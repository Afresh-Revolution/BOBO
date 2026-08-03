import { prisma } from "@/lib/db";
import {
  requireRole,
} from "@/lib/auth";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk, clientIp } from "@/lib/api";
import { parseIdList } from "@/lib/admin-bulk";

export async function POST(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    if (!requireRole(admin, ["SUPER_ADMIN"])) {
      return jsonError("Only SUPER_ADMIN can delete admins.", 403);
    }

    const body = await req.json().catch(() => null);
    const ids = parseIdList(body);
    if (!ids) return jsonError("ids must be a non-empty string array.", 400);

    if (ids.includes(admin.id)) {
      return jsonError("You cannot delete your own admin account.", 400);
    }

    const targets = await prisma.admin.findMany({
      where: { id: { in: ids } },
      select: { id: true, role: true, email: true },
    });
    if (!targets.length) return jsonError("No matching admins.", 404);

    const removingSuper = targets.filter((t) => t.role === "SUPER_ADMIN");
    if (removingSuper.length) {
      const remainingSupers = await prisma.admin.count({
        where: {
          role: "SUPER_ADMIN",
          isActive: true,
          id: { notIn: removingSuper.map((t) => t.id) },
        },
      });
      if (remainingSupers === 0) {
        return jsonError("Cannot delete the last SUPER_ADMIN.", 400);
      }
    }

    const targetIds = targets.map((t) => t.id);
    // Soft-delete: deactivate rather than hard-delete to preserve audit FKs.
    const result = await prisma.admin.updateMany({
      where: { id: { in: targetIds } },
      data: { isActive: false },
    });

    await prisma.auditLog.create({
      data: {
        adminId: admin.id,
        action: "admin.bulk_delete",
        entity: "Admin",
        ip: clientIp(req),
        userAgent: req.headers.get("user-agent") || undefined,
        meta: {
          ids: targetIds,
          emails: targets.map((t) => t.email),
          deleted: result.count,
        } as object,
      },
    });

    return jsonOk({ data: { deleted: result.count, ids: targetIds } });
  } catch (err) {
    console.error("[admin/admins/bulk-delete]", err);
    return jsonError("Internal server error", 500);
  }
}
