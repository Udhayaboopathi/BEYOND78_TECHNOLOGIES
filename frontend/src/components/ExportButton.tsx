import { useState } from "react";
import { Button, Spinner } from "@patternfly/react-core";
import { DownloadIcon } from "@patternfly/react-icons";
import { ExportButtonProps } from "../types";

const ExportButton: React.FC<ExportButtonProps> = ({ onExport, label = "Export" }) => {
  const [exporting, setExporting] = useState<boolean>(false);

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
      variant="secondary"
      icon={exporting ? <Spinner size="md" /> : <DownloadIcon />}
      onClick={handleExport}
      isDisabled={exporting}
    >
      {exporting ? "Exporting..." : label}
    </Button>
  );
}

export default ExportButton;
