"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Button,
  Dialog,
  Input,
  ImportCsvButton,
  LoadingSkeleton,
} from "@/components";
import { CustomerRow } from "@/components/CustomerRow";
import { Customer } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useApiWithToast } from "@/lib/useApiWithToast";
import { useAuth } from "@/context/AuthContext";
import { useParams } from "next/navigation";
import Link from "next/link";

interface CustomerFormInputs {
  name: string;
  email: string;
}

export default function CustomersPage() {
  const { customer } = useAuth();
  const params = useParams();
  const storeId = parseInt(params.storeId as string);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<number>>(
    new Set(),
  );
  const { fetchData } = useApiWithToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CustomerFormInputs>({
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const loadData = async () => {
    if (!storeId) {
      setLoading(false);
      return;
    }

    const customersList = await fetchData<Customer[]>(
      `/api/customers?storeId=${storeId}`,
    );
    if (customersList) setCustomers(customersList);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId]);

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      reset({
        name: customer.name,
        email: customer.email,
      });
    } else {
      setEditingId(null);
      reset({
        name: "",
        email: "",
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: CustomerFormInputs) => {
    const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
    const method = editingId ? "PUT" : "POST";

    const body: any = {
      name: data.name,
      email: data.email,
    };

    // Add storeId for new customers
    if (!editingId && storeId) {
      body.storeId = storeId;
    }

    const result = await fetchData(
      url,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
      true,
      `Customer ${editingId ? "updated" : "created"} successfully`,
    );

    if (result) {
      setDialogOpen(false);
      reset();
      const customersList = await fetchData<Customer[]>(
        `/api/customers?storeId=${storeId}`,
      );
      if (customersList) setCustomers(customersList);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCustomerIds.size === 0) return;

    if (
      confirm(
        `Are you sure you want to delete ${selectedCustomerIds.size} customer(s)?`,
      )
    ) {
      const result = await fetchData(
        "/api/customers",
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: Array.from(selectedCustomerIds) }),
        },
        true,
        `${selectedCustomerIds.size} customer(s) deleted successfully`,
      );

      if (result) {
        setCustomers((custs) =>
          custs.filter((c) => !selectedCustomerIds.has(c.id)),
        );
        setSelectedCustomerIds(new Set());
      }
    }
  };

  const toggleSelectCustomer = (id: number) => {
    const newSelected = new Set(selectedCustomerIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedCustomerIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedCustomerIds.size === sortedCustomers.length) {
      setSelectedCustomerIds(new Set());
    } else {
      setSelectedCustomerIds(new Set(sortedCustomers.map((c) => c.id)));
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const {
    sortedData: sortedCustomers,
    handleSort,
    getSortIndicator,
  } = useSortableTable({
    data: filteredCustomers,
    defaultSortKey: "name",
    defaultDirection: "asc",
  });

  if (loading) return <LoadingSkeleton />;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Customers</h1>
          {customer?.isAdmin && (
            <Link
              href="/admin/customers"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              View All Customers
            </Link>
          )}
        </div>
        <div className="flex gap-2">
          {selectedCustomerIds.size > 0 && (
            <Button
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete Selected ({selectedCustomerIds.size})
            </Button>
          )}
          <ImportCsvButton
            storeId={storeId}
            onImportSuccess={() => {
              setCustomers([]);
              setLoading(true);
              loadData();
            }}
          />
          <Button onClick={() => handleOpenDialog()}>+ New Customer</Button>
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
        <table className="w-full border-collapse border border-gray-300">
          <thead className="bg-gray-100">
            <tr>
              <th className="border border-gray-300 px-4 py-2 text-center font-semibold w-12">
                <input
                  type="checkbox"
                  checked={
                    selectedCustomerIds.size === sortedCustomers.length &&
                    sortedCustomers.length > 0
                  }
                  onChange={toggleSelectAll}
                  className="cursor-pointer"
                />
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("name")}
              >
                Name{getSortIndicator("name")}
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("email")}
              >
                Email{getSortIndicator("email")}
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200">
                Is Admin
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200">
                Is Store Manager
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Markup %
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Stores
              </th>
              <th
                className="border border-gray-300 px-4 py-2 text-left font-semibold cursor-pointer hover:bg-gray-200"
                onClick={() => handleSort("createdAt")}
              >
                Created{getSortIndicator("createdAt")}
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedCustomers.length === 0 ? (
              <tr>
                <td
                  colSpan={9}
                  className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                >
                  {customers.length === 0
                    ? "No customers available"
                    : "No customers match your search"}
                </td>
              </tr>
            ) : (
              sortedCustomers.map((customer) => (
                <CustomerRow
                  key={customer.id}
                  customer={customer}
                  selectedCustomerIds={selectedCustomerIds}
                  toggleSelectCustomer={toggleSelectCustomer}
                  setCustomers={setCustomers}
                  currentStoreId={storeId}
                  fetchData={fetchData}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editingId ? "Edit Customer" : "New Customer"}
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
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button type="submit">Save</Button>
            <Button variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Dialog>
    </main>
  );
}
