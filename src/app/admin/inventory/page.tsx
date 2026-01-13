"use client";

import { useEffect, useState } from "react";
import { Button, Dialog, Input, Select, ImportCsvButton } from "@/components";
import { InventoryReceived, Product } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useApiWithToast } from "@/lib/useApiWithToast";
import { useStore } from "@/context/StoreContext";

export default function InventoryPage() {
  const { currentStoreId, loading: storeLoading } = useStore();
  const [inventory, setInventory] = useState<InventoryReceived[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [sources, setSources] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] =
    useState<Partial<InventoryReceived> | null>(null);
  const [newProductDialogOpen, setNewProductDialogOpen] = useState(false);
  const [newProductData, setNewProductData] = useState({
    name: "",
    sku: "",
    unitOfMeasurement: "",
    pricePerUnit: "",
    minimumStock: "",
    sourceId: "",
  });
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

    const [inv, prods, src] = await Promise.all([
      fetchData<InventoryReceived[]>(
        `/api/inventory?storeId=${currentStoreId}`
      ),
      fetchData<Product[]>(`/api/products?storeId=${currentStoreId}`),
      fetchData<any[]>("/api/sources"),
    ]);
    if (inv) setInventory(inv);
    if (prods) setProducts(prods);
    if (src) setSources(src);
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

  const handleCreateProduct = async () => {
    if (!currentStoreId) return;

    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newProductData,
          storeId: currentStoreId,
          categoryIds: [],
          isOrganic: false,
          showInStorefront: true,
          pricePerUnit: parseFloat(newProductData.pricePerUnit),
          minimumStock: parseInt(newProductData.minimumStock),
          sourceId: newProductData.sourceId
            ? parseInt(newProductData.sourceId)
            : null,
        }),
      });

      if (res.ok) {
        const newProduct = await res.json();
        setProducts((prods) => [newProduct, ...prods]);
        setFormData({ ...formData, productId: newProduct.id.toString() });
        setNewProductDialogOpen(false);
        setNewProductData({
          name: "",
          sku: "",
          unitOfMeasurement: "",
          pricePerUnit: "",
          minimumStock: "",
          sourceId: "",
        });
      }
    } catch (error) {
      console.error("Error creating product:", error);
    }
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
    defaultSortKey: "receivedDate",
    defaultDirection: "desc",
  });

  if (loading) return <div>Loading...</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Inventory Received</h1>
        <div className="flex gap-2">
          <ImportCsvButton
            storeId={currentStoreId}
            onImportSuccess={() => {
              setInventory([]);
              setLoading(true);
              loadData();
            }}
          />
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
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Product <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <select
                value={formData.productId}
                onChange={(e) =>
                  setFormData({ ...formData, productId: e.target.value })
                }
                required
                className="w-full w-150 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a product</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                onClick={() => setNewProductDialogOpen(true)}
                variant="secondary"
              >
                + New
              </Button>
            </div>
          </div>
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

      <Dialog
        open={newProductDialogOpen}
        onOpenChange={setNewProductDialogOpen}
        title="New Product"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateProduct();
          }}
          className="space-y-4"
        >
          <Input
            label="Product Name"
            value={newProductData.name}
            onChange={(e) =>
              setNewProductData({ ...newProductData, name: e.target.value })
            }
            required
          />
          <Input
            label="SKU"
            value={newProductData.sku}
            onChange={(e) =>
              setNewProductData({ ...newProductData, sku: e.target.value })
            }
            required
          />
          <Input
            label="Unit of Measurement"
            value={newProductData.unitOfMeasurement}
            onChange={(e) =>
              setNewProductData({
                ...newProductData,
                unitOfMeasurement: e.target.value,
              })
            }
            required
          />
          <Input
            label="Price Per Unit"
            type="number"
            step="0.01"
            value={newProductData.pricePerUnit}
            onChange={(e) =>
              setNewProductData({
                ...newProductData,
                pricePerUnit: e.target.value,
              })
            }
            required
          />
          <Input
            label="Minimum Stock"
            type="number"
            value={newProductData.minimumStock}
            onChange={(e) =>
              setNewProductData({
                ...newProductData,
                minimumStock: e.target.value,
              })
            }
            required
          />
          <Select
            label="Source (optional)"
            value={newProductData.sourceId}
            onChange={(e) =>
              setNewProductData({ ...newProductData, sourceId: e.target.value })
            }
            options={[
              { value: "", label: "Select a source" },
              ...sources.map((s) => ({
                value: s.id,
                label: s.name,
              })),
            ]}
          />
          <div className="flex gap-2">
            <Button type="submit">Create Product</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setNewProductDialogOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </main>
  );
}
