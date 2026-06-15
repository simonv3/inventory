"use client";

import { useParams } from "next/navigation";
import { CustomersManager } from "@/components/customers/CustomersManager";

export default function StoreCustomersPage() {
  const params = useParams();
  const storeId = parseInt(params.storeId as string);
  return <CustomersManager storeId={storeId} />;
}
