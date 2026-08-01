"use client";

import { AdminImageUpload } from "@/components/admin";
import {
  defaultLandingSections,
  type LandingSectionKey,
} from "@/lib/cms-defaults";
import styles from "../admin.module.scss";

export type SectionDraft = {
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
  support: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  pillarsText: string;
  statement: string;
  timelineItems: { id: string; date: string; label: string; detail: string }[];
  steps: { step: string; title: string; body: string }[];
  eligibilityItemsText: string;
  eligibilityNote: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  eligibilitySecondaryCtaLabel: string;
  eligibilitySecondaryCtaHref: string;
  judgingCards: { title: string; body: string }[];
  faqItems: { q: string; a: string }[];
};

function asString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asObjArray(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value)
    ? (value.filter((v) => v && typeof v === "object") as Record<
        string,
        unknown
      >[])
    : [];
}

export function draftFromContent(
  title: string,
  content: Record<string, unknown>,
  sectionKey: LandingSectionKey,
): SectionDraft {
  const defaults = defaultLandingSections.find(
    (row) => row.sectionKey === sectionKey,
  );
  const metaDefaults = (defaults?.meta || {}) as Record<string, unknown>;
  const merged = { ...metaDefaults, ...content };

  const pillars = Array.isArray(merged.pillars)
    ? merged.pillars.filter((p): p is string => typeof p === "string")
    : [];
  const eligibilityItems = Array.isArray(merged.items)
    ? merged.items.filter((p): p is string => typeof p === "string")
    : [];
  const timelineRaw = asObjArray(merged.items).filter(
    (row) => "label" in row || "date" in row || "detail" in row,
  );
  const faqRaw = asObjArray(merged.items).filter(
    (row) => "q" in row || "a" in row,
  );
  const stepsRaw = asObjArray(merged.steps);
  const cardsRaw = asObjArray(merged.cards);

  const fallbackTimeline = asObjArray(metaDefaults.items).map((row, i) => ({
    id: asString(row.id, `item-${i + 1}`),
    date: asString(row.date),
    label: asString(row.label),
    detail: asString(row.detail),
  }));
  const fallbackFaq = asObjArray(metaDefaults.items).map((row) => ({
    q: asString(row.q),
    a: asString(row.a),
  }));
  const fallbackSteps = asObjArray(metaDefaults.steps).map((row, i) => ({
    step: asString(row.step, String(i + 1).padStart(2, "0")),
    title: asString(row.title),
    body: asString(row.body),
  }));
  const fallbackCards = asObjArray(metaDefaults.cards).map((row) => ({
    title: asString(row.title),
    body: asString(row.body),
  }));
  const fallbackPillars = Array.isArray(metaDefaults.pillars)
    ? metaDefaults.pillars.filter((p): p is string => typeof p === "string")
    : [];
  const fallbackEligibility = Array.isArray(metaDefaults.items)
    ? metaDefaults.items.filter((p): p is string => typeof p === "string")
    : [];

  return {
    title: title || defaults?.title || "",
    subtitle: asString(merged.subtitle, defaults?.subtitle || ""),
    body: asString(
      merged.body,
      defaults && "body" in defaults ? String(defaults.body) : "",
    ),
    ctaLabel: asString(
      merged.ctaLabel,
      defaults && "ctaLabel" in defaults ? String(defaults.ctaLabel) : "",
    ),
    ctaHref: asString(
      merged.ctaHref,
      defaults && "ctaHref" in defaults ? String(defaults.ctaHref) : "",
    ),
    imageUrl: asString(merged.imageUrl),
    support: asString(merged.support, asString(metaDefaults.support)),
    secondaryCtaLabel: asString(
      merged.secondaryCtaLabel,
      asString(metaDefaults.secondaryCtaLabel),
    ),
    secondaryCtaHref: asString(
      merged.secondaryCtaHref,
      asString(metaDefaults.secondaryCtaHref),
    ),
    pillarsText: (pillars.length ? pillars : fallbackPillars).join("\n"),
    statement: asString(merged.statement, asString(metaDefaults.statement)),
    timelineItems:
      sectionKey === "timeline"
        ? timelineRaw.length
          ? timelineRaw.map((row, i) => ({
              id: asString(row.id, `item-${i + 1}`),
              date: asString(row.date),
              label: asString(row.label),
              detail: asString(row.detail),
            }))
          : fallbackTimeline
        : [],
    steps:
      sectionKey === "how_to_apply"
        ? stepsRaw.length
          ? stepsRaw.map((row, i) => ({
              step: asString(row.step, String(i + 1).padStart(2, "0")),
              title: asString(row.title),
              body: asString(row.body),
            }))
          : fallbackSteps
        : [],
    eligibilityItemsText:
      sectionKey === "eligibility"
        ? (
            eligibilityItems.length ? eligibilityItems : fallbackEligibility
          ).join("\n")
        : "",
    eligibilityNote: asString(merged.note, asString(metaDefaults.note)),
    primaryCtaLabel: asString(
      merged.primaryCtaLabel,
      asString(metaDefaults.primaryCtaLabel),
    ),
    primaryCtaHref: asString(
      merged.primaryCtaHref,
      asString(metaDefaults.primaryCtaHref),
    ),
    eligibilitySecondaryCtaLabel: asString(
      sectionKey === "eligibility" ? merged.secondaryCtaLabel : "",
      asString(metaDefaults.secondaryCtaLabel),
    ),
    eligibilitySecondaryCtaHref: asString(
      sectionKey === "eligibility" ? merged.secondaryCtaHref : "",
      asString(metaDefaults.secondaryCtaHref),
    ),
    judgingCards:
      sectionKey === "judging"
        ? cardsRaw.length
          ? cardsRaw.map((row) => ({
              title: asString(row.title),
              body: asString(row.body),
            }))
          : fallbackCards
        : [],
    faqItems:
      sectionKey === "faq"
        ? faqRaw.length
          ? faqRaw.map((row) => ({
              q: asString(row.q),
              a: asString(row.a),
            }))
          : fallbackFaq
        : [],
  };
}

export function contentFromDraft(
  key: LandingSectionKey,
  draft: SectionDraft,
): Record<string, unknown> {
  const base: Record<string, unknown> = {
    subtitle: draft.subtitle || null,
    body: draft.body || null,
    ctaLabel: draft.ctaLabel || null,
    ctaHref: draft.ctaHref || null,
    imageUrl: draft.imageUrl || null,
  };

  if (key === "hero") {
    return {
      ...base,
      support: draft.support || null,
      secondaryCtaLabel: draft.secondaryCtaLabel || null,
      secondaryCtaHref: draft.secondaryCtaHref || null,
    };
  }

  if (key === "about") {
    return {
      ...base,
      pillars: draft.pillarsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      statement: draft.statement || null,
    };
  }

  if (key === "timeline") {
    return {
      ...base,
      items: draft.timelineItems.map((item, i) => ({
        id: item.id || `item-${i + 1}`,
        date: item.date,
        label: item.label,
        detail: item.detail,
      })),
    };
  }

  if (key === "how_to_apply") {
    return {
      ...base,
      steps: draft.steps.map((step, i) => ({
        step: step.step || String(i + 1).padStart(2, "0"),
        title: step.title,
        body: step.body,
      })),
    };
  }

  if (key === "eligibility") {
    return {
      ...base,
      items: draft.eligibilityItemsText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      note: draft.eligibilityNote || null,
      primaryCtaLabel: draft.primaryCtaLabel || null,
      primaryCtaHref: draft.primaryCtaHref || null,
      secondaryCtaLabel: draft.eligibilitySecondaryCtaLabel || null,
      secondaryCtaHref: draft.eligibilitySecondaryCtaHref || null,
    };
  }

  if (key === "judging") {
    return {
      ...base,
      cards: draft.judgingCards.map((card) => ({
        title: card.title,
        body: card.body,
      })),
    };
  }

  if (key === "faq") {
    return {
      ...base,
      items: draft.faqItems.map((item) => ({ q: item.q, a: item.a })),
    };
  }

  return base;
}

type Props = {
  sectionKey: LandingSectionKey;
  draft: SectionDraft;
  onChange: (patch: Partial<SectionDraft>) => void;
};

export function CmsSectionFields({ sectionKey, draft, onChange }: Props) {
  const titleLabel = sectionKey === "hero" ? "Brand" : "Eyebrow / section label";
  const subtitleLabel = sectionKey === "hero" ? "Full name" : "Heading";
  const bodyLabel = sectionKey === "hero" ? "Tagline" : "Description / body";

  return (
    <div className={styles.fieldGrid}>
      <label className={styles.field}>
        <span>{titleLabel}</span>
        <input
          className={styles.input}
          value={draft.title}
          onChange={(e) => onChange({ title: e.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span>{subtitleLabel}</span>
        <input
          className={styles.input}
          value={draft.subtitle}
          onChange={(e) => onChange({ subtitle: e.target.value })}
        />
      </label>
      <label className={styles.field}>
        <span>{bodyLabel}</span>
        <textarea
          className={styles.textarea}
          value={draft.body}
          onChange={(e) => onChange({ body: e.target.value })}
        />
      </label>

      {sectionKey === "hero" ? (
        <>
          <label className={styles.field}>
            <span>Support line</span>
            <textarea
              className={styles.textarea}
              value={draft.support}
              onChange={(e) => onChange({ support: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Primary CTA label</span>
            <input
              className={styles.input}
              value={draft.ctaLabel}
              onChange={(e) => onChange({ ctaLabel: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Primary CTA link</span>
            <input
              className={styles.input}
              value={draft.ctaHref}
              onChange={(e) => onChange({ ctaHref: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Secondary CTA label</span>
            <input
              className={styles.input}
              value={draft.secondaryCtaLabel}
              onChange={(e) => onChange({ secondaryCtaLabel: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Secondary CTA link</span>
            <input
              className={styles.input}
              value={draft.secondaryCtaHref}
              onChange={(e) => onChange({ secondaryCtaHref: e.target.value })}
            />
          </label>
        </>
      ) : null}

      {sectionKey === "about" ? (
        <>
          <label className={styles.field}>
            <span>Pillars (one per line)</span>
            <textarea
              className={styles.textarea}
              value={draft.pillarsText}
              onChange={(e) => onChange({ pillarsText: e.target.value })}
              rows={6}
            />
          </label>
          <label className={styles.field}>
            <span>Closing statement</span>
            <textarea
              className={styles.textarea}
              value={draft.statement}
              onChange={(e) => onChange({ statement: e.target.value })}
            />
          </label>
        </>
      ) : null}

      {sectionKey === "timeline" ? (
        <div className={styles.field}>
          <span>Milestones</span>
          {draft.timelineItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className={styles.sectionCard}>
              <label className={styles.field}>
                <span>Id (opens / closes / begins)</span>
                <input
                  className={styles.input}
                  value={item.id}
                  onChange={(e) => {
                    const timelineItems = [...draft.timelineItems];
                    timelineItems[index] = { ...item, id: e.target.value };
                    onChange({ timelineItems });
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>Date</span>
                <input
                  className={styles.input}
                  value={item.date}
                  onChange={(e) => {
                    const timelineItems = [...draft.timelineItems];
                    timelineItems[index] = { ...item, date: e.target.value };
                    onChange({ timelineItems });
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>Label</span>
                <input
                  className={styles.input}
                  value={item.label}
                  onChange={(e) => {
                    const timelineItems = [...draft.timelineItems];
                    timelineItems[index] = { ...item, label: e.target.value };
                    onChange({ timelineItems });
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>Detail</span>
                <textarea
                  className={styles.textarea}
                  value={item.detail}
                  onChange={(e) => {
                    const timelineItems = [...draft.timelineItems];
                    timelineItems[index] = { ...item, detail: e.target.value };
                    onChange({ timelineItems });
                  }}
                />
              </label>
              <button
                type="button"
                className={styles.muted}
                onClick={() =>
                  onChange({
                    timelineItems: draft.timelineItems.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
              >
                Remove milestone
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.muted}
            onClick={() =>
              onChange({
                timelineItems: [
                  ...draft.timelineItems,
                  { id: "", date: "", label: "", detail: "" },
                ],
              })
            }
          >
            Add milestone
          </button>
        </div>
      ) : null}

      {sectionKey === "how_to_apply" ? (
        <>
          <label className={styles.field}>
            <span>CTA label</span>
            <input
              className={styles.input}
              value={draft.ctaLabel}
              onChange={(e) => onChange({ ctaLabel: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>CTA link</span>
            <input
              className={styles.input}
              value={draft.ctaHref}
              onChange={(e) => onChange({ ctaHref: e.target.value })}
            />
          </label>
          <div className={styles.field}>
            <span>Steps</span>
            {draft.steps.map((step, index) => (
              <div key={`step-${index}`} className={styles.sectionCard}>
                <label className={styles.field}>
                  <span>Number</span>
                  <input
                    className={styles.input}
                    value={step.step}
                    onChange={(e) => {
                      const steps = [...draft.steps];
                      steps[index] = { ...step, step: e.target.value };
                      onChange({ steps });
                    }}
                  />
                </label>
                <label className={styles.field}>
                  <span>Title</span>
                  <input
                    className={styles.input}
                    value={step.title}
                    onChange={(e) => {
                      const steps = [...draft.steps];
                      steps[index] = { ...step, title: e.target.value };
                      onChange({ steps });
                    }}
                  />
                </label>
                <label className={styles.field}>
                  <span>Body</span>
                  <textarea
                    className={styles.textarea}
                    value={step.body}
                    onChange={(e) => {
                      const steps = [...draft.steps];
                      steps[index] = { ...step, body: e.target.value };
                      onChange({ steps });
                    }}
                  />
                </label>
                <button
                  type="button"
                  className={styles.muted}
                  onClick={() =>
                    onChange({
                      steps: draft.steps.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove step
                </button>
              </div>
            ))}
            <button
              type="button"
              className={styles.muted}
              onClick={() =>
                onChange({
                  steps: [
                    ...draft.steps,
                    {
                      step: String(draft.steps.length + 1).padStart(2, "0"),
                      title: "",
                      body: "",
                    },
                  ],
                })
              }
            >
              Add step
            </button>
          </div>
        </>
      ) : null}

      {sectionKey === "eligibility" ? (
        <>
          <label className={styles.field}>
            <span>Requirements (one per line)</span>
            <textarea
              className={styles.textarea}
              value={draft.eligibilityItemsText}
              onChange={(e) =>
                onChange({ eligibilityItemsText: e.target.value })
              }
              rows={5}
            />
          </label>
          <label className={styles.field}>
            <span>Note</span>
            <textarea
              className={styles.textarea}
              value={draft.eligibilityNote}
              onChange={(e) => onChange({ eligibilityNote: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Primary CTA label</span>
            <input
              className={styles.input}
              value={draft.primaryCtaLabel}
              onChange={(e) => onChange({ primaryCtaLabel: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Primary CTA link</span>
            <input
              className={styles.input}
              value={draft.primaryCtaHref}
              onChange={(e) => onChange({ primaryCtaHref: e.target.value })}
            />
          </label>
          <label className={styles.field}>
            <span>Secondary CTA label</span>
            <input
              className={styles.input}
              value={draft.eligibilitySecondaryCtaLabel}
              onChange={(e) =>
                onChange({ eligibilitySecondaryCtaLabel: e.target.value })
              }
            />
          </label>
          <label className={styles.field}>
            <span>Secondary CTA link</span>
            <input
              className={styles.input}
              value={draft.eligibilitySecondaryCtaHref}
              onChange={(e) =>
                onChange({ eligibilitySecondaryCtaHref: e.target.value })
              }
            />
          </label>
        </>
      ) : null}

      {sectionKey === "judging" ? (
        <div className={styles.field}>
          <span>Criteria cards</span>
          {draft.judgingCards.map((card, index) => (
            <div key={`card-${index}`} className={styles.sectionCard}>
              <label className={styles.field}>
                <span>Title</span>
                <input
                  className={styles.input}
                  value={card.title}
                  onChange={(e) => {
                    const judgingCards = [...draft.judgingCards];
                    judgingCards[index] = { ...card, title: e.target.value };
                    onChange({ judgingCards });
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>Body</span>
                <textarea
                  className={styles.textarea}
                  value={card.body}
                  onChange={(e) => {
                    const judgingCards = [...draft.judgingCards];
                    judgingCards[index] = { ...card, body: e.target.value };
                    onChange({ judgingCards });
                  }}
                />
              </label>
              <button
                type="button"
                className={styles.muted}
                onClick={() =>
                  onChange({
                    judgingCards: draft.judgingCards.filter(
                      (_, i) => i !== index,
                    ),
                  })
                }
              >
                Remove card
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.muted}
            onClick={() =>
              onChange({
                judgingCards: [...draft.judgingCards, { title: "", body: "" }],
              })
            }
          >
            Add card
          </button>
        </div>
      ) : null}

      {sectionKey === "faq" ? (
        <div className={styles.field}>
          <span>Questions & answers</span>
          {draft.faqItems.map((item, index) => (
            <div key={`faq-${index}`} className={styles.sectionCard}>
              <label className={styles.field}>
                <span>Question</span>
                <input
                  className={styles.input}
                  value={item.q}
                  onChange={(e) => {
                    const faqItems = [...draft.faqItems];
                    faqItems[index] = { ...item, q: e.target.value };
                    onChange({ faqItems });
                  }}
                />
              </label>
              <label className={styles.field}>
                <span>Answer</span>
                <textarea
                  className={styles.textarea}
                  value={item.a}
                  onChange={(e) => {
                    const faqItems = [...draft.faqItems];
                    faqItems[index] = { ...item, a: e.target.value };
                    onChange({ faqItems });
                  }}
                />
              </label>
              <button
                type="button"
                className={styles.muted}
                onClick={() =>
                  onChange({
                    faqItems: draft.faqItems.filter((_, i) => i !== index),
                  })
                }
              >
                Remove question
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.muted}
            onClick={() =>
              onChange({
                faqItems: [...draft.faqItems, { q: "", a: "" }],
              })
            }
          >
            Add question
          </button>
        </div>
      ) : null}

      <div className={styles.field}>
        <AdminImageUpload
          label="Image (optional)"
          value={draft.imageUrl || null}
          onChange={(url) => onChange({ imageUrl: url ?? "" })}
        />
      </div>
    </div>
  );
}
