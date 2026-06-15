"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { useParams } from "next/navigation";
import { Button } from "@/components";
import { CustomerAutocomplete } from "@/components/CustomerAutocomplete";
import { CartItemRow } from "@/components/cart/CartItemRow";
import { OrderSummary } from "@/components/cart/OrderSummary";
import { OrderConfirmation } from "@/components/cart/OrderConfirmation";
import { Customer, Product, SaleFormInputs } from "@/types";
import { effectiveQuantity } from "@/lib/saleMath";

const DEFAULT_PAYMENT_LINK =
  "https://opencollective.com/greens-and-beans/contribute/store-purchase-89569/checkout?interval=oneTime&amount={{amount}}&contributeAs=me";

export default function ShoppingCartPage() {
  const params = useParams();
  const storeId = parseInt(params.storeId as string);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderUrl, setOrderUrl] = useState("");
  const [orderId, setOrderId] = useState<number | null>(null);
  const [storeName, setStoreName] = useState("");
  const [paymentLinkTemplate, setPaymentLinkTemplate] = useState("");

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
      markupPercent: "0",
      items: [{ productId: "", quantity: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const selectedCustomerId = watch("customerId");

  useEffect(() => {
    if (!storeId || isNaN(storeId)) {
      setLoading(false);
      return;
    }
    Promise.all([
      fetch(`/api/customers?storeId=${storeId}`).then((r) => r.json()),
      fetch(`/api/products?storeId=${storeId}`).then((r) => r.json()),
      fetch(`/api/stores/${storeId}`).then((r) => r.json()),
    ])
      .then(([custs, prods, store]) => {
        setCustomers(custs);
        setProducts(prods);
        if (store?.name) setStoreName(store.name);
        if (store?.paymentLink) setPaymentLinkTemplate(store.paymentLink);
      })
      .catch((error) => console.error("Error fetching data:", error))
      .finally(() => setLoading(false));
  }, [storeId]);

  // When a customer is selected, pull their per-store markup.
  useEffect(() => {
    if (!selectedCustomerId || !storeId) return;
    const customer = customers.find((c) => c.id === parseInt(selectedCustomerId));
    const customerStore = customer?.stores?.find((cs) => cs.storeId === storeId);
    if (customerStore) {
      setValue("markupPercent", customerStore.markupPercent.toString());
    }
  }, [selectedCustomerId, customers, storeId, setValue]);

  const onSubmit = async (data: SaleFormInputs) => {
    try {
      const convertedItems = data.items.map((item) => {
        const product = products.find((p) => p.id === parseInt(item.productId));
        return {
          productId: parseInt(item.productId),
          quantity: effectiveQuantity(product, item.quantity, item.quantityOz),
        };
      });

      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(data.customerId),
          items: convertedItems,
          markupPercent: parseFloat(data.markupPercent),
        }),
      });

      if (res.ok) {
        const sale = await res.json();
        setOrderId(sale.id);
        setOrderUrl(
          (paymentLinkTemplate || DEFAULT_PAYMENT_LINK).replace(
            "{{amount}}",
            sale.totalPrice.toString(),
          ),
        );
        setOrderComplete(true);
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
    setOrderId(null);
    setOrderUrl("");
    reset({
      customerId: "",
      markupPercent: "0",
      items: [{ productId: "", quantity: "" }],
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">Loading...</div>
    );
  }

  if (!storeId || isNaN(storeId)) {
    return (
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-red-700 dark:text-red-300 mb-2">
            Invalid Store
          </h1>
          <p className="text-red-600 dark:text-red-400">
            Please provide a valid store ID.
          </p>
        </div>
      </main>
    );
  }

  const items = watch("items");
  const markupPercent = parseFloat(watch("markupPercent") || "0");

  return (
    <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-2">Shopping Cart</h1>
      {storeName && (
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {storeName}
        </p>
      )}

      {orderComplete ? (
        <OrderConfirmation
          orderId={orderId}
          orderUrl={orderUrl}
          onNewOrder={handleNewOrder}
        />
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8">
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1">Customer</label>
                <CustomerAutocomplete
                  customers={customers}
                  value={selectedCustomerId}
                  onChange={(customerId) => setValue("customerId", customerId)}
                  error={errors.customerId?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Markup % (from customer settings)
                </label>
                <input
                  type="number"
                  step="0.01"
                  readOnly
                  {...register("markupPercent", {
                    required: "Markup % is required",
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-800 cursor-not-allowed"
                />
                {errors.markupPercent && (
                  <p className="text-red-500 dark:text-red-400 text-sm mt-1">
                    {errors.markupPercent.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block font-medium mb-2">Sale Items</label>
                {fields.map((field, idx) => (
                  <CartItemRow
                    key={field.id}
                    index={idx}
                    products={products}
                    register={register}
                    watch={watch}
                    onRemove={() => remove(idx)}
                  />
                ))}
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => append({ productId: "", quantity: "" })}
                >
                  + Add Item
                </Button>
              </div>

              <OrderSummary
                items={items}
                products={products}
                markupPercent={markupPercent}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={!selectedCustomerId}
                >
                  Place Order
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
