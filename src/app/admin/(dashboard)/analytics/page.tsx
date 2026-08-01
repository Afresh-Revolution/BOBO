"use client";

import { useMemo } from "react";
import { AdminButton, AdminShell, StatCard } from "@/components/admin";
import { ChartSkeleton, StatsSkeleton } from "@/components/ui/Skeleton";
import { adminFetch } from "@/lib/admin-api";
import type { AnalyticsData } from "@/lib/admin-types";
import { useAdminResource } from "@/lib/use-admin-resource";
import styles from "../admin.module.scss";

export default function AnalyticsPage() {
  const { data, loading, error, reload } = useAdminResource<AnalyticsData | null>({
    initial: null,
    load: async () => {
      const res = await adminFetch<{
        ok?: boolean;
        data?: AnalyticsData;
      } & AnalyticsData>("/api/admin/analytics");
      return res.data ?? res;
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Failed to load analytics",
  });

  const statusMax = useMemo(() => {
    const items = data?.statusBreakdown ?? [];
    return Math.max(1, ...items.map((i) => i.count));
  }, [data]);

  const dayMax = useMemo(() => {
    const items = data?.applicationsByDay ?? [];
    return Math.max(1, ...items.map((i) => i.count));
  }, [data]);

  return (
    <AdminShell
      title="Analytics"
      description="Simple pulse on applications and conversions."
      actions={
        <AdminButton variant="secondary" size="sm" onClick={reload}>
          Refresh
        </AdminButton>
      }
    >
      {error ? <p className={styles.error}>{error}</p> : null}

      {loading ? (
        <>
          <div style={{ marginBottom: "1.25rem" }}>
            <StatsSkeleton count={3} />
          </div>
          <ChartSkeleton />
        </>
      ) : (
        <>
          <div className={styles.stats} style={{ marginBottom: "1.25rem" }}>
            <StatCard
              label="Views"
              value={data?.totals?.views ?? 0}
              accent="neutral"
            />
            <StatCard
              label="Applications"
              value={data?.totals?.applications ?? 0}
              accent="purple"
            />
            <StatCard
              label="Conversions"
              value={data?.totals?.conversions ?? 0}
              accent="gold"
            />
          </div>

          <div className={styles.chartRow}>
            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Status breakdown</h2>
              {(data?.statusBreakdown?.length ?? 0) === 0 ? (
                <p className={styles.muted}>No status data yet.</p>
              ) : (
                <div className={styles.bars}>
                  {data!.statusBreakdown!.map((item) => (
                    <div key={item.status} className={styles.barRow}>
                      <span>{item.status}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${Math.round((item.count / statusMax) * 100)}%`,
                          }}
                        />
                      </div>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className={styles.panel}>
              <h2 className={styles.panelTitle}>Applications by day</h2>
              {(data?.applicationsByDay?.length ?? 0) === 0 ? (
                <p className={styles.muted}>No daily series yet.</p>
              ) : (
                <div className={styles.bars}>
                  {data!.applicationsByDay!.map((item) => (
                    <div key={item.date} className={styles.barRow}>
                      <span>{item.date.slice(5)}</span>
                      <div className={styles.barTrack}>
                        <div
                          className={styles.barFill}
                          style={{
                            width: `${Math.round((item.count / dayMax) * 100)}%`,
                          }}
                        />
                      </div>
                      <span>{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </AdminShell>
  );
}
