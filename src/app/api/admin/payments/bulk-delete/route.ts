import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk, clientIp } from "@/lib/api";
import { parseIdList } from "@/lib/admin-bulk";

export async function POST(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const body = await req.json().catch(() => null);
    const ids = parseIdList(body);
    if (!ids) return jsonError("ids must be a non-empty string array.", 400);

    const result = await prisma.payment.deleteMany({
      where: { id: { in: ids } },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "payment.bulk_delete",
        entity: "Payment",
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent") || undefined,
        meta: { ids, deleted: result.count } as object,
      },
    });

    return jsonOk({ data: { deleted: result.count, ids } });
  } catch (err) {
    console.error("[admin/payments/bulk-delete]", err);
    return jsonError("Internal server error", 500);
  }
}
