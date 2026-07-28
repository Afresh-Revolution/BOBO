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
import { adminFetch, formatDate, formatMoney, unwrapList } from "@/lib/admin-api";
import { confirmAndBulkDelete } from "@/lib/admin-delete";
import type { Payment } from "@/lib/admin-types";
import { useRowSelection } from "@/lib/use-row-selection";
import styles from "../admin.module.scss";

export default function PaymentsPage() {
  const ask = useConfirm();
  const [rows, setRows] = useState<Payment[]>([]);
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
          const params = new URLSearchParams();
          if (q.trim()) params.set("q", q.trim());
          const qs = params.toString();
          const res = await adminFetch(
            `/api/admin/payments${qs ? `?${qs}` : ""}`,
          );
          if (!cancelled) setRows(unwrapList<Payment>(res as never));
        } catch (err) {
          if (!cancelled) {
            setRows([]);
            setError(
              err instanceof Error ? err.message : "Failed to load payments",
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
          endpoint: "/api/admin/payments/bulk-delete",
          ids,
          label: ids.length === 1 ? "payment" : "payments",
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

  const columns: Column<Payment>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Contestant",
        render: (row) => row.contestantName,
      },
      {
        key: "email",
        header: "Email",
        render: (row) => row.email,
      },
      {
        key: "amount",
        header: "Amount",
        render: (row) => formatMoney(row.amount, row.currency || "NGN"),
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "ref",
        header: "Reference",
        render: (row) => row.reference || "N/A",
      },
      {
        key: "date",
        header: "Date",
        render: (row) => formatDate(row.createdAt),
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
      title="Payments"
      description="Registration fees and payment statuses."
      actions={
        <AdminButton
          variant="secondary"
          size="sm"
          onClick={() => setTick((n) => n + 1)}
        >
          Refresh
        </AdminButton>
      }
    >
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search by name, email, reference…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
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
          entityLabel="payments"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No payments"
        emptyHint="Successful and pending charges will list here."
        selection={selection}
      />
    </AdminShell>
  );
}
