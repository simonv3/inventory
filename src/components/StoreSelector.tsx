"use client";

import { useStore } from "@/context/StoreContext";

export function StoreSelector() {
  const { currentStoreId, setCurrentStoreId, stores, loading } = useStore();

  if (loading || stores.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 ml-auto">
      <label className="text-sm text-gray-300">Store:</label>
      <select
        value={currentStoreId || ""}
        onChange={(e) => setCurrentStoreId(parseInt(e.target.value))}
        className="px-3 py-2 bg-slate-700 text-white border border-gray-600 rounded text-sm"
      >
        {stores.map((store) => (
          <option key={store.id} value={store.id}>
            {store.name}
          </option>
        ))}
      </select>
    </div>
  );
}
