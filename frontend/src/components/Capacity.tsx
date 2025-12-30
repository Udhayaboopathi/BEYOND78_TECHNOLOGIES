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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
  Grid,
} from "@mui/material";
import { Add, Edit, Delete, Upload, Refresh } from "@mui/icons-material";
import {
  getCapacity,
  createCapacity,
  updateCapacity,
  deleteCapacity,
  getCommodities,
  getLocations,
  getUOMs,
  getCommodityDetails,
  getLocationDetails,
  validateCapacity,
  exportCapacity,
  importCapacity,
} from "../api";
import type { Capacity as CapacityType, Commodity, Location, UOM } from '../types';
import ExportButton from "./ExportButton";
import ImportDialog from "./ImportDialog";

const Capacity: React.FC = () => {
  const [capacity, setCapacity] = useState<CapacityType[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [uoms, setUOMs] = useState<UOM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentCapacity, setCurrentCapacity] = useState<{
    id?: number;
    commodity_id: string;
    location_id: string;
    capacity_value: string;
    capacity_uom: string;
    effective_from: string;
    effective_to: string;
  }>({
    commodity_id: "",
    location_id: "",
    capacity_value: "",
    capacity_uom: "",
    effective_from: "",
    effective_to: "",
  });

  // Auto-populated read-only fields
  const [commodityDetails, setCommodityDetails] = useState<Commodity | null>(null);
  const [locationDetails, setLocationDetails] = useState<Location | null>(null);
  
  // Filter states
  const [filterCommodity, setFilterCommodity] = useState<number | string>("");
  const [filterLocation, setFilterLocation] = useState<number | string>("");

  useEffect(() => {
    fetchCapacity();
    fetchCommodities();
    fetchLocations();
    fetchUOMs();
  }, []);

  const fetchCommodities = async () => {
    try {
      const response = await getCommodities();
      setCommodities(response.data);
    } catch (err) {
      console.error("Failed to fetch commodities:", err);
    }
  };

  const fetchLocations = async () => {
    try {
      const response = await getLocations();
      setLocations(response.data);
    } catch (err) {
      console.error("Failed to fetch locations:", err);
    }
  };

  const fetchUOMs = async () => {
    try {
      const response = await getUOMs();
      setUOMs(response.data);
    } catch (err) {
      console.error("Failed to fetch UOMs:", err);
    }
  };

  const fetchCapacity = async () => {
    try {
      setLoading(true);
      const response = await getCapacity();
      setCapacity(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch capacity data.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (item: CapacityType | null = null) => {
    if (item) {
      setEditMode(true);
      setCurrentCapacity({
        id: item.id,
        commodity_id: item.commodity_id.toString(),
        location_id: item.location_id.toString(),
        capacity_value: item.quantity.toString(),
        capacity_uom: item.uom_id?.toString() || "",
        effective_from: item.eff_dt_from || "",
        effective_to: item.eff_dt_to || "",
      });
      // Load details for edit mode
      if (item.commodity_id) fetchCommodityDetailsData(item.commodity_id);
      if (item.location_id) fetchLocationDetailsData(item.location_id);
    } else {
      setEditMode(false);
      setCurrentCapacity({
        commodity_id: "",
        location_id: "",
        capacity_value: "",
        capacity_uom: "",
        effective_from: "",
        effective_to: "",
      });
      setCommodityDetails(null);
      setLocationDetails(null);
    }
    setValidationError(null);
    setOpenDialog(true);
  };

  const fetchCommodityDetailsData = async (commodityId: string | number) => {
    try {
      const id = typeof commodityId === 'string' ? parseInt(commodityId) : commodityId;
      const response = await getCommodityDetails(id);
      setCommodityDetails(response.data);
    } catch (err) {
      console.error("Failed to fetch commodity details:", err);
    }
  };

  const fetchLocationDetailsData = async (locationId: string | number) => {
    try {
      const id = typeof locationId === 'string' ? parseInt(locationId) : locationId;
      const response = await getLocationDetails(id);
      setLocationDetails(response.data);
    } catch (err) {
      console.error("Failed to fetch location details:", err);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setValidationError(null);
  };

  const handleSave = async () => {
    try {
      setValidationError(null);
      const data = {
        commodity_id: parseInt(currentCapacity.commodity_id),
        location_id: parseInt(currentCapacity.location_id),
        quantity: parseFloat(currentCapacity.capacity_value),
        uom_id: parseInt(currentCapacity.capacity_uom),
        eff_dt_from: currentCapacity.effective_from,
        eff_dt_to: currentCapacity.effective_to,
      };

      // Validate capacity (check for overlapping dates) - skip in edit mode
      if (!editMode) {
        try {
          await validateCapacity(data);
        } catch (validationErr: any) {
          setValidationError(
            validationErr.response?.data?.detail ||
              "Overlapping capacity record exists for this commodity and location in the given date range."
          );
          return;
        }
      }

      if (editMode && currentCapacity.id) {
        await updateCapacity(currentCapacity.id, data);
      } else {
        await createCapacity(data);
      }
      handleCloseDialog();
      fetchCapacity();
    } catch (err: any) {
      // Handle error object properly
      let errorMessage = "Failed to save capacity.";
      if (err.response?.data?.detail) {
        if (typeof err.response.data.detail === 'string') {
          errorMessage = err.response.data.detail;
        } else if (Array.isArray(err.response.data.detail)) {
          errorMessage = err.response.data.detail.map((e: any) => 
            typeof e === 'string' ? e : e.msg || JSON.stringify(e)
          ).join(', ');
        } else {
          errorMessage = JSON.stringify(err.response.data.detail);
        }
      }
      setError(errorMessage);
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (
      window.confirm("Are you sure you want to delete this capacity record?")
    ) {
      try {
        await deleteCapacity(id);
        fetchCapacity();
      } catch (err) {
        setError("Failed to delete capacity.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCurrentCapacity((prev) => ({ ...prev, [name as string]: value }));

    // Auto-populate dependent data when commodity or location changes
    if (name === "commodity_id" && value) {
      fetchCommodityDetailsData(value);
    }
    if (name === "location_id" && value) {
      fetchLocationDetailsData(value);
    }
  };

  // Filter capacity
  const filteredCapacity = capacity.filter((item) => {
    const matchesCommodity = filterCommodity === "" || 
      item.commodity_id === Number(filterCommodity);
    const matchesLocation = filterLocation === "" || 
      item.location_id === Number(filterLocation);
    return matchesCommodity && matchesLocation;
  });

  const handleClearFilters = () => {
    setFilterCommodity("");
    setFilterLocation("");
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Typography variant="h4" mb={2}>Capacity</Typography>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter: Commodity</InputLabel>
              <Select
                value={filterCommodity}
                onChange={(e) => setFilterCommodity(e.target.value)}
                label="Filter: Commodity"
              >
                <MenuItem value="">All</MenuItem>
                {commodities.map((commodity) => (
                  <MenuItem key={commodity.id} value={commodity.id}>
                    {commodity.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter: Location</InputLabel>
              <Select
                value={filterLocation}
                onChange={(e) => setFilterLocation(e.target.value)}
                label="Filter: Location"
              >
                <MenuItem value="">All</MenuItem>
                {locations.map((location) => (
                  <MenuItem key={location.id} value={location.id}>
                    {location.name}
                  </MenuItem>
                ))}
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
              <IconButton size="small" color="primary" onClick={fetchCapacity} title="Refresh">
                <Refresh />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <ExportButton onExport={exportCapacity} filename="capacity.csv" label="Export Capacity" />
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Upload />}
          onClick={() => setOpenImportDialog(true)}
        >
          Import Capacity
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Commodity</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Quantity</TableCell>
              <TableCell>UOM</TableCell>
              <TableCell>Effective From</TableCell>
              <TableCell>Effective To</TableCell>
              <TableCell>Last Modified</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCapacity.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>
                  {item.commodity?.name || `ID: ${item.commodity_id}`}
                </TableCell>
                <TableCell>
                  {item.location?.name || `ID: ${item.location_id}`}
                </TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.uom?.name || `ID: ${item.uom_id}`}</TableCell>
                <TableCell>{item.eff_dt_from}</TableCell>
                <TableCell>{item.eff_dt_to}</TableCell>
                <TableCell>{item.dt_last_modified}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(item)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(item.id!)}
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
        <DialogTitle>{editMode ? "Edit Capacity" : "Add Capacity"}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Commodity</InputLabel>
            <Select
              name="commodity_id"
              value={currentCapacity.commodity_id}
              onChange={handleInputChange}
              label="Commodity"
            >
              {commodities.map((commodity) => (
                <MenuItem key={commodity.id} value={commodity.id}>
                  {commodity.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Auto-populated Read-Only Commodity Details */}
          {commodityDetails && (
            <Box
              sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1, mt: 2, mb: 2 }}
            >
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Commodity Details (Read-Only)
              </Typography>
              <TextField
                fullWidth
                margin="dense"
                label="Commodity Name"
                value={commodityDetails.name || ""}
                disabled
                size="small"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Density"
                value={commodityDetails.density || ""}
                disabled
                size="small"
              />
              <TextField
                fullWidth
                margin="dense"
                label="UOM"
                value={commodityDetails.uom || ""}
                disabled
                size="small"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Energy UOM"
                value={commodityDetails.energy_uom || ""}
                disabled
                size="small"
              />
            </Box>
          )}

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Location</InputLabel>
            <Select
              name="location_id"
              value={currentCapacity.location_id}
              onChange={handleInputChange}
              label="Location"
            >
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Auto-populated Read-Only Location Details */}
          {locationDetails && (
            <Box
              sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 1, mt: 2, mb: 2 }}
            >
              <Typography variant="subtitle2" color="primary" gutterBottom>
                Location Details (Read-Only)
              </Typography>
              <TextField
                fullWidth
                margin="dense"
                label="Location Name"
                value={locationDetails.name || ""}
                disabled
                size="small"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Location Type"
                value={locationDetails.type || ""}
                disabled
                size="small"
              />
              <TextField
                fullWidth
                margin="dense"
                label="Description"
                value={locationDetails.description || ""}
                disabled
                size="small"
              />
            </Box>
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Capacity Value"
            name="capacity_value"
            type="number"
            value={currentCapacity.capacity_value}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Capacity UOM</InputLabel>
            <Select
              name="capacity_uom"
              value={currentCapacity.capacity_uom}
              onChange={handleInputChange}
              label="Capacity UOM"
            >
              {uoms.map((uom) => (
                <MenuItem key={uom.id} value={uom.id}>
                  {uom.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Effective From"
            name="effective_from"
            type="date"
            value={currentCapacity.effective_from}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Effective To"
            name="effective_to"
            type="date"
            value={currentCapacity.effective_to}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          {validationError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {validationError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <ImportDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={importCapacity}
        title="Import Capacity"
        templateColumns={[
          "Commodity Name",
          "Location Name",
          "UOM",
          "Quantity",
          "Effective From",
          "Effective To",
        ]}
      />
    </div>
  );
};

export default Capacity;
