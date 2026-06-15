"use client";

import { useState } from "react";
import { Category } from "@/types";

interface ProductCategoryEditorProps {
  categoryIds: number[];
  categories: Category[];
  onAdd: (categoryId: number) => void;
  onRemove: (categoryId: number) => void;
}

/**
 * Inline (table-cell) category picker: shows selected categories as removable
 * pills plus a search box that suggests unselected categories.
 */
export function ProductCategoryEditor({
  categoryIds,
  categories,
  onAdd,
  onRemove,
}: ProductCategoryEditorProps) {
  const [query, setQuery] = useState("");

  const matches = categories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(query.toLowerCase()) &&
      !categoryIds.includes(cat.id),
  );

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 min-h-8">
        {categoryIds.map((catId) => {
          const cat = categories.find((c) => c.id === catId);
          return (
            <span
              key={catId}
              className="badge badge-primary gap-1"
            >
              {cat?.name}
              <button
                type="button"
                onClick={() => onRemove(catId)}
                className="font-bold"
              >
                ×
              </button>
            </span>
          );
        })}
      </div>
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search categories..."
          className="input input-sm w-full"
        />
        {query && (
          <div className="absolute top-full left-0 right-0 bg-base-100 border border-base-300 rounded mt-1 z-10 max-h-32 overflow-y-auto">
            {matches.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  onAdd(cat.id);
                  setQuery("");
                }}
                className="w-full text-left px-2 py-1 hover:bg-base-200 text-sm"
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
