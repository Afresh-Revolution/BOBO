import "server-only";

import { prisma } from "@/lib/db";
import {
  FALLBACK_WINNERS,
  type SeasonWinner,
} from "@/lib/winners-shared";

export type { SeasonWinner };
export { FALLBACK_WINNERS as fallbackWinners };

export async function getPublishedWinners(): Promise<SeasonWinner[]> {
  try {
    const rows = await prisma.seasonWinner.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { seasonNumber: "desc" }],
    });

    if (!rows.length) return FALLBACK_WINNERS;

    const mapped = rows
      .map((row) => ({
        id: row.id,
        seasonNumber: row.seasonNumber,
        seasonLabel: row.seasonLabel,
        winnerName: row.winnerName,
        stateOfOrigin: row.stateOfOrigin,
        imageUrl: row.imageUrl?.trim() || "/winner.png",
        sortOrder: row.sortOrder,
      }))
      .filter((row) => Boolean(row.winnerName && row.imageUrl));

    return mapped.length ? mapped : FALLBACK_WINNERS;
  } catch (err) {
    console.error("[getPublishedWinners]", err);
    return FALLBACK_WINNERS;
  }
}
