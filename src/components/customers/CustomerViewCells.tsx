"use client";

import { Customer } from "@/types";
import { StoreManagerToggle } from "./StoreManagerToggle";

interface CustomerViewCellsProps {
  customer: Customer;
  currentStoreId?: number | null;
  canImpersonate: boolean;
  onEmailClick: () => void;
  onToggleManager: (storeId: number, isManager: boolean) => void;
  onEdit: () => void;
  onStores: () => void;
  onLoginAs: () => void;
  onDelete: () => void;
}

const CELL = "border border-base-300 px-4 py-2";

export function CustomerViewCells({
  customer,
  currentStoreId,
  canImpersonate,
  onEmailClick,
  onToggleManager,
  onEdit,
  onStores,
  onLoginAs,
  onDelete,
}: CustomerViewCellsProps) {
  return (
    <>
      <td className={CELL}>{customer.name}</td>
      <td className={CELL}>
        <button
          onClick={onEmailClick}
          className="btn btn-link btn-xs text-primary px-0"
        >
          {customer.email}
        </button>
      </td>
      <td className={CELL}>{customer.isAdmin ? "Yes" : "No"}</td>
      <td className={CELL}>
        <StoreManagerToggle
          customer={customer}
          currentStoreId={currentStoreId}
          onToggle={onToggleManager}
        />
      </td>
      <td className={CELL}>
        {currentStoreId
          ? (customer.stores?.find((cs) => cs.storeId === currentStoreId)
              ?.markupPercent ?? "—")
          : "—"}
      </td>
      <td className={CELL}>
        {customer.stores && customer.stores.length > 0
          ? customer.stores.map((cs) => cs.store?.name).join(", ")
          : "—"}
      </td>
      <td className={CELL}>
        {new Date(customer.createdAt).toLocaleDateString()}
      </td>
      <td className={CELL}>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="btn btn-link btn-xs text-primary px-0"
          >
            Edit
          </button>
          <button
            onClick={onStores}
            className="btn btn-link btn-xs text-success px-0"
          >
            Stores
          </button>
          {canImpersonate && (
            <button
              onClick={onLoginAs}
              className="btn btn-link btn-xs text-secondary px-0"
            >
              Login As
            </button>
          )}
          <button
            onClick={onDelete}
            className="btn btn-link btn-xs text-error px-0"
          >
            Delete
          </button>
        </div>
      </td>
    </>
  );
}
