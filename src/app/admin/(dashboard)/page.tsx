"use client";

import { AdminShell, StatCard } from "@/components/admin";
import { StatsSkeleton } from "@/components/ui/Skeleton";
import { adminFetch } from "@/lib/admin-api";
import type { DashboardStats } from "@/lib/admin-types";
import { useAdminResource } from "@/lib/use-admin-resource";
import styles from "./admin.module.scss";

const EMPTY: DashboardStats = {
  applications: 0,
  pending: 0,
  approved: 0,
  registered: 0,
  payments: 0,
};

export default function AdminDashboardPage() {
  const { data, loading, error } = useAdminResource({
    initial: EMPTY,
    load: async () => {
      const res = await adminFetch<{
        ok?: boolean;
        data?: DashboardStats;
      } & Partial<DashboardStats>>("/api/admin/stats");

      return (
        res.data ?? {
          applications: res.applications ?? 0,
          pending: res.pending ?? 0,
          approved: res.approved ?? 0,
          registered: res.registered ?? 0,
          payments: res.payments ?? 0,
          revenue: res.revenue,
        }
      );
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Could not load dashboard stats",
  });

  const s = data ?? EMPTY;

  return (
    <AdminShell
      title="Dashboard"
      description="Season overview: applications, approvals, and payments."
    >
      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <StatsSkeleton count={5} />
      ) : (
        <div className={styles.stats}>
          <StatCard
            label="Applications"
            value={s.applications}
            accent="purple"
            hint="Total submissions"
          />
          <StatCard
            label="Pending"
            value={s.pending}
            accent="gold"
            hint="Awaiting review"
          />
          <StatCard
            label="Approved"
            value={s.approved}
            accent="neutral"
            hint="Ready to register"
          />
          <StatCard
            label="Registered"
            value={s.registered}
            accent="purple"
            hint="Paid & confirmed"
          />
          <StatCard
            label="Payments"
            value={s.payments}
            accent="gold"
            hint={s.revenue != null ? `Revenue tracked` : "Successful charges"}
          />
        </div>
      )}
    </AdminShell>
  );
}
