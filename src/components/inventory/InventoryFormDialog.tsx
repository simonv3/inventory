"use client";

import { Button, Dialog, Input } from "@/components";
import { Product } from "@/types";

export interface InventoryFormValues {
  productId: string;
  quantity: string;
  receivedDate: string;
  receiptUrl: string;
}

interface InventoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  products: Product[];
  values: InventoryFormValues;
  onChange: (patch: Partial<InventoryFormValues>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onNewProduct: () => void;
}

/** Create/edit dialog for a single inventory-received entry. */
export function InventoryFormDialog({
  open,
  onOpenChange,
  editing,
  products,
  values,
  onChange,
  onSubmit,
  onNewProduct,
}: InventoryFormDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Inventory Entry" : "New Inventory Entry"}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Product <span className="text-error">*</span>
          </label>
          <div className="flex gap-2">
            <select
              value={values.productId}
              onChange={(e) => onChange({ productId: e.target.value })}
              required
              className="select w-full"
            >
              <option value="">Select a product</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <Button type="button" onClick={onNewProduct} variant="secondary">
              + New
            </Button>
          </div>
        </div>
        <Input
          label="Quantity"
          type="number"
          value={values.quantity}
          onChange={(e) => onChange({ quantity: e.target.value })}
          required
        />
        <Input
          label="Received Date"
          type="date"
          value={values.receivedDate}
          onChange={(e) => onChange({ receivedDate: e.target.value })}
          required
        />
        <Input
          label="Receipt URL (optional)"
          type="url"
          value={values.receiptUrl}
          onChange={(e) => onChange({ receiptUrl: e.target.value })}
        />
        <div className="flex gap-2">
          <Button type="submit">Save</Button>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
