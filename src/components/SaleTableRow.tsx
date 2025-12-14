"use client";

import { Sale, Customer, Product } from "@/types";

interface SaleTableRowProps {
  sale: Sale;
  saleIdx: number;
  isSelected: boolean;
  customers: Customer[];
  products: Product[];
  onSelectRow: (idx: number) => void;
  onOpenDialog: (sale: Sale) => void;
  onDelete: (id: number) => void;
}

export function SaleTableRow({
  sale,
  saleIdx,
  isSelected,
  customers,
  products,
  onSelectRow,
  onOpenDialog,
  onDelete,
}: SaleTableRowProps) {
  return (
    <tr className={`hover:bg-gray-50 ${isSelected ? "bg-blue-100" : ""}`}>
      <td className="border border-gray-300 px-3 py-2 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectRow(saleIdx)}
          className="cursor-pointer"
        />
      </td>
      <td className="border border-gray-300 px-4 py-2">
        {customers.find((c) => c.id === sale.customerId)?.name || "Unknown"}
      </td>
      <td className="border border-gray-300 px-4 py-2">
        {new Date(sale.saleDate).toLocaleDateString()}
      </td>
      <td className="border border-gray-300 px-4 py-2">
        <div className="space-y-1">
          {(sale.items || []).map((item, idx) => (
            <div key={idx} className="text-sm">
              {products.find((p) => p.id === item.productId)?.name || "Unknown"}{" "}
              x{item.quantity}
            </div>
          ))}
        </div>
      </td>
      <td className="border border-gray-300 px-4 py-2">
        ${sale.totalCost.toFixed(2)}
      </td>
      <td className="border border-gray-300 px-4 py-2">
        ${sale.totalPrice.toFixed(2)}
      </td>
      <td className="border border-gray-300 px-4 py-2">
        {sale.markupPercent}%
      </td>
      <td className="border border-gray-300 px-4 py-2">
        <div className="flex gap-2">
          <button
            onClick={() => onOpenDialog(sale)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(sale.id)}
            className="text-red-600 hover:text-red-800 font-medium"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );
}
