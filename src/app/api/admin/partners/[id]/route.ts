import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import { z } from "zod";

type RouteContext = { params: Promise<{ id: string }> };

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  href: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? undefined : v && v.length ? v : null)),
  logoUrl: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .nullable()
    .transform((v) => (v === undefined ? undefined : v && v.length ? v : null)),
  sortOrder: z.coerce.number().int().optional(),
  isPublished: z.boolean().optional(),
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

    const existing = await prisma.networkPartner.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return jsonError("Partner not found.", 404);

    const row = await prisma.networkPartner.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePublicSite();
    return jsonOk({ data: serialize(row) });
  } catch (err) {
    console.error("[admin/partners PATCH]", err);
    return jsonError("Internal server error", 500);
  }
}

export async function DELETE(req: Request, ctx: RouteContext) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const { id } = await ctx.params;
    const existing = await prisma.networkPartner.findFirst({
      where: { id, deletedAt: null },
    });
    if (!existing) return jsonError("Partner not found.", 404);

    await prisma.networkPartner.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });

    revalidatePublicSite();
    return jsonOk({ data: { id } });
  } catch (err) {
    console.error("[admin/partners DELETE]", err);
    return jsonError("Internal server error", 500);
  }
}
