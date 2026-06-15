"use client";

import { ReactNode } from "react";

export interface Column {
  label: string;
  /** When set, the column header is clickable and sorts by this key. */
  sortKey?: string;
  /** Extra classes appended to the default header cell classes. */
  className?: string;
}

interface TableHeaderProps {
  columns: Column[];
  onSort?: (key: string) => void;
  indicator?: (key: string) => string;
  /** Render a leading select-all checkbox column. */
  selectable?: boolean;
  allSelected?: boolean;
  onToggleAll?: () => void;
  /** Render a trailing "Actions" column. */
  actions?: boolean;
}

const HEADER_CELL =
  "border border-base-300 px-4 py-2 text-left font-semibold";

/**
 * Shared table header with optional sortable columns, a select-all checkbox,
 * and a trailing Actions column. Replaces the hand-rolled `<thead>` blocks
 * duplicated across the admin tables.
 */
export function TableHeader({
  columns,
  onSort,
  indicator,
  selectable = false,
  allSelected = false,
  onToggleAll,
  actions = false,
}: TableHeaderProps) {
  return (
    <thead className="bg-base-200">
      <tr>
        {selectable && (
          <th className="border border-base-300 px-3 py-2 text-left font-semibold w-10">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={onToggleAll}
              className="checkbox checkbox-sm"
            />
          </th>
        )}
        {columns.map((col) => {
          const sortable = col.sortKey && onSort;
          return (
            <th
              key={col.label}
              className={`${HEADER_CELL} ${
                sortable
                  ? "cursor-pointer hover:bg-base-300"
                  : ""
              } ${col.className ?? ""}`}
              onClick={sortable ? () => onSort!(col.sortKey!) : undefined}
            >
              {col.label}
              {sortable && indicator ? indicator(col.sortKey!) : ""}
            </th>
          );
        })}
        {actions && <th className={HEADER_CELL}>Actions</th>}
      </tr>
    </thead>
  );
}

interface TableEmptyProps {
  colSpan: number;
  children: ReactNode;
}

/** Single full-width row used for empty / no-results states. */
export function TableEmpty({ colSpan, children }: TableEmptyProps) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="border border-base-300 px-4 py-2 text-center text-base-content/60"
      >
        {children}
      </td>
    </tr>
  );
}
