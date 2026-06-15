"use client";

import { useParams } from "next/navigation";
import { InventoryManager } from "@/components/inventory/InventoryManager";

export default function StoreInventoryPage() {
  const params = useParams();
  const storeId = parseInt(params.storeId as string);
  return <InventoryManager storeId={storeId} />;
}
