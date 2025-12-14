import { useState, useMemo } from "react";

export type SortDirection = "asc" | "desc" | null;

interface UseSortableTableProps<T> {
  data: T[];
  defaultSortKey?: string;
  defaultDirection?: SortDirection;
}

interface UseSortableTableReturn<T> {
  sortedData: T[];
  sortKey: string | null;
  sortDirection: SortDirection;
  handleSort: (key: string) => void;
  getSortIndicator: (key: string) => string;
}

/**
 * Reusable hook for table sorting functionality
 * Handles sorting by any object key with tri-state (asc, desc, none)
 */
export function useSortableTable<T extends Record<string, any>>({
  data,
  defaultSortKey,
  defaultDirection = null,
}: UseSortableTableProps<T>): UseSortableTableReturn<T> {
  const [sortKey, setSortKey] = useState<string | null>(defaultSortKey || null);
  const [sortDirection, setSortDirection] =
    useState<SortDirection>(defaultDirection);

  const sortedData = useMemo(() => {
    if (!sortKey || !sortDirection) {
      return data;
    }

    const sorted = [...data].sort((a, b) => {
      const aValue = a[sortKey];
      const bValue = b[sortKey];

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0;
      if (aValue == null) return sortDirection === "asc" ? 1 : -1;
      if (bValue == null) return sortDirection === "asc" ? -1 : 1;

      // Handle string comparison (case-insensitive)
      if (typeof aValue === "string" && typeof bValue === "string") {
        const comparison = aValue
          .toLowerCase()
          .localeCompare(bValue.toLowerCase());
        return sortDirection === "asc" ? comparison : -comparison;
      }

      // Handle number comparison
      if (typeof aValue === "number" && typeof bValue === "number") {
        return sortDirection === "asc" ? aValue - bValue : bValue - aValue;
      }

      // Handle date comparison
      if (aValue instanceof Date && bValue instanceof Date) {
        return sortDirection === "asc"
          ? aValue.getTime() - bValue.getTime()
          : bValue.getTime() - aValue.getTime();
      }

      // Fallback to string comparison
      const aStr = String(aValue).toLowerCase();
      const bStr = String(bValue).toLowerCase();
      const comparison = aStr.localeCompare(bStr);
      return sortDirection === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [data, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      // Cycle through: asc -> desc -> none
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortKey(null);
      }
    } else {
      // New sort column, start with asc
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const getSortIndicator = (key: string): string => {
    if (sortKey !== key) return "";
    if (sortDirection === "asc") return " ↑";
    if (sortDirection === "desc") return " ↓";
    return "";
  };

  return {
    sortedData,
    sortKey,
    sortDirection,
    handleSort,
    getSortIndicator,
  };
}
