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
  Grid,
  Card,
  CardContent,
  Chip,
} from "@mui/material";
import {
  Add,
  Edit,
  Delete,
  Visibility,
  AddCircle,
  Upload,
} from "@mui/icons-material";
import ExportButton from "./ExportButton";
import ImportDialog from "./ImportDialog";
import {
  getBlends,
  createBlend,
  updateBlend,
  deleteBlend,
  getCommodities,
  getBlendComponents,
  exportBlends,
  importBlends,
} from "../api";
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function Blends() {
  const navigate = useNavigate();
  const [blends, setBlends] = useState([]);
  const [commodities, setCommodities] = useState([]);
  const [blendComponents, setBlendComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentBlend, setCurrentBlend] = useState({
    name: "",
    description: "",
    commodity_id: "",
  });
  const [viewingBlend, setViewingBlend] = useState(null);
  const [blendComposition, setBlendComposition] = useState([]);

  useEffect(() => {
    fetchBlends();
    fetchCommodities();
    fetchBlendComponents();
  }, []);

  const fetchCommodities = async () => {
    try {
      const response = await getCommodities();
      setCommodities(response.data);
    } catch (err) {
      console.error("Failed to fetch commodities:", err);
    }
  };

  const fetchBlendComponents = async () => {
    try {
      const response = await getBlendComponents();
      setBlendComponents(response.data);
    } catch (err) {
      console.error("Failed to fetch blend components:", err);
    }
  };

  const handleViewBlend = (blend) => {
    setViewingBlend(blend);

    // Get all components for this blend
    const components = blendComponents.filter((c) => c.blend_id === blend.id);

    // Prepare data for pie chart
    const chartData = components.map((component) => ({
      name: component.commodity?.name || `Commodity ${component.commodity_id}`,
      value: parseFloat(component.proportion) * 100,
      proportion: component.proportion,
    }));

    setBlendComposition(chartData);
    setOpenViewDialog(true);
  };

  const handleCloseViewDialog = () => {
    setOpenViewDialog(false);
    setViewingBlend(null);
    setBlendComposition([]);
  };

  const fetchBlends = async () => {
    try {
      setLoading(true);
      const response = await getBlends();
      setBlends(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch blends.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (blend = null) => {
    if (blend) {
      setEditMode(true);
      setCurrentBlend({
        id: blend.id,
        name: blend.name,
        description: blend.description,
        commodity_id: blend.commodity_id,
      });
    } else {
      setEditMode(false);
      setCurrentBlend({ name: "", description: "", commodity_id: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...currentBlend,
        commodity_id: parseInt(currentBlend.commodity_id),
      };
      if (editMode) {
        await updateBlend(currentBlend.id, data);
      } else {
        await createBlend(data);
      }
      handleCloseDialog();
      fetchBlends();
    } catch (err) {
      setError("Failed to save blend.");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this blend?")) {
      try {
        await deleteBlend(id);
        fetchBlends();
      } catch (err) {
        setError("Failed to delete blend.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBlend((prev) => ({ ...prev, [name]: value }));
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
        <Typography variant="h4">Blends</Typography>
        <Box display="flex" gap={2}>
          <ExportButton onExport={exportBlends} label="Export Blends" />
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Upload />}
            onClick={() => setOpenImportDialog(true)}
          >
            Import Blends
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<AddCircle />}
            onClick={() => navigate("/create-blend")}
          >
            Create Blend with Components
          </Button>
          <Button
            variant="outlined"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Quick Add Blend
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
              <TableCell>Commodity</TableCell>
              <TableCell>Components</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {blends.map((blend) => {
              const components = blendComponents.filter(
                (c) => c.blend_id === blend.id
              );
              const totalProportion = components.reduce(
                (sum, c) => sum + parseFloat(c.proportion || 0),
                0
              );

              return (
                <TableRow key={blend.id}>
                  <TableCell>{blend.id}</TableCell>
                  <TableCell>{blend.name}</TableCell>
                  <TableCell>{blend.description}</TableCell>
                  <TableCell>
                    {blend.commodity?.name || `ID: ${blend.commodity_id}`}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Chip
                        label={`${components.length} commodities`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      <Chip
                        label={`${(totalProportion * 100).toFixed(0)}%`}
                        size="small"
                        color={
                          Math.abs(totalProportion - 1) < 0.01
                            ? "success"
                            : "warning"
                        }
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      color="info"
                      onClick={() => handleViewBlend(blend)}
                      title="View Details & Chart"
                    >
                      <Visibility />
                    </IconButton>
                    <IconButton
                      color="primary"
                      onClick={() => handleOpenDialog(blend)}
                    >
                      <Edit />
                    </IconButton>
                    <IconButton
                      color="error"
                      onClick={() => handleDelete(blend.id)}
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editMode ? "Edit Blend" : "Add Blend"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            name="name"
            value={currentBlend.name}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={currentBlend.description}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Commodity</InputLabel>
            <Select
              name="commodity_id"
              value={currentBlend.commodity_id}
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
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained" color="primary">
            {editMode ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Blend Details Dialog with Pie Chart */}
      <Dialog
        open={openViewDialog}
        onClose={handleCloseViewDialog}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Blend Details: {viewingBlend?.name}</DialogTitle>
        <DialogContent>
          {viewingBlend && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Blend Information
                    </Typography>
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        ID
                      </Typography>
                      <Typography variant="body1">{viewingBlend.id}</Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Name
                      </Typography>
                      <Typography variant="body1">
                        {viewingBlend.name}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Description
                      </Typography>
                      <Typography variant="body1">
                        {viewingBlend.description}
                      </Typography>
                    </Box>
                    <Box mb={2}>
                      <Typography variant="subtitle2" color="textSecondary">
                        Base Commodity
                      </Typography>
                      <Typography variant="body1">
                        {viewingBlend.commodity?.name ||
                          `ID: ${viewingBlend.commodity_id}`}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                <Card sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Composition Details
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>
                              <strong>Commodity</strong>
                            </TableCell>
                            <TableCell align="right">
                              <strong>Proportion</strong>
                            </TableCell>
                            <TableCell align="right">
                              <strong>Percentage</strong>
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {blendComposition.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{item.name}</TableCell>
                              <TableCell align="right">
                                {parseFloat(item.proportion).toFixed(4)}
                              </TableCell>
                              <TableCell align="right">
                                <Chip
                                  label={`${item.value.toFixed(2)}%`}
                                  size="small"
                                  color="primary"
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                          <TableRow>
                            <TableCell>
                              <strong>Total</strong>
                            </TableCell>
                            <TableCell align="right">
                              <strong>
                                {blendComposition
                                  .reduce(
                                    (sum, item) =>
                                      sum + parseFloat(item.proportion),
                                    0
                                  )
                                  .toFixed(4)}
                              </strong>
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${blendComposition
                                  .reduce((sum, item) => sum + item.value, 0)
                                  .toFixed(2)}%`}
                                color={
                                  Math.abs(
                                    blendComposition.reduce(
                                      (sum, item) => sum + item.value,
                                      0
                                    ) - 100
                                  ) < 1
                                    ? "success"
                                    : "warning"
                                }
                              />
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary">
                      Composition Pie Chart
                    </Typography>
                    {blendComposition.length > 0 ? (
                      <ResponsiveContainer width="100%" height={400}>
                        <PieChart>
                          <Pie
                            data={blendComposition}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) =>
                              `${entry.name}: ${entry.value.toFixed(1)}%`
                            }
                            outerRadius={120}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {blendComposition.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            formatter={(value) => `${value.toFixed(2)}%`}
                          />
                          <Legend
                            verticalAlign="bottom"
                            height={36}
                            formatter={(value, entry) =>
                              `${value}: ${entry.payload.value.toFixed(2)}%`
                            }
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <Alert severity="info">
                        No components defined for this blend yet.
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {blendComposition.length > 0 && (
                  <Card sx={{ mt: 2 }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom color="primary">
                        Validation Status
                      </Typography>
                      {Math.abs(
                        blendComposition.reduce(
                          (sum, item) => sum + item.value,
                          0
                        ) - 100
                      ) < 1 ? (
                        <Alert severity="success">
                          ✓ Total proportion equals 100% - Blend is valid!
                        </Alert>
                      ) : (
                        <Alert severity="warning">
                          ⚠ Total proportion is{" "}
                          {blendComposition
                            .reduce((sum, item) => sum + item.value, 0)
                            .toFixed(2)}
                          % - Should equal 100%
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseViewDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      <ImportDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={importBlends}
        title="Import Blends"
        templateColumns={[
          "Blend Name",
          "Blend Description",
          "Base Commodity Name",
          "Component Commodity Name",
          "Component Proportion (%)",
        ]}
      />
    </div>
  );
}

// Colors for pie chart
const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
];

export default Blends;
