"use client";

import { useParams } from "next/navigation";
import { SalesManager } from "@/components/sales/SalesManager";

export default function StoreSalesPage() {
  const params = useParams();
  const storeId = parseInt(params.storeId as string);
  return <SalesManager storeId={storeId} />;
}
