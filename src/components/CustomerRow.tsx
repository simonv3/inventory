"use client";

import { useState } from "react";
import { Customer } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { StoresDialog } from "./StoresDialog";
import { CustomerEditCells } from "./customers/CustomerEditCells";
import { CustomerViewCells } from "./customers/CustomerViewCells";

interface CustomerRowProps {
  customer: Customer;
  selectedCustomerIds: Set<number>;
  toggleSelectCustomer: (id: number) => void;
  setCustomers: (updater: (custs: Customer[]) => Customer[]) => void;
  currentStoreId?: number | null;
  fetchData: (
    url: string,
    options?: RequestInit,
    showToast?: boolean,
    message?: string,
  ) => Promise<Customer[] | any>;
}

export function CustomerRow({
  customer,
  selectedCustomerIds,
  toggleSelectCustomer,
  setCustomers,
  currentStoreId,
  fetchData,
}: CustomerRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Customer> | null>(null);
  const [isStoresDialogOpen, setIsStoresDialogOpen] = useState(false);
  const { customer: authCustomer } = useAuth();
  const router = useRouter();

  const handleInlineSave = async (customerId: number) => {
    if (!editData) return;

    const result = await fetchData(
      `/api/customers/${customerId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editData.name, email: editData.email }),
      },
      true,
      "Customer updated successfully",
    );

    // Persist the per-store markup when a store is in context.
    if (result && currentStoreId && editData.stores) {
      const customerStore = editData.stores.find(
        (cs) => cs.storeId === currentStoreId,
      );
      if (customerStore) {
        await fetchData(
          `/api/customers/${customerId}/stores/${currentStoreId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markupPercent: customerStore.markupPercent }),
          },
          false,
        );
      }
    }

    if (result) {
      setEditData(null);
      setIsEditing(false);
      const customersList = await fetchData("/api/customers");
      if (customersList) setCustomers(() => customersList);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure?")) return;
    try {
      const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
      if (res.ok) setCustomers((custs) => custs.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Error deleting customer:", error);
    }
  };

  const handleLoginAs = async (customerId: number) => {
    try {
      const res = await fetch("/api/auth/login-as", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId }),
        credentials: "include",
      });
      if (res.ok) router.push("/customer/portal");
      else alert("Failed to login as customer");
    } catch (error) {
      console.error("Error logging in as customer:", error);
      alert("Error logging in as customer");
    }
  };

  const handleToggleStoreManager = async (
    storeId: number,
    isManager: boolean,
  ) => {
    try {
      const res = await fetch(`/api/customers/${customer.id}/stores/${storeId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeManager: isManager }),
      });
      if (res.ok) {
        setCustomers((custs) =>
          custs.map((c) =>
            c.id === customer.id
              ? {
                  ...c,
                  stores: c.stores?.map((cs) =>
                    cs.storeId === storeId
                      ? { ...cs, storeManager: isManager }
                      : cs,
                  ),
                }
              : c,
          ),
        );
      } else {
        alert("Failed to update store manager status");
      }
    } catch (error) {
      console.error("Error updating store manager:", error);
      alert("Error updating store manager");
    }
  };

  const handleUpdateCustomerStores = (updatedCustomer: Customer) => {
    setCustomers((custs) =>
      custs.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)),
    );
  };

  return (
    <tr className="hover:bg-base-200">
      <td className="border border-base-300 px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={selectedCustomerIds.has(customer.id)}
          onChange={() => toggleSelectCustomer(customer.id)}
          className="checkbox checkbox-sm"
        />
      </td>
      {isEditing && editData ? (
        <CustomerEditCells
          customer={customer}
          editData={editData}
          setEditData={setEditData}
          currentStoreId={currentStoreId}
          onToggleManager={handleToggleStoreManager}
          onSave={() => handleInlineSave(customer.id)}
          onCancel={() => {
            setIsEditing(false);
            setEditData(null);
          }}
        />
      ) : (
        <CustomerViewCells
          customer={customer}
          currentStoreId={currentStoreId}
          canImpersonate={!!authCustomer?.isAdmin}
          onEmailClick={() =>
            router.push(`/admin/sales?customerId=${customer.id}`)
          }
          onToggleManager={handleToggleStoreManager}
          onEdit={() => {
            setIsEditing(true);
            setEditData({ ...customer });
          }}
          onStores={() => setIsStoresDialogOpen(true)}
          onLoginAs={() => handleLoginAs(customer.id)}
          onDelete={() => handleDelete(customer.id)}
        />
      )}
      <StoresDialog
        customer={customer}
        isOpen={isStoresDialogOpen}
        onClose={() => setIsStoresDialogOpen(false)}
        onUpdate={handleUpdateCustomerStores}
      />
    </tr>
  );
}
