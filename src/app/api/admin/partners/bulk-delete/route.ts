import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk, clientIp } from "@/lib/api";
import { parseIdList } from "@/lib/admin-bulk";
import { revalidatePublicSite } from "@/lib/revalidate-site";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const ids = parseIdList(body);
    if (!ids) return jsonError("ids must be a non-empty string array.", 400);

    const result = await prisma.networkPartner.updateMany({
      where: { id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date(), isPublished: false },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "partner.bulk_delete",
        entity: "NetworkPartner",
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent") || undefined,
        meta: { ids, deleted: result.count } as Prisma.InputJsonValue,
      },
    });

    revalidatePublicSite();
    return jsonOk({ data: { deleted: result.count, ids } });
  } catch (err) {
    console.error("[admin/partners/bulk-delete]", err);
    return jsonError("Internal server error", 500);
  }
}
