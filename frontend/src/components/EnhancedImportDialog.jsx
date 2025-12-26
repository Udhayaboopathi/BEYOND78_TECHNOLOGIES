import React, { useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Link,
} from "@mui/material";
import { CloudUpload, ExpandMore, Download } from "@mui/icons-material";
import { downloadTemplate } from "../api";

/**
 * Enhanced ImportDialog - Generic import component for all entities
 *
 * @param {boolean} open - Dialog open state
 * @param {function} onClose - Close handler
 * @param {function} onImport - Import function that accepts FormData
 * @param {string} title - Dialog title
 * @param {string} entityKey - Entity key for template download (e.g., 'commodities', 'uoms')
 * @param {function} onSuccess - Optional success callback
 */
function EnhancedImportDialog({
  open,
  onClose,
  onImport,
  title,
  entityKey,
  onSuccess,
}) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);

  const handleFileChange = (event) => {
    const file = event.target.files[0];
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
    } catch (error) {
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
          successful: 0,
          failed: 1,
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

  const groupErrorsByRow = (errors) => {
    const grouped = {};
    errors.forEach((error) => {
      const row = error.row || 0;
      if (!grouped[row]) {
        grouped[row] = [];
      }
      grouped[row].push(error);
    });
    return grouped;
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Download the template, fill in your data, and upload the completed
            file.
          </Typography>

          <Button
            variant="outlined"
            startIcon={
              downloadingTemplate ? (
                <CircularProgress size={20} />
              ) : (
                <Download />
              )
            }
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            sx={{ mt: 1 }}
          >
            {downloadingTemplate ? "Downloading..." : "Download Template"}
          </Button>
        </Box>

        <Box
          sx={{
            border: "2px dashed #ccc",
            borderRadius: 2,
            p: 3,
            textAlign: "center",
            bgcolor: "#f9f9f9",
            mb: 2,
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
              variant="contained"
              component="span"
              startIcon={<CloudUpload />}
            >
              Select File
            </Button>
          </label>
          {selectedFile && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected: <strong>{selectedFile.name}</strong>
            </Typography>
          )}
        </Box>

        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", my: 3 }}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2, mt: 1 }}>
              Processing import...
            </Typography>
          </Box>
        )}

        {result && (
          <Box sx={{ mt: 2 }}>
            <Alert
              severity={
                result.failed === 0
                  ? "success"
                  : result.successful === 0
                  ? "error"
                  : "warning"
              }
              sx={{ mb: 2 }}
            >
              <Typography variant="body2">
                <strong>{result.message}</strong>
              </Typography>
              <Typography variant="caption">
                {result.successful > 0 &&
                  `✓ ${result.successful} records imported successfully. `}
                {result.failed > 0 && `✗ ${result.failed} records failed.`}
              </Typography>
            </Alert>

            {result.errors && result.errors.length > 0 && (
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle2" color="error">
                    View {result.errors.length} Error(s)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>
                          <strong>Row</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Field</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Error</strong>
                        </TableCell>
                        <TableCell>
                          <strong>Value</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {result.errors.map((error, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{error.row || "-"}</TableCell>
                          <TableCell>{error.field}</TableCell>
                          <TableCell>{error.message}</TableCell>
                          <TableCell>{error.value || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionDetails>
              </Accordion>
            )}
          </Box>
        )}

        <Box sx={{ mt: 3, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            <strong>💡 Tips:</strong>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              <li>Use the template to ensure correct column format</li>
              <li>Required fields must have values</li>
              <li>
                For updates, include records with matching unique identifiers
              </li>
              <li>Supported formats: CSV, Excel (.xlsx, .xls)</li>
            </ul>
          </Typography>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Close
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          color="primary"
          disabled={!selectedFile || loading}
        >
          Import
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default EnhancedImportDialog;
