"use client";

interface StoreRowProps {
  name: string;
  createdAt: string;
  isCurrent: boolean;
  isEditing: boolean;
  editName: string;
  onEditNameChange: (name: string) => void;
  onStartEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function StoreRow({
  name,
  createdAt,
  isCurrent,
  isEditing,
  editName,
  onEditNameChange,
  onStartEdit,
  onSave,
  onCancel,
  onDelete,
}: StoreRowProps) {
  return (
    <tr className="hover:bg-base-200">
      <td className="px-6 py-4">
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => onEditNameChange(e.target.value)}
            className="input"
            autoFocus
          />
        ) : (
          <span className="font-medium">
            {name}
            {isCurrent && (
              <span className="ml-2 badge badge-primary badge-sm">
                Current
              </span>
            )}
          </span>
        )}
      </td>
      <td className="px-6 py-4 text-sm text-base-content/60">
        {new Date(createdAt).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 text-sm space-x-3 flex gap-2">
        {isEditing ? (
          <>
            <button
              onClick={onSave}
              className="btn btn-link btn-xs text-primary px-0"
            >
              Save
            </button>
            <button
              onClick={onCancel}
              className="btn btn-link btn-xs px-0"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onStartEdit}
              className="btn btn-link btn-xs text-primary px-0"
            >
              Edit
            </button>
            <button
              onClick={onDelete}
              disabled={isCurrent}
              className="btn btn-link btn-xs text-error px-0"
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
}
