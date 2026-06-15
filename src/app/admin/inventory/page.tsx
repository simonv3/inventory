"use client";

import { AdminOnlyGuard } from "@/components";
import { InventoryManager } from "@/components/inventory/InventoryManager";
import { useStore } from "@/context/StoreContext";

export default function GlobalInventoryPage() {
  const { currentStoreId } = useStore();
  return (
    <AdminOnlyGuard>
      <InventoryManager storeId={currentStoreId} />
    </AdminOnlyGuard>
  );
}
