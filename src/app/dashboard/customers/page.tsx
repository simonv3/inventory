"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Navbar, Button, Dialog, Input } from "@/components";
import { Customer, CustomerType } from "@/types";
import { useSortableTable } from "@/hooks/useSortableTable";
import { useApiWithToast } from "@/lib/useApiWithToast";

interface CustomerFormInputs {
  name: string;
  email: string;
  markupPercent: number;
  customerTypeId?: number;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customerTypes, setCustomerTypes] = useState<CustomerType[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<number | null>(null);
  const [inlineEditData, setInlineEditData] =
    useState<Partial<Customer> | null>(null);
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
      markupPercent: 5.0,
      customerTypeId: undefined,
    },
  });

  useEffect(() => {
    const loadData = async () => {
      const [types, customersList] = await Promise.all([
        fetchData<CustomerType[]>("/api/customer-types"),
        fetchData<Customer[]>("/api/customers"),
      ]);
      if (types) setCustomerTypes(types);
      if (customersList) setCustomers(customersList);
      setLoading(false);
    };

    loadData();
  }, []);

  const handleOpenDialog = (customer?: Customer) => {
    if (customer) {
      setEditingId(customer.id);
      reset({
        name: customer.name,
        email: customer.email,
        markupPercent: customer.markupPercent,
        customerTypeId: customer.customerTypeId,
      });
    } else {
      setEditingId(null);
      reset({
        name: "",
        email: "",
        markupPercent: 5.0,
        customerTypeId: undefined,
      });
    }
    setDialogOpen(true);
  };

  const onSubmit = async (data: CustomerFormInputs) => {
    const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
    const method = editingId ? "PUT" : "POST";

    const result = await fetchData(
      url,
      {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          markupPercent: data.markupPercent,
          customerTypeId: data.customerTypeId || null,
        }),
      },
      true,
      `Customer ${editingId ? "updated" : "created"} successfully`
    );

    if (result) {
      setDialogOpen(false);
      reset();
      const customersList = await fetchData<Customer[]>("/api/customers");
      if (customersList) setCustomers(customersList);
    }
  };

  const handleInlineEdit = (customer: Customer) => {
    setInlineEditingId(customer.id);
    setInlineEditData({ ...customer });
  };

  const handleInlineSave = async (customerId: number) => {
    if (!inlineEditData) return;

    const result = await fetchData(
      `/api/customers/${customerId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: inlineEditData.name,
          email: inlineEditData.email,
          markupPercent: inlineEditData.markupPercent,
          customerTypeId: inlineEditData.customerTypeId || null,
        }),
      },
      true,
      "Customer updated successfully"
    );

    if (result) {
      setInlineEditingId(null);
      setInlineEditData(null);
      const customersList = await fetchData<Customer[]>("/api/customers");
      if (customersList) setCustomers(customersList);
    }
  };

  const handleInlineCancel = () => {
    setInlineEditingId(null);
    setInlineEditData(null);
  };

  const handleDelete = async (id: number) => {
    if (confirm("Are you sure?")) {
      try {
        const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
        if (res.ok) {
          setCustomers((custs) => custs.filter((c) => c.id !== id));
        }
      } catch (error) {
        console.error("Error deleting customer:", error);
      }
    }
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const {
    sortedData: sortedCustomers,
    handleSort,
    getSortIndicator,
  } = useSortableTable({
    data: filteredCustomers,
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Customers</h1>
          <Button onClick={() => handleOpenDialog()}>+ New Customer</Button>
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
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                  Markup %
                </th>
                <th className="border border-gray-300 px-4 py-2 text-left font-semibold">
                  Customer Type
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
                    colSpan={6}
                    className="border border-gray-300 px-4 py-2 text-center text-gray-500"
                  >
                    {customers.length === 0
                      ? "No customers available"
                      : "No customers match your search"}
                  </td>
                </tr>
              ) : (
                sortedCustomers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    {inlineEditingId === customer.id && inlineEditData ? (
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
                          <input
                            type="email"
                            value={inlineEditData.email || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="number"
                            step="0.1"
                            value={inlineEditData.markupPercent || 5.0}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                markupPercent: parseFloat(e.target.value),
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <select
                            value={inlineEditData.customerTypeId || ""}
                            onChange={(e) =>
                              setInlineEditData({
                                ...inlineEditData,
                                customerTypeId: e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined,
                              })
                            }
                            className="w-full px-2 py-1 border rounded"
                          >
                            <option value="">-- Select Type --</option>
                            {customerTypes.map((type) => (
                              <option key={type.id} value={type.id}>
                                {type.name}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          {new Date(
                            (inlineEditData as Customer).createdAt
                          ).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleInlineSave(customer.id)}
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
                          {customer.name}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {customer.email}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {customer.markupPercent}%
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {customer.customerType?.name || "—"}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          {new Date(customer.createdAt).toLocaleDateString()}
                        </td>
                        <td className="border border-gray-300 px-4 py-2">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleInlineEdit(customer)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(customer.id)}
                              className="text-red-600 hover:text-red-800 font-medium"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
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
                <p className="text-red-500 text-sm mt-1">
                  {errors.name.message}
                </p>
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
            <div>
              <label className="block text-sm font-medium mb-1">
                Markup Percentage (%)
              </label>
              <input
                type="number"
                step="0.1"
                {...register("markupPercent", {
                  required: "Markup percentage is required",
                  min: {
                    value: 0,
                    message: "Markup percentage must be 0 or greater",
                  },
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              />
              {errors.markupPercent && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.markupPercent.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Customer Type
              </label>
              <select
                {...register("customerTypeId")}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="">-- Select Customer Type --</option>
                {customerTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
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
      </main>
    </div>
  );
}
