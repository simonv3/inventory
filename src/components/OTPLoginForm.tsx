"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface OTPLoginFormProps {
  title: string;
  onLoginSuccess?: () => void | Promise<void>;
  redirectPath: string;
}

export default function OTPLoginForm({
  title,
  onLoginSuccess,
  redirectPath,
}: OTPLoginFormProps) {
  const [email, setEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to send OTP");
        return;
      }

      setStep("otp");
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Error requesting OTP:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otpCode }),
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Login failed");
        return;
      }

      if (onLoginSuccess) {
        await onLoginSuccess();
      }

      router.push(redirectPath);
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {title}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {step === "email"
              ? "Sign in with your email to receive a one-time code"
              : "Enter the code we sent to your email"}
          </p>
        </div>

        <form
          className="mt-8 space-y-6"
          onSubmit={step === "email" ? handleRequestOTP : handleVerifyOTP}
        >
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          {step === "email" ? (
            <div className="rounded-md shadow-sm">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          ) : (
            <div className="rounded-md shadow-sm">
              <label htmlFor="otp" className="sr-only">
                One-time code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                autoComplete="off"
                required
                maxLength={6}
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-center text-2xl tracking-widest"
                placeholder="000000"
                value={otpCode}
                onChange={(e) =>
                  setOtpCode(e.target.value.replace(/[^0-9]/g, ""))
                }
              />
              <p className="mt-2 text-center text-xs text-gray-600">
                Check your email for the 6-digit code
              </p>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading
                ? "Processing..."
                : step === "email"
                ? "Send Code"
                : "Verify & Sign In"}
            </button>
          </div>

          {step === "otp" && (
            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setOtpCode("");
                  setError("");
                }}
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Change email address
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
