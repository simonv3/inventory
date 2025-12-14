"use client";

import { useState, useRef } from "react";
import { Navbar, Button } from "@/components";

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.endsWith(".csv")) {
        setError("Please select a CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError("");
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/import/csv", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Import failed");
      } else {
        const data = await res.json();
        setResult(data);
        setFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (err) {
      setError((err as Error).message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-6">Import Data</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">CSV Import</h2>

          <p className="text-gray-600 mb-4">
            Upload a CSV file to import products, customers, sources, or
            inventory received. The system will automatically detect the data
            type based on column names.
          </p>

          <div className="mb-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-input"
              />
              <label htmlFor="csv-input" className="cursor-pointer">
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
                      <p className="font-semibold">
                        Click to select a CSV file
                      </p>
                      <p className="text-sm text-gray-500">or drag and drop</p>
                    </div>
                  )}
                </div>
              </label>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-red-800">{error}</p>
            </div>
          )}

          {result && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
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
                      (err: { row: number; error: string }, idx: number) => (
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

          <Button
            onClick={handleImport}
            disabled={!file || loading}
            className="w-full"
          >
            {loading ? "Importing..." : "Import CSV"}
          </Button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">CSV Format Examples</h3>

          <div className="space-y-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Products</h4>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`Product	Category	Show in store	Unit	Price per unit	Minimum to stock	Source
Organic Milk	Dairy	true	lbs	3.99	10	Frankferd Farms
Fresh Apples	Produce	true	lbs	1.50	50	Frontier Co-op
Cheese	Dairy	true	lbs	8.99	5	Costco`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Customers</h4>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`Name and Surname,Email
John Smith,john@example.com
Jane Doe,jane@example.com
Acme Corp,contact@acme.com`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Sources</h4>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`Source Name
Frankferd Farms
Frontier Co-op
Costco`}
              </pre>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">
                Inventory Received
              </h4>
              <pre className="bg-gray-900 text-gray-100 p-3 rounded text-sm overflow-x-auto">
                {`Product,Quantity,Date Received,Receipt Info
Organic Milk,50,2025-12-10,Delivery from supplier
Fresh Apples,100,2025-12-09,Farmers market order
Cheese,20,2025-12-08,Costco bulk purchase
Bread,75,2025-12-10,Local bakery`}
              </pre>
            </div>
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The import system auto-detects the data
              type based on column names. Use the column names shown above for
              best results.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
