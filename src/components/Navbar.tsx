"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StoreSelector } from "./StoreSelector";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

interface NavbarProps {
  onLogout?: () => void;
}

export function Navbar({ onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/import", label: "Import" },
    { href: "/dashboard/products", label: "Products" },
    { href: "/dashboard/inventory", label: "Inventory" },
    { href: "/dashboard/sales", label: "Sales" },
    { href: "/dashboard/customers", label: "Customers" },
    { href: "/dashboard/stores", label: "Stores" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
    if (onLogout) {
      onLogout();
    }
    router.push("/");
  };

  return (
    <nav className="bg-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={"/"} className="text-2xl font-bold">
            📦 Inventory
          </Link>
          <div className="flex gap-8 items-center">
            <div className="relative">
              {customer?.isAdmin && (
                <>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`transition flex items-center gap-1 ${
                      dropdownItems.some((item) => pathname === item.href)
                        ? "text-blue-400 font-semibold"
                        : "text-gray-300 hover:text-white"
                    }`}
                  >
                    Menu
                    <svg
                      className={`w-4 h-4 transition ${
                        isDropdownOpen ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 14l-7 7m0 0l-7-7m7 7V3"
                      />
                    </svg>
                  </button>
                  {isDropdownOpen && (
                    <div className="absolute top-full mt-2 left-0 bg-slate-700 rounded shadow-lg py-2 min-w-max z-50">
                      {dropdownItems.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`block px-4 py-2 transition ${
                            pathname === item.href
                              ? "bg-blue-600 text-white"
                              : "text-gray-300 hover:bg-slate-600 hover:text-white"
                          }`}
                          onClick={() => setIsDropdownOpen(false)}
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {customer?.isAdmin && <StoreSelector />}
            <div className="flex items-center gap-4 ml-2 pl-8 border-l border-gray-600">
              <Link
                href="/customer/portal"
                className={`transition ${
                  pathname === "/customer/portal"
                    ? "text-blue-400 font-semibold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                Profile
              </Link>
              <Link
                href="/shopping-cart"
                className={`transition ${
                  pathname === "/shopping-cart"
                    ? "text-blue-400 font-semibold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                🛒 Cart
              </Link>
              <button
                onClick={handleLogout}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
