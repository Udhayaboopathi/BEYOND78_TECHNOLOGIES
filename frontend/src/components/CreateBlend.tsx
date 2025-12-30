import { useState, useEffect } from "react";
import {
  Typography,
  Paper,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Alert,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
} from "@mui/material";
import { Add, Delete, Save, Cancel } from "@mui/icons-material";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getCommodities, createBlendWithComponents } from "../api";
import type { Commodity } from '../types';
import { useNavigate } from "react-router-dom";

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

const CreateBlend: React.FC = () => {
  const navigate = useNavigate();

  // Blend basic info
  const [blendName, setBlendName] = useState<string>("");
  const [blendDescription, setBlendDescription] = useState<string>("");
  const [baseCommodityId, setBaseCommodityId] = useState<string>("");

  // Components state
  const [components, setComponents] = useState<Array<{
    id: number;
    commodity_id: string;
    proportion: string;
  }>>([{ id: Date.now(), commodity_id: "", proportion: "" }]);

  // Master data
  const [commodities, setCommodities] = useState<Commodity[]>([]);

  // Validation and UI state
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [totalProportion, setTotalProportion] = useState<number>(0);
  const [chartData, setChartData] = useState<Array<{
    name: string;
    value: number;
    proportion: number;
  }>>([]);

  useEffect(() => {
    fetchCommodities();
  }, []);

  useEffect(() => {
    calculateTotal();
    updateChartData();
  }, [components, commodities]);

  const fetchCommodities = async () => {
    try {
      const response = await getCommodities();
      setCommodities(response.data);
    } catch (err) {
      setError("Failed to fetch commodities");
      console.error(err);
    }
  };

  const calculateTotal = () => {
    const total = components.reduce((sum, comp) => {
      const proportion = parseFloat(comp.proportion) || 0;
      return sum + proportion;
    }, 0);
    setTotalProportion(total);
  };

  const updateChartData = () => {
    const data = components
      .filter((comp) => comp.commodity_id && comp.proportion)
      .map((comp) => {
        const commodity = commodities.find(
          (c) => c.id === parseInt(comp.commodity_id)
        );
        return {
          name: commodity?.name || `Commodity ${comp.commodity_id}`,
          value: parseFloat(comp.proportion) * 100,
          proportion: parseFloat(comp.proportion),
        };
      });
    setChartData(data);
  };

  const addComponent = () => {
    setComponents([
      ...components,
      { id: Date.now(), commodity_id: "", proportion: "" },
    ]);
  };

  const removeComponent = (id: number) => {
    if (components.length > 1) {
      setComponents(components.filter((comp) => comp.id !== id));
    }
  };

  const updateComponent = (id: number, field: string, value: string) => {
    setComponents(
      components.map((comp) =>
        comp.id === id ? { ...comp, [field]: value } : comp
      )
    );
    // Clear validation errors when user makes changes
    setValidationErrors({});
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Validate blend name
    if (!blendName.trim()) {
      errors.blendName = "Blend name is required";
    }

    // Validate blend description
    if (!blendDescription.trim()) {
      errors.blendDescription = "Blend description is required";
    }

    // Validate base commodity
    if (!baseCommodityId) {
      errors.baseCommodityId = "Base commodity is required";
    }

    // Validate components
    const filledComponents = components.filter(
      (c) => c.commodity_id || c.proportion
    );

    if (filledComponents.length === 0) {
      errors.components = "At least one component is required";
    }

    // Check each component
    components.forEach((comp, _index) => {
      if (!comp.commodity_id) {
        errors[`component_${comp.id}_commodity`] = "Commodity is required";
      }
      if (!comp.proportion || parseFloat(comp.proportion) <= 0) {
        errors[`component_${comp.id}_proportion`] =
          "Proportion must be greater than 0";
      }
      if (parseFloat(comp.proportion) > 1) {
        errors[`component_${comp.id}_proportion`] =
          "Proportion cannot exceed 1.0 (100%)";
      }
    });

    // Check for duplicate commodities
    const commodityIds = components
      .filter((c) => c.commodity_id)
      .map((c) => c.commodity_id);
    const duplicates = commodityIds.filter(
      (id, index) => commodityIds.indexOf(id) !== index
    );
    if (duplicates.length > 0) {
      errors.duplicates =
        "Duplicate commodities found. Each commodity can only appear once.";
    }

    // Validate total proportion
    if (Math.abs(totalProportion - 1.0) > 0.001) {
      errors.totalProportion = `Total proportion must equal 100% (1.0). Current: ${(
        totalProportion * 100
      ).toFixed(2)}%`;
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      setError("Please fix all validation errors before submitting");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = {
        name: blendName,
        description: blendDescription,
        commodity_id: parseInt(baseCommodityId),
        components: components.map((comp) => ({
          commodity_id: parseInt(comp.commodity_id),
          proportion: parseFloat(comp.proportion),
        })),
      };

      const response = await createBlendWithComponents(data);

      // Success - redirect to blends list
      alert(
        `Blend "${response.data.name}" created successfully with ${components.length} components!`
      );
      navigate("/blends");
    } catch (err: any) {
      const errorMsg = err?.response?.data?.detail || "Failed to create blend";
      setError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (
      window.confirm(
        "Are you sure you want to cancel? All unsaved data will be lost."
      )
    ) {
      navigate("/blends");
    }
  };

  const isFormValid = (): boolean => {
    return (
      blendName.trim() !== '' &&
      blendDescription.trim() !== '' &&
      baseCommodityId !== '' &&
      components.every((c) => c.commodity_id && c.proportion) &&
      Math.abs(totalProportion - 1.0) < 0.001 &&
      Object.keys(validationErrors).length === 0
    );
  };

  return (
    <Box p={3}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom color="primary">
          Create New Blend
        </Typography>
        <Typography variant="body2" color="textSecondary" paragraph>
          Create a blend by defining its name, description, base commodity, and
          composition. The total of all proportions must equal exactly 100%.
        </Typography>

        <Divider sx={{ my: 3 }} />

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Left Column: Blend Information & Components */}
          <Grid item xs={12} md={7}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Blend Information
                </Typography>

                <TextField
                  fullWidth
                  label="Blend Name"
                  value={blendName}
                  onChange={(e) => setBlendName(e.target.value)}
                  error={!!validationErrors.blendName}
                  helperText={validationErrors.blendName}
                  required
                  margin="normal"
                />

                <TextField
                  fullWidth
                  label="Blend Description"
                  value={blendDescription}
                  onChange={(e) => setBlendDescription(e.target.value)}
                  error={!!validationErrors.blendDescription}
                  helperText={validationErrors.blendDescription}
                  required
                  margin="normal"
                  multiline
                  rows={2}
                />

                <FormControl
                  fullWidth
                  margin="normal"
                  required
                  error={!!validationErrors.baseCommodityId}
                >
                  <InputLabel>Base Commodity</InputLabel>
                  <Select
                    value={baseCommodityId}
                    onChange={(e) => setBaseCommodityId(e.target.value)}
                    label="Base Commodity"
                  >
                    {commodities.map((commodity) => (
                      <MenuItem key={commodity.id} value={commodity.id}>
                        {commodity.name}
                      </MenuItem>
                    ))}
                  </Select>
                  {validationErrors.baseCommodityId && (
                    <Typography
                      variant="caption"
                      color="error"
                      sx={{ mt: 0.5, ml: 1.5 }}
                    >
                      {validationErrors.baseCommodityId}
                    </Typography>
                  )}
                </FormControl>
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Box
                  display="flex"
                  justifyContent="space-between"
                  alignItems="center"
                  mb={2}
                >
                  <Typography variant="h6" color="primary">
                    Blend Components
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={addComponent}
                  >
                    Add Component
                  </Button>
                </Box>

                {validationErrors.components && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {validationErrors.components}
                  </Alert>
                )}

                {validationErrors.duplicates && (
                  <Alert severity="error" sx={{ mb: 2 }}>
                    {validationErrors.duplicates}
                  </Alert>
                )}

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="45%">
                          <strong>Commodity</strong>
                        </TableCell>
                        <TableCell width="30%">
                          <strong>Proportion</strong>
                        </TableCell>
                        <TableCell width="15%" align="right">
                          <strong>Percentage</strong>
                        </TableCell>
                        <TableCell width="10%" align="center">
                          <strong>Action</strong>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {components.map((comp) => (
                        <TableRow key={comp.id}>
                          <TableCell>
                            <FormControl
                              fullWidth
                              size="small"
                              error={
                                !!validationErrors[
                                  `component_${comp.id}_commodity`
                                ]
                              }
                            >
                              <Select
                                value={comp.commodity_id}
                                onChange={(e) =>
                                  updateComponent(
                                    comp.id,
                                    "commodity_id",
                                    e.target.value
                                  )
                                }
                                displayEmpty
                              >
                                <MenuItem value="" disabled>
                                  Select commodity
                                </MenuItem>
                                {commodities.map((commodity) => (
                                  <MenuItem
                                    key={commodity.id}
                                    value={commodity.id}
                                  >
                                    {commodity.name}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                            {validationErrors[
                              `component_${comp.id}_commodity`
                            ] && (
                              <Typography variant="caption" color="error">
                                {
                                  validationErrors[
                                    `component_${comp.id}_commodity`
                                  ]
                                }
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <TextField
                              fullWidth
                              size="small"
                              type="number"
                              inputProps={{ step: "0.01", min: "0", max: "1" }}
                              value={comp.proportion}
                              onChange={(e) =>
                                updateComponent(
                                  comp.id,
                                  "proportion",
                                  e.target.value
                                )
                              }
                              placeholder="0.00 - 1.00"
                              error={
                                !!validationErrors[
                                  `component_${comp.id}_proportion`
                                ]
                              }
                              helperText={
                                validationErrors[
                                  `component_${comp.id}_proportion`
                                ]
                              }
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={`${(
                                parseFloat(comp.proportion || '0') * 100
                              ).toFixed(1)}%`}
                              size="small"
                              color={comp.proportion ? "primary" : "default"}
                            />
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => removeComponent(comp.id)}
                              disabled={components.length === 1}
                            >
                              <Delete />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell colSpan={2} align="right">
                          <strong>Total:</strong>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`${(totalProportion * 100).toFixed(2)}%`}
                            color={
                              Math.abs(totalProportion - 1.0) < 0.001
                                ? "success"
                                : "warning"
                            }
                          />
                        </TableCell>
                        <TableCell />
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>

                {validationErrors.totalProportion && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    {validationErrors.totalProportion}
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column: Pie Chart & Validation Status */}
          <Grid item xs={12} md={5}>
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Composition Preview
                </Typography>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) =>
                          `${entry.name}: ${entry.value.toFixed(1)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {chartData.map((_entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${Number(value).toFixed(2)}%`} />
                      <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <Alert severity="info">
                    Add components with proportions to see the pie chart
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card variant="outlined">
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  Validation Status
                </Typography>

                <Box display="flex" flexDirection="column" gap={1}>
                  <Box display="flex" alignItems="center" gap={1}>
                    {blendName.trim() ? (
                      <Chip label="✓ Blend name" color="success" size="small" />
                    ) : (
                      <Chip label="✗ Blend name" color="error" size="small" />
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    {blendDescription.trim() ? (
                      <Chip
                        label="✓ Description"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip label="✗ Description" color="error" size="small" />
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    {baseCommodityId ? (
                      <Chip
                        label="✓ Base commodity"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="✗ Base commodity"
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    {components.every((c) => c.commodity_id) ? (
                      <Chip
                        label="✓ All commodities selected"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="✗ Select commodities"
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    {components.every(
                      (c) => c.proportion && parseFloat(c.proportion) > 0
                    ) ? (
                      <Chip
                        label="✓ All proportions filled"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label="✗ Fill proportions"
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>

                  <Box display="flex" alignItems="center" gap={1}>
                    {Math.abs(totalProportion - 1.0) < 0.001 ? (
                      <Chip
                        label="✓ Total = 100%"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        label={`✗ Total = ${(totalProportion * 100).toFixed(
                          2
                        )}%`}
                        color="error"
                        size="small"
                      />
                    )}
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {isFormValid() ? (
                    <Alert severity="success">
                      ✓ Ready to submit! All validations passed.
                    </Alert>
                  ) : (
                    <Alert severity="warning">
                      Please complete all required fields and ensure total
                      proportion equals 100%
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
          <Button
            variant="outlined"
            startIcon={<Cancel />}
            onClick={handleCancel}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Save />}
            onClick={handleSubmit}
            disabled={!isFormValid() || loading}
          >
            {loading ? "Creating..." : "Create Blend"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default CreateBlend;
