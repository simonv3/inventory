"use client";

import { AdminOnlyGuard } from "@/components";
import { SalesManager } from "@/components/sales/SalesManager";
import { useStore } from "@/context/StoreContext";

export default function GlobalSalesPage() {
  const { currentStoreId } = useStore();
  return (
    <AdminOnlyGuard>
      <SalesManager storeId={currentStoreId} />
    </AdminOnlyGuard>
  );
}
