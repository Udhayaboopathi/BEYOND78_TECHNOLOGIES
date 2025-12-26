import React, { useState } from "react";
import { Button, CircularProgress } from "@mui/material";
import { Download } from "@mui/icons-material";

function ExportButton({ onExport, label, ...props }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await onExport();

      // Create blob and download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${label.toLowerCase().replace(/\s+/g, "_")}_export.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <Button
      variant="outlined"
      color="primary"
      startIcon={exporting ? <CircularProgress size={16} /> : <Download />}
      onClick={handleExport}
      disabled={exporting}
      {...props}
    >
      {exporting ? "Exporting..." : label}
    </Button>
  );
}

export default ExportButton;
