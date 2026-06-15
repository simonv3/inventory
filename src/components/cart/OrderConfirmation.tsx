"use client";

import { Button } from "@/components";

interface OrderConfirmationProps {
  orderId: number | null;
  orderUrl: string;
  onNewOrder: () => void;
}

export function OrderConfirmation({
  orderId,
  orderUrl,
  onNewOrder,
}: OrderConfirmationProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
          Order Confirmed!
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Order ID: <span className="font-mono font-bold">{orderId}</span>
        </p>
      </div>

      <div className="mb-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
          Complete your payment:
        </p>
        <a
          href={orderUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
        >
          Go to Payment
        </a>
      </div>

      <Button onClick={onNewOrder} className="w-full">
        Create New Order
      </Button>
    </div>
  );
}
