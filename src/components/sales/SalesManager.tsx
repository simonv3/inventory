"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { Button, Dialog, Input, BulkImportDialog, LoadingSkeleton } from "@/components";
import { BulkSelectionBanner } from "@/components/BulkSelectionBanner";
import { Column, TableHeader, TableEmpty } from "@/components/DataTable";
import { Sale, Customer, Product, SaleFormInputs } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { SaleTableRow } from "@/components/SaleTableRow";
import SaleDialog from "@/components/SaleDialog";

const COLUMNS: Column[] = [
  { label: "Customer", sortKey: "customerId" },
  { label: "Date", sortKey: "date" },
  { label: "Items" },
  { label: "Total Cost", sortKey: "totalCost" },
  { label: "Total Price", sortKey: "totalPrice" },
  { label: "Markup", sortKey: "markupPercent" },
];

const DEFAULTS: SaleFormInputs = {
  customerId: "",
  markupPercent: "20",
  items: [{ productId: "", quantity: "" }],
};

export function SalesManager({ storeId }: { storeId: number | null }) {
  const searchParams = useSearchParams();
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customerIdFilter, setCustomerIdFilter] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
    control,
  } = useForm<SaleFormInputs>({ defaultValues: DEFAULTS });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const loadData = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    try {
      const [sls, custs, prods] = await Promise.all([
        fetch(`/api/sales?storeId=${storeId}`).then((r) => r.json()),
        fetch(`/api/customers?storeId=${storeId}`).then((r) => r.json()),
        fetch(`/api/products?storeId=${storeId}`).then((r) => r.json()),
      ]);
      setSales(sls);
      setCustomers(custs);
      setProducts(prods);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const customerId = searchParams.get("customerId");
    if (customerId) {
      const id = parseInt(customerId);
      setCustomerIdFilter(id);
      const customer = customers.find((c) => c.id === id);
      if (customer) setSearchQuery(customer.email);
    }
  }, [searchParams, customers]);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const openDialog = (sale?: Sale) => {
    setEditingId(sale?.id ?? null);
    reset(
      sale
        ? {
            customerId: sale.customerId.toString(),
            markupPercent: sale.markupPercent.toString(),
            items: (sale.items || []).map((item) => ({
              productId: item.productId.toString(),
              quantity: item.quantity.toString(),
            })),
          }
        : DEFAULTS,
    );
    setDialogOpen(true);
  };

  const onSubmit = async (data: SaleFormInputs) => {
    try {
      const res = await fetch(
        editingId ? `/api/sales/${editingId}` : "/api/sales",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerId: parseInt(data.customerId),
            markupPercent: parseFloat(data.markupPercent),
            items: data.items.map((item) => ({
              productId: parseInt(item.productId),
              quantity: parseInt(item.quantity),
            })),
          }),
        },
      );
      if (res.ok) {
        setDialogOpen(false);
        const responseData = await res.json();
        setSales((sls) =>
          editingId
            ? sls.map((s) => (s.id === editingId ? responseData : s))
            : [responseData, ...sls],
        );
        reset();
      }
    } catch (error) {
      console.error("Error saving sale:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/sales/${id}`, { method: "DELETE" });
      if (res.ok) setSales((sls) => sls.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Error deleting sale:", error);
    }
  };

  const filtered = sales.filter((sale) => {
    if (customerIdFilter && sale.customerId !== customerIdFilter) return false;
    const customer = customers.find((c) => c.id === sale.customerId);
    return (
      customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer?.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.saleDate.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  const { sortedData, handleSort, getSortIndicator } = useSortableTable({
    data: filtered,
    defaultSortKey: "customerId",
    defaultDirection: "asc",
  });

  const selection = useBulkSelection(sales);

  const bulkDelete = async () => {
    if (selection.count === 0) return;
    if (!confirm(`Delete ${selection.count} item${selection.count > 1 ? "s" : ""}?`))
      return;
    const ids = selection.selected;
    try {
      const res = await fetch(`/api/sales`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to delete sales");
      setSales((sls) => sls.filter((s) => !ids.includes(s.id)));
      selection.clear();
    } catch (error) {
      console.error("Error bulk deleting sales:", error);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sales</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setImportDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Import CSV
          </Button>
          <Button onClick={() => openDialog()}>+ New Sale</Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by customer name, email, or date..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <BulkSelectionBanner count={selection.count} onDelete={bulkDelete} />

      <div className="overflow-x-auto">
        <table className="table">
          <TableHeader
            columns={COLUMNS}
            onSort={handleSort}
            indicator={getSortIndicator}
            selectable
            allSelected={selection.allSelected}
            onToggleAll={selection.toggleAll}
            actions
          />
          <tbody>
            {sortedData.length === 0 ? (
              <TableEmpty colSpan={8}>
                {sales.length === 0
                  ? "No sales available"
                  : "No sales match your search"}
              </TableEmpty>
            ) : (
              sortedData.map((sale) => (
                <SaleTableRow
                  key={sale.id}
                  sale={sale}
                  selected={selection.isSelected(sale.id)}
                  customers={customers}
                  products={products}
                  onToggleSelect={() => selection.toggle(sale.id)}
                  onOpenDialog={openDialog}
                  onDelete={handleDelete}
                />
              ))
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

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        storeId={storeId}
        onImportSuccess={() => {
          setSales([]);
          setLoading(true);
          loadData();
        }}
      />
    </main>
  );
}
