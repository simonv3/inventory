"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface CustomerData {
  id: number;
  name: string;
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  customer: CustomerData | null;
  loading: boolean;
  isAuthenticated: boolean;
  logout: () => void;
  refreshToken: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCustomer = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const customerData = await response.json();
        setCustomer(customerData);
      } else {
        setCustomer(null);
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomer();
  }, []);

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Error logging out:", error);
    } finally {
      setCustomer(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        loading,
        isAuthenticated: customer !== null,
        logout,
        refreshToken: fetchCustomer,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
