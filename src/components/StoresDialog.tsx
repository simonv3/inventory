"use client";

import { useEffect, useState } from "react";
import { Customer, Store } from "@/types";
import { useToast } from "@/lib/useToast";

interface StoresDialogProps {
  customer: Customer;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCustomer: Customer) => void;
}

export function StoresDialog({
  customer,
  isOpen,
  onClose,
  onUpdate,
}: StoresDialogProps) {
  const [allStores, setAllStores] = useState<Store[]>([]);
  const [selectedStores, setSelectedStores] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadStores();
      // Initialize selected stores
      const storeIds = new Set(customer.stores?.map((cs) => cs.storeId) || []);
      setSelectedStores(storeIds);
    }
  }, [isOpen, customer]);

  const loadStores = async () => {
    try {
      const res = await fetch("/api/stores", { credentials: "include" });
      if (res.ok) {
        const stores = await res.json();
        setAllStores(stores);
      }
    } catch (error) {
      console.error("Error loading stores:", error);
      showError("Failed to load stores");
    }
  };

  const handleToggleStore = (storeId: number) => {
    const newSelected = new Set(selectedStores);
    if (newSelected.has(storeId)) {
      newSelected.delete(storeId);
    } else {
      newSelected.add(storeId);
    }
    setSelectedStores(newSelected);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const currentStoreIds = new Set(
        customer.stores?.map((cs) => cs.storeId) || []
      );

      // Find stores to add and remove
      const storesToAdd = Array.from(selectedStores).filter(
        (id) => !currentStoreIds.has(id)
      );
      const storesToRemove = Array.from(currentStoreIds).filter(
        (id) => !selectedStores.has(id)
      );

      // Add new stores
      for (const storeId of storesToAdd) {
        const res = await fetch(
          `/api/customers/${customer.id}/stores`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ storeId }),
            credentials: "include",
          }
        );
        if (!res.ok) {
          throw new Error(`Failed to add store ${storeId}`);
        }
      }

      // Remove stores
      for (const storeId of storesToRemove) {
        const res = await fetch(
          `/api/customers/${customer.id}/stores/${storeId}`,
          {
            method: "DELETE",
            credentials: "include",
          }
        );
        if (!res.ok) {
          throw new Error(`Failed to remove store ${storeId}`);
        }
      }

      // Fetch updated customer
      const res = await fetch(`/api/customers/${customer.id}`, {
        credentials: "include",
      });
      if (res.ok) {
        const updatedCustomer = await res.json();
        onUpdate(updatedCustomer);
        success("Stores updated successfully");
        onClose();
      }
    } catch (error) {
      console.error("Error updating stores:", error);
      showError(
        error instanceof Error ? error.message : "Failed to update stores"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold">
            Manage Stores for {customer.name}
          </h2>
        </div>

        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {allStores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No stores available</p>
          ) : (
            <div className="space-y-3">
              {allStores.map((store) => (
                <label key={store.id} className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={selectedStores.has(store.id)}
                    onChange={() => handleToggleStore(store.id)}
                    disabled={loading}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <span className="text-gray-700">{store.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 px-6 py-4 flex gap-2 justify-end">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded hover:bg-gray-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
