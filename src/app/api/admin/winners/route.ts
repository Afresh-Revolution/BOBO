import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { z } from "zod";

const winnerSchema = z.object({
  seasonNumber: z.coerce.number().int().positive(),
  seasonLabel: z.string().trim().min(1).max(80),
  winnerName: z.string().trim().min(1).max(120),
  stateOfOrigin: z.string().trim().min(1).max(120),
  imageUrl: z.string().trim().min(1).max(2048),
  sortOrder: z.coerce.number().int().optional().default(0),
  isPublished: z.boolean().optional().default(true),
});

function serialize(row: {
  id: string;
  seasonNumber: number;
  seasonLabel: string;
  winnerName: string;
  stateOfOrigin: string;
  imageUrl: string;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}) {
  return {
    id: row.id,
    seasonNumber: row.seasonNumber,
    seasonLabel: row.seasonLabel,
    winnerName: row.winnerName,
    stateOfOrigin: row.stateOfOrigin,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    isPublished: row.isPublished,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    deletedAt: row.deletedAt?.toISOString() ?? null,
  };
}

export async function GET() {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const rows = await prisma.seasonWinner.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { seasonNumber: "desc" }],
    });

    return jsonOk({ data: rows.map(serialize) });
  } catch (err) {
    console.error("[admin/winners GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const parsed = winnerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const data = parsed.data;
    const existing = await prisma.seasonWinner.findUnique({
      where: { seasonNumber: data.seasonNumber },
    });
    if (existing && !existing.deletedAt) {
      return jsonError(`Season ${data.seasonNumber} already exists.`, 409);
    }

    const row = existing
      ? await prisma.seasonWinner.update({
          where: { id: existing.id },
          data: { ...data, deletedAt: null },
        })
      : await prisma.seasonWinner.create({ data });

    revalidatePublicSite();
    return jsonOk({ data: serialize(row) });
  } catch (err) {
    console.error("[admin/winners POST]", err);
    return jsonError("Internal server error", 500);
  }
}
