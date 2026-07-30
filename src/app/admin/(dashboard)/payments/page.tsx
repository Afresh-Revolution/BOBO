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
import { registrationFee } from "@/lib/content";
import { useRowSelection } from "@/lib/use-row-selection";
import styles from "../admin.module.scss";

function formatFee(row: Payment) {
  const cbc = row.amountCbc ?? registrationFee.amountCbc;
  const ngn = row.amount || registrationFee.amountNgnApprox;
  return `${cbc} CBC (≈ ${formatMoney(ngn, row.currency || "NGN")})`;
}

export default function PaymentsPage() {
  const ask = useConfirm();
  const [rows, setRows] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tick, setTick] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Payment | null>(null);

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
        if (selected && ids.includes(selected.id)) setSelected(null);
        setTick((n) => n + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setDeleting(false);
      }
    },
    [ask, selection, selected],
  );

  const exportSelected = useCallback(async () => {
    const ids = selection.selectedIds;
    if (!ids.length) {
      setError("Select at least one payment to export.");
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/payments/export", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids, format: "xlsx" }),
      });

      if (!res.ok) {
        const json = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(json?.error || `Export failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "bobo-payments.xlsx";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export Excel");
    } finally {
      setExporting(false);
    }
  }, [selection.selectedIds]);

  const confirmPayment = useCallback(
    async (payment: Payment) => {
      const ok = await ask({
        title: "Confirm payment?",
        message: `Mark ${payment.contestantName}'s CBC payment as confirmed? They will be registered and emailed.`,
        confirmLabel: "Confirm payment",
        cancelLabel: "Cancel",
        tone: "default",
      });
      if (!ok) return;

      setConfirmingId(payment.id);
      setError(null);
      try {
        const res = await adminFetch<{ data: Payment; message?: string }>(
          `/api/admin/payments/${payment.id}/confirm`,
          { method: "POST" },
        );
        const updated = res.data;
        if (updated) {
          setRows((prev) =>
            prev.map((row) => (row.id === payment.id ? { ...row, ...updated } : row)),
          );
          setSelected((prev) =>
            prev?.id === payment.id ? { ...prev, ...updated } : prev,
          );
        } else {
          setTick((n) => n + 1);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to confirm payment",
        );
      } finally {
        setConfirmingId(null);
      }
    },
    [ask],
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
        key: "phone",
        header: "Phone",
        render: (row) => row.phone || "N/A",
      },
      {
        key: "amount",
        header: "Amount",
        render: (row) => formatFee(row),
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
              variant="secondary"
              onClick={() => setSelected(row)}
            >
              View
            </AdminButton>
            {row.status === "pending" ? (
              <AdminButton
                size="sm"
                variant="gold"
                loading={confirmingId === row.id}
                onClick={() => void confirmPayment(row)}
              >
                Confirm
              </AdminButton>
            ) : null}
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
    [confirmPayment, confirmingId, deleting, deleteIds, selection],
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
          onExport={exportSelected}
          deleting={deleting}
          exporting={exporting}
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
        onRowClick={setSelected}
        selection={selection}
      />

      {selected ? (
        <>
          <button
            type="button"
            className={styles.drawerBackdrop}
            aria-label="Close details"
            onClick={() => setSelected(null)}
          />
          <aside className={styles.drawer} role="dialog" aria-modal="true">
            <div className={styles.drawerHeader}>
              <div>
                <h2>{selected.contestantName}</h2>
                <p>{selected.email}</p>
              </div>
              <AdminButton
                variant="ghost"
                size="sm"
                onClick={() => setSelected(null)}
              >
                Close
              </AdminButton>
            </div>

            <dl className={styles.meta}>
              <div>
                <dt>Status</dt>
                <dd>
                  <StatusBadge status={selected.status} />
                </dd>
              </div>
              <div>
                <dt>Amount</dt>
                <dd>{formatFee(selected)}</dd>
              </div>
              <div>
                <dt>Reference</dt>
                <dd>{selected.reference || "N/A"}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(selected.createdAt)}</dd>
              </div>
              <div>
                <dt>Name on receipt</dt>
                <dd>{selected.submittedFullName || selected.contestantName}</dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd>{selected.phone || "N/A"}</dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>{selected.age ?? "N/A"}</dd>
              </div>
              <div>
                <dt>State of residence</dt>
                <dd>{selected.stateOfResidence || "N/A"}</dd>
              </div>
              <div>
                <dt>NIN</dt>
                <dd>{selected.nin || "N/A"}</dd>
              </div>
              <div>
                <dt>CBC receipt</dt>
                <dd>
                  {selected.receiptUrl ? (
                    <div className={styles.videoBlock}>
                      {/\.pdf(\?|$)/i.test(selected.receiptUrl) ? (
                        <iframe
                          className={styles.receiptPreview}
                          src={selected.receiptUrl}
                          title="CBC receipt"
                        />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          className={styles.receiptPreview}
                          src={selected.receiptUrl}
                          alt="CBC purchase receipt"
                        />
                      )}
                      <a
                        className={styles.mediaLink}
                        href={selected.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open full size
                      </a>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </dd>
              </div>
            </dl>

            <div className={styles.rowActions} style={{ marginTop: "1rem" }}>
              {selected.status === "pending" ? (
                <AdminButton
                  variant="gold"
                  loading={confirmingId === selected.id}
                  onClick={() => void confirmPayment(selected)}
                >
                  Confirm payment
                </AdminButton>
              ) : null}
              <AdminButton
                variant="danger"
                loading={deleting}
                onClick={() => void deleteIds([selected.id])}
              >
                Delete payment
              </AdminButton>
            </div>
          </aside>
        </>
      ) : null}
    </AdminShell>
  );
}
