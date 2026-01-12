"use client";

import { useAuth } from "@/context/AuthContext";
import OTPLoginForm from "@/components/OTPLoginForm";

export default function CustomerLogin() {
  const { refreshToken } = useAuth();

  return (
    <OTPLoginForm
      title="Customer Login"
      onLoginSuccess={refreshToken}
      redirectPath="/customer/portal"
    />
  );
}
