"use client";

import { ReactNode } from "react";
import React from "react";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  children: ReactNode;
}

export function Dialog({ open, onOpenChange, title, children }: DialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

interface ButtonProps {
  variant?: "primary" | "secondary" | "danger";
  children: ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  className?: string;
  disabled?: boolean;
}

export function Button({
  variant = "primary",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const baseClass =
    "px-4 py-2 rounded font-medium transition disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-300 text-gray-900 hover:bg-gray-400",
    danger: "bg-red-600 text-white hover:bg-red-700",
  };

  return (
    <button
      className={`${baseClass} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

interface InputProps {
  label?: string;
  type?: string;
  placeholder?: string;
  value?: string;
  onChange?: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  className?: string;
  required?: boolean;
  textarea?: boolean;
  step?: string;
  min?: string;
  max?: string;
}

export function Input({
  label,
  type = "text",
  className = "",
  textarea = false,
  ...props
}: InputProps) {
  const baseClass =
    "w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="mb-4">
      {label && <label className="block font-medium mb-1">{label}</label>}
      {textarea ? (
        <textarea className={`${baseClass} ${className}`} {...props} />
      ) : (
        <input type={type} className={`${baseClass} ${className}`} {...props} />
      )}
    </div>
  );
}

interface SelectProps {
  label?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  className?: string;
  required?: boolean;
}

export function Select({
  label,
  options,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="mb-4">
      {label && <label className="block font-medium mb-1">{label}</label>}
      <select
        className={`w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface TableProps {
  headers: string[];
  rows: (string | number | ReactNode)[][];
  onEdit?: (index: number) => void;
  onDelete?: (index: number) => void;
  onBulkDelete?: (indices: number[]) => void;
  selectable?: boolean;
}

export function Table({
  headers,
  rows,
  onEdit,
  onDelete,
  onBulkDelete,
  selectable = false,
}: TableProps) {
  const [selectedRows, setSelectedRows] = React.useState<Set<number>>(
    new Set()
  );
  const [selectAll, setSelectAll] = React.useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(rows.map((_, idx) => idx)));
      setSelectAll(true);
    }
  };

  const handleSelectRow = (idx: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(idx)) {
      newSelected.delete(idx);
    } else {
      newSelected.add(idx);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === rows.length && rows.length > 0);
  };

  const handleBulkDelete = () => {
    if (selectedRows.size === 0) return;
    if (
      confirm(
        `Delete ${selectedRows.size} item${selectedRows.size > 1 ? "s" : ""}?`
      )
    ) {
      onBulkDelete?.(Array.from(selectedRows).sort((a, b) => b - a));
      setSelectedRows(new Set());
      setSelectAll(false);
    }
  };

  return (
    <div>
      {selectable && selectedRows.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded flex justify-between items-center">
          <p className="text-blue-900 font-medium">
            {selectedRows.size} item{selectedRows.size > 1 ? "s" : ""} selected
          </p>
          <button
            onClick={handleBulkDelete}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
          >
            Delete Selected
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              {selectable && (
                <th className="border border-gray-300 px-4 py-2 text-left w-12">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
              )}
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="border border-gray-300 px-4 py-2 text-left font-semibold"
                >
                  {header}
                </th>
              ))}
              {(onEdit || onDelete) && (
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={
                    headers.length +
                    (onEdit || onDelete ? 1 : 0) +
                    (selectable ? 1 : 0)
                  }
                  className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              rows.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className={`hover:bg-gray-50 ${
                    selectedRows.has(rowIdx) ? "bg-blue-100" : ""
                  }`}
                >
                  {selectable && (
                    <td className="border border-gray-300 px-4 py-2">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIdx)}
                        onChange={() => handleSelectRow(rowIdx)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  {row.map((cell, cellIdx) => (
                    <td
                      key={cellIdx}
                      className="border border-gray-300 px-4 py-2"
                    >
                      {cell}
                    </td>
                  ))}
                  {(onEdit || onDelete) && (
                    <td className="border border-gray-300 px-4 py-2">
                      <div className="flex gap-2">
                        {onEdit && (
                          <button
                            onClick={() => onEdit(rowIdx)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                        )}
                        {onDelete && (
                          <button
                            onClick={() => onDelete(rowIdx)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
