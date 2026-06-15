"use client";

import { AdminOnlyGuard } from "@/components";
import { CustomersManager } from "@/components/customers/CustomersManager";

export default function GlobalCustomersPage() {
  return (
    <AdminOnlyGuard>
      <CustomersManager storeId={null} />
    </AdminOnlyGuard>
  );
}
