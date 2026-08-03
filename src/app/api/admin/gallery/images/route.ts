import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { z } from "zod";

const imageSchema = z.object({
  albumId: z.string().uuid(),
  imageUrl: z.string().trim().min(1).max(2048),
  caption: z.string().trim().max(300).optional().nullable(),
  alt: z.string().trim().max(200).optional().nullable(),
  sortOrder: z.coerce.number().int().optional().default(0),
  isPublished: z.boolean().optional().default(true),
});

const bulkSchema = z.object({
  albumId: z.string().uuid(),
  images: z
    .array(
      z.object({
        imageUrl: z.string().trim().min(1).max(2048),
        caption: z.string().trim().max(300).optional().nullable(),
        alt: z.string().trim().max(200).optional().nullable(),
        sortOrder: z.coerce.number().int().optional(),
        isPublished: z.boolean().optional(),
      }),
    )
    .min(1)
    .max(40),
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

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;

    const url = new URL(req.url);
    const albumId = url.searchParams.get("albumId");
    if (!albumId) return jsonError("albumId is required.", 400);

    const rows = await prisma.galleryImage.findMany({
      where: { albumId, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return jsonOk({ data: rows.map(serializeImage) });
  } catch (err) {
    console.error("[admin/gallery/images GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;

    const body = await req.json().catch(() => null);

    // Bulk: { albumId, images: [...] }
    if (body && typeof body === "object" && Array.isArray(body.images)) {
      const parsed = bulkSchema.safeParse(body);
      if (!parsed.success) {
        return jsonError(
          parsed.error.issues[0]?.message || "Invalid payload",
          400,
        );
      }

      const { albumId, images } = parsed.data;
      const album = await prisma.galleryAlbum.findFirst({
        where: { id: albumId, deletedAt: null },
      });
      if (!album) return jsonError("Album not found.", 404);

      const maxSort = await prisma.galleryImage.aggregate({
        where: { albumId, deletedAt: null },
        _max: { sortOrder: true },
      });
      let nextSort = (maxSort._max.sortOrder ?? -1) + 1;

      const created = await prisma.$transaction(
        images.map((item) => {
          const sortOrder =
            typeof item.sortOrder === "number" ? item.sortOrder : nextSort++;
          return prisma.galleryImage.create({
            data: {
              albumId,
              imageUrl: item.imageUrl,
              caption: item.caption ?? null,
              alt: item.alt ?? null,
              sortOrder,
              isPublished: item.isPublished ?? true,
            },
          });
        }),
      );

      if (!album.coverUrl && created[0]) {
        await prisma.galleryAlbum.update({
          where: { id: album.id },
          data: { coverUrl: created[0].imageUrl },
        });
      }

      revalidatePublicSite();
      return jsonOk({ data: created.map(serializeImage) });
    }

    const parsed = imageSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const data = parsed.data;
    const album = await prisma.galleryAlbum.findFirst({
      where: { id: data.albumId, deletedAt: null },
    });
    if (!album) return jsonError("Album not found.", 404);

    const row = await prisma.galleryImage.create({
      data: {
        albumId: data.albumId,
        imageUrl: data.imageUrl,
        caption: data.caption ?? null,
        alt: data.alt ?? null,
        sortOrder: data.sortOrder,
        isPublished: data.isPublished,
      },
    });

    if (!album.coverUrl) {
      await prisma.galleryAlbum.update({
        where: { id: album.id },
        data: { coverUrl: data.imageUrl },
      });
    }

    revalidatePublicSite();
    return jsonOk({ data: serializeImage(row) });
  } catch (err) {
    console.error("[admin/gallery/images POST]", err);
    return jsonError("Internal server error", 500);
  }
}
