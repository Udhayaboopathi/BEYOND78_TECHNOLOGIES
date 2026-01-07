import React, { useState } from "react";
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  AlertVariant,
  Spinner,
  ExpandableSection,
  Title,
  List,
  ListItem,
} from "@patternfly/react-core";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@patternfly/react-table";
import { DownloadIcon, UploadIcon } from "@patternfly/react-icons";
import { downloadTemplate } from "../api";
import { EnhancedImportDialogProps, ImportResult } from '../types';

/**
 * Enhanced ImportDialog - Generic import component for all entities
 */
const EnhancedImportDialog: React.FC<EnhancedImportDialogProps> = ({
  open,
  onClose,
  onImport,
  entityName,
  entityKey,
  onSuccess,
  templateColumns: _templateColumns,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState<boolean>(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = [
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];
      if (
        !validTypes.includes(file.type) &&
        !file.name.match(/\.(csv|xlsx|xls)$/)
      ) {
        alert("Invalid file type. Please upload a CSV or Excel file.");
        return;
      }
      setSelectedFile(file);
      setResult(null);
    }
  };

  const handleDownloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);
      const response = await downloadTemplate(entityKey);

      // Extract filename from Content-Disposition header
      const contentDisposition = response.headers["content-disposition"];
      let filename = `${entityKey}_import_template.xlsx`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create blob and download
      const blob = new Blob([response.data], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download template:", error);
      alert("Failed to download template. Please try again.");
    } finally {
      setDownloadingTemplate(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      alert("Please select a file to import.");
      return;
    }

    try {
      setLoading(true);
      setResult(null);

      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await onImport(formData);
      setResult(response.data);

      // If completely successful, close dialog after 3 seconds
      if (response.data.successful > 0 && response.data.failed === 0) {
        setTimeout(() => {
          handleClose();
          if (onSuccess) onSuccess();
        }, 3000);
      }
    } catch (error: any) {
      console.error("Import failed:", error);
      const errorData = error.response?.data?.detail || error.response?.data;

      if (typeof errorData === "object" && errorData.errors) {
        setResult(errorData);
      } else {
        setResult({
          message:
            typeof errorData === "string"
              ? errorData
              : "Import failed. Please check your file and try again.",
          summary: { successful: 0, failed: 1, total: 1 },
          errors: [],
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setResult(null);
    onClose();
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={`Import ${entityName}`}
      isOpen={open}
      onClose={handleClose}
      actions={[
        <Button
          key="import"
          variant="primary"
          onClick={handleImport}
          isDisabled={!selectedFile || loading}
        >
          Import
        </Button>,
        <Button key="close" variant="link" onClick={handleClose} isDisabled={loading}>
          Close
        </Button>,
      ]}
    >
      <div style={{ marginBottom: "1rem" }}>
        <p style={{ marginBottom: "0.5rem", fontSize: "0.875rem" }}>
          Download the template, fill in your data, and upload the completed file.
        </p>

        <Button
          variant="secondary"
          icon={downloadingTemplate ? <Spinner size="md" /> : <DownloadIcon />}
          onClick={handleDownloadTemplate}
          isDisabled={downloadingTemplate}
          style={{ marginTop: "0.5rem" }}
        >
          {downloadingTemplate ? "Downloading..." : "Download Template"}
        </Button>
      </div>

      <div
        style={{
          border: "2px dashed #ccc",
          borderRadius: "4px",
          padding: "1.5rem",
          textAlign: "center",
          backgroundColor: "#f9f9f9",
          marginBottom: "1rem",
        }}
      >
        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: "none" }}
          id="import-file-input"
        />
        <label htmlFor="import-file-input">
          <Button
            variant="primary"
            component="span"
            icon={<UploadIcon />}
          >
            Select File
          </Button>
        </label>
        {selectedFile && (
          <p style={{ marginTop: "1rem", fontSize: "0.875rem" }}>
            Selected: <strong>{selectedFile.name}</strong>
          </p>
        )}
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", margin: "1.5rem 0" }}>
          <Spinner size="lg" />
          <p style={{ marginLeft: "0.5rem", fontSize: "0.875rem" }}>
            Processing import...
          </p>
        </div>
      )}

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <Alert
            variant={
              (result.summary?.failed === 0 || result.failed?.length === 0)
                ? AlertVariant.success
                : (result.summary?.successful === 0 || result.successful?.length === 0)
                ? AlertVariant.danger
                : AlertVariant.warning
            }
            title={result.message || "Import completed"}
            style={{ marginBottom: "1rem" }}
          >
            <p style={{ fontSize: "0.875rem" }}>
              {(result.summary?.successful || result.successful?.length || 0) > 0 &&
                `✓ ${result.summary?.successful || result.successful?.length} records imported successfully. `}
              {(result.summary?.failed || result.failed?.length || 0) > 0 && `✗ ${result.summary?.failed || result.failed?.length} records failed.`}
            </p>
          </Alert>

          {result.errors && result.errors.length > 0 && (
            <ExpandableSection toggleText={`View ${result.errors.length} Error(s)`}>
              <Table>
                <Thead>
                  <Tr>
                    <Th>Row</Th>
                    <Th>Field</Th>
                    <Th>Error</Th>
                    <Th>Value</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {result.errors.map((error, idx) => (
                    <Tr key={idx}>
                      <Td>{error.row || "-"}</Td>
                      <Td>{error.field}</Td>
                      <Td>{error.message}</Td>
                      <Td>{error.value || "-"}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </ExpandableSection>
          )}
        </div>
      )}

      <div style={{ marginTop: "1.5rem", padding: "1rem", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
        <div style={{ fontSize: "0.875rem" }}>
          <strong>💡 Tips:</strong>
          <List>
            <ListItem>Use the template to ensure correct column format</ListItem>
            <ListItem>Required fields must have values</ListItem>
            <ListItem>For updates, include records with matching unique identifiers</ListItem>
            <ListItem>Supported formats: CSV, Excel (.xlsx, .xls)</ListItem>
          </List>
        </div>
      </div>
    </Modal>
  );
}

export default EnhancedImportDialog;
