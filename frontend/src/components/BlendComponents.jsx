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
import { Add, Edit, Delete } from "@mui/icons-material";
import ExportButton from "./ExportButton";
import {
  getBlendComponents,
  createBlendComponent,
  updateBlendComponent,
  deleteBlendComponent,
  getBlends,
  getCommodities,
  getCommodityDetails,
  validateBlendProportion,
  exportBlendComponents,
} from "../api";

function BlendComponents() {
  const [components, setComponents] = useState([]);
  const [blends, setBlends] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [validationError, setValidationError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentComponent, setCurrentComponent] = useState({
    blend_id: "",
    commodity_id: "",
    proportion: "",
  });

  // Auto-populated read-only fields
  const [commodityDetails, setCommodityDetails] = useState(null);
  const [proportionTotal, setProportionTotal] = useState(0);

  useEffect(() => {
    fetchComponents();
    fetchBlends();
    fetchCommodities();
  }, []);

  const fetchBlends = async () => {
    try {
      const response = await getBlends();
      setBlends(response.data);
    } catch (err) {
      console.error("Failed to fetch blends:", err);
    }
  };

  const fetchCommodities = async () => {
    try {
      const response = await getCommodities();
      setCommodities(response.data);
    } catch (err) {
      console.error("Failed to fetch commodities:", err);
    }
  };

  const fetchComponents = async () => {
    try {
      setLoading(true);
      const response = await getBlendComponents();
      setComponents(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch blend components.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (component = null) => {
    if (component) {
      setEditMode(true);
      setCurrentComponent({
        id: component.id,
        blend_id: component.blend_id,
        commodity_id: component.commodity_id,
        proportion: component.proportion,
      });
      // Load details for edit mode
      if (component.commodity_id)
        fetchCommodityDetailsData(component.commodity_id);
      if (component.blend_id)
        calculateProportionTotal(component.blend_id, component.id);
    } else {
      setEditMode(false);
      setCurrentComponent({ blend_id: "", commodity_id: "", proportion: "" });
      setCommodityDetails(null);
      setProportionTotal(0);
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

  const calculateProportionTotal = async (blendId, excludeId = null) => {
    try {
      // Calculate current total from components list
      const blendComponents = components.filter(
        (c) => c.blend_id === blendId && c.id !== excludeId
      );
      const total = blendComponents.reduce(
        (sum, c) => sum + parseFloat(c.proportion || 0),
        0
      );
      setProportionTotal(total);
    } catch (err) {
      console.error("Failed to calculate proportion total:", err);
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
        blend_id: parseInt(currentComponent.blend_id),
        commodity_id: parseInt(currentComponent.commodity_id),
        proportion: parseFloat(currentComponent.proportion),
      };

      // Validate proportion total (should equal 100% or 1.0)
      const currentProportion = parseFloat(currentComponent.proportion || 0);
      const existingTotal = editMode ? proportionTotal : proportionTotal;
      const newTotal = existingTotal + currentProportion;

      // Check if adding this would exceed 100% (allowing for small floating point errors)
      if (newTotal > 1.01) {
        setValidationError(
          `Total proportion cannot exceed 100%. Current total: ${(
            existingTotal * 100
          ).toFixed(2)}%, Adding: ${(currentProportion * 100).toFixed(
            2
          )}%, Would be: ${(newTotal * 100).toFixed(2)}%`
        );
        return;
      }

      if (editMode) {
        await updateBlendComponent(currentComponent.id, data);
      } else {
        await createBlendComponent(data);
      }
      handleCloseDialog();
      fetchComponents();
    } catch (err) {
      if (err.response?.data?.detail) {
        setValidationError(err.response.data.detail);
      } else {
        setError("Failed to save blend component.");
      }
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (
      window.confirm("Are you sure you want to delete this blend component?")
    ) {
      try {
        await deleteBlendComponent(id);
        fetchComponents();
      } catch (err) {
        setError("Failed to delete blend component.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentComponent((prev) => ({ ...prev, [name]: value }));

    // Auto-populate dependent data when commodity changes
    if (name === "commodity_id" && value) {
      fetchCommodityDetailsData(value);
    }

    // Recalculate proportion total when blend changes
    if (name === "blend_id" && value) {
      calculateProportionTotal(value, editMode ? currentComponent.id : null);
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
        <Typography variant="h4">Blend Components</Typography>
        <Box display="flex" gap={2}>
          <ExportButton
            onExport={exportBlendComponents}
            label="Export Blend Components"
          />
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Component
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Blend</TableCell>
              <TableCell>Commodity</TableCell>
              <TableCell>Proportion</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {components.map((component) => (
              <TableRow key={component.id}>
                <TableCell>{component.id}</TableCell>
                <TableCell>
                  {component.blend?.name || `ID: ${component.blend_id}`}
                </TableCell>
                <TableCell>
                  {component.commodity?.name || `ID: ${component.commodity_id}`}
                </TableCell>
                <TableCell>{component.proportion}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(component)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(component.id)}
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
          {editMode ? "Edit Blend Component" : "Add Blend Component"}
        </DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Blend</InputLabel>
            <Select
              name="blend_id"
              value={currentComponent.blend_id}
              onChange={handleInputChange}
              label="Blend"
            >
              {blends.map((blend) => (
                <MenuItem key={blend.id} value={blend.id}>
                  {blend.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Proportion Total Display */}
          {currentComponent.blend_id && (
            <Alert severity="info" sx={{ mt: 2 }}>
              <strong>Current Total for this Blend:</strong>{" "}
              {(proportionTotal * 100).toFixed(2)}%
              <br />
              <strong>Remaining:</strong>{" "}
              {((1 - proportionTotal) * 100).toFixed(2)}%
            </Alert>
          )}

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Commodity</InputLabel>
            <Select
              name="commodity_id"
              value={currentComponent.commodity_id}
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
                </>
              )}
            </Box>
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Proportion (0-1, e.g., 0.5 for 50%)"
            name="proportion"
            type="number"
            inputProps={{ step: "0.01", min: "0", max: "1" }}
            value={currentComponent.proportion}
            onChange={handleInputChange}
            helperText={`Enter proportion as decimal (0-1). Currently entered: ${(
              parseFloat(currentComponent.proportion || 0) * 100
            ).toFixed(2)}%`}
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
    </div>
  );
}

export default BlendComponents;
