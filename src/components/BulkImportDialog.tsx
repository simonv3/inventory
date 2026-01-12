"use client";

import { useState, useRef } from "react";
import { Dialog } from "@/components";
import { useToast } from "@/lib/useToast";

interface BulkImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId: number | null;
  onImportSuccess?: () => void;
}

interface ImportResult {
  type: string;
  success: number;
  failed: number;
  errors: Array<{ row: number; error?: string }>;
}

export default function BulkImportDialog({
  open,
  onOpenChange,
  storeId,
  onImportSuccess,
}: BulkImportDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        toast.error("Please select a CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file");
      return;
    }

    if (!storeId) {
      toast.error("Please select a store first");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("storeId", storeId.toString());

      const res = await fetch("/api/import/csv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Import failed");
        return;
      }

      const data = await res.json();
      setResult(data);
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success(`${data.success} records imported successfully`);

      if (onImportSuccess) {
        onImportSuccess();
      }

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onOpenChange(false);
      }, 1000);
    } catch (err) {
      toast.error((err as Error).message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Bulk Import Data">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Upload a CSV file to import records. The system will automatically
          detect the data type based on column names.
        </p>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
            id="bulk-import-file"
          />
          <label htmlFor="bulk-import-file" className="cursor-pointer">
            <div className="text-gray-600">
              {file ? (
                <div>
                  <p className="font-semibold text-blue-600">{file.name}</p>
                  <p className="text-sm text-gray-500">
                    ({(file.size / 1024).toFixed(2)} KB)
                  </p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold">Click to select a CSV file</p>
                  <p className="text-sm text-gray-500">or drag and drop</p>
                </div>
              )}
            </div>
          </label>
        </div>

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="font-semibold text-green-800 mb-2">
              Import completed ({result.type})
            </p>
            <p className="text-green-700 mb-2">
              ✓ {result.success} records imported successfully
            </p>
            {result.failed > 0 && (
              <div className="mt-3">
                <p className="text-red-700 mb-2">
                  ✗ {result.failed} records failed:
                </p>
                <ul className="text-sm text-red-600 space-y-1 max-h-48 overflow-y-auto">
                  {result.errors.map(
                    (err: { row: number; error?: string }, idx: number) => (
                      <li key={idx}>
                        Row {err.row}: {err.error}
                      </li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 justify-end">
          <button
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Importing..." : "Import"}
          </button>
        </div>
      </div>
    </Dialog>
  );
}
