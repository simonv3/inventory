"use client";

import { Customer } from "@/types";

interface StoreManagerToggleProps {
  customer: Customer;
  currentStoreId?: number | null;
  onToggle: (storeId: number, isManager: boolean) => void;
}

/**
 * Store-manager control for a customer row. With a current store selected it
 * renders a toggle button for that store; otherwise a read-only Yes/No.
 * Shared between the customer row's edit and view modes.
 */
export function StoreManagerToggle({
  customer,
  currentStoreId,
  onToggle,
}: StoreManagerToggleProps) {
  if (!currentStoreId) {
    return (
      <span>{customer.stores?.some((cs) => cs.storeManager) ? "Yes" : "No"}</span>
    );
  }

  const isManager = customer.stores?.find(
    (cs) => cs.storeId === currentStoreId,
  )?.storeManager;

  return (
    <button
      onClick={() => onToggle(currentStoreId, !isManager)}
      className={`btn btn-sm ${
        isManager ? "btn-primary" : "btn-neutral btn-outline"
      }`}
    >
      {isManager ? "Manager" : "Set Manager"}
    </button>
  );
}
