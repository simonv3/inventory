"use client";

import { useEffect, useState } from "react";
import { Button, Dialog, Input, Select, BulkImportDialog } from "@/components";
import { InventoryReceived, Product } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useApiWithToast } from "@/lib/useApiWithToast";
import { useStore } from "@/context/StoreContext";

export default function InventoryPage() {
  const { currentStoreId, loading: storeLoading } = useStore();
  const [inventory, setInventory] = useState<InventoryReceived[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] =
    useState<Partial<InventoryReceived> | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { fetchData } = useApiWithToast();
  const [formData, setFormData] = useState({
    productId: "",
    quantity: "",
    receivedDate: "",
    receiptUrl: "",
  });

  const loadData = async () => {
    if (!currentStoreId) {
      setLoading(false);
      return;
    }

    const [inv, prods] = await Promise.all([
      fetchData<InventoryReceived[]>(
        `/api/inventory?storeId=${currentStoreId}`
      ),
      fetchData<Product[]>(`/api/products?storeId=${currentStoreId}`),
    ]);
    if (inv) setInventory(inv);
    if (prods) setProducts(prods);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoreId]);

  const handleOpenDialog = (item?: InventoryReceived) => {
    if (item) {
      setEditingId(item.id);
      setFormData({
        productId: item.productId.toString(),
        quantity: item.quantity.toString(),
        receivedDate: item.receivedDate.split("T")[0],
        receiptUrl: item.receiptUrl || "",
      });
    } else {
      setEditingId(null);
      setFormData({
        productId: "",
        quantity: "",
        receivedDate: new Date().toISOString().split("T")[0],
        receiptUrl: "",
      });
    }
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId ? `/api/inventory/${editingId}` : "/api/inventory";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productId: parseInt(formData.productId),
          quantity: parseInt(formData.quantity),
        }),
      });

      if (res.ok) {
        setDialogOpen(false);
        const data = await res.json();
        if (editingId) {
          setInventory((inv) =>
            inv.map((i) => (i.id === editingId ? data : i))
          );
        } else {
          setInventory((inv) => [data, ...inv]);
        }
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
    }
  };

  const handleInlineEdit = (item: InventoryReceived) => {
    setInlineEditingId(item.id);
    setInlineEditData({
      ...item,
    });
  };

  const handleInlineSave = async (itemId: number) => {
    if (!inlineEditData) return;

    try {
      const res = await fetch(`/api/inventory/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: inlineEditData.productId,
          quantity: inlineEditData.quantity,
          receivedDate: inlineEditData.receivedDate,
          receiptUrl: inlineEditData.receiptUrl,
        }),
      });

      if (res.ok) {
        const updatedItem = await res.json();
        setInventory((inv) =>
          inv.map((i) => (i.id === itemId ? updatedItem : i))
        );
        setInlineEditingId(null);
        setInlineEditData(null);
      }
    } catch (error) {
      console.error("Error saving inventory:", error);
    }
  };

  const handleInlineCancel = () => {
    setInlineEditingId(null);
    setInlineEditData(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        const res = await fetch(`/api/inventory/${id}`, { method: "DELETE" });
        if (res.ok) {
          setInventory((inv) => inv.filter((i) => i.id !== id));
        }
      } catch (error) {
        console.error("Error deleting inventory:", error);
      }
    }
  };

  const handleBulkDelete = async (selectedIds: number[]) => {
    try {
      const response = await fetch(`/api/inventory`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (!response.ok) throw new Error("Failed to delete inventory");
      setInventory((inv) => inv.filter((i) => !selectedIds.includes(i.id)));
      setSelectedRows(new Set());
    } catch (error) {
      console.error("Error bulk deleting inventory:", error);
    }
  };

  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(inventory.map((_, idx) => idx)));
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
    setSelectAll(newSelected.size === inventory.length && inventory.length > 0);
  };

  const handleBulkDeleteClick = () => {
    if (selectedRows.size === 0) return;
    if (
      confirm(
        `Delete ${selectedRows.size} item${selectedRows.size > 1 ? "s" : ""}?`
      )
    ) {
      const idsToDelete = Array.from(selectedRows).map(
        (idx) => inventory[idx].id
      );
      handleBulkDelete(idsToDelete);
    }
  };

  const filteredInventory = inventory.filter((item) => {
    const product = products.find((p) => p.id === item.productId);
    return (
      product?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receivedDate.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const {
    sortedData: sortedInventory,
    handleSort,
    getSortIndicator,
  } = useSortableTable({
    data: filteredInventory,
    defaultSortKey: "productId",
    defaultDirection: "asc",
  });

  if (loading) return <div>Loading...</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Received</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setImportDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Import CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>+ New Entry</Button>
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

      {selectedRows.size > 0 && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded flex justify-between items-center">
          <p className="text-blue-900 font-medium">
            {selectedRows.size} item{selectedRows.size > 1 ? "s" : ""} selected
          </p>
          <button
            onClick={handleBulkDeleteClick}
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
              <th className="border border-gray-300 px-4 py-2 text-left w-12">
                <input
                  type="checkbox"
                  checked={selectAll}
                  onChange={handleSelectAll}
                  className="w-4 h-4 cursor-pointer"
                />
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("productId")}
              >
                Product{getSortIndicator("productId")}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("quantity")}
              >
                Quantity{getSortIndicator("quantity")}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("receivedDate")}
              >
                Received Date{getSortIndicator("receivedDate")}
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Receipt
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedInventory.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                >
                  {inventory.length === 0
                    ? "No inventory entries available"
                    : "No inventory entries match your search"}
                </td>
              </tr>
            ) : (
              sortedInventory.map((item, idx) => {
                const originalIdx = inventory.indexOf(item);
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 ${
                      selectedRows.has(originalIdx) ? "bg-blue-100" : ""
                    }`}
                  >
                    <td className="border border-gray-300 px-4 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(originalIdx)}
                        onChange={() => handleSelectRow(originalIdx)}
                        className="w-4 h-4 cursor-pointer"
                      />
                    </td>
                    {inlineEditingId === item.id && inlineEditData ? (
                      <>
                        <td className="border border-gray-300 px-2 py-1">
                          <select
                            value={inlineEditData.productId || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                productId: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="">Select product</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={inlineEditData.quantity || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                quantity: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="date"
                            value={
                              (inlineEditData.receivedDate as string)?.split(
                                "T"
                              )[0] || ""
                            }
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                receivedDate: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="url"
                            value={inlineEditData.receiptUrl || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                receiptUrl: e.target.value,
                              })
                            }
                            placeholder="URL..."
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleInlineSave(item.id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleInlineCancel}
                              className="bg-gray-400 text-white px-2 py-1 rounded text-sm hover:bg-gray-500"
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="border border-gray-300 px-4 py-2">
                          {products.find((p) => p.id === item.productId)
                            ?.name || "Unknown"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {item.quantity}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(item.receivedDate).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-center">
                          {item.receiptUrl ? "✓" : "✗"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInlineEdit(item)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit Inventory Entry" : "New Inventory Entry"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Product"
            value={formData.productId}
            onChange={(e) =>
              setFormData({ ...formData, productId: e.target.value })
            }
            options={products.map((p) => ({
              value: p.id,
              label: p.name,
            }))}
            required
          />
          <Input
            label="Quantity"
            type="number"
            value={formData.quantity}
            onChange={(e) =>
              setFormData({ ...formData, quantity: e.target.value })
            }
            required
          />
          <Input
            label="Received Date"
            type="date"
            value={formData.receivedDate}
            onChange={(e) =>
              setFormData({ ...formData, receivedDate: e.target.value })
            }
            required
          />
          <Input
            label="Receipt URL (optional)"
            type="url"
            value={formData.receiptUrl}
            onChange={(e) =>
              setFormData({ ...formData, receiptUrl: e.target.value })
            }
          />
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>

      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        storeId={currentStoreId}
        onImportSuccess={() => {
          setInventory([]);
          setLoading(true);
          loadData();
        }}
      />
    </main>
  );
}
