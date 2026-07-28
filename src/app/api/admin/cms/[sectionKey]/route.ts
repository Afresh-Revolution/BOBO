import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import type { Prisma } from "@prisma/client";

type RouteContext = { params: Promise<{ sectionKey: string }> };
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

  return {
    key: section.sectionKey,
    title: section.title ?? section.sectionKey,
    content: {
      ...meta,
      subtitle: section.subtitle ?? meta.subtitle ?? null,
      body: section.body ?? meta.body ?? null,
      ctaLabel: section.ctaLabel ?? meta.ctaLabel ?? null,
      ctaHref: section.ctaHref ?? meta.ctaHref ?? null,
      imageUrl: section.imageUrl ?? meta.imageUrl ?? null,
      sortOrder: section.sortOrder,
      isPublished: section.isPublished,
    },
    updatedAt: section.updatedAt.toISOString(),
  };
}

export async function PUT(req: Request, ctx: RouteContext) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const { sectionKey } = await ctx.params;
    if (!sectionKey) return jsonError("sectionKey is required.", 400);

    const body = (await req.json().catch(() => null)) as {
      title?: string;
      content?: CmsContent;
    } | null;

    const content = body?.content ?? {};
    const title =
      body?.title ||
      (typeof content.title === "string" ? content.title : undefined) ||
      sectionKey;

    const saved = await prisma.websiteContent.upsert({
      where: { sectionKey },
      create: {
        sectionKey,
        title,
        subtitle: typeof content.subtitle === "string" ? content.subtitle : null,
        body: typeof content.body === "string" ? content.body : null,
        ctaLabel: typeof content.ctaLabel === "string" ? content.ctaLabel : null,
        ctaHref: typeof content.ctaHref === "string" ? content.ctaHref : null,
        imageUrl: typeof content.imageUrl === "string" ? content.imageUrl : null,
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

    return jsonOk({ data: serializeCms(saved) });
  } catch (err) {
    console.error("[admin/cms/sectionKey]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function GET(_req: Request, ctx: RouteContext) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const { sectionKey } = await ctx.params;
    const section = await prisma.websiteContent.findUnique({
      where: { sectionKey },
    });
    if (!section) return jsonError("Section not found.", 404);

    return jsonOk({ data: serializeCms(section) });
  } catch (err) {
    console.error("[admin/cms/sectionKey GET]", err);
    return jsonError("Internal server error", 500);
  }
}
