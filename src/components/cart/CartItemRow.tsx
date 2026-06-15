"use client";

import { UseFormRegister, UseFormWatch } from "react-hook-form";
import { Product, SaleFormInputs } from "@/types";
import { effectiveQuantity, unitSalePrice } from "@/lib/saleMath";

interface CartItemRowProps {
  index: number;
  products: Product[];
  register: UseFormRegister<SaleFormInputs>;
  watch: UseFormWatch<SaleFormInputs>;
  onRemove: () => void;
}

const SELECT =
  "flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded text-sm";
const PRICE_BOX =
  "p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700";

export function CartItemRow({
  index,
  products,
  register,
  watch,
  onRemove,
}: CartItemRowProps) {
  const productId = watch(`items.${index}.productId`);
  const product = products.find((p) => p.id === parseInt(productId || "0"));
  const markupPercent = parseFloat(watch("markupPercent") || "0");
  const costPrice = product?.pricePerUnit || 0;
  const salePrice = unitSalePrice(costPrice, markupPercent);
  const subtotal =
    salePrice *
    effectiveQuantity(
      product,
      watch(`items.${index}.quantity`),
      watch(`items.${index}.quantityOz`),
    );

  return (
    <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
      <div className="space-y-3">
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
            Product
          </label>
          <div className="flex gap-2">
            <select
              {...register(`items.${index}.productId`, {
                required: "Product is required",
              })}
              className={SELECT}
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
              onClick={onRemove}
              className="px-2 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              ✕
            </button>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-600 dark:text-gray-300 mb-1">
            Quantity {product?.unitOfMeasurement === "lb" && "(lb or oz)"}
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="lb"
              {...register(`items.${index}.quantity`, {
                required: "Quantity is required",
              })}
              className={SELECT}
            />
            {product?.unitOfMeasurement === "lb" && (
              <input
                type="number"
                step="0.1"
                placeholder="oz"
                {...register(`items.${index}.quantityOz`)}
                className="w-24 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded text-sm"
              />
            )}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Unit: {product?.unitOfMeasurement}
            {product?.unitOfMeasurement === "lb" && " (1 lb = 16 oz)"}
          </p>
        </div>
      </div>
      {product && (
        <div className="grid grid-cols-3 gap-2 text-sm mt-3">
          <div className={PRICE_BOX}>
            <label className="text-gray-600 dark:text-gray-300 text-xs">
              Cost/Unit
            </label>
            <p className="font-semibold">${costPrice.toFixed(2)}</p>
          </div>
          <div className={PRICE_BOX}>
            <label className="text-gray-600 dark:text-gray-300 text-xs">
              Sale/Unit
            </label>
            <p className="font-semibold">${salePrice.toFixed(2)}</p>
          </div>
          <div className={PRICE_BOX}>
            <label className="text-gray-600 dark:text-gray-300 text-xs">
              Subtotal
            </label>
            <p className="font-semibold">${subtotal.toFixed(2)}</p>
          </div>
        </div>
      )}
    </div>
  );
}
