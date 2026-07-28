"use client";

import { useCallback, useMemo, useState } from "react";

export function useRowSelection(rowIds: string[]) {
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const idSet = useMemo(() => new Set(rowIds), [rowIds]);

  // Drop selections that are no longer in the current row set.
  const selectedIds = useMemo(
    () => [...selected].filter((id) => idSet.has(id)),
    [selected, idSet],
  );

  const selectedCount = selectedIds.length;
  const allSelected = rowIds.length > 0 && selectedCount === rowIds.length;
  const someSelected = selectedCount > 0 && !allSelected;

  const isSelected = useCallback(
    (id: string) => selected.has(id) && idSet.has(id),
    [selected, idSet],
  );

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const selectAll = useCallback(() => {
    setSelected(new Set(rowIds));
  }, [rowIds]);

  const selectFirst = useCallback(
    (count: number) => {
      const n = Math.max(0, Math.min(Math.floor(count), rowIds.length));
      setSelected(new Set(rowIds.slice(0, n)));
    },
    [rowIds],
  );

  const toggleAll = useCallback(() => {
    if (allSelected) clear();
    else selectAll();
  }, [allSelected, clear, selectAll]);

  return {
    selectedIds,
    selectedCount,
    allSelected,
    someSelected,
    isSelected,
    toggle,
    toggleAll,
    selectAll,
    selectFirst,
    clear,
  };
}
