"use client";

import { Button } from "@/components";

interface AddStoreFormProps {
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

export function AddStoreForm({
  name,
  onNameChange,
  onSubmit,
  onCancel,
}: AddStoreFormProps) {
  return (
    <div className="card bg-base-100 shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">Create New Store</h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Store Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Enter store name"
            className="input w-full"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <Button type="submit">Create Store</Button>
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-neutral btn-outline"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
