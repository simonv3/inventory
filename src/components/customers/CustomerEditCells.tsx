"use client";

import { Customer } from "@/types";
import { StoreManagerToggle } from "./StoreManagerToggle";

interface CustomerEditCellsProps {
  customer: Customer;
  editData: Partial<Customer>;
  setEditData: (data: Partial<Customer>) => void;
  currentStoreId?: number | null;
  onToggleManager: (storeId: number, isManager: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
}

const CELL = "border border-base-300 px-2 py-1";
const INPUT = "input input-sm w-full";

export function CustomerEditCells({
  customer,
  editData,
  setEditData,
  currentStoreId,
  onToggleManager,
  onSave,
  onCancel,
}: CustomerEditCellsProps) {
  const markup =
    editData.stores?.find((cs) => cs.storeId === currentStoreId)
      ?.markupPercent || 0;

  return (
    <>
      <td className={CELL}>
        <input
          type="text"
          value={editData.name || ""}
          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
          className={INPUT}
        />
      </td>
      <td className={CELL}>
        <input
          type="email"
          value={editData.email || ""}
          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
          className={INPUT}
        />
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
        {currentStoreId ? (
          <input
            type="number"
            step="0.01"
            value={markup}
            onChange={(e) => {
              const newStores =
                editData.stores?.map((cs) =>
                  cs.storeId === currentStoreId
                    ? { ...cs, markupPercent: parseFloat(e.target.value) || 0 }
                    : cs,
                ) || [];
              setEditData({ ...editData, stores: newStores });
            }}
            className={INPUT}
          />
        ) : (
          <span>—</span>
        )}
      </td>
      <td className={CELL}>
        {customer.stores && customer.stores.length > 0
          ? customer.stores.map((cs) => cs.store?.name).join(", ")
          : "—"}
      </td>
      <td className={CELL}>
        {new Date((editData as Customer).createdAt).toLocaleDateString()}
      </td>
      <td className={CELL}>
        <div className="flex gap-1">
          <button onClick={onSave} className="btn btn-success btn-sm">
            Save
          </button>
          <button
            onClick={onCancel}
            className="btn btn-neutral btn-outline btn-sm"
          >
            Cancel
          </button>
        </div>
      </td>
    </>
  );
}
