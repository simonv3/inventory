"use client";

import { Sale, Customer, Product } from "@/types";

interface SaleTableRowProps {
  sale: Sale;
  selected: boolean;
  customers: Customer[];
  products: Product[];
  onToggleSelect: () => void;
  onOpenDialog: (sale: Sale) => void;
  onDelete: (id: number) => void;
}

export function SaleTableRow({
  sale,
  selected,
  customers,
  products,
  onToggleSelect,
  onOpenDialog,
  onDelete,
}: SaleTableRowProps) {
  return (
    <tr className={`hover:bg-base-200 ${selected ? "bg-primary/10" : ""}`}>
      <td className="border border-base-300 px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="checkbox checkbox-sm"
        />
      </td>
      <td className="border border-base-300 px-4 py-2">
        {customers.find((c) => c.id === sale.customerId)?.name || "Unknown"}
      </td>
      <td className="border border-base-300 px-4 py-2">
        {new Date(sale.saleDate).toLocaleDateString()}
      </td>
      <td className="border border-base-300 px-4 py-2">
        <div className="space-y-1">
          {(sale.items || []).map((item, idx) => (
            <div key={idx} className="text-sm">
              {products.find((p) => p.id === item.productId)?.name || "Unknown"}{" "}
              x{item.quantity}
            </div>
          ))}
        </div>
      </td>
      <td className="border border-base-300 px-4 py-2">
        ${sale.totalCost.toFixed(2)}
      </td>
      <td className="border border-base-300 px-4 py-2">
        ${sale.totalPrice.toFixed(2)}
      </td>
      <td className="border border-base-300 px-4 py-2">
        {sale.markupPercent}%
      </td>
      <td className="border border-base-300 px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => onOpenDialog(sale)}
            className="btn btn-link btn-xs text-primary px-0"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(sale.id)}
            className="btn btn-link btn-xs text-error px-0"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
