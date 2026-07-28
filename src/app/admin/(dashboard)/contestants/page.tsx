"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AdminButton,
  AdminShell,
  BulkSelectBar,
  DataTable,
  StatusBadge,
  useConfirm,
  type Column,
} from "@/components/admin";
import { adminFetch, formatDate, unwrapList } from "@/lib/admin-api";
import { confirmAndBulkDelete } from "@/lib/admin-delete";
import type { Application } from "@/lib/admin-types";
import { useRowSelection } from "@/lib/use-row-selection";
import styles from "../admin.module.scss";

export default function ContestantsPage() {
  const ask = useConfirm();
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const selection = useRowSelection(rowIds);

  useEffect(() => {
    let cancelled = false;

    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const params = new URLSearchParams({ status: "approved,registered" });
          if (q.trim()) params.set("q", q.trim());

          let res: unknown;
          try {
            res = await adminFetch(`/api/admin/contestants?${params}`);
          } catch {
            const [approved, registered] = await Promise.all([
              adminFetch("/api/admin/applications?status=approved"),
              adminFetch("/api/admin/applications?status=registered"),
            ]);
            res = {
              data: [
                ...unwrapList<Application>(approved as never),
                ...unwrapList<Application>(registered as never),
              ],
            };
          }

          if (!cancelled) {
            const list = unwrapList<Application>(res as never).filter((row) =>
              ["approved", "registered"].includes(row.status),
            );
            setRows(list);
          }
        } catch (err) {
          if (!cancelled) {
            setRows([]);
            setError(
              err instanceof Error ? err.message : "Failed to load contestants",
            );
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [q, tick]);

  const deleteIds = useCallback(
    async (ids: string[]) => {
      setDeleting(true);
      setError(null);
      try {
        const deleted = await confirmAndBulkDelete({
          endpoint: "/api/admin/applications/bulk-delete",
          ids,
          label: ids.length === 1 ? "contestant" : "contestants",
          ask,
        });
        if (!deleted) return;
        selection.clear();
        setTick((n) => n + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setDeleting(false);
      }
    },
    [ask, selection],
  );

  const columns: Column<Application>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Contestant",
        render: (row) => row.fullName,
      },
      {
        key: "email",
        header: "Email",
        render: (row) => row.email,
      },
      {
        key: "location",
        header: "Location",
        render: (row) =>
          [row.city, row.state].filter(Boolean).join(", ") || "N/A",
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "updated",
        header: "Updated",
        render: (row) => formatDate(row.updatedAt || row.createdAt),
      },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
            <AdminButton
              size="sm"
              variant="danger"
              loading={deleting && selection.isSelected(row.id)}
              onClick={() => void deleteIds([row.id])}
            >
              Delete
            </AdminButton>
          </div>
        ),
      },
    ],
    [deleting, deleteIds, selection],
  );

  return (
    <AdminShell
      title="Contestants"
      description="Approved and registered contestants only."
    >
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search contestants…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <AdminButton
          variant="secondary"
          size="sm"
          onClick={() => setTick((n) => n + 1)}
        >
          Refresh
        </AdminButton>
      </div>

      {!loading && rows.length > 0 ? (
        <BulkSelectBar
          total={rows.length}
          selectedCount={selection.selectedCount}
          onSelectAll={selection.selectAll}
          onSelectFirst={selection.selectFirst}
          onClear={selection.clear}
          onDelete={() => deleteIds(selection.selectedIds)}
          deleting={deleting}
          entityLabel="contestants"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No contestants yet"
        emptyHint="Approved applicants will appear here."
        selection={selection}
      />
    </AdminShell>
  );
}
