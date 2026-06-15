"use client";

import { AdminOnlyGuard } from "@/components";
import { ProductsManager } from "@/components/products/ProductsManager";
import { useStore } from "@/context/StoreContext";

export default function GlobalProductsPage() {
  const { currentStoreId } = useStore();
  return (
    <AdminOnlyGuard>
      <ProductsManager storeId={currentStoreId} />
    </AdminOnlyGuard>
  );
}
