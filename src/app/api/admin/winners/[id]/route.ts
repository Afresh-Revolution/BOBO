import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  seasonNumber: z.coerce.number().int().positive().optional(),
  seasonLabel: z.string().trim().min(1).max(80).optional(),
  winnerName: z.string().trim().min(1).max(120).optional(),
  stateOfOrigin: z.string().trim().min(1).max(120).optional(),
  imageUrl: z.string().trim().min(1).max(2048).optional(),
  sortOrder: z.coerce.number().int().optional(),
  isPublished: z.boolean().optional(),
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

export async function PATCH(req: Request, ctx: RouteContext) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const { id } = await ctx.params;
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const existing = await prisma.seasonWinner.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return jsonError("Winner not found.", 404);

    if (
      parsed.data.seasonNumber != null &&
      parsed.data.seasonNumber !== existing.seasonNumber
    ) {
      const clash = await prisma.seasonWinner.findUnique({
        where: { seasonNumber: parsed.data.seasonNumber },
      });
      if (clash && clash.id !== id && !clash.deletedAt) {
        return jsonError(`Season ${parsed.data.seasonNumber} already exists.`, 409);
      }
    }

    const row = await prisma.seasonWinner.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePublicSite();
    return jsonOk({ data: serialize(row) });
  } catch (err) {
    console.error("[admin/winners PATCH]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const { id } = await ctx.params;
    const existing = await prisma.seasonWinner.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return jsonError("Winner not found.", 404);

    await prisma.seasonWinner.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });

    revalidatePublicSite();
    return jsonOk({ data: { id } });
  } catch (err) {
    console.error("[admin/winners DELETE]", err);
    return jsonError("Internal server error", 500);
  }
}
