"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Sale } from "@/types";

export default function CustomerPortal() {
  const { customer, loading } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const router = useRouter();
  useEffect(() => {
    if (loading || !customer) return;

    // Fetch customer's sales
    const fetchSales = async () => {
      try {
        const salesResponse = await fetch("/api/sales", {
          credentials: "include",
        });
        if (salesResponse.ok) {
          const sales = await salesResponse.json();
          // Filter sales for this customer
          const customerSales = sales.filter(
            (sale: Sale) => sale.customerId === customer.id
          );
          setSales(customerSales);
        }
      } catch (error) {
        console.error("Error fetching sales:", error);
      }
    };

    fetchSales();
  }, [customer, loading, router]);

  if (loading || !customer) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Account Information */}
        <div className="mt-8 bg-white rounded-lg shadow p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Account Information
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name
              </label>
              <p className="text-gray-900">{customer.name}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <p className="text-gray-900">{customer.email}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Your Orders</h2>
          </div>

          <div className="overflow-x-auto">
            {sales.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                <p>You haven't placed any orders yet.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Order Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sales.map((sale) => (
                    <tr key={sale.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {sale.items?.length || 0} item
                        {(sale.items?.length || 0) > 1 ? "s" : ""}
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                        ${sale.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
