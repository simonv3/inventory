"use client";

interface BulkSelectionBannerProps {
  count: number;
  onDelete: () => void;
  itemLabel?: string;
}

/**
 * "N items selected — Delete Selected" banner shown above tables that support
 * bulk deletion. Renders nothing when nothing is selected.
 */
export function BulkSelectionBanner({
  count,
  onDelete,
  itemLabel = "item",
}: BulkSelectionBannerProps) {
  if (count === 0) return null;

  return (
    <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg flex items-center justify-between">
      <span className="text-blue-900 dark:text-blue-200">
        {count} {itemLabel}
        {count > 1 ? "s" : ""} selected
      </span>
      <button
        onClick={onDelete}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        Delete Selected
      </button>
    </div>
  );
}
