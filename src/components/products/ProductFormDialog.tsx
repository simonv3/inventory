"use client";

import { useState } from "react";
import {
  UseFormRegister,
  FieldErrors,
  UseFormHandleSubmit,
} from "react-hook-form";
import { Button, Dialog } from "@/components";
import { Category, Source } from "@/types";

export interface ProductFormInputs {
  name: string;
  sku: string;
  unitOfMeasurement: string;
  pricePerUnit: string;
  minimumStock: string;
  sourceId: string;
  isOrganic: boolean;
  showInStorefront: boolean;
  categoryIds: number[];
}

interface ProductFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  categories: Category[];
  sources: Source[];
  register: UseFormRegister<ProductFormInputs>;
  errors: FieldErrors<ProductFormInputs>;
  handleSubmit: UseFormHandleSubmit<ProductFormInputs>;
  onSubmit: (data: ProductFormInputs) => void;
  onCategoryCreated: (category: Category) => void;
}

const FIELD = "input w-full";

export function ProductFormDialog({
  open,
  onOpenChange,
  editing,
  categories,
  sources,
  register,
  errors,
  handleSubmit,
  onSubmit,
  onCategoryCreated,
}: ProductFormDialogProps) {
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const addCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });
      if (res.ok) {
        onCategoryCreated(await res.json());
        setNewCategoryName("");
        setShowNewCategory(false);
      } else {
        alert("Category already exists or error creating category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? "Edit Product" : "New Product"}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            {...register("name", { required: "Name is required" })}
            className={FIELD}
          />
          {errors.name && (
            <p className="text-error text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Categories</label>
          <div className="space-y-2 mb-3 p-3 border border-base-300 rounded-lg bg-base-200 max-h-48 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-base-content/60 text-sm">No categories yet</p>
            ) : (
              categories.map((cat) => (
                <label key={cat.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    {...register("categoryIds")}
                    value={cat.id}
                    className="checkbox checkbox-sm"
                  />
                  <span>{cat.name}</span>
                </label>
              ))
            )}
          </div>

          {!showNewCategory ? (
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowNewCategory(true)}
              className="text-sm"
            >
              + Add New Category
            </Button>
          ) : (
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Category name..."
                className="input flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCategory();
                  }
                }}
              />
              <Button type="button" onClick={addCategory} className="text-sm">
                Add
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setShowNewCategory(false);
                  setNewCategoryName("");
                }}
                className="text-sm"
              >
                Cancel
              </Button>
            </div>
          )}
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register("isOrganic")}
            className="checkbox checkbox-sm"
          />
          <span>Is Organic</span>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register("showInStorefront")}
            className="checkbox checkbox-sm"
          />
          <span>Show in Storefront</span>
        </label>

        <div>
          <label className="block text-sm font-medium mb-1">
            Unit of Measurement
          </label>
          <input
            {...register("unitOfMeasurement", {
              required: "Unit of measurement is required",
            })}
            className={FIELD}
          />
          {errors.unitOfMeasurement && (
            <p className="text-error text-sm mt-1">
              {errors.unitOfMeasurement.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Price Per Unit</label>
          <input
            type="number"
            step="0.01"
            {...register("pricePerUnit", {
              required: "Price per unit is required",
            })}
            className={FIELD}
          />
          {errors.pricePerUnit && (
            <p className="text-error text-sm mt-1">
              {errors.pricePerUnit.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Minimum Stock</label>
          <input
            type="number"
            {...register("minimumStock", {
              required: "Minimum stock is required",
            })}
            className={FIELD}
          />
          {errors.minimumStock && (
            <p className="text-error text-sm mt-1">
              {errors.minimumStock.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Source (Optional)
          </label>
          <select {...register("sourceId")} className="select w-full">
            <option value="">Select a source</option>
            {sources.map((source) => (
              <option key={source.id} value={source.id}>
                {source.name}
              </option>
            ))}
          </select>
        </div>

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
