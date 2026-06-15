"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/UI";
import { AdminOnlyGuard } from "@/components/AdminOnlyGuard";
import { AddStoreForm } from "@/components/stores/AddStoreForm";
import { StoreRow } from "@/components/stores/StoreRow";
import { useStore } from "@/context/StoreContext";

interface Store {
  id: number;
  name: string;
  createdAt: string;
}

function StoresPageContent() {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingStore, setIsAddingStore] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const { currentStoreId } = useStore();

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const response = await fetch("/api/stores", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setStores(data);
      }
    } catch (err) {
      setError("Failed to fetch stores");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      setError("Store name is required");
      return;
    }

    try {
      const response = await fetch("/api/stores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: newStoreName }),
      });

      if (response.ok) {
        setSuccess("Store created successfully");
        setNewStoreName("");
        setIsAddingStore(false);
        setError("");
        await fetchStores();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create store");
      }
    } catch (err) {
      setError("Failed to create store");
      console.error(err);
    }
  };

  const handleUpdateStore = async (id: number) => {
    if (!editName.trim()) {
      setError("Store name is required");
      return;
    }

    try {
      const response = await fetch(`/api/stores/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: editName }),
      });

      if (response.ok) {
        setSuccess("Store updated successfully");
        setEditingId(null);
        setEditName("");
        setError("");
        await fetchStores();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to update store");
      }
    } catch (err) {
      setError("Failed to update store");
      console.error(err);
    }
  };

  const handleDeleteStore = async (id: number) => {
    if (currentStoreId === id) {
      setError("Cannot delete the currently selected store");
      return;
    }

    if (!confirm("Are you sure you want to delete this store?")) {
      return;
    }

    try {
      const response = await fetch(`/api/stores/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setSuccess("Store deleted successfully");
        setError("");
        await fetchStores();
      } else {
        const data = await response.json();
        setError(data.error || "Failed to delete store");
      }
    } catch (err) {
      setError("Failed to delete store");
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        Loading...
      </div>
    );
  }

  const content = (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Store Management</h1>
        {!isAddingStore && (
          <Button onClick={() => setIsAddingStore(true)}>Add Store</Button>
        )}
      </div>

      {error && (
        <div className="alert alert-error mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          {success}
        </div>
      )}

      {isAddingStore && (
        <AddStoreForm
          name={newStoreName}
          onNameChange={setNewStoreName}
          onSubmit={handleAddStore}
          onCancel={() => setIsAddingStore(false)}
        />
      )}

      <div className="card bg-base-100 shadow overflow-hidden">
        <table className="table">
          <thead>
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Store Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Created
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <StoreRow
                key={store.id}
                name={store.name}
                createdAt={store.createdAt}
                isCurrent={currentStoreId === store.id}
                isEditing={editingId === store.id}
                editName={editName}
                onEditNameChange={setEditName}
                onStartEdit={() => {
                  setEditingId(store.id);
                  setEditName(store.name);
                }}
                onSave={() => handleUpdateStore(store.id)}
                onCancel={() => setEditingId(null)}
                onDelete={() => handleDeleteStore(store.id)}
              />
            ))}
          </tbody>
        </table>

        {stores.length === 0 && (
          <div className="p-8 text-center text-base-content/60">
            No stores found. Create one to get started.
          </div>
        )}
      </div>
    </main>
  );

  return <AdminOnlyGuard>{content}</AdminOnlyGuard>;
}

export default function StoresPage() {
  return <StoresPageContent />;
}
