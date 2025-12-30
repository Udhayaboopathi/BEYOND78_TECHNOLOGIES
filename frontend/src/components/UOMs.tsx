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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
} from "@mui/material";
import { Add, Edit, Delete, Upload, Refresh } from "@mui/icons-material";
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
    base_uom: "",
    description: "",
    is_active: true,
  });
  
  // Filter states
  const [filterName, setFilterName] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

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
        base_uom: uom.base_uom || "",
        description: uom.description || "",
        is_active: uom.is_active ?? true,
      });
    } else {
      setEditMode(false);
      setCurrentUOM({ name: "", type: "", base_uom: "", description: "", is_active: true });
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

  // Filter UOMs
  const filteredUOMs = uoms.filter((uom) => {
    const matchesName = filterName === "" || 
      uom.name?.toLowerCase().includes(filterName.toLowerCase());
    const matchesType = filterType === "" || uom.type === filterType;
    return matchesName && matchesType;
  });

  const handleClearFilters = () => {
    setFilterName("");
    setFilterType("");
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Typography variant="h4" mb={2}>Units of Measurement (UOMs)</Typography>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Filter: Name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter: Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Filter: Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Mass">Mass</MenuItem>
                <MenuItem value="Volume">Volume</MenuItem>
                <MenuItem value="Energy">Energy</MenuItem>
                <MenuItem value="Length">Length</MenuItem>
                <MenuItem value="Temperature">Temperature</MenuItem>
                <MenuItem value="Pressure">Pressure</MenuItem>
                <MenuItem value="Time">Time</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button size="small" variant="outlined" onClick={handleClearFilters}>
                Clear filters
              </Button>
              <Button size="small" variant="contained" onClick={() => handleOpenDialog()}>
                New
              </Button>
              <IconButton size="small" color="primary" onClick={fetchUOMs} title="Refresh">
                <Refresh />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <ExportButton onExport={exportUOMs} label="Export UOMs" />
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Upload />}
          onClick={() => setOpenImportDialog(true)}
        >
          Import UOMs
        </Button>
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
            {filteredUOMs.map((uom) => (
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
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={currentUOM.type}
              onChange={(e) => setCurrentUOM(prev => ({ ...prev, type: e.target.value }))}
              label="Type"
            >
              <MenuItem value="Mass">Mass</MenuItem>
              <MenuItem value="Volume">Volume</MenuItem>
              <MenuItem value="Energy">Energy</MenuItem>
              <MenuItem value="Length">Length</MenuItem>
              <MenuItem value="Temperature">Temperature</MenuItem>
              <MenuItem value="Pressure">Pressure</MenuItem>
              <MenuItem value="Time">Time</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Base UOM</InputLabel>
            <Select
              name="base_uom"
              value={currentUOM.base_uom}
              onChange={(e) => setCurrentUOM(prev => ({ ...prev, base_uom: e.target.value }))}
              label="Base UOM"
            >
              <MenuItem value="kg">kg (Kilogram)</MenuItem>
              <MenuItem value="MT">MT (Metric Ton)</MenuItem>
              <MenuItem value="lb">lb (Pound)</MenuItem>
              <MenuItem value="L">L (Liter)</MenuItem>
              <MenuItem value="m³">m³ (Cubic Meter)</MenuItem>
              <MenuItem value="bbl">bbl (Barrel)</MenuItem>
              <MenuItem value="gal">gal (Gallon)</MenuItem>
              <MenuItem value="MJ">MJ (Megajoule)</MenuItem>
              <MenuItem value="GJ">GJ (Gigajoule)</MenuItem>
              <MenuItem value="kWh">kWh (Kilowatt-hour)</MenuItem>
              <MenuItem value="MWh">MWh (Megawatt-hour)</MenuItem>
              <MenuItem value="BTU">BTU (British Thermal Unit)</MenuItem>
              <MenuItem value="m">m (Meter)</MenuItem>
              <MenuItem value="ft">ft (Foot)</MenuItem>
              <MenuItem value="°C">°C (Celsius)</MenuItem>
              <MenuItem value="°F">°F (Fahrenheit)</MenuItem>
              <MenuItem value="K">K (Kelvin)</MenuItem>
              <MenuItem value="Pa">Pa (Pascal)</MenuItem>
              <MenuItem value="bar">bar (Bar)</MenuItem>
              <MenuItem value="psi">psi (Pounds per Square Inch)</MenuItem>
              <MenuItem value="s">s (Second)</MenuItem>
              <MenuItem value="min">min (Minute)</MenuItem>
              <MenuItem value="h">h (Hour)</MenuItem>
              <MenuItem value="day">day (Day)</MenuItem>
            </Select>
          </FormControl>
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
        templateColumns={['name', 'type', 'description', 'base_uom', 'is_active']}
      />
    </div>
  );
}

export default UOMs;
