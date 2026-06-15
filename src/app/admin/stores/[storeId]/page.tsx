"use client";

import { useEffect, useState } from "react";
import { Product, Customer, InventoryReceived, Sale } from "@/types";
import { useStore } from "@/context/StoreContext";
import { useParams } from "next/navigation";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";

export default function StoreDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryReceived[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const storeId = parseInt(params.storeId as string);

  useEffect(() => {
    const loadData = async () => {
      try {
        const headers = {
          "x-store-id": storeId.toString(),
        };

        const [productsData, customersData, inventoryData, salesData] =
          await Promise.all([
            fetch("/api/products", {
              credentials: "include",
              headers,
            }).then((r) => r.json()),
            fetch(`/api/customers?storeId=${storeId}`, {
              credentials: "include",
            }).then((r) => r.json()),
            fetch("/api/inventory", {
              credentials: "include",
              headers,
            }).then((r) => r.json()),
            fetch("/api/sales", {
              credentials: "include",
              headers,
            }).then((r) => r.json()),
          ]);

        setProducts(productsData || []);
        setCustomers(customersData || []);
        setInventory(inventoryData || []);
        setSales(salesData || []);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [storeId]);

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
        0,
      );
      const numberOfTransactions = new Set(
        sales
          .filter((s) => s.items?.some((item) => item.productId === product.id))
          .map((s) => s.id),
      ).size;
      return { product, totalQuantitySold, numberOfTransactions };
    })
    .sort((a, b) => b.numberOfTransactions - a.numberOfTransactions);

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Store Dashboard</h1>

      <div className="stats stats-vertical md:stats-horizontal shadow w-full mb-8">
        <div className="stat">
          <div className="stat-title">Total Products</div>
          <div className="stat-value text-primary">{products.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Customers</div>
          <div className="stat-value text-success">{customers.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Sales</div>
          <div className="stat-value text-secondary">{sales.length}</div>
        </div>
        <div className="stat">
          <div className="stat-title">Total Revenue</div>
          <div className="stat-value text-warning">
            ${totalRevenue.toFixed(2)}
          </div>
        </div>
        <div className="stat">
          <div className="stat-title">Average Purchase</div>
          <div className="stat-value text-error">
            ${averagePurchase.toFixed(2)}
          </div>
        </div>
      </div>

      {lowStockProducts.length > 0 && (
        <div className="alert alert-warning mb-8 block">
          <h2 className="text-lg font-bold mb-4">⚠️ Low Stock Alert</h2>
          <ul className="space-y-2">
            {lowStockProducts.map((p) => (
              <li key={p.id}>
                • <strong>{p.name}</strong> is below minimum stock level
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card bg-base-100 shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Sales</h2>
          <div className="space-y-3">
            {sales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex justify-between items-center p-3 bg-base-200 rounded"
              >
                <div>
                  <p className="font-medium">
                    {sale.customer?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {new Date(sale.saleDate).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-bold text-success">
                  ${sale.totalPrice.toFixed(2)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="card bg-base-100 shadow p-6">
          <h2 className="text-xl font-bold mb-4">Recent Inventory Received</h2>
          <div className="space-y-3">
            {inventory.slice(0, 5).map((inv) => (
              <div
                key={inv.id}
                className="flex justify-between items-center p-3 bg-base-200 rounded"
              >
                <div>
                  <p className="font-medium">
                    {inv.product?.name || "Unknown"}
                  </p>
                  <p className="text-sm text-base-content/60">
                    {new Date(inv.receivedDate).toLocaleDateString()}
                  </p>
                </div>
                <p className="font-bold text-primary">
                  {inv.quantity} {inv.product?.unitOfMeasurement}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card bg-base-100 shadow p-6">
        <h2 className="text-xl font-bold mb-4">Products by Sales Quantity</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th className="text-left font-semibold">Product Name</th>
                <th className="text-right font-semibold">Total Sold</th>
                <th className="text-left font-semibold">Unit</th>
                <th className="text-right font-semibold">Times Sold</th>
              </tr>
            </thead>
            <tbody>
              {productsSalesByQuantity.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center text-base-content/60"
                  >
                    No sales data available
                  </td>
                </tr>
              ) : (
                productsSalesByQuantity.map(
                  ({ product, totalQuantitySold, numberOfTransactions }) => (
                    <tr key={product.id} className="hover:bg-base-200">
                      <td>{product.name}</td>
                      <td className="text-right font-semibold">
                        {totalQuantitySold}
                      </td>
                      <td>{product.unitOfMeasurement}</td>
                      <td className="text-right font-semibold">
                        {numberOfTransactions}
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
