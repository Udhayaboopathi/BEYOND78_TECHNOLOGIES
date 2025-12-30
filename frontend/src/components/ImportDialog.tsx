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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  ExpandMore,
  CheckCircle,
  Error as ErrorIcon,
} from "@mui/icons-material";
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
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2} mt={1}>
          {/* Template Info */}
          <Alert severity="info">
            <Typography variant="body2" gutterBottom>
              <strong>Required Columns:</strong> {templateColumns.join(", ")}
            </Typography>
            <Button
              size="small"
              variant="outlined"
              onClick={downloadTemplate}
              sx={{ mt: 1 }}
            >
              Download Template
            </Button>
          </Alert>

          {/* File Upload */}
          <Box>
            <input
              accept=".xlsx,.xls,.csv"
              style={{ display: "none" }}
              id="import-file-input"
              type="file"
              onChange={handleFileChange}
            />
            <label htmlFor="import-file-input">
              <Button variant="contained" component="span">
                Choose File
              </Button>
            </label>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected: <strong>{file.name}</strong> (
                {(file.size / 1024).toFixed(2)} KB)
              </Typography>
            )}
          </Box>

          {/* Error Display */}
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* Results Display */}
          {result && (
            <Box>
              {result.successful && result.successful.length > 0 && (
                <Alert severity="success" icon={<CheckCircle />} sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    <strong>
                      Successfully imported {result.successful.length} records
                    </strong>
                  </Typography>
                </Alert>
              )}

              {result.failed && result.failed.length > 0 && (
                <Alert severity="warning" icon={<ErrorIcon />}>
                  <Typography variant="body1" gutterBottom>
                    <strong>
                      Failed to import {result.failed.length} records
                    </strong>
                  </Typography>
                  <Accordion sx={{ mt: 1 }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Typography>View Failed Records</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell>
                                <strong>Row</strong>
                              </TableCell>
                              <TableCell>
                                <strong>Errors</strong>
                              </TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {result.failed.map((fail, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <Chip
                                    label={fail.row || index + 1}
                                    size="small"
                                  />
                                </TableCell>
                                <TableCell>
                                  <Typography variant="caption">
                                    {fail.error}
                                  </Typography>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </AccordionDetails>
                  </Accordion>
                </Alert>
              )}

              {result.message && (
                <Typography
                  variant="body2"
                  color="textSecondary"
                  sx={{ mt: 1 }}
                >
                  {result.message}
                </Typography>
              )}
            </Box>
          )}

          {/* Loading */}
          {importing && (
            <Box display="flex" alignItems="center" gap={2}>
              <CircularProgress size={24} />
              <Typography>Importing data...</Typography>
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={importing}>
          {result && result.successful && result.successful.length > 0
            ? "Close"
            : "Cancel"}
        </Button>
        <Button
          onClick={handleImport}
          variant="contained"
          color="primary"
          disabled={!file || importing}
        >
          {importing ? "Importing..." : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ImportDialog;
