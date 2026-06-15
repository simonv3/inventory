"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { Button, Input, ImportCsvButton, LoadingSkeleton } from "@/components";
import { Column, TableHeader, TableEmpty } from "@/components/DataTable";
import { CustomerRow } from "@/components/CustomerRow";
import { Customer } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useApiWithToast } from "@/lib/useApiWithToast";
import { useBulkSelection } from "@/hooks/useBulkSelection";
import { useAuth } from "@/context/AuthContext";
import {
  CustomerFormDialog,
  CustomerFormInputs,
} from "./CustomerFormDialog";

const COLUMNS: Column[] = [
  { label: "Name", sortKey: "name" },
  { label: "Email", sortKey: "email" },
  { label: "Is Admin" },
  { label: "Is Store Manager" },
  { label: "Markup %" },
  { label: "Stores" },
  { label: "Created", sortKey: "createdAt" },
];

export function CustomersManager({ storeId }: { storeId: number | null }) {
  const { customer: authCustomer } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { fetchData } = useApiWithToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormInputs>({ defaultValues: { name: "", email: "" } });

  const customersUrl = storeId
    ? `/api/customers?storeId=${storeId}`
    : "/api/customers";

  const loadData = async () => {
    const list = await fetchData<Customer[]>(customersUrl);
    if (list) setCustomers(list);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const openDialog = (customer?: Customer) => {
    setEditingId(customer?.id ?? null);
    reset(
      customer
        ? { name: customer.name, email: customer.email }
        : { name: "", email: "" },
    );
    setDialogOpen(true);
  };

  const onSubmit = async (data: CustomerFormInputs) => {
    const body: Record<string, unknown> = {
      name: data.name,
      email: data.email,
    };
    if (!editingId && storeId) body.storeId = storeId;

    const result = await fetchData(
      editingId ? `/api/customers/${editingId}` : "/api/customers",
      {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      true,
      `Customer ${editingId ? "updated" : "created"} successfully`,
    );
    if (result) {
      setDialogOpen(false);
      reset();
      loadData();
    }
  };

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );
  const { sortedData, handleSort, getSortIndicator } = useSortableTable({
    data: filtered,
    defaultSortKey: "name",
    defaultDirection: "asc",
  });

  const selection = useBulkSelection(sortedData);

  const bulkDelete = async () => {
    if (selection.count === 0) return;
    if (
      !confirm(
        `Are you sure you want to delete ${selection.count} customer(s)?`,
      )
    )
      return;
    const ids = selection.selected;
    const result = await fetchData(
      "/api/customers",
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      },
      true,
      `${ids.length} customer(s) deleted successfully`,
    );
    if (result) {
      setCustomers((custs) => custs.filter((c) => !ids.includes(c.id)));
      selection.clear();
    }
  };

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Customers</h1>
          {storeId && authCustomer?.isAdmin && (
            <Link
              href="/admin/customers"
              className="btn btn-link btn-sm text-primary px-0"
            >
              View All Customers
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          {selection.count > 0 && (
            <Button onClick={bulkDelete} variant="danger">
              Delete Selected ({selection.count})
            </Button>
          )}
          {storeId && (
            <ImportCsvButton
              storeId={storeId}
              onImportSuccess={() => {
                setCustomers([]);
                setLoading(true);
                loadData();
              }}
            />
          )}
          <Button onClick={() => openDialog()}>+ New Customer</Button>
        </div>
      </div>

      <div className="mb-6">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-base-300">
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
              <TableEmpty colSpan={9}>
                {customers.length === 0
                  ? "No customers available"
                  : "No customers match your search"}
              </TableEmpty>
            ) : (
              sortedData.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  selectedCustomerIds={selection.selectedIds}
                  toggleSelectCustomer={selection.toggle}
                  setCustomers={setCustomers}
                  currentStoreId={storeId}
                  fetchData={fetchData}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <CustomerFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editing={editingId !== null}
        register={register}
        errors={errors}
        handleSubmit={handleSubmit}
        onSubmit={onSubmit}
      />
    </main>
  );
}
