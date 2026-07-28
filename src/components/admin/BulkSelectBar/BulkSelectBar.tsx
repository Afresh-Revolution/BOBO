"use client";

import { useState } from "react";
import { AdminButton } from "../AdminButton";
import styles from "./BulkSelectBar.module.scss";

type BulkSelectBarProps = {
  total: number;
  selectedCount: number;
  onSelectAll: () => void;
  onSelectFirst: (count: number) => void;
  onClear: () => void;
  onDelete: () => void | Promise<void>;
  deleting?: boolean;
  entityLabel?: string;
};

export function BulkSelectBar({
  total,
  selectedCount,
  onSelectAll,
  onSelectFirst,
  onClear,
  onDelete,
  deleting,
  entityLabel = "items",
}: BulkSelectBarProps) {
  const [countInput, setCountInput] = useState("");

  const applyCount = () => {
    const n = Number.parseInt(countInput, 10);
    if (!Number.isFinite(n) || n <= 0) return;
    onSelectFirst(n);
  };

  return (
    <div className={styles.bar} role="toolbar" aria-label="Bulk selection">
      <p className={styles.summary}>
        {selectedCount > 0
          ? `${selectedCount} of ${total} selected`
          : `${total} ${entityLabel}`}
      </p>

      <div className={styles.controls}>
        <label className={styles.countField}>
          <span>Select</span>
          <input
            type="number"
            min={1}
            max={total || 1}
            inputMode="numeric"
            placeholder="N"
            value={countInput}
            onChange={(e) => setCountInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyCount();
              }
            }}
            aria-label="Number of items to select"
          />
          <AdminButton size="sm" variant="secondary" onClick={applyCount}>
            Apply
          </AdminButton>
        </label>

        <AdminButton size="sm" variant="secondary" onClick={onSelectAll}>
          Select all
        </AdminButton>

        {selectedCount > 0 ? (
          <AdminButton size="sm" variant="ghost" onClick={onClear}>
            Clear
          </AdminButton>
        ) : null}

        <AdminButton
          size="sm"
          variant="danger"
          disabled={selectedCount === 0}
          loading={deleting}
          onClick={() => void onDelete()}
        >
          Delete selected
        </AdminButton>
      </div>
    </div>
  );
}
