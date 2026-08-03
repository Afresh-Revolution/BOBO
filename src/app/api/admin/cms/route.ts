import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { ensureLandingCmsSections } from "@/lib/ensure-landing-cms";
import type { Prisma } from "@prisma/client";

type CmsContent = Record<string, unknown>;

function asJson(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function serializeCms(section: {
  sectionKey: string;
  title: string | null;
  subtitle: string | null;
  body: string | null;
  ctaLabel: string | null;
  ctaHref: string | null;
  imageUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  meta: unknown;
  updatedAt: Date;
}) {
  const meta =
    section.meta && typeof section.meta === "object" && !Array.isArray(section.meta)
      ? (section.meta as CmsContent)
      : {};

  const content: CmsContent = {
    ...meta,
    subtitle: section.subtitle ?? meta.subtitle ?? null,
    body: section.body ?? meta.body ?? null,
    ctaLabel: section.ctaLabel ?? meta.ctaLabel ?? null,
    ctaHref: section.ctaHref ?? meta.ctaHref ?? null,
    imageUrl: section.imageUrl ?? meta.imageUrl ?? null,
    sortOrder: section.sortOrder,
    isPublished: section.isPublished,
  };

  return {
    key: section.sectionKey,
    title: section.title ?? section.sectionKey,
    content,
    updatedAt: section.updatedAt.toISOString(),
  };
}

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    await ensureLandingCmsSections();

    const sections = await prisma.websiteContent.findMany({
      orderBy: { sortOrder: "asc" },
    });

    return jsonOk({ data: sections.map(serializeCms) });
  } catch (err) {
    console.error("[admin/cms GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function PUT(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const body = (await req.json().catch(() => null)) as {
      sections?: { key: string; title?: string; content?: CmsContent }[];
      data?: { key: string; title?: string; content?: CmsContent }[];
    } | null;

    const sections = body?.sections || body?.data;
    if (!Array.isArray(sections)) {
      return jsonError("sections array is required.", 400);
    }

    const results = [];
    for (const section of sections) {
      if (!section.key) continue;
      const content = section.content ?? {};
      const title =
        section.title ||
        (typeof content.title === "string" ? content.title : section.key);

      const saved = await prisma.websiteContent.upsert({
        where: { sectionKey: section.key },
        create: {
          sectionKey: section.key,
          title,
          subtitle:
            typeof content.subtitle === "string" ? content.subtitle : null,
          body: typeof content.body === "string" ? content.body : null,
          ctaLabel:
            typeof content.ctaLabel === "string" ? content.ctaLabel : null,
          ctaHref: typeof content.ctaHref === "string" ? content.ctaHref : null,
          imageUrl:
            typeof content.imageUrl === "string" ? content.imageUrl : null,
          meta: asJson(content),
          updatedById: admin.id,
        },
        update: {
          title,
          subtitle:
            typeof content.subtitle === "string" || content.subtitle === null
              ? (content.subtitle as string | null)
              : undefined,
          body:
            typeof content.body === "string" || content.body === null
              ? (content.body as string | null)
              : undefined,
          ctaLabel:
            typeof content.ctaLabel === "string" || content.ctaLabel === null
              ? (content.ctaLabel as string | null)
              : undefined,
          ctaHref:
            typeof content.ctaHref === "string" || content.ctaHref === null
              ? (content.ctaHref as string | null)
              : undefined,
          imageUrl:
            typeof content.imageUrl === "string" || content.imageUrl === null
              ? (content.imageUrl as string | null)
              : undefined,
          meta: asJson(content),
          updatedById: admin.id,
        },
      });
      results.push(serializeCms(saved));
    }

    revalidatePublicSite();
    return jsonOk({ data: results });
  } catch (err) {
    console.error("[admin/cms PUT]", err);
    return jsonError("Internal server error", 500);
  }
}
