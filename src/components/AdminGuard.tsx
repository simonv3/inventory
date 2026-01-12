"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { customer, loading, isStoreManager } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Redirect if not admin or store manager
    if (!customer || (!customer.isAdmin && !isStoreManager)) {
      router.replace("/");
    }
  }, [customer, loading, isStoreManager, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // Don't render if not admin or store manager
  if (!customer || (!customer.isAdmin && !isStoreManager)) {
    return null;
  }

  return <>{children}</>;
}
