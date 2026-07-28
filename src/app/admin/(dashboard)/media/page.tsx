"use client";

import { useCallback, useMemo, useState } from "react";
import {
  AdminButton,
  AdminShell,
  BulkSelectBar,
  useConfirm,
} from "@/components/admin";
import { adminFetch, formatDate, unwrapList } from "@/lib/admin-api";
import { confirmAndBulkDelete } from "@/lib/admin-delete";
import type { MediaItem } from "@/lib/admin-types";
import { useAdminResource } from "@/lib/use-admin-resource";
import { useRowSelection } from "@/lib/use-row-selection";
import styles from "../admin.module.scss";

export default function MediaPage() {
  const ask = useConfirm();
  const [deleting, setDeleting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, loading, error, reload } = useAdminResource({
    initial: [] as MediaItem[],
    load: async () => {
      const res = await adminFetch("/api/admin/media");
      return unwrapList<MediaItem>(res as never);
    },
    mapError: (err) =>
      err instanceof Error ? err.message : "Failed to load media",
  });

  const items = data ?? [];
  const rowIds = useMemo(() => items.map((i) => i.id), [items]);
  const selection = useRowSelection(rowIds);

  const deleteIds = useCallback(
    async (ids: string[]) => {
      setDeleting(true);
      setActionError(null);
      try {
        const deleted = await confirmAndBulkDelete({
          endpoint: "/api/admin/media/bulk-delete",
          ids,
          label: ids.length === 1 ? "media item" : "media items",
          ask,
        });
        if (!deleted) return;
        selection.clear();
        await reload();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to delete media",
        );
      } finally {
        setDeleting(false);
      }
    },
    [ask, reload, selection],
  );

  return (
    <AdminShell
      title="Media"
      description="Uploaded assets: videos, certificates, and site imagery."
      actions={
        <AdminButton variant="secondary" size="sm" onClick={reload}>
          Refresh
        </AdminButton>
      }
    >
      {error || actionError ? (
        <p className={styles.error}>{actionError || error}</p>
      ) : null}

      {!loading && items.length > 0 ? (
        <BulkSelectBar
          total={items.length}
          selectedCount={selection.selectedCount}
          onSelectAll={selection.selectAll}
          onSelectFirst={selection.selectFirst}
          onClear={selection.clear}
          onDelete={() => deleteIds(selection.selectedIds)}
          deleting={deleting}
          entityLabel="media items"
        />
      ) : null}

      {loading ? (
        <p className={styles.muted}>Loading media…</p>
      ) : items.length === 0 ? (
        <div className={styles.panel}>
          <p className={styles.panelTitle}>No media yet</p>
          <p className={styles.muted}>
            Files uploaded through applications or the CMS will show here.
          </p>
        </div>
      ) : (
        <div className={styles.mediaGrid}>
          {items.map((item) => {
            const isVideo = item.type?.startsWith("video");
            const isImage = item.type?.startsWith("image");
            const checked = selection.isSelected(item.id);
            return (
              <article
                key={item.id}
                className={[styles.mediaCard, checked ? styles.mediaCardSelected : ""]
                  .filter(Boolean)
                  .join(" ")}
              >
                <label className={styles.mediaCheck}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => selection.toggle(item.id)}
                    aria-label={`Select ${item.name}`}
                  />
                </label>
                {isImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.url} alt={item.name} />
                ) : isVideo ? (
                  <video src={item.url} muted playsInline />
                ) : (
                  <div
                    style={{
                      aspectRatio: 1,
                      display: "grid",
                      placeItems: "center",
                      background: "#0a080c",
                      color: "rgba(255,255,255,0.4)",
                      fontSize: "0.75rem",
                    }}
                  >
                    File
                  </div>
                )}
                <div className={styles.mediaMeta}>
                  <p title={item.name}>{item.name}</p>
                  <p style={{ marginTop: "0.35rem", opacity: 0.55 }}>
                    {formatDate(item.createdAt)}
                  </p>
                  <div className={styles.rowActions} style={{ marginTop: "0.5rem" }}>
                    <a
                      className={styles.mediaLink}
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open
                    </a>
                    <AdminButton
                      size="sm"
                      variant="danger"
                      loading={deleting && checked}
                      onClick={() => void deleteIds([item.id])}
                    >
                      Delete
                    </AdminButton>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}
