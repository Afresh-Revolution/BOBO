import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;

    const [applications, pending, approved, registered, payments, revenueAgg] =
      await Promise.all([
        prisma.application.count(),
        prisma.application.count({
          where: { status: { in: ["PENDING", "UNDER_REVIEW"] } },
        }),
        prisma.application.count({ where: { status: "APPROVED" } }),
        prisma.application.count({ where: { status: "REGISTERED" } }),
        prisma.payment.count({ where: { status: "COMPLETED" } }),
        prisma.payment.aggregate({
          where: { status: "COMPLETED" },
          _sum: { amountNgnApprox: true },
        }),
      ]);

    return jsonOk({
      applications,
      pending,
      approved,
      registered,
      payments,
      revenue: revenueAgg._sum.amountNgnApprox ?? 0,
    });
  } catch (err) {
    console.error("[admin/stats]", err);
    return jsonError("Internal server error", 500);
  }
}
