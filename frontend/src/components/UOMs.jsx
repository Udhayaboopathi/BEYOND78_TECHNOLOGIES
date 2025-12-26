import React, { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from "@mui/material";
import { Add, Edit, Delete, Upload } from "@mui/icons-material";
import ExportButton from "./ExportButton";
import EnhancedImportDialog from "./EnhancedImportDialog";
import {
  getUOMs,
  createUOM,
  updateUOM,
  deleteUOM,
  exportUOMs,
  importUOMs,
} from "../api";

function UOMs() {
  const [uoms, setUOMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentUOM, setCurrentUOM] = useState({
    name: "",
    type: "",
    base_uom: "",
    description: "",
  });

  useEffect(() => {
    fetchUOMs();
  }, []);

  const fetchUOMs = async () => {
    try {
      setLoading(true);
      const response = await getUOMs();
      setUOMs(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch UOMs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (uom = null) => {
    if (uom) {
      setEditMode(true);
      setCurrentUOM(uom);
    } else {
      setEditMode(false);
      setCurrentUOM({ name: "", type: "", base_uom: "", description: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      if (editMode) {
        await updateUOM(currentUOM.id, currentUOM);
      } else {
        await createUOM(currentUOM);
      }
      handleCloseDialog();
      fetchUOMs();
    } catch (err) {
      setError("Failed to save UOM.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this UOM?")) {
      try {
        await deleteUOM(id);
        fetchUOMs();
      } catch (err) {
        setError("Failed to delete UOM.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentUOM((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4">Units of Measurement (UOMs)</Typography>
        <Box display="flex" gap={2}>
          <ExportButton onExport={exportUOMs} label="Export UOMs" />
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Upload />}
            onClick={() => setOpenImportDialog(true)}
          >
            Import UOMs
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add UOM
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Base UOM</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {uoms.map((uom) => (
              <TableRow key={uom.id}>
                <TableCell>{uom.id}</TableCell>
                <TableCell>{uom.name}</TableCell>
                <TableCell>{uom.type}</TableCell>
                <TableCell>{uom.base_uom}</TableCell>
                <TableCell>{uom.description}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(uom)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(uom.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editMode ? "Edit UOM" : "Add UOM"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            name="name"
            value={currentUOM.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Type"
            name="type"
            value={currentUOM.type}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Base UOM"
            name="base_uom"
            value={currentUOM.base_uom}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={currentUOM.description}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <EnhancedImportDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={importUOMs}
        title="Import UOMs"
        entityKey="uoms"
        onSuccess={fetchUOMs}
      />
    </div>
  );
}

export default UOMs;
