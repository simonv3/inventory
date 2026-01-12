"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Dialog, Input, Select, BulkImportDialog } from "@/components";
import { Product, Category, Source } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useApiWithToast } from "@/lib/useApiWithToast";
import { useStore } from "@/context/StoreContext";

interface ProductFormInputs {
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

export default function ProductsPage() {
  const { currentStoreId, loading: storeLoading } = useStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] = useState<Partial<Product> | null>(
    null
  );
  const [inlineCategoryInput, setInlineCategoryInput] = useState("");
  const [categoryInputValue, setCategoryInputValue] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const { fetchData } = useApiWithToast();
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ProductFormInputs>({
    defaultValues: {
      name: "",
      sku: "",
      categoryIds: [],
      isOrganic: false,
      showInStorefront: true,
      unitOfMeasurement: "",
      pricePerUnit: "",
      minimumStock: "",
      sourceId: "",
    },
  });

  const loadData = async () => {
    if (!currentStoreId) {
      setLoading(false);
      return;
    }

    await Promise.all([
      (async () => {
        const data = await fetchData<Product[]>(
          `/api/products?storeId=${currentStoreId}`
        );
        if (data) setProducts(data);
      })(),
      (async () => {
        const data = await fetchData<Category[]>("/api/categories");
        if (data) setCategories(data);
      })(),
      (async () => {
        const data = await fetchData<Source[]>("/api/sources");
        if (data) setSources(data);
      })(),
    ]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStoreId]);

  const handleOpenDialog = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      reset({
        name: product.name,
        categoryIds: product.categories?.map((c) => c.id) || [],
        isOrganic: product.isOrganic,
        showInStorefront: product.showInStorefront,
        unitOfMeasurement: product.unitOfMeasurement,
        pricePerUnit: product.pricePerUnit.toString(),
        minimumStock: product.minimumStock.toString(),
        sourceId: product.sourceId?.toString() || "",
      });
    } else {
      setEditingId(null);
      reset({
        name: "",
        categoryIds: [],
        isOrganic: false,
        showInStorefront: true,
        unitOfMeasurement: "",
        pricePerUnit: "",
        minimumStock: "",
        sourceId: "",
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: ProductFormInputs) => {
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const method = editingId ? "PUT" : "POST";

    const result = await fetchData(
      url,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          pricePerUnit: parseFloat(data.pricePerUnit),
          minimumStock: parseInt(data.minimumStock),
          sourceId: data.sourceId ? parseInt(data.sourceId) : undefined,
        }),
      },
      true,
      `Product ${editingId ? "updated" : "created"} successfully`
    );

    if (result) {
      setDialogOpen(false);
      reset();
      const products = await fetchData<Product[]>("/api/products");
      if (products) setProducts(products);
    }
  };

  const handleInlineEdit = (product: Product) => {
    setInlineEditingId(product.id);
    setInlineEditData({
      ...product,
      categoryIds: product.categories?.map((c) => c.id) || [],
    } as any);
  };

  const handleInlineSave = async (productId: number) => {
    if (!inlineEditData) return;

    const result = await fetchData(
      `/api/products/${productId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inlineEditData.name,
          sourceId: inlineEditData.sourceId,
          unitOfMeasurement: inlineEditData.unitOfMeasurement,
          pricePerUnit: inlineEditData.pricePerUnit,
          minimumStock: inlineEditData.minimumStock,
          showInStorefront: inlineEditData.showInStorefront,
          isOrganic: inlineEditData.isOrganic,
          categoryIds: (inlineEditData as any).categoryIds || [],
        }),
      },
      true,
      "Product updated successfully"
    );

    if (result) {
      setInlineEditingId(null);
      setInlineEditData(null);
      const products = await fetchData<Product[]>("/api/products");
      if (products) setProducts(products);
    }
  };

  const handleInlineCancel = () => {
    setInlineEditingId(null);
    setInlineEditData(null);
    setInlineCategoryInput("");
  };

  const handleAddCategoryToInline = (categoryId: number) => {
    const categoryIds = ((inlineEditData as any).categoryIds || []) as number[];
    if (!categoryIds.includes(categoryId)) {
      setInlineEditData({
        ...inlineEditData,
        categoryIds: [...categoryIds, categoryId],
      } as any);
    }
    setInlineCategoryInput("");
  };

  const handleRemoveCategoryFromInline = (categoryId: number) => {
    const categoryIds = ((inlineEditData as any).categoryIds || []) as number[];
    setInlineEditData({
      ...inlineEditData,
      categoryIds: categoryIds.filter((id) => id !== categoryId),
    } as any);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
        if (res.ok) {
          setProducts((prods) => prods.filter((p) => p.id !== id));
        }
      } catch (error) {
        console.error("Error deleting product:", error);
      }
    }
  };

  const handleToggleBooleanField = async (
    productId: number,
    field: "isOrganic" | "showInStorefront",
    currentValue: boolean
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !currentValue }),
      });

      if (res.ok) {
        setProducts((prods) =>
          prods.map((p) =>
            p.id === productId ? { ...p, [field]: !currentValue } : p
          )
        );
      }
    } catch (error) {
      console.error(`Error toggling ${field}:`, error);
    }
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(products.map((_, idx) => idx)));
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
    setSelectAll(newSelected.size === products.length && products.length > 0);
  };

  const handleBulkDeleteClick = () => {
    if (selectedRows.size === 0) return;
    if (
      confirm(
        `Delete ${selectedRows.size} item${selectedRows.size > 1 ? "s" : ""}?`
      )
    ) {
      const idsToDelete = Array.from(selectedRows).map(
        (idx) => products[idx].id
      );
      handleBulkDelete(idsToDelete);
    }
  };

  const handleBulkDelete = async (idsToDelete: number[]) => {
    try {
      const response = await fetch(`/api/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: idsToDelete }),
      });
      if (!response.ok) throw new Error("Failed to delete products");
      setProducts((prods) => prods.filter((p) => !idsToDelete.includes(p.id)));
      setSelectedRows(new Set());
      setSelectAll(false);
    } catch (error) {
      console.error("Error bulk deleting products:", error);
    }
  };

  const handleAddNewCategory = async () => {
    if (!categoryInputValue.trim()) return;

    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: categoryInputValue.trim() }),
      });

      if (res.ok) {
        const newCategory = await res.json();
        setCategories([...categories, newCategory]);
        setCategoryInputValue("");
        setShowNewCategoryInput(false);
      } else {
        alert("Category already exists or error creating category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    sortedData: sortedProducts,
    handleSort,
    getSortIndicator,
  } = useSortableTable({
    data: filteredProducts,
    defaultSortKey: "name",
    defaultDirection: "asc",
  });

  if (loading) return <div>Loading...</div>;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex gap-2">
          <Button
            onClick={() => setImportDialogOpen(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            Import CSV
          </Button>
          <Button onClick={() => handleOpenDialog()}>+ New Product</Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by product name..."
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
                onClick={() => handleSort("name")}
              >
                Name{getSortIndicator("name")}
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Categories
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("unitOfMeasurement")}
              >
                Unit{getSortIndicator("unitOfMeasurement")}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("pricePerUnit")}
              >
                Price{getSortIndicator("pricePerUnit")}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("minimumStock")}
              >
                Min Stock{getSortIndicator("minimumStock")}
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Source
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Storefront
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Organic
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProducts.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                >
                  {products.length === 0
                    ? "No products available"
                    : "No products match your search"}
                </td>
              </tr>
            ) : (
              sortedProducts.map((product, idx) => {
                const originalIdx = products.indexOf(product);
                return (
                  <tr
                    key={product.id}
                    className={`hover:bg-gray-50 ${
                      selectedRows.has(originalIdx) ? "bg-blue-100" : ""
                    }`}
                  >
                    <td className="border border-gray-300 px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(originalIdx)}
                        onChange={() => handleSelectRow(originalIdx)}
                        className="cursor-pointer"
                      />
                    </td>
                    {inlineEditingId === product.id && inlineEditData ? (
                      <>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={inlineEditData.name || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                name: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <div className="space-y-2">
                            <div className="flex flex-wrap gap-1 min-h-8">
                              {((inlineEditData as any).categoryIds || []).map(
                                (catId: number) => {
                                  const cat = categories.find(
                                    (c) => c.id === catId
                                  );
                                  return (
                                    <span
                                      key={catId}
                                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center gap-1"
                                    >
                                      {cat?.name}
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleRemoveCategoryFromInline(catId)
                                        }
                                        className="text-blue-600 hover:text-blue-900 font-bold"
                                      >
                                        ×
                                      </button>
                                    </span>
                                  );
                                }
                              )}
                            </div>
                            <div className="relative">
                              <input
                                type="text"
                                value={inlineCategoryInput}
                                onChange={(e) =>
                                  setInlineCategoryInput(e.target.value)
                                }
                                placeholder="Search categories..."
                                className="w-full px-2 py-1 border rounded text-sm"
                              />
                              {inlineCategoryInput && (
                                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded mt-1 z-10 max-h-32 overflow-y-auto">
                                  {categories
                                    .filter(
                                      (cat) =>
                                        cat.name
                                          .toLowerCase()
                                          .includes(
                                            inlineCategoryInput.toLowerCase()
                                          ) &&
                                        !(
                                          (inlineEditData as any).categoryIds ||
                                          []
                                        ).includes(cat.id)
                                    )
                                    .map((cat) => (
                                      <button
                                        key={cat.id}
                                        type="button"
                                        onClick={() =>
                                          handleAddCategoryToInline(cat.id)
                                        }
                                        className="w-full text-left px-2 py-1 hover:bg-gray-100 text-sm"
                                      >
                                        {cat.name}
                                      </button>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={inlineEditData.unitOfMeasurement || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                unitOfMeasurement: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            step="0.01"
                            value={inlineEditData.pricePerUnit || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                pricePerUnit: parseFloat(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            value={inlineEditData.minimumStock || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                minimumStock: parseInt(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <select
                            value={inlineEditData.sourceId || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                sourceId: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="">Select source</option>
                            {sources.map((source) => (
                              <option key={source.id} value={source.id}>
                                {source.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={inlineEditData.showInStorefront || false}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                showInStorefront: e.target.checked,
                              })
                            }
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="checkbox"
                            checked={inlineEditData.isOrganic || false}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                isOrganic: e.target.checked,
                              })
                            }
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleInlineSave(product.id)}
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
                          {product.name}
                        </td>
                        <td className="border border-gray-300 px-4 py-2 text-sm">
                          {product.categories?.map((c) => c.name).join(", ") ||
                            "—"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {product.unitOfMeasurement}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          ${product.pricePerUnit.toFixed(2)}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {product.minimumStock}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {product.source?.name || "—"}
                        </td>
                        <td
                          className="border border-gray-300 px-4 py-2 text-center cursor-pointer hover:bg-gray-100"
                          onClick={() =>
                            handleToggleBooleanField(
                              product.id,
                              "showInStorefront",
                              product.showInStorefront
                            )
                          }
                        >
                          <input
                            type="checkbox"
                            checked={product.showInStorefront}
                            onChange={() =>
                              handleToggleBooleanField(
                                product.id,
                                "showInStorefront",
                                product.showInStorefront
                              )
                            }
                            className="cursor-pointer"
                          />
                        </td>
                        <td
                          className="border border-gray-300 px-4 py-2 text-center cursor-pointer hover:bg-gray-100"
                          onClick={() =>
                            handleToggleBooleanField(
                              product.id,
                              "isOrganic",
                              product.isOrganic
                            )
                          }
                        >
                          <input
                            type="checkbox"
                            checked={product.isOrganic}
                            onChange={() =>
                              handleToggleBooleanField(
                                product.id,
                                "isOrganic",
                                product.isOrganic
                              )
                            }
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInlineEdit(product)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
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
        title={editingId ? "Edit Product" : "New Product"}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              {...register("name", { required: "Name is required" })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categories</label>
            <div className="space-y-2 mb-3 p-3 border rounded-lg bg-gray-50 max-h-48 overflow-y-auto">
              {categories.length === 0 ? (
                <p className="text-gray-500 text-sm">No categories yet</p>
              ) : (
                categories.map((cat) => (
                  <label key={cat.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      {...register("categoryIds")}
                      value={cat.id}
                      className="rounded"
                    />
                    <span>{cat.name}</span>
                  </label>
                ))
              )}
            </div>

            {!showNewCategoryInput && (
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowNewCategoryInput(true)}
                className="text-sm"
              >
                + Add New Category
              </Button>
            )}

            {showNewCategoryInput && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={categoryInputValue}
                  onChange={(e) => setCategoryInputValue(e.target.value)}
                  placeholder="Category name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddNewCategory();
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={handleAddNewCategory}
                  className="text-sm"
                >
                  Add
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setShowNewCategoryInput(false);
                    setCategoryInputValue("");
                  }}
                  className="text-sm"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("isOrganic")}
                className="rounded"
              />
              <span>Is Organic</span>
            </label>
          </div>
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register("showInStorefront")}
                className="rounded"
              />
              <span>Show in Storefront</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Unit of Measurement
            </label>
            <input
              {...register("unitOfMeasurement", {
                required: "Unit of measurement is required",
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.unitOfMeasurement && (
              <p className="text-red-500 text-sm mt-1">
                {errors.unitOfMeasurement.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Price Per Unit
            </label>
            <input
              type="number"
              step="0.01"
              {...register("pricePerUnit", {
                required: "Price per unit is required",
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.pricePerUnit && (
              <p className="text-red-500 text-sm mt-1">
                {errors.pricePerUnit.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Minimum Stock
            </label>
            <input
              type="number"
              {...register("minimumStock", {
                required: "Minimum stock is required",
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.minimumStock && (
              <p className="text-red-500 text-sm mt-1">
                {errors.minimumStock.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Source (Optional)
            </label>
            <select
              {...register("sourceId")}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            >
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
          setProducts([]);
          setLoading(true);
          loadData();
        }}
      />
    </main>
  );
}
