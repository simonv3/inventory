"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Customer } from "@/types";
import { Button, Input } from "@/components";

export default function LoginAsPage() {
  const { customer, loading, refreshToken } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [loggingInAs, setLoggingInAs] = useState<number | null>(null);

  useEffect(() => {
    if (!loading && (!customer || !customer.isAdmin)) {
      router.push("/");
      return;
    }
  }, [customer, loading, router]);

  useEffect(() => {
    if (!customer || !customer.isAdmin) return;

    const fetchCustomers = async () => {
      try {
        const res = await fetch("/api/customers", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setCustomers(data);
        }
      } catch (error) {
        console.error("Error fetching customers:", error);
      } finally {
        setLoadingCustomers(false);
      }
    };

    fetchCustomers();
  }, [customer]);

  const handleLoginAs = async (customerId: number) => {
    setLoggingInAs(customerId);
    try {
      const res = await fetch("/api/auth/login-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
        credentials: "include",
      });

      if (res.ok) {
        await refreshToken();
        router.push("/customer/portal");
      } else {
        alert("Failed to login as customer");
      }
    } catch (error) {
      console.error("Error logging in as customer:", error);
      alert("Error logging in as customer");
    } finally {
      setLoggingInAs(null);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading || !customer || !customer.isAdmin) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Login as Customer</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-6">
          <Input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {loadingCustomers ? (
          <div className="text-center py-8">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No customers found
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm text-gray-500">{c.email}</p>
                </div>
                <Button
                  onClick={() => handleLoginAs(c.id)}
                  disabled={loggingInAs === c.id}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loggingInAs === c.id ? "Logging in..." : "Login As"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
