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
import type { Application, ApplicationStatus } from "@/lib/admin-types";
import { useRowSelection } from "@/lib/use-row-selection";
import styles from "../admin.module.scss";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "All statuses" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "registered", label: "Registered" },
];

/** Force download for Cloudinary URLs; otherwise return the original URL. */
function attachmentUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.includes("cloudinary.com")) return url;
    if (parsed.pathname.includes("/upload/") && !parsed.pathname.includes("fl_attachment")) {
      parsed.pathname = parsed.pathname.replace("/upload/", "/upload/fl_attachment/");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export default function ApplicationsPage() {
  const ask = useConfirm();
  const [rows, setRows] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [selected, setSelected] = useState<Application | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [reason, setReason] = useState("");
  const [tick, setTick] = useState(0);

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
          if (status) params.set("status", status);
          if (q.trim()) params.set("q", q.trim());
          const qs = params.toString();
          const res = await adminFetch(
            `/api/admin/applications${qs ? `?${qs}` : ""}`,
          );
          if (!cancelled) setRows(unwrapList<Application>(res as never));
        } catch (err) {
          if (!cancelled) {
            setRows([]);
            setError(
              err instanceof Error ? err.message : "Failed to load applications",
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
  }, [q, status, tick]);

  const patchStatus = useCallback(
    async (id: string, action: "approve" | "reject", rejectReason?: string) => {
      setActingId(id);
      setError(null);
      try {
        await adminFetch(`/api/admin/applications/${id}`, {
          method: "PATCH",
          body: {
            action,
            ...(action === "reject" && rejectReason
              ? { reason: rejectReason }
              : {}),
          },
        });
        setTick((n) => n + 1);
        setSelected((prev) =>
          prev?.id === id
            ? {
                ...prev,
                status: (action === "approve"
                  ? "approved"
                  : "rejected") as ApplicationStatus,
                reason: rejectReason || prev.reason,
              }
            : prev,
        );
        setReason("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Action failed");
      } finally {
        setActingId(null);
      }
    },
    [],
  );

  const deleteIds = useCallback(
    async (ids: string[]) => {
      setDeleting(true);
      setError(null);
      try {
        const deleted = await confirmAndBulkDelete({
          endpoint: "/api/admin/applications/bulk-delete",
          ids,
          label: ids.length === 1 ? "submission" : "submissions",
          ask,
        });
        if (!deleted) return;
        selection.clear();
        setSelected((prev) => (prev && ids.includes(prev.id) ? null : prev));
        setTick((n) => n + 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to delete");
      } finally {
        setDeleting(false);
      }
    },
    [ask, selection],
  );

  const exportSelected = useCallback(async () => {
    const ids = selection.selectedIds;
    if (!ids.length) {
      setError("Select at least one submission to export.");
      return;
    }

    setExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/applications/export", {
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
      anchor.download = "bobo-applications.xlsx";
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


  const columns: Column<Application>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (row) => row.fullName || "N/A",
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
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "created",
        header: "Submitted",
        render: (row) => formatDate(row.createdAt),
      },
      {
        key: "actions",
        header: "Actions",
        render: (row) => (
          <div className={styles.rowActions} onClick={(e) => e.stopPropagation()}>
            <AdminButton size="sm" variant="secondary" onClick={() => setSelected(row)}>
              View
            </AdminButton>
            {row.status === "pending" || row.status === "submitted" ? (
              <>
                <AdminButton
                  size="sm"
                  variant="gold"
                  loading={actingId === row.id}
                  onClick={() => void patchStatus(row.id, "approve")}
                >
                  Approve
                </AdminButton>
                <AdminButton
                  size="sm"
                  variant="danger"
                  loading={actingId === row.id}
                  onClick={() => void patchStatus(row.id, "reject")}
                >
                  Reject
                </AdminButton>
              </>
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
    [actingId, deleting, deleteIds, patchStatus, selection],
  );

  return (
    <AdminShell
      title="Applications"
      description="Review submissions, watch intro videos, and approve or reject."
    >
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.toolbar}>
        <input
          className={styles.search}
          type="search"
          placeholder="Search name, email…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className={styles.select}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by status"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
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
          onExport={exportSelected}
          deleting={deleting}
          exporting={exporting}
          entityLabel="submissions"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No applications"
        emptyHint="New submissions will show up here once the API is live."
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
                <h2>{selected.fullName}</h2>
                <p>{selected.email}</p>
              </div>
              <AdminButton variant="ghost" size="sm" onClick={() => setSelected(null)}>
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
                <dt>Phone</dt>
                <dd>{selected.phone || "N/A"}</dd>
              </div>
              <div>
                <dt>Location</dt>
                <dd>
                  {selected.stateOfResidence || selected.state || selected.city || "N/A"}
                </dd>
              </div>
              <div>
                <dt>Age</dt>
                <dd>{selected.age ?? "N/A"}</dd>
              </div>
              <div>
                <dt>Submitted</dt>
                <dd>{formatDate(selected.createdAt)}</dd>
              </div>
              <div>
                <dt>NIN</dt>
                <dd>{selected.nin || "N/A"}</dd>
              </div>
              <div>
                <dt>Social links</dt>
                <dd>
                  <ul className={styles.socialList}>
                    {selected.tiktokUrl ? (
                      <li>
                        <a
                          className={styles.mediaLink}
                          href={selected.tiktokUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          TikTok
                        </a>
                      </li>
                    ) : null}
                    {selected.instagramUrl ? (
                      <li>
                        <a
                          className={styles.mediaLink}
                          href={selected.instagramUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Instagram
                        </a>
                      </li>
                    ) : null}
                    {selected.xUrl ? (
                      <li>
                        <a
                          className={styles.mediaLink}
                          href={selected.xUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          X
                        </a>
                      </li>
                    ) : null}
                    {selected.facebookUrl ? (
                      <li>
                        <a
                          className={styles.mediaLink}
                          href={selected.facebookUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Facebook
                        </a>
                      </li>
                    ) : null}
                    {!selected.tiktokUrl &&
                    !selected.instagramUrl &&
                    !selected.xUrl &&
                    !selected.facebookUrl
                      ? "N/A"
                      : null}
                  </ul>
                </dd>
              </div>
              <div>
                <dt>Intro video</dt>
                <dd>
                  {selected.videoUrl ? (
                    <div className={styles.videoBlock}>
                      <video
                        className={styles.videoPlayer}
                        src={selected.videoUrl}
                        controls
                        playsInline
                        preload="metadata"
                      >
                        Your browser does not support video playback.
                      </video>
                      <div className={styles.videoActions}>
                        <a
                          className={styles.mediaLink}
                          href={selected.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in new tab
                        </a>
                        <a
                          className={styles.mediaLink}
                          href={attachmentUrl(selected.videoUrl)}
                          download
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ) : (
                    "N/A"
                  )}
                </dd>
              </div>
              <div>
                <dt>Birth certificate</dt>
                <dd>
                  {selected.birthCertUrl ? (
                    <a
                      className={styles.mediaLink}
                      href={selected.birthCertUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      View document
                    </a>
                  ) : (
                    "N/A"
                  )}
                </dd>
              </div>
              <div>
                <dt>Health info</dt>
                <dd>{selected.healthInfo || "N/A"}</dd>
              </div>
            </dl>

            <div className={styles.rowActions} style={{ marginTop: "1rem" }}>
              <AdminButton
                variant="danger"
                loading={deleting}
                onClick={() => void deleteIds([selected.id])}
              >
                Delete submission
              </AdminButton>
            </div>

            {(selected.status === "pending" || selected.status === "submitted") && (
              <div className={styles.fieldGrid}>
                <label className={styles.field}>
                  <span>Reject reason (optional)</span>
                  <textarea
                    className={styles.textarea}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Shared in rejection email…"
                  />
                </label>
                <div className={styles.rowActions}>
                  <AdminButton
                    variant="gold"
                    loading={actingId === selected.id}
                    onClick={() => void patchStatus(selected.id, "approve")}
                  >
                    Approve
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    loading={actingId === selected.id}
                    onClick={() => void patchStatus(selected.id, "reject", reason)}
                  >
                    Reject
                  </AdminButton>
                </div>
              </div>
            )}
          </aside>
        </>
      ) : null}
    </AdminShell>
  );
}
