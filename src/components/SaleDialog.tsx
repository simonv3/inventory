"use client";

import { SaleFormInputs } from "@/app/admin/sales/page";
import { Button } from "@/components";
import { Customer, Product } from "@/types";

interface SaleDialogProps {
  customers: Customer[];
  products: Product[];
  register: any;
  handleSubmit: any;
  onSubmit: (data: SaleFormInputs) => void;
  watch: any;
  errors: any;
  fields: any;
  append: any;
  remove: any;
  onClose: () => void;
}

function SaleDialog({
  customers,
  products,
  register,
  handleSubmit,
  onSubmit,
  watch,
  errors,
  fields,
  append,
  remove,
  onClose,
}: SaleDialogProps) {
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-4 max-h-96 overflow-y-auto"
    >
      <div>
        <label className="block text-sm font-medium mb-1">Customer</label>
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
        <label className="block text-sm font-medium mb-1">Markup %</label>
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm max-w-[90%]"
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
                    <label className="text-gray-600 text-xs">Cost/Unit</label>
                    <p className="font-semibold">${costPrice.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <label className="text-gray-600 text-xs">Sale/Unit</label>
                    <p className="font-semibold">${salePrice.toFixed(2)}</p>
                  </div>
                  <div className="p-2 bg-white rounded border border-gray-200">
                    <label className="text-gray-600 text-xs">Subtotal</label>
                    <p className="font-semibold">
                      ${(salePrice * parseInt(quantity || "0")).toFixed(2)}
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
        <Button type="submit">Save</Button>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export default SaleDialog;
