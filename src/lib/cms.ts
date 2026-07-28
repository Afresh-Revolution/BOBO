import { prisma } from "@/lib/db";
import { siteConfig as fallback } from "@/lib/content";

export type CmsSection = {
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  meta: Record<string, unknown>;
};

export async function getPublishedCms(): Promise<Record<string, CmsSection>> {
  try {
    const rows = await prisma.websiteContent.findMany({
      where: { isPublished: true },
      orderBy: { sortOrder: "asc" },
    });
    return Object.fromEntries(
      rows.map((row) => [
        row.sectionKey,
        {
          sectionKey: row.sectionKey,
          title: row.title,
          subtitle: row.subtitle,
          body: row.body,
          ctaLabel: row.ctaLabel,
          ctaHref: row.ctaHref,
          imageUrl: row.imageUrl,
          meta: (row.meta as Record<string, unknown>) ?? {},
        },
      ]),
    );
  } catch {
    return {
      hero: {
        sectionKey: "hero",
        title: fallback.name,
        subtitle: fallback.fullName,
        body: fallback.tagline,
        ctaLabel: "Start Application",
        ctaHref: "/apply",
        imageUrl: null,
        meta: {},
      },
    };
  }
}
