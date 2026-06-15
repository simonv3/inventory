"use client";

import { InventoryReceived, Product } from "@/types";

export type InventoryEditData = Partial<InventoryReceived>;

interface InventoryRowProps {
  item: InventoryReceived;
  products: Product[];
  selected: boolean;
  onToggleSelect: () => void;
  isEditing: boolean;
  editData: InventoryEditData | null;
  onChangeEdit: (patch: InventoryEditData) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
}

const EDIT_INPUT = "input input-sm w-full";

export function InventoryRow({
  item,
  products,
  selected,
  onToggleSelect,
  isEditing,
  editData,
  onChangeEdit,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
}: InventoryRowProps) {
  return (
    <tr
      className={`hover:bg-base-200 ${selected ? "bg-primary/10" : ""}`}
    >
      <td className="text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="checkbox checkbox-sm"
        />
      </td>

      {isEditing && editData ? (
        <>
          <td>
            <select
              value={editData.productId || ""}
              onChange={(e) =>
                onChangeEdit({ productId: parseInt(e.target.value) })
              }
              className="select select-sm w-full"
            >
              <option value="">Select product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </td>
          <td>
            <input
              type="number"
              value={editData.quantity || ""}
              onChange={(e) =>
                onChangeEdit({ quantity: parseInt(e.target.value) })
              }
              className={EDIT_INPUT}
            />
          </td>
          <td>
            <input
              type="date"
              value={(editData.receivedDate as string)?.split("T")[0] || ""}
              onChange={(e) => onChangeEdit({ receivedDate: e.target.value })}
              className={EDIT_INPUT}
            />
          </td>
          <td>
            <input
              type="url"
              value={editData.receiptUrl || ""}
              onChange={(e) => onChangeEdit({ receiptUrl: e.target.value })}
              placeholder="URL..."
              className={EDIT_INPUT}
            />
          </td>
          <td>
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
      ) : (
        <>
          <td>
            {products.find((p) => p.id === item.productId)?.name || "Unknown"}
          </td>
          <td>{item.quantity}</td>
          <td>{new Date(item.receivedDate).toLocaleDateString()}</td>
          <td className="text-center">{item.receiptUrl ? "✓" : "✗"}</td>
          <td>
            <div className="flex gap-2">
              <button
                onClick={onStartEdit}
                className="btn btn-link btn-xs text-primary px-0"
              >
                Edit
              </button>
              <button
                onClick={onDelete}
                className="btn btn-link btn-xs text-error px-0"
              >
                Delete
              </button>
            </div>
          </td>
        </>
      )}
    </tr>
  );
}
