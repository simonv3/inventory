import { useState } from "react";
import { Customer } from "@/types";

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
    message?: string
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

  const handleInlineEdit = (customer: Customer) => {
    setIsEditing(true);
    setEditData({ ...customer });
  };

  const handleInlineSave = async (customerId: number) => {
    if (!editData) return;

    // Save customer name/email
    const result = await fetchData(
      `/api/customers/${customerId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editData.name,
          email: editData.email,
        }),
      },
      true,
      "Customer updated successfully"
    );

    // Save markup percentage if current store is selected
    if (result && currentStoreId && editData.stores) {
      const customerStore = editData.stores.find(
        (cs) => cs.storeId === currentStoreId
      );
      if (customerStore) {
        await fetchData(
          `/api/customers/${customerId}/stores/${currentStoreId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              markupPercent: customerStore.markupPercent,
            }),
          },
          false
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

  const handleInlineCancel = () => {
    setIsEditing(false);
    setEditData(null);
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

  const handleToggleStoreManager = async (
    customerId: number,
    storeId: number,
    isManager: boolean
  ) => {
    try {
      const res = await fetch(
        `/api/customers/${customerId}/stores/${storeId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ storeManager: isManager }),
        }
      );

      if (res.ok) {
        // Update the customer in the list
        setCustomers((custs) =>
          custs.map((c) => {
            if (c.id === customerId) {
              return {
                ...c,
                stores: c.stores?.map((cs) => {
                  if (cs.storeId === storeId) {
                    return { ...cs, storeManager: isManager };
                  }
                  return cs;
                }),
              };
            }
            return c;
          })
        );
      } else {
        alert("Failed to update store manager status");
      }
    } catch (error) {
      console.error("Error updating store manager:", error);
      alert("Error updating store manager");
    }
  };

  return (
    <tr key={customer.id} className="hover:bg-gray-50">
      <td className="border border-gray-300 px-4 py-2 text-center">
        <input
          type="checkbox"
          checked={selectedCustomerIds.has(customer.id)}
          onChange={() => toggleSelectCustomer(customer.id)}
          className="cursor-pointer"
        />
      </td>
      {isEditing && editData ? (
        <>
          <td className="border border-gray-300 px-2 py-1">
            <input
              type="text"
              value={editData.name || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  name: e.target.value,
                })
              }
              className="w-full px-2 py-1 border rounded"
            />
          </td>
          <td className="border border-gray-300 px-2 py-1">
            <input
              type="email"
              value={editData.email || ""}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  email: e.target.value,
                })
              }
              className="w-full px-2 py-1 border rounded"
            />
          </td>
          <td className="border border-gray-300 px-2 py-1">
            {customer.isAdmin ? "Yes" : "No"}
          </td>
          <td className="border border-gray-300 px-2 py-1">
            {currentStoreId ? (
              <button
                onClick={() => {
                  const currentIsManager = customer.stores?.find(
                    (cs) => cs.storeId === currentStoreId
                  )?.storeManager;
                  handleToggleStoreManager(
                    customer.id,
                    currentStoreId,
                    !currentIsManager
                  );
                }}
                className={`px-2 py-1 rounded text-sm font-medium transition ${
                  customer.stores?.find((cs) => cs.storeId === currentStoreId)
                    ?.storeManager
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
              >
                {customer.stores?.find((cs) => cs.storeId === currentStoreId)
                  ?.storeManager
                  ? "Manager"
                  : "Set Manager"}
              </button>
            ) : (
              <span>
                {customer.stores?.some((cs) => cs.storeManager) ? "Yes" : "No"}
              </span>
            )}
          </td>
          <td className="border border-gray-300 px-2 py-1">
            {currentStoreId ? (
              <input
                type="number"
                step="0.01"
                value={
                  editData.stores?.find((cs) => cs.storeId === currentStoreId)
                    ?.markupPercent || 0
                }
                onChange={(e) => {
                  const newStores =
                    editData.stores?.map((cs) => {
                      if (cs.storeId === currentStoreId) {
                        return {
                          ...cs,
                          markupPercent: parseFloat(e.target.value) || 0,
                        };
                      }
                      return cs;
                    }) || [];
                  setEditData({
                    ...editData,
                    stores: newStores,
                  });
                }}
                className="w-full px-2 py-1 border rounded"
              />
            ) : (
              <span>—</span>
            )}
          </td>
          <td className="border border-gray-300 px-2 py-1">
            {customer.stores && customer.stores.length > 0
              ? customer.stores.map((cs) => cs.store?.name).join(", ")
              : "—"}
          </td>
          <td className="border border-gray-300 px-2 py-1">
            {new Date((editData as Customer).createdAt).toLocaleDateString()}
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
          <td className="border border-gray-300 px-4 py-2">{customer.name}</td>
          <td className="border border-gray-300 px-4 py-2">{customer.email}</td>
          <td className="border border-gray-300 px-4 py-2">
            {customer.isAdmin ? "Yes" : "No"}
          </td>
          <td className="border border-gray-300 px-4 py-2">
            {currentStoreId ? (
              <button
                onClick={() => {
                  const currentIsManager = customer.stores?.find(
                    (cs) => cs.storeId === currentStoreId
                  )?.storeManager;
                  handleToggleStoreManager(
                    customer.id,
                    currentStoreId,
                    !currentIsManager
                  );
                }}
                className={`px-2 py-1 rounded text-sm font-medium transition ${
                  customer.stores?.find((cs) => cs.storeId === currentStoreId)
                    ?.storeManager
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                }`}
              >
                {customer.stores?.find((cs) => cs.storeId === currentStoreId)
                  ?.storeManager
                  ? "Manager"
                  : "Set Manager"}
              </button>
            ) : (
              <span>
                {customer.stores?.some((cs) => cs.storeManager) ? "Yes" : "No"}
              </span>
            )}
          </td>{" "}
          <td className="border border-gray-300 px-4 py-2">
            {currentStoreId
              ? customer.stores?.find((cs) => cs.storeId === currentStoreId)
                  ?.markupPercent ?? "—"
              : "—"}
          </td>
          <td className="border border-gray-300 px-4 py-2">
            {customer.stores && customer.stores.length > 0
              ? customer.stores.map((cs) => cs.store?.name).join(", ")
              : "—"}
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
  );
}
