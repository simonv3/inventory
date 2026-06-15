"use client";

import { useEffect, useState } from "react";
import { Button, Input, ImportCsvButton, LoadingSkeleton } from "@/components";
import { BulkSelectionBanner } from "@/components/BulkSelectionBanner";
import { Column, TableHeader, TableEmpty } from "@/components/DataTable";
import { InventoryReceived, Product, Source } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useApiWithToast } from "@/lib/useApiWithToast";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import { InventoryRow, InventoryEditData } from "./InventoryRow";
import {
  InventoryFormDialog,
  InventoryFormValues,
} from "./InventoryFormDialog";
import { NewProductDialog, NewProductValues } from "./NewProductDialog";

const COLUMNS: Column[] = [
  { label: "Product", sortKey: "productId" },
  { label: "Quantity", sortKey: "quantity" },
  { label: "Received Date", sortKey: "receivedDate" },
  { label: "Receipt" },
];

const today = () => new Date().toISOString().split("T")[0];

export function InventoryManager({ storeId }: { storeId: number | null }) {
  const [inventory, setInventory] = useState<InventoryReceived[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [formData, setFormData] = useState<InventoryFormValues>({
    productId: "",
    quantity: "",
    receivedDate: "",
    receiptUrl: "",
  });

  const { fetchData } = useApiWithToast();
  const inline = useInlineEdit<InventoryReceived>();

  const loadData = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    const [inv, prods, src] = await Promise.all([
      fetchData<InventoryReceived[]>(`/api/inventory?storeId=${storeId}`),
      fetchData<Product[]>(`/api/products?storeId=${storeId}`),
      fetchData<Source[]>("/api/sources"),
    ]);
    if (inv) setInventory(inv);
    if (prods) setProducts(prods);
    if (src) setSources(src);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const openDialog = (item?: InventoryReceived) => {
    setEditingId(item?.id ?? null);
    setFormData(
      item
        ? {
            productId: item.productId.toString(),
            quantity: item.quantity.toString(),
            receivedDate: item.receivedDate.split("T")[0],
            receiptUrl: item.receiptUrl || "",
          }
        : { productId: "", quantity: "", receivedDate: today(), receiptUrl: "" },
    );
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(
        editingId ? `/api/inventory/${editingId}` : "/api/inventory",
        {
          method: editingId ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            productId: parseInt(formData.productId),
            quantity: parseInt(formData.quantity),
          }),
        },
      );
      if (res.ok) {
        setDialogOpen(false);
        const data = await res.json();
        setInventory((inv) =>
          editingId
            ? inv.map((i) => (i.id === editingId ? data : i))
            : [data, ...inv],
        );
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
    }
  };

  const createProduct = async (values: NewProductValues) => {
    if (!storeId) return false;
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          storeId,
          categoryIds: [],
          isOrganic: false,
          showInStorefront: true,
          pricePerUnit: parseFloat(values.pricePerUnit),
          minimumStock: parseInt(values.minimumStock),
          sourceId: values.sourceId ? parseInt(values.sourceId) : null,
        }),
      });
      if (!res.ok) return false;
      const newProduct = await res.json();
      setProducts((prods) => [newProduct, ...prods]);
      setFormData((f) => ({ ...f, productId: newProduct.id.toString() }));
      setNewProductOpen(false);
      return true;
    } catch (error) {
      console.error("Error creating product:", error);
      return false;
    }
  };

  const saveInline = async (itemId: number) => {
    const d = inline.data;
    if (!d) return;
    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: d.productId,
          quantity: d.quantity,
          receivedDate: d.receivedDate,
          receiptUrl: d.receiptUrl,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setInventory((inv) => inv.map((i) => (i.id === itemId ? updated : i)));
        inline.cancel();
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
      if (res.ok) setInventory((inv) => inv.filter((i) => i.id !== id));
    } catch (error) {
      console.error("Error deleting inventory:", error);
    }
  };

  const filtered = inventory.filter((item) => {
    const product = products.find((p) => p.id === item.productId);
    return (
      product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receivedDate.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });
  const { sortedData, handleSort, getSortIndicator } = useSortableTable({
    data: filtered,
    defaultSortKey: "receivedDate",
    defaultDirection: "desc",
  });

  const selection = useBulkSelection(inventory);

  const bulkDelete = async () => {
    if (selection.count === 0) return;
    if (!confirm(`Delete ${selection.count} item${selection.count > 1 ? "s" : ""}?`))
      return;
    const ids = selection.selected;
    try {
      const res = await fetch(`/api/inventory`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to delete inventory");
      setInventory((inv) => inv.filter((i) => !ids.includes(i.id)));
      selection.clear();
    } catch (error) {
      console.error("Error bulk deleting inventory:", error);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Received</h1>
        <div className="flex gap-2">
          <ImportCsvButton
            storeId={storeId}
            onImportSuccess={() => {
              setInventory([]);
              setLoading(true);
              loadData();
            }}
          />
          <Button onClick={() => openDialog()}>+ New Entry</Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by product name or date..."
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
              <TableEmpty colSpan={6}>
                {inventory.length === 0
                  ? "No inventory entries available"
                  : "No inventory entries match your search"}
              </TableEmpty>
            ) : (
              sortedData.map((item) => (
                <InventoryRow
                  key={item.id}
                  item={item}
                  products={products}
                  selected={selection.isSelected(item.id)}
                  onToggleSelect={() => selection.toggle(item.id)}
                  isEditing={inline.isEditing(item.id)}
                  editData={inline.data as InventoryEditData | null}
                  onChangeEdit={(patch) => inline.update(patch)}
                  onSave={() => saveInline(item.id)}
                  onCancel={inline.cancel}
                  onStartEdit={() => inline.start(item)}
                  onDelete={() => handleDelete(item.id)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <InventoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingId !== null}
        products={products}
        values={formData}
        onChange={(patch) => setFormData((f) => ({ ...f, ...patch }))}
        onSubmit={handleSubmit}
        onNewProduct={() => setNewProductOpen(true)}
      />

      <NewProductDialog
        open={newProductOpen}
        onOpenChange={setNewProductOpen}
        sources={sources}
        onCreate={createProduct}
      />
    </main>
  );
}
