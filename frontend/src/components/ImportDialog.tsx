import React, { useState } from "react";
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  AlertVariant,
  Spinner,
  Label,
  ExpandableSection,
} from "@patternfly/react-core";
import {
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Td,
} from "@patternfly/react-table";
import { CheckCircleIcon } from "@patternfly/react-icons";
import { ImportDialogProps, ImportResult } from '../types';

const ImportDialog: React.FC<ImportDialogProps> = ({ 
  open, 
  onClose, 
  onImport, 
  title, 
  templateColumns = [] 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState<boolean>(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      const fileType = selectedFile.name.split(".").pop()?.toLowerCase();
      if (!fileType || !["xlsx", "xls", "csv"].includes(fileType)) {
        setError("Please select a valid Excel (.xlsx, .xls) or CSV file");
        setFile(null);
        return;
      }
      setFile(selectedFile);
      setError(null);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setImporting(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await onImport(formData);
      setResult(response.data);

      // If all successful, close after 3 seconds
      if (
        response.data.successful &&
        response.data.successful.length > 0 &&
        (!response.data.failed || response.data.failed.length === 0)
      ) {
        setTimeout(() => {
          handleClose();
        }, 3000);
      }
    } catch (err: any) {
      const errorMsg =
        err.response?.data?.detail?.message ||
        err.response?.data?.detail ||
        "Import failed";
      setError(errorMsg);

      // Check if there are failed records in the error detail
      if (err.response?.data?.detail?.failed) {
        setResult({ failed: err.response.data.detail.failed, successful: [] });
      }
    } finally {
      setImporting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setImporting(false);
    setResult(null);
    setError(null);
    onClose();
  };

  const downloadTemplate = () => {
    // Create CSV template
    const csvContent =
      templateColumns.join(",") +
      "\n" +
      templateColumns.map(() => "").join(",");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, "_")}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Modal
      variant={ModalVariant.medium}
      title={title}
      isOpen={open}
      onClose={handleClose}
      actions={[
        <Button
          key="import"
          variant="primary"
          onClick={handleImport}
          isDisabled={!file || importing}
        >
          {importing ? "Importing..." : "Import"}
        </Button>,
        <Button key="close" variant="link" onClick={handleClose} isDisabled={importing}>
          {result && result.successful && result.successful.length > 0
            ? "Close"
            : "Cancel"}
        </Button>,
      ]}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
        {/* Template Info */}
        <Alert variant={AlertVariant.info} title="Template Information">
          <p style={{ fontSize: "0.875rem" }}>
            <strong>Required Columns:</strong> {templateColumns.join(", ")}
          </p>
          <Button
            size="sm"
            variant="link"
            onClick={downloadTemplate}
            style={{ marginTop: "0.5rem", padding: 0 }}
          >
            Download Template
          </Button>
        </Alert>

        {/* File Upload */}
        <div>
          <input
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            id="import-file-input"
            type="file"
            onChange={handleFileChange}
          />
          <label htmlFor="import-file-input">
            <Button variant="primary" component="span">
              Choose File
            </Button>
          </label>
          {file && (
            <p style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}>
              Selected: <strong>{file.name}</strong> (
              {(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert
            variant={AlertVariant.danger}
            title="Import Error"
            actionClose={<Button variant="plain" onClick={() => setError(null)} />}
          >
            {error}
          </Alert>
        )}

        {/* Results Display */}
        {result && (
          <div>
            {result.successful && result.successful.length > 0 && (
              <Alert
                variant={AlertVariant.success}
                title={`Successfully imported ${result.successful.length} records`}
                style={{ marginBottom: "1rem" }}
                customIcon={<CheckCircleIcon />}
              />
            )}

            {result.failed && result.failed.length > 0 && (
              <Alert
                variant={AlertVariant.warning}
                title={`Failed to import ${result.failed.length} records`}
              >
                <ExpandableSection toggleText="View Failed Records">
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>Row</Th>
                        <Th>Errors</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {result.failed.map((fail, index) => (
                        <Tr key={index}>
                          <Td>
                            <Label color="blue">{fail.row || index + 1}</Label>
                          </Td>
                          <Td>
                            <span style={{ fontSize: "0.875rem" }}>
                              {fail.error}
                            </span>
                          </Td>
                        </Tr>
                      ))}
                    </Tbody>
                  </Table>
                </ExpandableSection>
              </Alert>
            )}

            {result.message && (
              <p style={{ marginTop: "0.5rem", fontSize: "0.875rem", color: "#6a6e73" }}>
                {result.message}
              </p>
            )}
          </div>
        )}

        {/* Loading */}
        {importing && (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Spinner size="md" />
            <span>Importing data...</span>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ImportDialog;
