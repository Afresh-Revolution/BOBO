import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { z } from "zod";

const partnerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  href: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .nullable()
    .transform((v) => (v && v.length ? v : null)),
  logoUrl: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .nullable()
    .transform((v) => (v && v.length ? v : null)),
  sortOrder: z.coerce.number().int().optional().default(0),
  isPublished: z.boolean().optional().default(true),
});

function serialize(row: {
  id: string;
  name: string;
  href: string | null;
  logoUrl: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}) {
  return {
    id: row.id,
    name: row.name,
    href: row.href,
    logoUrl: row.logoUrl,
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

    const rows = await prisma.networkPartner.findMany({
      where: { deletedAt: null },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });

    return jsonOk({ data: rows.map(serialize) });
  } catch (err) {
    console.error("[admin/partners GET]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const parsed = partnerSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message || "Invalid payload", 400);
    }

    const row = await prisma.networkPartner.create({
      data: parsed.data,
    });

    revalidatePublicSite();
    return jsonOk({ data: serialize(row) });
  } catch (err) {
    console.error("[admin/partners POST]", err);
    return jsonError("Internal server error", 500);
  }
}
