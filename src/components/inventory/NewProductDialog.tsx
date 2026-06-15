"use client";

import { useState } from "react";
import { Button, Dialog, Input, Select } from "@/components";
import { Source } from "@/types";

export interface NewProductValues {
  name: string;
  sku: string;
  unitOfMeasurement: string;
  pricePerUnit: string;
  minimumStock: string;
  sourceId: string;
}

const EMPTY: NewProductValues = {
  name: "",
  sku: "",
  unitOfMeasurement: "",
  pricePerUnit: "",
  minimumStock: "",
  sourceId: "",
};

interface NewProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sources: Source[];
  /** Returns true when the product was created (so the form can reset). */
  onCreate: (values: NewProductValues) => Promise<boolean>;
}

/** Quick "create product" dialog launched from the inventory entry form. */
export function NewProductDialog({
  open,
  onOpenChange,
  sources,
  onCreate,
}: NewProductDialogProps) {
  const [values, setValues] = useState<NewProductValues>(EMPTY);
  const set = (patch: Partial<NewProductValues>) =>
    setValues((v) => ({ ...v, ...patch }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="New Product">
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (await onCreate(values)) setValues(EMPTY);
        }}
        className="space-y-4"
      >
        <Input
          label="Product Name"
          value={values.name}
          onChange={(e) => set({ name: e.target.value })}
          required
        />
        <Input
          label="SKU"
          value={values.sku}
          onChange={(e) => set({ sku: e.target.value })}
          required
        />
        <Input
          label="Unit of Measurement"
          value={values.unitOfMeasurement}
          onChange={(e) => set({ unitOfMeasurement: e.target.value })}
          required
        />
        <Input
          label="Price Per Unit"
          type="number"
          step="0.01"
          value={values.pricePerUnit}
          onChange={(e) => set({ pricePerUnit: e.target.value })}
          required
        />
        <Input
          label="Minimum Stock"
          type="number"
          value={values.minimumStock}
          onChange={(e) => set({ minimumStock: e.target.value })}
          required
        />
        <Select
          label="Source (optional)"
          value={values.sourceId}
          onChange={(e) => set({ sourceId: e.target.value })}
          options={[
            { value: "", label: "Select a source" },
            ...sources.map((s) => ({ value: s.id, label: s.name })),
          ]}
        />
        <div className="flex gap-2">
          <Button type="submit">Create Product</Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
