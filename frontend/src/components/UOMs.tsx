import { useState, useEffect } from "react";
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
import { UOM, UOMFormData } from '../types';

const UOMs: React.FC = () => {
  const [uoms, setUOMs] = useState<UOM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentUOM, setCurrentUOM] = useState<UOMFormData>({
    name: "",
    type: "",
    base_conversion: "",
    description: "",
    is_active: true,
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

  const handleOpenDialog = (uom: UOM | null = null) => {
    if (uom) {
      setEditMode(true);
      setCurrentUOM({
        id: uom.id,
        name: uom.name || "",
        type: uom.type || "",
        base_conversion: uom.base_conversion?.toString() || "",
        description: uom.description || "",
        is_active: uom.is_active ?? true,
      });
    } else {
      setEditMode(false);
      setCurrentUOM({ name: "", type: "", base_conversion: "", description: "", is_active: true });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      const uomData = {
        ...currentUOM,
        base_conversion: typeof currentUOM.base_conversion === 'string' 
          ? (currentUOM.base_conversion ? parseFloat(currentUOM.base_conversion) : undefined)
          : currentUOM.base_conversion,
      };
      
      if (editMode && currentUOM.id) {
        await updateUOM(currentUOM.id, uomData);
      } else {
        await createUOM(uomData);
      }
      handleCloseDialog();
      fetchUOMs();
    } catch (err) {
      setError("Failed to save UOM.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
                <TableCell>{uom.base_conversion}</TableCell>
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
            label="Base Conversion"
            name="base_conversion"
            type="number"
            value={currentUOM.base_conversion}
            onChange={handleInputChange}
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
        entityName="UOMs"
        entityKey="uoms"
        onSuccess={fetchUOMs}
        templateColumns={['name', 'type', 'description', 'base_conversion', 'is_active']}
      />
    </div>
  );
}

export default UOMs;
