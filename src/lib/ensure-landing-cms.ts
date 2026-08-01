import { prisma } from "@/lib/db";
import { defaultLandingSections } from "@/lib/cms-defaults";
import type { Prisma } from "@prisma/client";

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function metaRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function needsListBackfill(sectionKey: string, meta: Record<string, unknown>) {
  if (sectionKey === "timeline" || sectionKey === "faq") {
    return !Array.isArray(meta.items) || meta.items.length === 0;
  }
  if (sectionKey === "how_to_apply") {
    return !Array.isArray(meta.steps) || meta.steps.length === 0;
  }
  if (sectionKey === "eligibility") {
    return !Array.isArray(meta.items) || meta.items.length === 0;
  }
  if (sectionKey === "judging") {
    return !Array.isArray(meta.cards) || meta.cards.length === 0;
  }
  if (sectionKey === "about") {
    return !Array.isArray(meta.pillars) || meta.pillars.length === 0 || !meta.statement;
  }
  if (sectionKey === "hero") {
    return !meta.support;
  }
  return false;
}

/** Create missing landing sections and backfill empty list meta without wiping edits. */
export async function ensureLandingCmsSections() {
  for (const section of defaultLandingSections) {
    const existing = await prisma.websiteContent.findUnique({
      where: { sectionKey: section.sectionKey },
    });

    const defaultMeta = section.meta as Record<string, unknown>;

    if (!existing) {
      await prisma.websiteContent.create({
        data: {
          sectionKey: section.sectionKey,
          title: section.title,
          subtitle: section.subtitle,
          body: "body" in section ? (section.body as string) : null,
          ctaLabel: "ctaLabel" in section ? (section.ctaLabel as string) : null,
          ctaHref: "ctaHref" in section ? (section.ctaHref as string) : null,
          sortOrder: section.sortOrder,
          isPublished: true,
          meta: asJson(defaultMeta),
        },
      });
      continue;
    }

    const meta = metaRecord(existing.meta);
    if (!needsListBackfill(section.sectionKey, meta)) continue;

    const nextMeta: Record<string, unknown> = { ...defaultMeta, ...meta };

    if (section.sectionKey === "timeline" || section.sectionKey === "faq") {
      if (!Array.isArray(meta.items) || meta.items.length === 0) {
        nextMeta.items = defaultMeta.items;
      }
    }
    if (section.sectionKey === "how_to_apply") {
      if (!Array.isArray(meta.steps) || meta.steps.length === 0) {
        nextMeta.steps = defaultMeta.steps;
      }
    }
    if (section.sectionKey === "eligibility") {
      if (!Array.isArray(meta.items) || meta.items.length === 0) {
        nextMeta.items = defaultMeta.items;
      }
      if (!meta.note) nextMeta.note = defaultMeta.note;
    }
    if (section.sectionKey === "judging") {
      if (!Array.isArray(meta.cards) || meta.cards.length === 0) {
        nextMeta.cards = defaultMeta.cards;
      }
    }
    if (section.sectionKey === "about") {
      if (!Array.isArray(meta.pillars) || meta.pillars.length === 0) {
        nextMeta.pillars = defaultMeta.pillars;
      }
      if (!meta.statement) nextMeta.statement = defaultMeta.statement;
    }
    if (section.sectionKey === "hero") {
      if (!meta.support) nextMeta.support = defaultMeta.support;
      if (!meta.secondaryCtaLabel) {
        nextMeta.secondaryCtaLabel = defaultMeta.secondaryCtaLabel;
      }
      if (!meta.secondaryCtaHref) {
        nextMeta.secondaryCtaHref = defaultMeta.secondaryCtaHref;
      }
    }

    await prisma.websiteContent.update({
      where: { sectionKey: section.sectionKey },
      data: {
        title: existing.title || section.title,
        subtitle: existing.subtitle || section.subtitle,
        body:
          existing.body ||
          ("body" in section ? (section.body as string) : null),
        ctaLabel:
          existing.ctaLabel ||
          ("ctaLabel" in section ? (section.ctaLabel as string) : null),
        ctaHref:
          existing.ctaHref ||
          ("ctaHref" in section ? (section.ctaHref as string) : null),
        sortOrder: existing.sortOrder || section.sortOrder,
        meta: asJson(nextMeta),
        isPublished: true,
      },
    });
  }
}
