"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Button, Dialog, Input } from "@/components";
import { Sale, Customer, Product } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { SaleTableRow } from "@/components/SaleTableRow";
import SaleDialog from "@/components/SaleDialog";

export interface SaleFormInputs {
  customerId: string;
  markupPercent: string;
  items: Array<{ productId: string; quantity: string; quantityOz?: string }>;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<Partial<Sale> | null>(
    null
  );
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    control,
  } = useForm<SaleFormInputs>({
    defaultValues: {
      customerId: "",
      markupPercent: "20",
      items: [{ productId: "", quantity: "" }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/sales").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/products").then((r) => r.json()),
    ])
      .then(([sls, custs, prods]) => {
        setSales(sls);
        console.log("custs", custs);
        setCustomers(custs);
        setProducts(prods);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleOpenDialog = (sale?: Sale) => {
    if (sale) {
      setEditingId(sale.id);
      reset({
        customerId: sale.customerId.toString(),
        markupPercent: sale.markupPercent.toString(),
        items: (sale.items || []).map((item) => ({
          productId: item.productId.toString(),
          quantity: item.quantity.toString(),
        })),
      });
    } else {
      setEditingId(null);
      reset({
        customerId: "",
        markupPercent: "20",
        items: [{ productId: "", quantity: "" }],
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: SaleFormInputs) => {
    try {
      const url = editingId ? `/api/sales/${editingId}` : "/api/sales";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: parseInt(data.customerId),
          markupPercent: parseFloat(data.markupPercent),
          items: data.items.map((item) => ({
            productId: parseInt(item.productId),
            quantity: parseInt(item.quantity),
          })),
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        const responseData = await res.json();
        if (editingId) {
          setSales((sls) =>
            sls.map((s) => (s.id === editingId ? responseData : s))
          );
        } else {
          setSales((sls) => [responseData, ...sls]);
        }
        reset();
      }
    } catch (error) {
      console.error("Error saving sale:", error);
    }
  };

  const handleInlineEdit = (sale: Sale) => {
    setInlineEditingId(sale.id);
    setInlineEditData({ ...sale });
  };

  const handleInlineSave = async (saleId: number) => {
    if (!inlineEditData) return;

    try {
      const res = await fetch(`/api/sales/${saleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: inlineEditData.customerId,
          markupPercent: inlineEditData.markupPercent,
          items: (inlineEditData.items || []).map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      });

      if (res.ok) {
        const updatedSale = await res.json();
        setSales((sls) => sls.map((s) => (s.id === saleId ? updatedSale : s)));
        setInlineEditingId(null);
        setInlineEditData(null);
      }
    } catch (error) {
      console.error("Error saving sale:", error);
    }
  };

  const handleInlineCancel = () => {
    setInlineEditingId(null);
    setInlineEditData(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
        if (res.ok) {
          setSales((sls) => sls.filter((s) => s.id !== id));
        }
      } catch (error) {
        console.error("Error deleting sale:", error);
      }
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(sales.map((_, idx) => idx)));
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
    setSelectAll(newSelected.size === sales.length && sales.length > 0);
  };

  const handleBulkDeleteClick = () => {
    if (selectedRows.size === 0) return;
    if (
      confirm(
        `Delete ${selectedRows.size} item${selectedRows.size > 1 ? "s" : ""}?`
      )
    ) {
      const idsToDelete = Array.from(selectedRows).map((idx) => sales[idx].id);
      handleBulkDelete(idsToDelete);
    }
  };

  const handleBulkDelete = async (idsToDelete: number[]) => {
    try {
      const response = await fetch(`/api/sales`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      if (!response.ok) throw new Error("Failed to delete sales");
      setSales((sls) => sls.filter((s) => !idsToDelete.includes(s.id)));
      setSelectedRows(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Error bulk deleting sales:", error);
    }
  };

  const filteredSales = sales.filter((sale) => {
    const customer = customers.find((c) => c.id === sale.customerId);
    return (
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.saleDate.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const {
    sortedData: sortedSales,
    handleSort,
    getSortIndicator,
  } = useSortableTable({
    data: filteredSales,
  });

  if (loading) return <div>Loading...</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales</h1>
        <Button onClick={() => handleOpenDialog()}>+ New Sale</Button>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by customer name, email, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {selectedRows.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <span className="text-blue-900">
            {selectedRows.size} item{selectedRows.size > 1 ? "s" : ""} selected
          </span>
          <button
            onClick={handleBulkDeleteClick}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Delete Selected
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-3 py-2 text-left font-semibold w-10">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("customerId")}
              >
                Customer{getSortIndicator("customerId")}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("date")}
              >
                Date{getSortIndicator("date")}
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Items
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("totalCost")}
              >
                Total Cost{getSortIndicator("totalCost")}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("totalPrice")}
              >
                Total Price{getSortIndicator("totalPrice")}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("markupPercent")}
              >
                Markup{getSortIndicator("markupPercent")}
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedSales.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                >
                  {sales.length === 0
                    ? "No sales available"
                    : "No sales match your search"}
                </td>
              </tr>
            ) : (
              sortedSales.map((sale, saleIdx) => {
                const originalIdx = sales.indexOf(sale);
                return (
                  <SaleTableRow
                    key={sale.id}
                    sale={sale}
                    saleIdx={originalIdx}
                    isSelected={selectedRows.has(originalIdx)}
                    customers={customers}
                    products={products}
                    onSelectRow={handleSelectRow}
                    onOpenDialog={handleOpenDialog}
                    onDelete={handleDelete}
                  />
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit Sale" : "New Sale"}
      >
        <SaleDialog
          customers={customers}
          products={products}
          register={register}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          watch={watch}
          errors={errors}
          fields={fields}
          append={append}
          remove={remove}
          onClose={() => setDialogOpen(false)}
        />
      </Dialog>
    </main>
  );
}
