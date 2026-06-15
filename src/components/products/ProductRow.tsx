"use client";

import { Product, Category, Source } from "@/types";
import { ProductCategoryEditor } from "./ProductCategoryEditor";

export type ProductEditData = Partial<Product> & { categoryIds?: number[] };

type BooleanField = "isOrganic" | "showInStorefront";

interface ProductRowProps {
  product: Product;
  categories: Category[];
  sources: Source[];
  selected: boolean;
  onToggleSelect: () => void;
  isEditing: boolean;
  editData: ProductEditData | null;
  onChangeEdit: (patch: ProductEditData) => void;
  onAddCategory: (categoryId: number) => void;
  onRemoveCategory: (categoryId: number) => void;
  onSave: () => void;
  onCancel: () => void;
  onStartEdit: () => void;
  onDelete: () => void;
  onToggleField: (field: BooleanField, current: boolean) => void;
}

const CELL = "";
const EDIT_CELL = "";
const EDIT_INPUT = "input input-sm w-full";

export function ProductRow({
  product,
  categories,
  sources,
  selected,
  onToggleSelect,
  isEditing,
  editData,
  onChangeEdit,
  onAddCategory,
  onRemoveCategory,
  onSave,
  onCancel,
  onStartEdit,
  onDelete,
  onToggleField,
}: ProductRowProps) {
  return (
    <tr
      className={`hover:bg-base-200 ${
        selected ? "bg-primary/10" : ""
      }`}
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
          <td className={EDIT_CELL}>
            <input
              type="text"
              value={editData.name || ""}
              onChange={(e) => onChangeEdit({ name: e.target.value })}
              className={EDIT_INPUT}
            />
          </td>
          <td className={EDIT_CELL}>
            <ProductCategoryEditor
              categoryIds={editData.categoryIds || []}
              categories={categories}
              onAdd={onAddCategory}
              onRemove={onRemoveCategory}
            />
          </td>
          <td className={EDIT_CELL}>
            <input
              type="text"
              value={editData.unitOfMeasurement || ""}
              onChange={(e) =>
                onChangeEdit({ unitOfMeasurement: e.target.value })
              }
              className={EDIT_INPUT}
            />
          </td>
          <td className={EDIT_CELL}>
            <input
              type="number"
              step="0.01"
              value={editData.pricePerUnit ?? ""}
              onChange={(e) =>
                onChangeEdit({ pricePerUnit: parseFloat(e.target.value) })
              }
              className={EDIT_INPUT}
            />
          </td>
          <td className={EDIT_CELL}>
            <input
              type="number"
              value={editData.minimumStock ?? ""}
              onChange={(e) =>
                onChangeEdit({ minimumStock: parseInt(e.target.value) })
              }
              className={EDIT_INPUT}
            />
          </td>
          <td className={EDIT_CELL}>
            <select
              value={editData.sourceId ?? ""}
              onChange={(e) =>
                onChangeEdit({
                  sourceId: e.target.value
                    ? parseInt(e.target.value)
                    : undefined,
                })
              }
              className="select select-sm w-full"
            >
              <option value="">Select source</option>
              {sources.map((source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ))}
            </select>
          </td>
          <td className={`${EDIT_CELL} text-center`}>
            <input
              type="checkbox"
              checked={editData.showInStorefront || false}
              onChange={(e) =>
                onChangeEdit({ showInStorefront: e.target.checked })
              }
              className="checkbox checkbox-sm"
            />
          </td>
          <td className={`${EDIT_CELL} text-center`}>
            <input
              type="checkbox"
              checked={editData.isOrganic || false}
              onChange={(e) => onChangeEdit({ isOrganic: e.target.checked })}
              className="checkbox checkbox-sm"
            />
          </td>
          <td className={EDIT_CELL}>
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
          <td className={CELL}>{product.name}</td>
          <td className={`${CELL} text-sm`}>
            {product.categories?.map((c) => c.name).join(", ") || "—"}
          </td>
          <td className={CELL}>{product.unitOfMeasurement}</td>
          <td className={CELL}>${product.pricePerUnit.toFixed(2)}</td>
          <td className={CELL}>{product.minimumStock}</td>
          <td className={CELL}>{product.source?.name || "—"}</td>
          <td
            className={`${CELL} text-center cursor-pointer hover:bg-base-200`}
            onClick={() =>
              onToggleField("showInStorefront", product.showInStorefront)
            }
          >
            <input
              type="checkbox"
              checked={product.showInStorefront}
              onChange={() =>
                onToggleField("showInStorefront", product.showInStorefront)
              }
              className="checkbox checkbox-sm"
            />
          </td>
          <td
            className={`${CELL} text-center cursor-pointer hover:bg-base-200`}
            onClick={() => onToggleField("isOrganic", product.isOrganic)}
          >
            <input
              type="checkbox"
              checked={product.isOrganic}
              onChange={() => onToggleField("isOrganic", product.isOrganic)}
              className="checkbox checkbox-sm"
            />
          </td>
          <td className={CELL}>
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
