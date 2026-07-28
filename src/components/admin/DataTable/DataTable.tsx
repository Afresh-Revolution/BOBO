"use client";

import type { ReactNode } from "react";
import styles from "./DataTable.module.scss";

export type Column<T> = {
  key: string;
  header: string;
  width?: string;
  render: (row: T) => ReactNode;
};

export type DataTableSelection = {
  isSelected: (id: string) => boolean;
  toggle: (id: string) => void;
  toggleAll: () => void;
  allSelected: boolean;
  someSelected: boolean;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  onRowClick?: (row: T) => void;
  selection?: DataTableSelection;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = "Nothing here yet",
  emptyHint = "Data will appear once the API is connected.",
  onRowClick,
  selection,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className={styles.state} role="status">
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
        <div className={styles.skeleton} />
        <p>Loading…</p>
      </div>
    );
  }

  if (!rows.length) {
    return (
      <div className={styles.state}>
        <p className={styles.emptyTitle}>{emptyTitle}</p>
        <p className={styles.emptyHint}>{emptyHint}</p>
      </div>
    );
  }

  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {selection ? (
              <th className={styles.checkCol} scope="col">
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={selection.allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = selection.someSelected;
                  }}
                  onChange={selection.toggleAll}
                  aria-label="Select all rows"
                />
              </th>
            ) : null}
            {columns.map((col) => (
              <th key={col.key} style={col.width ? { width: col.width } : undefined}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const id = rowKey(row);
            const checked = selection?.isSelected(id) ?? false;
            return (
              <tr
                key={id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={[
                  onRowClick ? styles.clickable : undefined,
                  checked ? styles.selected : undefined,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                {selection ? (
                  <td
                    className={styles.checkCol}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={checked}
                      onChange={() => selection.toggle(id)}
                      aria-label="Select row"
                    />
                  </td>
                ) : null}
                {columns.map((col) => (
                  <td key={col.key}>{col.render(row)}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
