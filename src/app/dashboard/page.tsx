"use client";

import { useEffect, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Product, Customer, InventoryReceived, Sale } from "@/types";
import { useApiWithToast } from "@/lib/useApiWithToast";
import { useStore } from "@/context/StoreContext";

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryReceived[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { fetchData } = useApiWithToast();
  const { currentStoreId } = useStore();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Create a wrapper to add store header to fetchData
        const fetchWithStore = async <T,>(url: string): Promise<T | null> => {
          const headers: Record<string, string> = {};
          if (currentStoreId) {
            headers["x-store-id"] = currentStoreId.toString();
          }
          const response = await fetch(url, {
            credentials: "include",
            headers,
          });
          if (!response.ok) {
            throw new Error(`Failed to fetch ${url}`);
          }
          return response.json();
        };

        const [productsData, customersData, inventoryData, salesData] =
          await Promise.all([
            fetchWithStore<Product[]>("/api/products"),
            fetchWithStore<Customer[]>("/api/customers"),
            fetchWithStore<InventoryReceived[]>("/api/inventory"),
            fetchWithStore<Sale[]>("/api/sales"),
          ]);

        if (productsData) setProducts(productsData);
        if (customersData) setCustomers(customersData);
        if (inventoryData) setInventory(inventoryData);
        if (salesData) setSales(salesData);
      } finally {
        setLoading(false);
      }
    };

    if (currentStoreId || currentStoreId === null) {
      loadData();
    }
  }, [currentStoreId]);

  const totalRevenue = sales.reduce((sum, sale) => sum + sale.totalPrice, 0);
  const averagePurchase = sales.length > 0 ? totalRevenue / sales.length : 0;
  const lowStockProducts = products.filter((p) => {
    if (!p.showInStorefront) return false;
    const received = inventory.filter((i) => i.productId === p.id);
    const sold = sales
      .flatMap((s) => s.items || [])
      .filter((si) => si.productId === p.id);
    const currentStock =
      received.reduce((sum, i) => sum + i.quantity, 0) -
      sold.reduce((sum, si) => sum + si.quantity, 0);
    return currentStock < p.minimumStock;
  });

  const productsSalesByQuantity = products
    .map((product) => {
      const salesItems = sales
        .flatMap((s) => s.items || [])
        .filter((item) => item.productId === product.id);
      const totalQuantitySold = salesItems.reduce(
        (sum, item) => sum + item.quantity,
        0
      );
      const numberOfTransactions = new Set(
        sales
          .filter((s) => s.items?.some((item) => item.productId === product.id))
          .map((s) => s.id)
      ).size;
      return { product, totalQuantitySold, numberOfTransactions };
    })
    .sort((a, b) => b.numberOfTransactions - a.numberOfTransactions);

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

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">
              Total Products
            </h3>
            <p className="text-3xl font-bold text-blue-600">
              {products.length}
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">
              Total Customers
            </h3>
            <p className="text-3xl font-bold text-green-600">
              {customers.length}
            </p>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">Total Sales</h3>
            <p className="text-3xl font-bold text-purple-600">{sales.length}</p>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">Total Revenue</h3>
            <p className="text-3xl font-bold text-orange-600">
              ${totalRevenue.toFixed(2)}
            </p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-gray-600 text-sm font-medium">
              Average Purchase
            </h3>
            <p className="text-3xl font-bold text-red-600">
              ${averagePurchase.toFixed(2)}
            </p>
          </div>
        </div>

        {lowStockProducts.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-bold text-yellow-800 mb-4">
              ⚠️ Low Stock Alert
            </h2>
            <ul className="space-y-2">
              {lowStockProducts.map((p) => (
                <li key={p.id} className="text-yellow-700">
                  • <strong>{p.name}</strong> is below minimum stock level
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">Recent Sales</h2>
            <div className="space-y-3">
              {sales.slice(0, 5).map((sale) => (
                <div
                  key={sale.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">
                      {sale.customer?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(sale.saleDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-green-600">
                    ${sale.totalPrice.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold mb-4">
              Recent Inventory Received
            </h2>
            <div className="space-y-3">
              {inventory.slice(0, 5).map((inv) => (
                <div
                  key={inv.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded"
                >
                  <div>
                    <p className="font-medium">
                      {inv.product?.name || "Unknown"}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(inv.receivedDate).toLocaleDateString()}
                    </p>
                  </div>
                  <p className="font-bold text-blue-600">
                    {inv.quantity} {inv.product?.unitOfMeasurement}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Products by Sales Quantity</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Product Name
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                    Total Sold
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                    Unit
                  </th>
                  <th className="border border-gray-300 px-4 py-2 text-right font-semibold">
                    Times Sold
                  </th>
                </tr>
              </thead>
              <tbody>
                {productsSalesByQuantity.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                    >
                      No sales data available
                    </td>
                  </tr>
                ) : (
                  productsSalesByQuantity.map(
                    ({ product, totalQuantitySold, numberOfTransactions }) => (
                      <tr key={product.id} className="hover:bg-gray-50">
                        <td className="border border-gray-300 px-4 py-2">
                          {product.name}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                          {totalQuantitySold}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {product.unitOfMeasurement}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-right font-semibold">
                          {numberOfTransactions}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
