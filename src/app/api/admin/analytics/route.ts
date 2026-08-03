import { prisma } from "@/lib/db";
import { requireAdminApi } from "@/lib/security/admin-api";
import { jsonError, jsonOk } from "@/lib/api";
import { mapAppStatus } from "@/lib/serializers";

export async function GET(req: Request) {
  try {
    const gated = await requireAdminApi(req);
    if (gated instanceof Response) return gated;
    const { admin } = gated;

    const since = new Date();
    since.setDate(since.getDate() - 13);
    since.setHours(0, 0, 0, 0);

    const [apps, byStatus, recentApps, recentPayments, registered] =
      await Promise.all([
        prisma.application.count(),
        prisma.application.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        prisma.application.findMany({
          where: { createdAt: { gte: since } },
          select: { createdAt: true },
        }),
        prisma.payment.findMany({
          where: { createdAt: { gte: since }, status: "COMPLETED" },
          select: { createdAt: true, amountNgnApprox: true },
        }),
        prisma.application.count({ where: { status: "REGISTERED" } }),
      ]);

    const dayKeys: string[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      dayKeys.push(d.toISOString().slice(0, 10));
    }

    const appCounts = Object.fromEntries(dayKeys.map((k) => [k, 0]));
    for (const a of recentApps) {
      const key = a.createdAt.toISOString().slice(0, 10);
      if (key in appCounts) appCounts[key] += 1;
    }

    const payAmounts = Object.fromEntries(dayKeys.map((k) => [k, 0]));
    for (const p of recentPayments) {
      const key = p.createdAt.toISOString().slice(0, 10);
      if (key in payAmounts) payAmounts[key] += p.amountNgnApprox;
    }

    const statusBreakdown = byStatus.map((row) => ({
      status: mapAppStatus(row.status),
      count: row._count._all,
    }));

    // Merge duplicate mapped statuses (e.g. PENDING + UNDER_REVIEW → pending)
    const merged = new Map<string, number>();
    for (const row of statusBreakdown) {
      merged.set(row.status, (merged.get(row.status) || 0) + row.count);
    }

    const data = {
      applicationsByDay: dayKeys.map((date) => ({
        date,
        count: appCounts[date],
      })),
      paymentsByDay: dayKeys.map((date) => ({
        date,
        amount: payAmounts[date],
      })),
      statusBreakdown: [...merged.entries()].map(([status, count]) => ({
        status,
        count,
      })),
      totals: {
        views: 0,
        applications: apps,
        conversions: registered,
      },
    };

    return jsonOk({ ...data, data });
  } catch (err) {
    console.error("[admin/analytics]", err);
    return jsonError("Internal server error", 500);
  }
}
