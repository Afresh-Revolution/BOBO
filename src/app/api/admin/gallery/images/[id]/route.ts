import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  imageUrl: z.string().trim().min(1).max(2048).optional(),
  caption: z.string().trim().max(300).optional().nullable(),
  alt: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.coerce.number().int().optional(),
  isPublished: z.boolean().optional(),
});

function serializeImage(row: {
  id: string;
  albumId: string;
  imageUrl: string;
  caption: string | null;
  alt: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}) {
  return {
    id: row.id,
    albumId: row.albumId,
    imageUrl: row.imageUrl,
    caption: row.caption,
    alt: row.alt,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
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

    const existing = await prisma.galleryImage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return jsonError("Image not found.", 404);

    const row = await prisma.galleryImage.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePublicSite();
    return jsonOk({ data: serializeImage(row) });
  } catch (err) {
    console.error("[admin/gallery/images PATCH]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;

    const { id } = await ctx.params;
    const existing = await prisma.galleryImage.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return jsonError("Image not found.", 404);

    await prisma.galleryImage.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });

    revalidatePublicSite();
    return jsonOk({ data: { id } });
  } catch (err) {
    console.error("[admin/gallery/images DELETE]", err);
    return jsonError("Internal server error", 500);
  }
}
