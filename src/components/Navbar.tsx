"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StoreSelector } from "./StoreSelector";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";

interface NavbarProps {
  onLogout?: () => void;
}

export function Navbar({ onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { customer, logout } = useAuth();
  const { currentStoreId } = useStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const dropdownItems = (storeId: number | null) => [
    {
      href: storeId ? `/admin/stores/${storeId}` : "/admin",
      label: "Dashboard",
    },
    { href: "/admin/import", label: "Import", isAdminOnly: true },
    {
      href: storeId ? `/admin/stores/${storeId}/products` : "/admin/products",
      label: "Products",
    },
    {
      href: storeId ? `/admin/stores/${storeId}/inventory` : "/admin/inventory",
      label: "Inventory",
    },
    {
      href: storeId ? `/admin/stores/${storeId}/sales` : "/admin/sales",
      label: "Sales",
    },
    {
      href: storeId ? `/admin/stores/${storeId}/customers` : "/admin/customers",
      label: "Customers",
    },
    { href: "/admin/stores", label: "Stores", isAdminOnly: true },
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

  const customerCanSeeMenu =
    customer?.isAdmin || customer?.stores.find((s) => s.storeManager);

  const currentDropdownItems = dropdownItems(currentStoreId);

  return (
    <nav className="bg-slate-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href={"/"} className="text-2xl font-bold">
            Inventory
          </Link>
          <div className="flex gap-8 items-center">
            <div className="relative">
              {customerCanSeeMenu && (
                <>
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className={`transition flex items-center gap-1 ${
                      currentDropdownItems.some(
                        (item) => pathname === item.href,
                      )
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
                      {currentDropdownItems
                        .filter(
                          (item) => !item.isAdminOnly || customer?.isAdmin,
                        )
                        .map((item) => (
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
                href={currentStoreId ? `/${currentStoreId}/cart` : "#"}
                className={`transition ${
                  pathname?.startsWith("/") && pathname?.includes("/cart")
                    ? "text-blue-400 font-semibold"
                    : "text-gray-300 hover:text-white"
                }`}
                onClick={(e) => {
                  if (!currentStoreId) {
                    e.preventDefault();
                  }
                }}
              >
                Cart
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
