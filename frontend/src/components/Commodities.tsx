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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  SelectChangeEvent,
} from "@mui/material";
import { Add, Edit, Delete, Upload } from "@mui/icons-material";
import ExportButton from "./ExportButton";
import EnhancedImportDialog from "./EnhancedImportDialog";
import {
  getCommodities,
  createCommodity,
  updateCommodity,
  deleteCommodity,
  getUOMs,
  exportCommodities,
  importCommodities,
} from "../api";
import { Commodity, UOM, CommodityFormData } from '../types';

const Commodities: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [uoms, setUOMs] = useState<UOM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentCommodity, setCurrentCommodity] = useState<CommodityFormData>({
    name: "",
    description: "",
    uom: "",
    density: "",
    energy_uom: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCommodities();
    fetchUOMs();
  }, []);

  const fetchUOMs = async () => {
    try {
      const response = await getUOMs();
      setUOMs(response.data);
    } catch (err) {
      console.error("Failed to fetch UOMs:", err);
    }
  };

  const fetchCommodities = async () => {
    try {
      setLoading(true);
      const response = await getCommodities();
      setCommodities(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch commodities.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (commodity: Commodity | null = null) => {
    if (commodity) {
      setEditMode(true);
      setCurrentCommodity({
        id: commodity.id,
        name: commodity.name || "",
        description: commodity.description || "",
        uom: commodity.uom || "",
        density: commodity.density?.toString() || "",
        energy_uom: commodity.energy_uom || "",
        is_active: commodity.is_active ?? true,
      });
    } else {
      setEditMode(false);
      setCurrentCommodity({
        name: "",
        description: "",
        uom: "",
        density: "",
        energy_uom: "",
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      const commodityData = {
        ...currentCommodity,
        density: typeof currentCommodity.density === 'string' 
          ? (currentCommodity.density ? parseFloat(currentCommodity.density) : undefined)
          : currentCommodity.density,
      };
      
      if (editMode && currentCommodity.id) {
        await updateCommodity(currentCommodity.id, commodityData);
      } else {
        await createCommodity(commodityData);
      }
      handleCloseDialog();
      fetchCommodities();
    } catch (err) {
      setError("Failed to save commodity.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this commodity?")) {
      try {
        await deleteCommodity(id);
        fetchCommodities();
      } catch (err) {
        setError("Failed to delete commodity.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentCommodity((prev: CommodityFormData) => ({
      ...prev,
      [name]: name === "density" ? parseFloat(value) : value,
    }));
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
        <Typography variant="h4">Commodities</Typography>
        <Box display="flex" gap={2}>
          <ExportButton
            onExport={exportCommodities}
            label="Export Commodities"
          />
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Upload />}
            onClick={() => setOpenImportDialog(true)}
          >
            Import Commodities
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Commodity
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>UOM</TableCell>
              <TableCell>Density</TableCell>
              <TableCell>Energy UOM</TableCell>
              <TableCell>Is Active</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {commodities.map((commodity) => (
              <TableRow key={commodity.id}>
                <TableCell>{commodity.id}</TableCell>
                <TableCell>{commodity.name}</TableCell>
                <TableCell>{commodity.description}</TableCell>
                <TableCell>{commodity.uom}</TableCell>
                <TableCell>{commodity.density}</TableCell>
                <TableCell>{commodity.energy_uom}</TableCell>
                <TableCell>{commodity.is_active ? "Yes" : "No"}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(commodity)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(commodity.id)}
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
        <DialogTitle>
          {editMode ? "Edit Commodity" : "Add Commodity"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            name="name"
            value={currentCommodity.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={currentCommodity.description}
            onChange={handleInputChange}
            multiline
            rows={3}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>UOM</InputLabel>
            <Select
              name="uom"
              value={currentCommodity.uom}
              onChange={handleInputChange}
              label="UOM"
            >
              {uoms.map((uom) => (
                <MenuItem key={uom.id} value={uom.name}>
                  {uom.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Density"
            name="density"
            type="number"
            value={currentCommodity.density}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Energy UOM</InputLabel>
            <Select
              name="energy_uom"
              value={currentCommodity.energy_uom}
              onChange={handleInputChange}
              label="Energy UOM"
            >
              {uoms.map((uom) => (
                <MenuItem key={uom.id} value={uom.name}>
                  {uom.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>{" "}
          <FormControlLabel
            control={
              <Checkbox
                checked={currentCommodity.is_active}
                onChange={(e) =>
                  setCurrentCommodity((prev: CommodityFormData) => ({
                    ...prev,
                    is_active: e.target.checked,
                  }))
                }
                name="is_active"
              />
            }
            label="Is Active"
          />{" "}
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
        onImport={importCommodities}
        entityName="Commodities"
        entityKey="commodities"
        onSuccess={fetchCommodities}
        templateColumns={['name', 'description', 'uom', 'density', 'energy_uom', 'is_active']}
      />
    </div>
  );
}

export default Commodities;
