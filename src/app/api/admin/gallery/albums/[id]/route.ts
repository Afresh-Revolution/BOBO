import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { slugify } from "@/lib/slugify";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  title: z.string().trim().min(1).max(120).optional(),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  coverUrl: z.string().trim().max(2048).optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  isPublished: z.boolean().optional(),
});

function serializeAlbum(row: {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  coverUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverUrl: row.coverUrl,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

async function uniqueSlug(desired: string, excludeId: string) {
  let slug = slugify(desired);
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.galleryAlbum.findFirst({
      where: { slug: candidate, deletedAt: null, NOT: { id: excludeId } },
    });
    if (!existing) return candidate;
    n += 1;
  }
}

export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;

    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const existing = await prisma.galleryAlbum.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return jsonError("Album not found.", 404);

    const data = parsed.data;
    let slug = existing.slug;
    if (data.slug != null || data.title != null) {
      slug = await uniqueSlug(data.slug || data.title || existing.title, id);
    }

    const row = await prisma.galleryAlbum.update({
      where: { id },
      data: {
        title: data.title,
        slug,
        description: data.description,
        coverUrl: data.coverUrl === undefined ? undefined : data.coverUrl || null,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      },
    });

    revalidatePublicSite();
    return jsonOk({ data: serializeAlbum(row) });
  } catch (err) {
    console.error("[admin/gallery/albums PATCH]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;

    const { id } = await ctx.params;
    const existing = await prisma.galleryAlbum.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return jsonError("Album not found.", 404);

    const now = new Date();
    await prisma.$transaction([
      prisma.galleryImage.updateMany({
        where: { albumId: id, deletedAt: null },
        data: { deletedAt: now, isPublished: false },
      }),
      prisma.galleryAlbum.update({
        where: { id },
        data: { deletedAt: now, isPublished: false },
      }),
    ]);

    revalidatePublicSite();
    return jsonOk({ data: { id } });
  } catch (err) {
    console.error("[admin/gallery/albums DELETE]", err);
    return jsonError("Internal server error", 500);
  }
}
