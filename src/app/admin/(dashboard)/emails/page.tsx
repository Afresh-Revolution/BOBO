"use client";

import { useCallback, useMemo, useState } from "react";
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
import type { EmailLog } from "@/lib/admin-types";
import { useAdminResource } from "@/lib/use-admin-resource";
import { useRowSelection } from "@/lib/use-row-selection";
import styles from "../admin.module.scss";

export default function EmailsPage() {
  const ask = useConfirm();
  const [actingId, setActingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAdminResource({
    initial: [] as EmailLog[],
    load: async () => {
      const res = await adminFetch("/api/admin/emails");
      return unwrapList<EmailLog>(res as never);
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Failed to load email logs",
  });

  const rows = data ?? [];
  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const selection = useRowSelection(rowIds);

  const resend = useCallback(
    async (id: string) => {
      setActingId(id);
      setActionError(null);
      try {
        await adminFetch(`/api/admin/emails/${id}/resend`, { method: "POST" });
        await reload();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to resend email",
        );
      } finally {
        setActingId(null);
      }
    },
    [reload],
  );

  const deleteIds = useCallback(
    async (ids: string[]) => {
      setDeleting(true);
      setActionError(null);
      try {
        const deleted = await confirmAndBulkDelete({
          endpoint: "/api/admin/emails/bulk-delete",
          ids,
          label: ids.length === 1 ? "email log" : "email logs",
          ask,
        });
        if (!deleted) return;
        selection.clear();
        await reload();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to delete emails",
        );
      } finally {
        setDeleting(false);
      }
    },
    [ask, reload, selection],
  );

  const columns: Column<EmailLog>[] = useMemo(
    () => [
      {
        key: "to",
        header: "To",
        render: (row) => row.to,
      },
      {
        key: "subject",
        header: "Subject",
        render: (row) => row.subject,
      },
      {
        key: "template",
        header: "Template",
        render: (row) => row.template || "N/A",
      },
      {
        key: "status",
        header: "Status",
        render: (row) => <StatusBadge status={row.status} />,
      },
      {
        key: "error",
        header: "Error",
        render: (row) =>
          row.error ? (
            <span className={styles.emailError} title={row.error}>
              {row.error}
            </span>
          ) : (
            "—"
          ),
      },
      {
        key: "date",
        header: "Sent",
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
              loading={actingId === row.id}
              onClick={() => void resend(row.id)}
            >
              Resend
            </AdminButton>
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
    [actingId, deleting, deleteIds, resend, selection],
  );

  return (
    <AdminShell
      title="Emails"
      description="Transactional email log: approvals, rejections, reminders."
      actions={
        <AdminButton variant="secondary" size="sm" onClick={reload}>
          Refresh
        </AdminButton>
      }
    >
      {error || actionError ? (
        <p className={styles.error}>{actionError || error}</p>
      ) : null}

      {!loading && rows.length > 0 ? (
        <BulkSelectBar
          total={rows.length}
          selectedCount={selection.selectedCount}
          onSelectAll={selection.selectAll}
          onSelectFirst={selection.selectFirst}
          onClear={selection.clear}
          onDelete={() => deleteIds(selection.selectedIds)}
          deleting={deleting}
          entityLabel="emails"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No emails logged"
        emptyHint="Outbound messages will appear once the mailer is connected."
        selection={selection}
      />
    </AdminShell>
  );
}
