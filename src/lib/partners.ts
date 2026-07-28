import "server-only";

import { prisma } from "@/lib/db";
import { sponsors as FALLBACK_PARTNERS } from "@/lib/content";

export type NetworkPartnerCard = {
  id: string;
  name: string;
  href: string | null;
  logoUrl: string | null;
  sortOrder: number;
};

export async function getPublishedNetworkPartners(): Promise<
  NetworkPartnerCard[]
> {
  try {
    const rows = await prisma.networkPartner.findMany({
      where: { isPublished: true, deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    if (!rows.length) {
      return FALLBACK_PARTNERS.map((p, i) => ({
        id: `fallback-${i}`,
        name: p.name,
        href: p.href,
        logoUrl: null,
        sortOrder: i,
      }));
    }

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      href: row.href,
      logoUrl: row.logoUrl,
      sortOrder: row.sortOrder,
    }));
  } catch (err) {
    console.error("[getPublishedNetworkPartners]", err);
    return FALLBACK_PARTNERS.map((p, i) => ({
      id: `fallback-${i}`,
      name: p.name,
      href: p.href,
      logoUrl: null,
      sortOrder: i,
    }));
  }
}
