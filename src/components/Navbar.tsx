"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { StoreSelector } from "./StoreSelector";

interface NavbarProps {
  customerName?: string;
  onLogout?: () => void;
}

export function Navbar({ customerName, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isPortal = pathname.startsWith("/customer/portal");
  const isDashboard = pathname.startsWith("/dashboard");

  const dashboardItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/products", label: "Products" },
    { href: "/dashboard/inventory", label: "Inventory" },
    { href: "/dashboard/sales", label: "Sales" },
    { href: "/dashboard/customers", label: "Customers" },
    { href: "/dashboard/import", label: "Import" },
  ];

  const portalItems = [{ href: "/customer/portal", label: "My Orders" }];

  const navItems = isPortal ? portalItems : dashboardItems;
  const portalLink = { href: "/customer/portal", label: "Portal" };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
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
          <Link
            href={isPortal ? "/customer/portal" : "/dashboard"}
            className="text-2xl font-bold"
          >
            📦 Inventory
          </Link>
          <div className="flex gap-8 items-center">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`transition ${
                  pathname === item.href
                    ? "text-blue-400 font-semibold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            ))}
            {!isPortal && (
              <Link
                href={portalLink.href}
                className={`transition ${
                  pathname === portalLink.href
                    ? "text-blue-400 font-semibold"
                    : "text-gray-300 hover:text-white"
                }`}
              >
                {portalLink.label}
              </Link>
            )}
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
            {isDashboard && <StoreSelector />}
            <div className="flex items-center gap-4 ml-8 pl-8 border-l border-gray-600">
              {customerName && (
                <span className="text-sm text-gray-300">{customerName}</span>
              )}
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
