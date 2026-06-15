import { useMemo, useState } from "react";

/**
 * Id-based multi-row selection for tables with bulk actions.
 * Keying on stable item ids (rather than row index) keeps selection correct
 * across sorting and filtering.
 */
export function useBulkSelection<T extends { id: number }>(items: T[]) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const allSelected = items.length > 0 && selectedIds.size === items.length;

  const toggle = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelectedIds((prev) =>
      prev.size === items.length ? new Set() : new Set(items.map((i) => i.id)),
    );
  };

  const clear = () => setSelectedIds(new Set());

  const isSelected = (id: number) => selectedIds.has(id);

  const selected = useMemo(() => Array.from(selectedIds), [selectedIds]);

  return {
    selectedIds,
    selected,
    count: selectedIds.size,
    allSelected,
    isSelected,
    toggle,
    toggleAll,
    clear,
  };
}
