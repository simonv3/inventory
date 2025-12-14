"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Navbar, Button } from "@/components";
import { Customer, Product } from "@/types";
import QRCode from "qrcode";
import { SaleFormInputs } from "@/app/dashboard/sales/page";

export default function ShoppingCartPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(true);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderUrl, setOrderUrl] = useState("");
  const [qrCode, setQrCode] = useState<string>("");
  const [orderId, setOrderId] = useState<number | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
    control,
  } = useForm<SaleFormInputs>({
    defaultValues: {
      customerId: "",
      markupPercent: "20",
      items: [{ productId: "", quantity: "" }],
    },
  });

  const selectedCustomerId = watch("customerId");

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([custs, prods]) => {
        setCustomers(custs);
        setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      const customer = customers.find(
        (c) => c.id === parseInt(selectedCustomerId)
      );
      if (customer) {
        setValue("markupPercent", customer.markupPercent.toString());
      }
    }
  }, [selectedCustomerId, customers, setValue]);

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  const onSubmit = async (data: SaleFormInputs) => {
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(data.customerId),
          items: data.items.map((item) => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
          })),
          markupPercent: parseFloat(data.markupPercent),
        }),
      });

      if (res.ok) {
        const sale = await res.json();
        setOrderId(sale.id);
        const url = `${window.location.origin}/order/${sale.id}`;
        setOrderUrl(url);

        // Generate QR code
        const qrDataUrl = await QRCode.toDataURL(url);
        setQrCode(qrDataUrl);

        setOrderComplete(true);
        setDialogOpen(false);
      } else {
        alert("Failed to create order");
      }
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Error creating order");
    }
  };

  const handleNewOrder = () => {
    setOrderComplete(false);
    setQrCode("");
    setOrderId(null);
    setOrderUrl("");
    reset({
      customerId: "",
      markupPercent: "20",
      items: [{ productId: "", quantity: "" }],
    });
    setDialogOpen(true);
  };

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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

        {orderComplete ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-green-600 mb-4">
                Order Confirmed!
              </h2>
              <p className="text-gray-600 mb-6">
                Order ID: <span className="font-mono font-bold">{orderId}</span>
              </p>
            </div>

            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white border-2 border-gray-200 rounded-lg">
                {qrCode && (
                  <img src={qrCode} alt="Order QR Code" className="w-64 h-64" />
                )}
              </div>
            </div>

            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Order Link:</p>
              <p className="font-mono text-sm break-all text-blue-600 mb-4">
                {orderUrl}
              </p>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(orderUrl);
                  alert("Link copied to clipboard!");
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mr-2"
              >
                Copy Link
              </button>
              <a
                href={qrCode}
                download={`order-qr-${orderId}.png`}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 inline-block"
              >
                Download QR Code
              </a>
            </div>

            <Button onClick={handleNewOrder} className="w-full">
              Create New Order
            </Button>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-8">
            <div className="max-w-2xl mx-auto">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Customer
                  </label>
                  <select
                    {...register("customerId", {
                      required: "Customer is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  {errors.customerId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.customerId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Markup %
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("markupPercent", {
                      required: "Markup % is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded"
                  />
                  {errors.markupPercent && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.markupPercent.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block font-medium mb-2">Sale Items</label>
                  {fields.map((field: any, idx: number) => {
                    const productId = watch(`items.${idx}.productId`);
                    const product = products.find(
                      (p) => p.id === parseInt(productId || "0")
                    );
                    const costPrice = product?.pricePerUnit || 0;
                    const markupPercent = watch("markupPercent");
                    const markup = parseFloat(markupPercent || "0") / 100;
                    const salePrice = costPrice * (1 + markup);
                    const quantity = watch(`items.${idx}.quantity`);

                    return (
                      <div
                        key={field.id}
                        className="mb-4 p-3 bg-gray-50 rounded border border-gray-200"
                      >
                        <div className="space-y-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Product
                            </label>
                            <div className="flex gap-2">
                              <select
                                {...register(`items.${idx}.productId`, {
                                  required: "Product is required",
                                })}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                              >
                                <option value="">Select Product</option>
                                {products.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.name}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                onClick={() => remove(idx)}
                                className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              {...register(`items.${idx}.quantity`, {
                                required: "Quantity is required",
                              })}
                              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                            />
                          </div>
                        </div>
                        {product && (
                          <div className="grid grid-cols-3 gap-2 text-sm mt-3">
                            <div className="p-2 bg-white rounded border border-gray-200">
                              <label className="text-gray-600 text-xs">
                                Cost/Unit
                              </label>
                              <p className="font-semibold">
                                ${costPrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="p-2 bg-white rounded border border-gray-200">
                              <label className="text-gray-600 text-xs">
                                Sale/Unit
                              </label>
                              <p className="font-semibold">
                                ${salePrice.toFixed(2)}
                              </p>
                            </div>
                            <div className="p-2 bg-white rounded border border-gray-200">
                              <label className="text-gray-600 text-xs">
                                Subtotal
                              </label>
                              <p className="font-semibold">
                                $
                                {(
                                  salePrice * parseInt(quantity || "0")
                                ).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => append({ productId: "", quantity: "" })}
                  >
                    + Add Item
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button type="submit" className="flex-1">
                    Place Order
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
