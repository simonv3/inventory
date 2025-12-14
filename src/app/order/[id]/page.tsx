"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Navbar } from "@/components";
import { Sale } from "@/types";

export default function OrderPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await fetch(`/api/sales/${orderId}`);
        if (!res.ok) {
          setError("Order not found");
          return;
        }
        const data = await res.json();
        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order");
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="flex justify-center items-center h-screen">
          Loading...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div>
        <Navbar />
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h1 className="text-2xl font-bold text-red-600">
              {error || "Order not found"}
            </h1>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Order Details</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-gray-600 text-sm">Order ID</p>
              <p className="text-2xl font-bold">{order.id}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Customer</p>
              <p className="text-2xl font-bold">
                {order.customer?.name || "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Order Date</p>
              <p className="text-lg">
                {new Date(order.saleDate).toLocaleDateString()} at{" "}
                {new Date(order.saleDate).toLocaleTimeString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm">Markup %</p>
              <p className="text-lg font-semibold">{order.markupPercent}%</p>
            </div>
          </div>

          <hr className="my-6" />

          <h2 className="text-xl font-bold mb-4">Items</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left">
                    Product
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right">
                    Qty
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right">
                    Cost/Unit
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right">
                    Sale/Unit
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right">
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, idx) => (
                    <tr key={idx}>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.product?.name || `Product #${item.productId}`}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        {item.quantity}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        ${item.costPrice.toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right">
                        $
                        {(
                          item.costPrice *
                          (1 + order.markupPercent / 100)
                        ).toFixed(2)}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                        $
                        {(
                          item.costPrice *
                          (1 + order.markupPercent / 100) *
                          item.quantity
                        ).toFixed(2)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                    >
                      No items in this order
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <hr className="my-6" />

          <div className="flex justify-end">
            <div className="w-64">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Total Cost:</span>
                <span className="font-semibold">
                  ${order.totalCost.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 pt-2">
                <span>Total Price:</span>
                <span className="text-green-600">
                  ${order.totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
