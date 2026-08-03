import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { slugify } from "@/lib/slugify";
import { z } from "zod";

const albumSchema = z.object({
  title: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(1).max(80).optional(),
  description: z.string().trim().max(2000).optional().nullable(),
  coverUrl: z.string().trim().max(2048).optional().nullable(),
  sortOrder: z.coerce.number().int().optional().default(0),
  isPublished: z.boolean().optional().default(true),
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
  _count?: { images: number };
}) {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    description: row.description,
    coverUrl: row.coverUrl,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    imageCount: row._count?.images ?? undefined,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

async function uniqueSlug(desired: string, excludeId?: string) {
  let slug = slugify(desired);
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.galleryAlbum.findFirst({
      where: {
        slug: candidate,
        deletedAt: null,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    if (!existing) return candidate;
    n += 1;
  }
}

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;

    const rows = await prisma.galleryAlbum.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
      include: {
        _count: {
          select: { images: { where: { deletedAt: null } } },
        },
      },
    });

    return jsonOk({ data: rows.map(serializeAlbum) });
  } catch (err) {
    console.error("[admin/gallery/albums GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;

    const body = await req.json().catch(() => null);
    const parsed = albumSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const data = parsed.data;
    const slug = await uniqueSlug(data.slug || data.title);

    const softDeleted = await prisma.galleryAlbum.findFirst({
      where: { slug, deletedAt: { not: null } },
    });

    const row = softDeleted
      ? await prisma.galleryAlbum.update({
          where: { id: softDeleted.id },
          data: {
            title: data.title,
            slug,
            description: data.description ?? null,
            coverUrl: data.coverUrl || null,
            sortOrder: data.sortOrder,
            isPublished: data.isPublished,
            deletedAt: null,
          },
          include: {
            _count: {
              select: { images: { where: { deletedAt: null } } },
            },
          },
        })
      : await prisma.galleryAlbum.create({
          data: {
            title: data.title,
            slug,
            description: data.description ?? null,
            coverUrl: data.coverUrl || null,
            sortOrder: data.sortOrder,
            isPublished: data.isPublished,
          },
          include: {
            _count: {
              select: { images: { where: { deletedAt: null } } },
            },
          },
        });

    revalidatePublicSite();
    return jsonOk({ data: serializeAlbum(row) });
  } catch (err) {
    console.error("[admin/gallery/albums POST]", err);
    return jsonError("Internal server error", 500);
  }
}
