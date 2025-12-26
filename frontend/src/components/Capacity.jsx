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
} from "@mui/material";
import { Add, Edit, Delete, Upload } from "@mui/icons-material";
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
import ExportButton from "./ExportButton";
import ImportDialog from "./ImportDialog";

function Capacity() {
  const [capacity, setCapacity] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [locations, setLocations] = useState([]);
  const [uoms, setUOMs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentCapacity, setCurrentCapacity] = useState({
    commodity_id: "",
    location_id: "",
    quantity: "",
    uom_id: "",
    eff_dt_from: "",
    eff_dt_to: "",
  });

  // Auto-populated read-only fields
  const [commodityDetails, setCommodityDetails] = useState(null);
  const [locationDetails, setLocationDetails] = useState(null);

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

  const handleOpenDialog = (item = null) => {
    if (item) {
      setEditMode(true);
      setCurrentCapacity({
        id: item.id,
        commodity_id: item.commodity_id,
        location_id: item.location_id,
        quantity: item.quantity,
        uom_id: item.uom_id,
        eff_dt_from: item.eff_dt_from,
        eff_dt_to: item.eff_dt_to,
      });
      // Load details for edit mode
      if (item.commodity_id) fetchCommodityDetailsData(item.commodity_id);
      if (item.location_id) fetchLocationDetailsData(item.location_id);
    } else {
      setEditMode(false);
      setCurrentCapacity({
        commodity_id: "",
        location_id: "",
        quantity: "",
        uom_id: "",
        eff_dt_from: "",
        eff_dt_to: "",
      });
      setCommodityDetails(null);
      setLocationDetails(null);
    }
    setValidationError(null);
    setOpenDialog(true);
  };

  const fetchCommodityDetailsData = async (commodityId) => {
    try {
      const response = await getCommodityDetails(commodityId);
      setCommodityDetails(response.data);
    } catch (err) {
      console.error("Failed to fetch commodity details:", err);
    }
  };

  const fetchLocationDetailsData = async (locationId) => {
    try {
      const response = await getLocationDetails(locationId);
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
        quantity: parseFloat(currentCapacity.quantity),
        uom_id: parseInt(currentCapacity.uom_id),
        eff_dt_from: currentCapacity.eff_dt_from,
        eff_dt_to: currentCapacity.eff_dt_to,
      };

      // Validate capacity (check for overlapping dates) - skip in edit mode
      if (!editMode) {
        try {
          await validateCapacity(data);
        } catch (validationErr) {
          setValidationError(
            validationErr.response?.data?.detail ||
              "Overlapping capacity record exists for this commodity and location in the given date range."
          );
          return;
        }
      }

      if (editMode) {
        await updateCapacity(currentCapacity.id, data);
      } else {
        await createCapacity(data);
      }
      handleCloseDialog();
      fetchCapacity();
    } catch (err) {
      setError("Failed to save capacity.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentCapacity((prev) => ({ ...prev, [name]: value }));

    // Auto-populate dependent data when commodity or location changes
    if (name === "commodity_id" && value) {
      fetchCommodityDetailsData(value);
    }
    if (name === "location_id" && value) {
      fetchLocationDetailsData(value);
    }
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
        <Typography variant="h4">Capacity</Typography>
        <Box display="flex" gap={2}>
          <ExportButton onExport={exportCapacity} label="Export Capacity" />
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Upload />}
            onClick={() => setOpenImportDialog(true)}
          >
            Import Capacity
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Capacity
          </Button>
        </Box>
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
            {capacity.map((item) => (
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
                    onClick={() => handleDelete(item.id)}
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
              {commodityDetails.uom && (
                <>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="UOM Type"
                    value={commodityDetails.uom.type || ""}
                    disabled
                    size="small"
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Base UOM"
                    value={commodityDetails.uom.base_uom || ""}
                    disabled
                    size="small"
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="UOM Description"
                    value={commodityDetails.uom.description || ""}
                    disabled
                    size="small"
                  />
                </>
              )}
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
              {locationDetails.parent_location && (
                <TextField
                  fullWidth
                  margin="dense"
                  label="Parent Location"
                  value={locationDetails.parent_location.name || ""}
                  disabled
                  size="small"
                />
              )}
              {locationDetails.counter_party && (
                <>
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Counter Party"
                    value={locationDetails.counter_party.LegalName || ""}
                    disabled
                    size="small"
                  />
                  <TextField
                    fullWidth
                    margin="dense"
                    label="Short Name"
                    value={locationDetails.counter_party.ShortName || ""}
                    disabled
                    size="small"
                  />
                </>
              )}
            </Box>
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Quantity"
            name="quantity"
            type="number"
            value={currentCapacity.quantity}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>UOM</InputLabel>
            <Select
              name="uom_id"
              value={currentCapacity.uom_id}
              onChange={handleInputChange}
              label="UOM"
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
            name="eff_dt_from"
            type="date"
            value={currentCapacity.eff_dt_from}
            onChange={handleInputChange}
            InputLabelProps={{ shrink: true }}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Effective To"
            name="eff_dt_to"
            type="date"
            value={currentCapacity.eff_dt_to}
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
}

export default Capacity;
