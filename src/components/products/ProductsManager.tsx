"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Input, ImportCsvButton, LoadingSkeleton } from "@/components";
import { BulkSelectionBanner } from "@/components/BulkSelectionBanner";
import { Column, TableHeader, TableEmpty } from "@/components/DataTable";
import { Product, Category, Source } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useApiWithToast } from "@/lib/useApiWithToast";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useInlineEdit } from "@/hooks/useInlineEdit";
import {
  ProductFormDialog,
  ProductFormInputs,
} from "./ProductFormDialog";
import { ProductRow, ProductEditData } from "./ProductRow";

const COLUMNS: Column[] = [
  { label: "Name", sortKey: "name" },
  { label: "Categories" },
  { label: "Unit", sortKey: "unitOfMeasurement" },
  { label: "Price", sortKey: "pricePerUnit" },
  { label: "Min Stock", sortKey: "minimumStock" },
  { label: "Source" },
  { label: "Storefront" },
  { label: "Organic" },
];

const DEFAULTS: ProductFormInputs = {
  name: "",
  sku: "",
  categoryIds: [],
  isOrganic: false,
  showInStorefront: true,
  unitOfMeasurement: "",
  pricePerUnit: "",
  minimumStock: "",
  sourceId: "",
};

export function ProductsManager({ storeId }: { storeId: number | null }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { fetchData } = useApiWithToast();
  const inline = useInlineEdit<Product>();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProductFormInputs>({ defaultValues: DEFAULTS });

  const reloadProducts = async () => {
    if (!storeId) return;
    const data = await fetchData<Product[]>(`/api/products?storeId=${storeId}`);
    if (data) setProducts(data);
  };

  const loadData = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }
    await Promise.all([
      reloadProducts(),
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
  }, [storeId]);

  const openDialog = (product?: Product) => {
    setEditingId(product?.id ?? null);
    reset(
      product
        ? {
            name: product.name,
            categoryIds: product.categories?.map((c) => c.id) || [],
            isOrganic: product.isOrganic,
            showInStorefront: product.showInStorefront,
            unitOfMeasurement: product.unitOfMeasurement,
            pricePerUnit: product.pricePerUnit.toString(),
            minimumStock: product.minimumStock.toString(),
            sourceId: product.sourceId?.toString() || "",
          }
        : DEFAULTS,
    );
    setDialogOpen(true);
  };

  const onSubmit = async (data: ProductFormInputs) => {
    const url = editingId ? `/api/products/${editingId}` : "/api/products";
    const result = await fetchData(
      url,
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          pricePerUnit: parseFloat(data.pricePerUnit),
          minimumStock: parseInt(data.minimumStock),
          sourceId: data.sourceId ? parseInt(data.sourceId) : undefined,
        }),
      },
      true,
      `Product ${editingId ? "updated" : "created"} successfully`,
    );
    if (result) {
      setDialogOpen(false);
      reset();
      reloadProducts();
    }
  };

  const startInlineEdit = (product: Product) =>
    inline.start(product, {
      categoryIds: product.categories?.map((c) => c.id) || [],
    } as ProductEditData);

  const saveInlineEdit = async (productId: number) => {
    const d = inline.data as ProductEditData | null;
    if (!d) return;
    const result = await fetchData(
      `/api/products/${productId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: d.name,
          sourceId: d.sourceId,
          unitOfMeasurement: d.unitOfMeasurement,
          pricePerUnit: d.pricePerUnit,
          minimumStock: d.minimumStock,
          showInStorefront: d.showInStorefront,
          isOrganic: d.isOrganic,
          categoryIds: d.categoryIds || [],
        }),
      },
      true,
      "Product updated successfully",
    );
    if (result) {
      inline.cancel();
      reloadProducts();
    }
  };

  const addInlineCategory = (categoryId: number) => {
    const d = inline.data as ProductEditData | null;
    const ids = d?.categoryIds || [];
    if (!ids.includes(categoryId))
      inline.update({ categoryIds: [...ids, categoryId] } as ProductEditData);
  };

  const removeInlineCategory = (categoryId: number) => {
    const d = inline.data as ProductEditData | null;
    inline.update({
      categoryIds: (d?.categoryIds || []).filter((id) => id !== categoryId),
    } as ProductEditData);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (res.ok) setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const toggleField = async (
    productId: number,
    field: "isOrganic" | "showInStorefront",
    current: boolean,
  ) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !current }),
      });
      if (res.ok)
        setProducts((prev) =>
          prev.map((p) => (p.id === productId ? { ...p, [field]: !current } : p)),
        );
    } catch (error) {
      console.error(`Error toggling ${field}:`, error);
    }
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const { sortedData, handleSort, getSortIndicator } = useSortableTable({
    data: filtered,
    defaultSortKey: "name",
    defaultDirection: "asc",
  });

  const selection = useBulkSelection(products);

  const bulkDelete = async () => {
    if (selection.count === 0) return;
    if (!confirm(`Delete ${selection.count} item${selection.count > 1 ? "s" : ""}?`))
      return;
    const ids = selection.selected;
    try {
      const res = await fetch(`/api/products`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed to delete products");
      setProducts((prev) => prev.filter((p) => !ids.includes(p.id)));
      selection.clear();
    } catch (error) {
      console.error("Error bulk deleting products:", error);
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Products</h1>
        <div className="flex gap-2">
          <ImportCsvButton
            storeId={storeId}
            onImportSuccess={() => {
              setProducts([]);
              setLoading(true);
              loadData();
            }}
          />
          <Button onClick={() => openDialog()}>+ New Product</Button>
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
              <TableEmpty colSpan={10}>
                {products.length === 0
                  ? "No products available"
                  : "No products match your search"}
              </TableEmpty>
            ) : (
              sortedData.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  categories={categories}
                  sources={sources}
                  selected={selection.isSelected(product.id)}
                  onToggleSelect={() => selection.toggle(product.id)}
                  isEditing={inline.isEditing(product.id)}
                  editData={inline.data as ProductEditData | null}
                  onChangeEdit={(patch) => inline.update(patch)}
                  onAddCategory={addInlineCategory}
                  onRemoveCategory={removeInlineCategory}
                  onSave={() => saveInlineEdit(product.id)}
                  onCancel={inline.cancel}
                  onStartEdit={() => startInlineEdit(product)}
                  onDelete={() => handleDelete(product.id)}
                  onToggleField={(field, current) =>
                    toggleField(product.id, field, current)
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingId !== null}
        categories={categories}
        sources={sources}
        register={register}
        errors={errors}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
        onCategoryCreated={(cat) => setCategories((prev) => [...prev, cat])}
      />
    </main>
  );
}
