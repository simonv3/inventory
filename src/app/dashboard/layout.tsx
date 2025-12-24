"use client";

import { Navbar } from "@/components";
import { AdminGuard } from "@/components/AdminGuard";

// Mark as dynamic so middleware runs
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminGuard>
      <div>
        <Navbar />
        {children}
      </div>
    </AdminGuard>
  );
}
