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
  exportBlendComponents,
} from "../api";
import { BlendComponent, Blend, Commodity } from '../types';

const BlendComponents: React.FC = () => {
  const [components, setComponents] = useState<BlendComponent[]>([]);
  const [blends, setBlends] = useState<Blend[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentComponent, setCurrentComponent] = useState<{
    id?: number;
    blend_id: string;
    commodity_id: string;
    proportion: string;
  }>({
    blend_id: "",
    commodity_id: "",
    proportion: "",
  });

  // Auto-populated read-only fields
  const [commodityDetails, setCommodityDetails] = useState<Commodity | null>(null);
  const [proportionTotal, setProportionTotal] = useState<number>(0);

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

  const handleOpenDialog = (component: BlendComponent | null = null) => {
    if (component) {
      setEditMode(true);
      setCurrentComponent({
        id: component.id,
        blend_id: component.blend_id.toString(),
        commodity_id: component.commodity_id.toString(),
        proportion: component.proportion.toString(),
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

  const fetchCommodityDetailsData = async (commodityId: string | number) => {
    try {
      const id = typeof commodityId === 'string' ? parseInt(commodityId) : commodityId;
      const response = await getCommodityDetails(id);
      setCommodityDetails(response.data);
    } catch (err) {
      console.error("Failed to fetch commodity details:", err);
    }
  };

  const calculateProportionTotal = async (blendId: string | number, excludeId: number | null = null) => {
    try {
      const id = typeof blendId === 'string' ? parseInt(blendId) : blendId;
      // Calculate current total from components list
      const blendComponents = components.filter(
        (c) => c.blend_id === id && c.id !== excludeId
      );
      const total = blendComponents.reduce(
        (sum, c) => sum + (c.proportion || 0),
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
      const proportionValue = typeof currentComponent.proportion === 'string' 
        ? parseFloat(currentComponent.proportion) 
        : currentComponent.proportion;
      
      const data = {
        blend_id: parseInt(currentComponent.blend_id),
        commodity_id: parseInt(currentComponent.commodity_id),
        proportion: proportionValue,
      };

      // Validate proportion total (should equal 100% or 1.0)
      const currentProportion = proportionValue || 0;
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

      if (editMode && currentComponent.id) {
        await updateBlendComponent(currentComponent.id, data);
      } else {
        await createBlendComponent(data);
      }
      handleCloseDialog();
      fetchComponents();
    } catch (err: any) {
      if (err?.response?.data?.detail) {
        setValidationError(err.response.data.detail);
      } else {
        setError("Failed to save blend component.");
      }
      console.error(err);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setCurrentComponent((prev) => ({ ...prev, [name as string]: value }));

    // Auto-populate dependent data when commodity changes
    if (name === "commodity_id" && value) {
      fetchCommodityDetailsData(value);
    }

    // Recalculate proportion total when blend changes
    if (name === "blend_id" && value) {
      calculateProportionTotal(value, editMode && currentComponent.id ? currentComponent.id : null);
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
            filename="blend_components.csv"
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
              <TextField
                fullWidth
                margin="dense"
                label="UOM"
                value={commodityDetails.uom || ""}
                disabled
                size="small"
              />
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
              parseFloat(currentComponent.proportion || '0') * 100
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
};

export default BlendComponents;
