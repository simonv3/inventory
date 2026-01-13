"use client";

import { useState } from "react";
import { Button } from "@/components";
import BulkImportDialog from "@/components/BulkImportDialog";
import { useAuth } from "@/context/AuthContext";

interface ImportCsvButtonProps {
  storeId: number | null;
  onImportSuccess?: () => void;
}

export function ImportCsvButton({
  storeId,
  onImportSuccess,
}: ImportCsvButtonProps) {
  const { customer } = useAuth();
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Only show button for admins
  if (!customer?.isAdmin) {
    return null;
  }

  return (
    <>
      <Button
        onClick={() => setImportDialogOpen(true)}
        className="bg-green-600 hover:bg-green-700"
      >
        Import CSV
      </Button>
      <BulkImportDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
        storeId={storeId}
        onImportSuccess={onImportSuccess}
      />
    </>
  );
}
