"use client";

import { useState } from "react";
import {
  AdminButton,
  AdminImageUpload,
  AdminShell,
  useConfirm,
} from "@/components/admin";
import { adminFetch, unwrapList } from "@/lib/admin-api";
import type { CmsSection } from "@/lib/admin-types";
import { useAdminResource } from "@/lib/use-admin-resource";
import styles from "../admin.module.scss";

const SECTION_KEYS = ["hero", "about", "timeline", "faq", "sponsors"] as const;

const SECTION_LABELS: Record<(typeof SECTION_KEYS)[number], string> = {
  hero: "Hero",
  about: "About",
  timeline: "Timeline",
  faq: "FAQ",
  sponsors: "Sponsors",
};

type SectionDraft = {
  title: string;
  subtitle: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  imageUrl: string;
};

type WinnerRow = {
  id: string;
  seasonNumber: number;
  seasonLabel: string;
  winnerName: string;
  stateOfOrigin: string;
  imageUrl: string;
  sortOrder: number;
  isPublished: boolean;
};

type WinnerDraft = {
  seasonNumber: string;
  seasonLabel: string;
  winnerName: string;
  stateOfOrigin: string;
  imageUrl: string;
  sortOrder: string;
  isPublished: boolean;
};

type PartnerRow = {
  id: string;
  name: string;
  href: string | null;
  logoUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
};

type PartnerDraft = {
  name: string;
  href: string;
  logoUrl: string;
  sortOrder: string;
  isPublished: boolean;
};

function emptySections(): CmsSection[] {
  return SECTION_KEYS.map((key) => ({
    key,
    title: SECTION_LABELS[key],
    content: {},
  }));
}

function draftFromSection(section: CmsSection): SectionDraft {
  const c = section.content || {};
  return {
    title: section.title || "",
    subtitle: typeof c.subtitle === "string" ? c.subtitle : "",
    body: typeof c.body === "string" ? c.body : "",
    ctaLabel: typeof c.ctaLabel === "string" ? c.ctaLabel : "",
    ctaHref: typeof c.ctaHref === "string" ? c.ctaHref : "",
    imageUrl: typeof c.imageUrl === "string" ? c.imageUrl : "",
  };
}

function emptyWinnerDraft(): WinnerDraft {
  return {
    seasonNumber: "",
    seasonLabel: "",
    winnerName: "",
    stateOfOrigin: "",
    imageUrl: "/winner.png",
    sortOrder: "0",
    isPublished: true,
  };
}

function draftFromWinner(w: WinnerRow): WinnerDraft {
  return {
    seasonNumber: String(w.seasonNumber),
    seasonLabel: w.seasonLabel,
    winnerName: w.winnerName,
    stateOfOrigin: w.stateOfOrigin,
    imageUrl: w.imageUrl,
    sortOrder: String(w.sortOrder),
    isPublished: w.isPublished,
  };
}

function emptyPartnerDraft(): PartnerDraft {
  return {
    name: "",
    href: "",
    logoUrl: "",
    sortOrder: "0",
    isPublished: true,
  };
}

function draftFromPartner(p: PartnerRow): PartnerDraft {
  return {
    name: p.name,
    href: p.href ?? "",
    logoUrl: p.logoUrl ?? "",
    sortOrder: String(p.sortOrder),
    isPublished: p.isPublished,
  };
}

export default function CmsPage() {
  const ask = useConfirm();
  const [drafts, setDrafts] = useState<Record<string, SectionDraft>>({});
  const [winnerDrafts, setWinnerDrafts] = useState<Record<string, WinnerDraft>>(
    {},
  );
  const [partnerDrafts, setPartnerDrafts] = useState<
    Record<string, PartnerDraft>
  >({});
  const [newWinner, setNewWinner] = useState<WinnerDraft>(emptyWinnerDraft());
  const [newPartner, setNewPartner] = useState<PartnerDraft>(emptyPartnerDraft());
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    data: sectionsData,
    loading: sectionsLoading,
    error: sectionsError,
    reload: reloadSections,
  } = useAdminResource({
    initial: emptySections(),
    load: async () => {
      const res = await adminFetch("/api/admin/cms");
      const list = unwrapList<CmsSection>(res as never);
      const byKey = new Map(list.map((s) => [s.key, s]));
      return SECTION_KEYS.map((key) => {
        const existing = byKey.get(key);
        return (
          existing ?? {
            key,
            title: SECTION_LABELS[key],
            content: {},
          }
        );
      });
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Failed to load CMS",
  });

  const {
    data: winnersData,
    loading: winnersLoading,
    error: winnersError,
    reload: reloadWinners,
  } = useAdminResource({
    initial: [] as WinnerRow[],
    load: async () => {
      const res = await adminFetch("/api/admin/winners");
      return unwrapList<WinnerRow>(res as never);
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Failed to load winners",
  });

  const {
    data: partnersData,
    loading: partnersLoading,
    error: partnersError,
    reload: reloadPartners,
  } = useAdminResource({
    initial: [] as PartnerRow[],
    load: async () => {
      const res = await adminFetch("/api/admin/partners");
      return unwrapList<PartnerRow>(res as never);
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Failed to load partners",
  });

  const sections = sectionsData ?? emptySections();
  const winners = winnersData ?? [];
  const partners = partnersData ?? [];

  function handleReload() {
    setDrafts({});
    setWinnerDrafts({});
    setPartnerDrafts({});
    setMessage(null);
    setLocalError(null);
    reloadSections();
    reloadWinners();
    reloadPartners();
  }

  function sectionDraft(section: CmsSection): SectionDraft {
    return drafts[section.key] ?? draftFromSection(section);
  }

  function updateSectionDraft(
    key: string,
    patch: Partial<SectionDraft>,
    base: SectionDraft,
  ) {
    setDrafts((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? base), ...patch },
    }));
  }

  async function saveSection(key: string, base: SectionDraft) {
    setSaving(`section:${key}`);
    setMessage(null);
    setLocalError(null);
    const draft = drafts[key] ?? base;

    try {
      await adminFetch(`/api/admin/cms/${key}`, {
        method: "PUT",
        body: {
          title: draft.title,
          content: {
            subtitle: draft.subtitle || null,
            body: draft.body || null,
            ctaLabel: draft.ctaLabel || null,
            ctaHref: draft.ctaHref || null,
            imageUrl: draft.imageUrl || null,
          },
        },
      });
      setMessage(`Saved “${SECTION_LABELS[key as keyof typeof SECTION_LABELS] || key}”`);
      setDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      reloadSections();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  async function saveWinner(id: string, base: WinnerDraft) {
    setSaving(`winner:${id}`);
    setMessage(null);
    setLocalError(null);
    const draft = winnerDrafts[id] ?? base;

    try {
      await adminFetch(`/api/admin/winners/${id}`, {
        method: "PATCH",
        body: {
          seasonNumber: Number(draft.seasonNumber),
          seasonLabel: draft.seasonLabel,
          winnerName: draft.winnerName,
          stateOfOrigin: draft.stateOfOrigin,
          imageUrl: draft.imageUrl,
          sortOrder: Number(draft.sortOrder || 0),
          isPublished: draft.isPublished,
        },
      });
      setMessage("Winner updated");
      setWinnerDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      reloadWinners();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  async function createWinner() {
    setSaving("winner:new");
    setMessage(null);
    setLocalError(null);
    try {
      await adminFetch("/api/admin/winners", {
        method: "POST",
        body: {
          seasonNumber: Number(newWinner.seasonNumber),
          seasonLabel: newWinner.seasonLabel,
          winnerName: newWinner.winnerName,
          stateOfOrigin: newWinner.stateOfOrigin,
          imageUrl: newWinner.imageUrl,
          sortOrder: Number(newWinner.sortOrder || 0),
          isPublished: newWinner.isPublished,
        },
      });
      setMessage("Winner added");
      setNewWinner(emptyWinnerDraft());
      reloadWinners();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(null);
    }
  }

  async function deleteWinner(id: string) {
    const ok = await ask({
      title: "Remove season winner?",
      message: "This will unpublish the winner from the site.",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(`winner-del:${id}`);
    setMessage(null);
    setLocalError(null);
    try {
      await adminFetch(`/api/admin/winners/${id}`, { method: "DELETE" });
      setMessage("Winner removed");
      reloadWinners();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(null);
    }
  }

  async function savePartner(id: string, base: PartnerDraft) {
    setSaving(`partner:${id}`);
    setMessage(null);
    setLocalError(null);
    const draft = partnerDrafts[id] ?? base;

    try {
      await adminFetch(`/api/admin/partners/${id}`, {
        method: "PATCH",
        body: {
          name: draft.name,
          href: draft.href || null,
          logoUrl: draft.logoUrl || null,
          sortOrder: Number(draft.sortOrder || 0),
          isPublished: draft.isPublished,
        },
      });
      setMessage("Partner updated");
      setPartnerDrafts((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      reloadPartners();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  async function createPartner() {
    if (!newPartner.name.trim()) {
      setLocalError("Partner name is required.");
      return;
    }
    setSaving("partner:new");
    setMessage(null);
    setLocalError(null);
    try {
      await adminFetch("/api/admin/partners", {
        method: "POST",
        body: {
          name: newPartner.name,
          href: newPartner.href || null,
          logoUrl: newPartner.logoUrl || null,
          sortOrder: Number(newPartner.sortOrder || 0),
          isPublished: newPartner.isPublished,
        },
      });
      setMessage("Partner added");
      setNewPartner(emptyPartnerDraft());
      reloadPartners();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(null);
    }
  }

  async function deletePartner(id: string) {
    const ok = await ask({
      title: "Remove network partner?",
      message: "This partner card will be removed from the landing page.",
      confirmLabel: "Remove",
      cancelLabel: "Cancel",
      tone: "danger",
    });
    if (!ok) return;
    setSaving(`partner-del:${id}`);
    setMessage(null);
    setLocalError(null);
    try {
      await adminFetch(`/api/admin/partners/${id}`, { method: "DELETE" });
      setMessage("Partner removed");
      reloadPartners();
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setSaving(null);
    }
  }

  const loading = sectionsLoading || winnersLoading || partnersLoading;
  const error = localError || sectionsError || winnersError || partnersError;

  return (
    <AdminShell
      title="CMS"
      description="Edit landing page copy, network partners, and season winners."
      actions={
        <AdminButton variant="secondary" size="sm" onClick={handleReload}>
          Reload
        </AdminButton>
      }
    >
      {error ? <p className={styles.error}>{error}</p> : null}
      {message ? <p className={styles.muted}>{message}</p> : null}

      {loading ? (
        <p className={styles.muted}>Loading CMS…</p>
      ) : (
        <>
          <section className={styles.sectionList} aria-label="Page sections">
            <h2 className={styles.panelTitle}>Landing sections</h2>
            {sections.map((section) => {
              const draft = sectionDraft(section);
              return (
                <article key={section.key} className={styles.sectionCard}>
                  <div>
                    <h3 className={styles.panelTitle}>
                      {SECTION_LABELS[
                        section.key as keyof typeof SECTION_LABELS
                      ] || section.key}
                    </h3>
                    <p className={styles.muted}>Key: {section.key}</p>
                  </div>

                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Title / brand</span>
                      <input
                        className={styles.input}
                        value={draft.title}
                        onChange={(e) =>
                          updateSectionDraft(
                            section.key,
                            { title: e.target.value },
                            draft,
                          )
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Subtitle</span>
                      <input
                        className={styles.input}
                        value={draft.subtitle}
                        onChange={(e) =>
                          updateSectionDraft(
                            section.key,
                            { subtitle: e.target.value },
                            draft,
                          )
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Body</span>
                      <textarea
                        className={styles.textarea}
                        value={draft.body}
                        onChange={(e) =>
                          updateSectionDraft(
                            section.key,
                            { body: e.target.value },
                            draft,
                          )
                        }
                      />
                    </label>
                    {section.key === "hero" ? (
                      <>
                        <label className={styles.field}>
                          <span>CTA label</span>
                          <input
                            className={styles.input}
                            value={draft.ctaLabel}
                            onChange={(e) =>
                              updateSectionDraft(
                                section.key,
                                { ctaLabel: e.target.value },
                                draft,
                              )
                            }
                          />
                        </label>
                        <label className={styles.field}>
                          <span>CTA link</span>
                          <input
                            className={styles.input}
                            value={draft.ctaHref}
                            onChange={(e) =>
                              updateSectionDraft(
                                section.key,
                                { ctaHref: e.target.value },
                                draft,
                              )
                            }
                          />
                        </label>
                      </>
                    ) : null}
                    <label className={styles.field}>
                      <span>Image URL (optional)</span>
                      <input
                        className={styles.input}
                        value={draft.imageUrl}
                        onChange={(e) =>
                          updateSectionDraft(
                            section.key,
                            { imageUrl: e.target.value },
                            draft,
                          )
                        }
                        placeholder="/winner.png or https://…"
                      />
                    </label>
                  </div>

                  <div className={styles.rowActions}>
                    <AdminButton
                      variant="gold"
                      size="sm"
                      loading={saving === `section:${section.key}`}
                      onClick={() => void saveSection(section.key, draft)}
                    >
                      Save {SECTION_LABELS[section.key as keyof typeof SECTION_LABELS] || section.key}
                    </AdminButton>
                  </div>
                </article>
              );
            })}
          </section>

          <section className={styles.sectionList} aria-label="Network partners">
            <h2 className={styles.panelTitle}>Network partners</h2>
            <p className={styles.muted}>
              Cards under the Partners section (CBrilliance, Popin, CBC Nets, and
              any others). Name is required; logo and link are optional.
            </p>

            {partners.map((partner) => {
              const draft =
                partnerDrafts[partner.id] ?? draftFromPartner(partner);
              return (
                <article key={partner.id} className={styles.sectionCard}>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Name</span>
                      <input
                        className={styles.input}
                        value={draft.name}
                        onChange={(e) =>
                          setPartnerDrafts((prev) => ({
                            ...prev,
                            [partner.id]: {
                              ...(prev[partner.id] ?? draft),
                              name: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Link URL (optional)</span>
                      <input
                        className={styles.input}
                        value={draft.href}
                        onChange={(e) =>
                          setPartnerDrafts((prev) => ({
                            ...prev,
                            [partner.id]: {
                              ...(prev[partner.id] ?? draft),
                              href: e.target.value,
                            },
                          }))
                        }
                        placeholder="https://…"
                      />
                    </label>
                    <div className={styles.field}>
                      <AdminImageUpload
                        label="Logo (optional)"
                        value={draft.logoUrl}
                        onChange={(url) =>
                          setPartnerDrafts((prev) => ({
                            ...prev,
                            [partner.id]: {
                              ...(prev[partner.id] ?? draft),
                              logoUrl: url ?? "",
                            },
                          }))
                        }
                      />
                    </div>
                    <label className={styles.field}>
                      <span>Sort order</span>
                      <input
                        className={styles.input}
                        type="number"
                        value={draft.sortOrder}
                        onChange={(e) =>
                          setPartnerDrafts((prev) => ({
                            ...prev,
                            [partner.id]: {
                              ...(prev[partner.id] ?? draft),
                              sortOrder: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Published</span>
                      <select
                        className={styles.select}
                        value={draft.isPublished ? "yes" : "no"}
                        onChange={(e) =>
                          setPartnerDrafts((prev) => ({
                            ...prev,
                            [partner.id]: {
                              ...(prev[partner.id] ?? draft),
                              isPublished: e.target.value === "yes",
                            },
                          }))
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                  </div>
                  <div className={styles.rowActions}>
                    <AdminButton
                      variant="gold"
                      size="sm"
                      loading={saving === `partner:${partner.id}`}
                      onClick={() => void savePartner(partner.id, draft)}
                    >
                      Save partner
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      size="sm"
                      loading={saving === `partner-del:${partner.id}`}
                      onClick={() => void deletePartner(partner.id)}
                    >
                      Remove
                    </AdminButton>
                  </div>
                </article>
              );
            })}

            <article className={styles.sectionCard}>
              <h3 className={styles.panelTitle}>Add network partner</h3>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Name</span>
                  <input
                    className={styles.input}
                    value={newPartner.name}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g. Popin"
                  />
                </label>
                <label className={styles.field}>
                  <span>Link URL (optional)</span>
                  <input
                    className={styles.input}
                    value={newPartner.href}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        href: e.target.value,
                      }))
                    }
                    placeholder="https://…"
                  />
                </label>
                <div className={styles.field}>
                  <AdminImageUpload
                    label="Logo (optional)"
                    value={newPartner.logoUrl}
                    onChange={(url) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        logoUrl: url ?? "",
                      }))
                    }
                  />
                </div>
                <label className={styles.field}>
                  <span>Sort order</span>
                  <input
                    className={styles.input}
                    type="number"
                    value={newPartner.sortOrder}
                    onChange={(e) =>
                      setNewPartner((prev) => ({
                        ...prev,
                        sortOrder: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className={styles.rowActions}>
                <AdminButton
                  variant="gold"
                  size="sm"
                  loading={saving === "partner:new"}
                  onClick={() => void createPartner()}
                >
                  Add partner
                </AdminButton>
              </div>
            </article>
          </section>

          <section className={styles.sectionList} aria-label="Season winners">
            <h2 className={styles.panelTitle}>Season winners (hero slideshow)</h2>
            <p className={styles.muted}>
              These appear in the hero right rail. Add seasons, images, and
              state of origin.
            </p>

            {winners.map((winner) => {
              const draft =
                winnerDrafts[winner.id] ?? draftFromWinner(winner);
              return (
                <article key={winner.id} className={styles.sectionCard}>
                  <div className={styles.fieldGrid}>
                    <label className={styles.field}>
                      <span>Season number</span>
                      <input
                        className={styles.input}
                        type="number"
                        min={1}
                        value={draft.seasonNumber}
                        onChange={(e) =>
                          setWinnerDrafts((prev) => ({
                            ...prev,
                            [winner.id]: {
                              ...(prev[winner.id] ?? draft),
                              seasonNumber: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Season label</span>
                      <input
                        className={styles.input}
                        value={draft.seasonLabel}
                        onChange={(e) =>
                          setWinnerDrafts((prev) => ({
                            ...prev,
                            [winner.id]: {
                              ...(prev[winner.id] ?? draft),
                              seasonLabel: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Winner name</span>
                      <input
                        className={styles.input}
                        value={draft.winnerName}
                        onChange={(e) =>
                          setWinnerDrafts((prev) => ({
                            ...prev,
                            [winner.id]: {
                              ...(prev[winner.id] ?? draft),
                              winnerName: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>State of origin</span>
                      <input
                        className={styles.input}
                        value={draft.stateOfOrigin}
                        onChange={(e) =>
                          setWinnerDrafts((prev) => ({
                            ...prev,
                            [winner.id]: {
                              ...(prev[winner.id] ?? draft),
                              stateOfOrigin: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Image URL</span>
                      <input
                        className={styles.input}
                        value={draft.imageUrl}
                        onChange={(e) =>
                          setWinnerDrafts((prev) => ({
                            ...prev,
                            [winner.id]: {
                              ...(prev[winner.id] ?? draft),
                              imageUrl: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Sort order</span>
                      <input
                        className={styles.input}
                        type="number"
                        value={draft.sortOrder}
                        onChange={(e) =>
                          setWinnerDrafts((prev) => ({
                            ...prev,
                            [winner.id]: {
                              ...(prev[winner.id] ?? draft),
                              sortOrder: e.target.value,
                            },
                          }))
                        }
                      />
                    </label>
                    <label className={styles.field}>
                      <span>Published</span>
                      <select
                        className={styles.select}
                        value={draft.isPublished ? "yes" : "no"}
                        onChange={(e) =>
                          setWinnerDrafts((prev) => ({
                            ...prev,
                            [winner.id]: {
                              ...(prev[winner.id] ?? draft),
                              isPublished: e.target.value === "yes",
                            },
                          }))
                        }
                      >
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                    </label>
                  </div>
                  <div className={styles.rowActions}>
                    <AdminButton
                      variant="gold"
                      size="sm"
                      loading={saving === `winner:${winner.id}`}
                      onClick={() => void saveWinner(winner.id, draft)}
                    >
                      Save winner
                    </AdminButton>
                    <AdminButton
                      variant="secondary"
                      size="sm"
                      loading={saving === `winner-del:${winner.id}`}
                      onClick={() => void deleteWinner(winner.id)}
                    >
                      Remove
                    </AdminButton>
                  </div>
                </article>
              );
            })}

            <article className={styles.sectionCard}>
              <h3 className={styles.panelTitle}>Add season winner</h3>
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Season number</span>
                  <input
                    className={styles.input}
                    type="number"
                    min={1}
                    value={newWinner.seasonNumber}
                    onChange={(e) =>
                      setNewWinner((prev) => ({
                        ...prev,
                        seasonNumber: e.target.value,
                      }))
                    }
                    placeholder="2"
                  />
                </label>
                <label className={styles.field}>
                  <span>Season label</span>
                  <input
                    className={styles.input}
                    value={newWinner.seasonLabel}
                    onChange={(e) =>
                      setNewWinner((prev) => ({
                        ...prev,
                        seasonLabel: e.target.value,
                      }))
                    }
                    placeholder="Season 2"
                  />
                </label>
                <label className={styles.field}>
                  <span>Winner name</span>
                  <input
                    className={styles.input}
                    value={newWinner.winnerName}
                    onChange={(e) =>
                      setNewWinner((prev) => ({
                        ...prev,
                        winnerName: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>State of origin</span>
                  <input
                    className={styles.input}
                    value={newWinner.stateOfOrigin}
                    onChange={(e) =>
                      setNewWinner((prev) => ({
                        ...prev,
                        stateOfOrigin: e.target.value,
                      }))
                    }
                  />
                </label>
                <label className={styles.field}>
                  <span>Image URL</span>
                  <input
                    className={styles.input}
                    value={newWinner.imageUrl}
                    onChange={(e) =>
                      setNewWinner((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                  />
                </label>
              </div>
              <div className={styles.rowActions}>
                <AdminButton
                  variant="gold"
                  size="sm"
                  loading={saving === "winner:new"}
                  onClick={() => void createWinner()}
                >
                  Add winner
                </AdminButton>
              </div>
            </article>
          </section>
        </>
      )}
    </AdminShell>
  );
}
