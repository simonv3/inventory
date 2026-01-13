"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import OTPLoginForm from "@/components/OTPLoginForm";

export default function Home() {
  const { customer, loading, refreshToken } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && customer) {
      router.push(customer.isAdmin ? "/admin" : "/customer/portal");
    }
  }, [customer, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <OTPLoginForm
      title="Green's and Beans Grocery"
      redirectPath="/customer/portal"
      onLoginSuccess={refreshToken}
    />
  );
}
