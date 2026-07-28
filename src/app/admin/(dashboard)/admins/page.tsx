"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminButton,
  AdminShell,
  BulkSelectBar,
  DataTable,
  useConfirm,
  type Column,
} from "@/components/admin";
import { adminFetch, unwrapList } from "@/lib/admin-api";
import { confirmAndBulkDelete } from "@/lib/admin-delete";
import type { AdminUser } from "@/lib/admin-types";
import { useAdminResource } from "@/lib/use-admin-resource";
import { useRowSelection } from "@/lib/use-row-selection";
import styles from "../admin.module.scss";

export default function AdminsPage() {
  const ask = useConfirm();
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAdminResource({
    initial: [] as AdminUser[],
    load: async () => {
      const res = await adminFetch("/api/admin/admins");
      return unwrapList<AdminUser>(res as never);
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Failed to load admins",
  });

  const rows = data ?? [];
  const rowIds = useMemo(() => rows.map((r) => r.id), [rows]);
  const selection = useRowSelection(rowIds);

  const deleteIds = useCallback(
    async (ids: string[]) => {
      setDeleting(true);
      setActionError(null);
      try {
        const deleted = await confirmAndBulkDelete({
          endpoint: "/api/admin/admins/bulk-delete",
          ids,
          label: ids.length === 1 ? "admin" : "admins",
          ask,
        });
        if (!deleted) return;
        selection.clear();
        await reload();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to delete admins",
        );
      } finally {
        setDeleting(false);
      }
    },
    [ask, reload, selection],
  );

  const columns: Column<AdminUser>[] = useMemo(
    () => [
      {
        key: "name",
        header: "Name",
        render: (row) => row.name || "N/A",
      },
      {
        key: "email",
        header: "Email",
        render: (row) => row.email,
      },
      {
        key: "role",
        header: "Role",
        render: (row) => row.role || "admin",
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
      title="Admins"
      description="People with access to the BOBO control room."
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
          entityLabel="admins"
        />
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        loading={loading}
        emptyTitle="No admins listed"
        emptyHint="Admin accounts will appear once the auth API is wired."
        selection={selection}
      />
    </AdminShell>
  );
}
