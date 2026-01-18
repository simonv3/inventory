"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AdminOnlyGuard({ children }: { children: React.ReactNode }) {
  const { customer, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Redirect if not admin
    if (!customer || !customer.isAdmin) {
      router.replace("/");
    }
  }, [customer, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  // Don't render if not admin
  if (!customer || !customer.isAdmin) {
    return null;
  }

  return <>{children}</>;
}
