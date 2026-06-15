"use client";

import { Product } from "@/types";
import { computeOrderTotals, SaleItemInput } from "@/lib/saleMath";

interface OrderSummaryProps {
  items: SaleItemInput[];
  products: Product[];
  markupPercent: number;
}

export function OrderSummary({
  items,
  products,
  markupPercent,
}: OrderSummaryProps) {
  const { costSubtotal, markupAmount, total } = computeOrderTotals(
    items,
    products,
    markupPercent,
  );

  return (
    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">
            Subtotal (Cost):
          </span>
          <span className="font-medium">${costSubtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-blue-200 dark:border-blue-900 pt-2">
          <span className="text-gray-600 dark:text-gray-300">
            Markup ({markupPercent}%):
          </span>
          <span className="font-medium text-green-600 dark:text-green-400">
            +${markupAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t border-blue-200 dark:border-blue-900 pt-2">
          <span>Total:</span>
          <span className="text-blue-600 dark:text-blue-400">
            ${total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
}
