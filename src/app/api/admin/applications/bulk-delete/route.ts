import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk, clientIp } from "@/lib/api";
import { parseIdList } from "@/lib/admin-bulk";
import type { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const body = await req.json().catch(() => null);
    const ids = parseIdList(body);
    if (!ids) return jsonError("ids must be a non-empty string array.", 400);

    const apps = await prisma.application.findMany({
      where: { id: { in: ids } },
      select: { id: true, userId: true },
    });
    if (!apps.length) return jsonError("No matching applications.", 404);

    const appIds = apps.map((a) => a.id);
    const userIds = [...new Set(apps.map((a) => a.userId))];

    await prisma.$transaction(async (tx) => {
      await tx.emailLog.deleteMany({ where: { applicationId: { in: appIds } } });
      await tx.application.deleteMany({ where: { id: { in: appIds } } });

      for (const userId of userIds) {
        const remaining = await tx.application.count({ where: { userId } });
        if (remaining === 0) {
          await tx.user.delete({ where: { id: userId } }).catch(() => undefined);
        }
      }

      await tx.auditLog.create({
        data: {
          adminId: admin.id,
          action: "application.bulk_delete",
          entity: "Application",
          ip: clientIp(req),
          userAgent: req.headers.get("user-agent") || undefined,
          meta: { ids: appIds, requested: ids.length } as Prisma.InputJsonValue,
        },
      });
    });

    return jsonOk({ data: { deleted: appIds.length, ids: appIds } });
  } catch (err) {
    console.error("[admin/applications/bulk-delete]", err);
    return jsonError("Internal server error", 500);
  }
}
