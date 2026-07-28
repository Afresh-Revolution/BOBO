import { prisma } from "@/lib/db";
import { getAdminFromCookies } from "@/lib/auth";
import { jsonError, jsonOk, clientIp } from "@/lib/api";
import { parseIdList } from "@/lib/admin-bulk";

export async function POST(req: Request) {
  try {
    const admin = await getAdminFromCookies();
    if (!admin) return jsonError("Unauthorized", 401);

    const body = await req.json().catch(() => null);
    const ids = parseIdList(body);
    if (!ids) return jsonError("ids must be a non-empty string array.", 400);

    const result = await prisma.emailLog.deleteMany({
      where: { id: { in: ids } },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "email.bulk_delete",
        entity: "EmailLog",
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent") || undefined,
        meta: { ids, deleted: result.count } as object,
      },
    });

    return jsonOk({ data: { deleted: result.count, ids } });
  } catch (err) {
    console.error("[admin/emails/bulk-delete]", err);
    return jsonError("Internal server error", 500);
  }
}
