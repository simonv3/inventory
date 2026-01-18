"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/UI";
import { AdminOnlyGuard } from "@/components/AdminOnlyGuard";
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
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded text-green-700">
          {success}
        </div>
      )}

      {isAddingStore && (
        <div className="mb-8 p-6 bg-white rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Create New Store</h2>
          <form onSubmit={handleAddStore} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Store Name
              </label>
              <input
                type="text"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                placeholder="Enter store name"
                className="w-full px-3 py-2 border border-gray-300 rounded"
                autoFocus
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit">Create Store</Button>
              <button
                type="button"
                onClick={() => setIsAddingStore(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Store Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Created
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {stores.map((store) => (
              <tr key={store.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  {editingId === store.id ? (
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded"
                      autoFocus
                    />
                  ) : (
                    <span className="font-medium">
                      {store.name}
                      {currentStoreId === store.id && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                          Current
                        </span>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {new Date(store.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm space-x-3 flex gap-2">
                  {editingId === store.id ? (
                    <>
                      <button
                        onClick={() => handleUpdateStore(store.id)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="text-gray-600 hover:text-gray-700 font-medium"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          setEditingId(store.id);
                          setEditName(store.name);
                        }}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteStore(store.id)}
                        disabled={currentStoreId === store.id}
                        className={`font-medium ${
                          currentStoreId === store.id
                            ? "text-gray-400 cursor-not-allowed"
                            : "text-red-600 hover:text-red-700"
                        }`}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {stores.length === 0 && (
          <div className="p-8 text-center text-gray-500">
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
