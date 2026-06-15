import { useState } from "react";

/**
 * Generic inline (row-level) edit state. The caller owns persistence:
 * call `start(item)` to enter edit mode, `update(patch)` as fields change,
 * then run the API call and `cancel()` (or `cancel()` to abort).
 */
export function useInlineEdit<T extends { id: number }>() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [data, setData] = useState<Partial<T> | null>(null);

  const start = (item: T, initial?: Partial<T>) => {
    setEditingId(item.id);
    setData({ ...item, ...initial });
  };

  const update = (patch: Partial<T>) =>
    setData((prev) => (prev ? { ...prev, ...patch } : prev));

  const cancel = () => {
    setEditingId(null);
    setData(null);
  };

  const isEditing = (id: number) => editingId === id;

  return { editingId, data, start, update, cancel, isEditing };
}
