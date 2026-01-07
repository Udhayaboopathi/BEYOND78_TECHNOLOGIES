import { useState, useEffect } from "react";
import {
  Title,
  Button,
  TextInput,
  TextArea,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Alert,
  AlertVariant,
  Card,
  CardBody,
  Label,
  Divider,
} from "@patternfly/react-core";
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
} from "@patternfly/react-table";
import { PlusCircleIcon, TrashIcon, SaveIcon, TimesIcon } from "@patternfly/react-icons";
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
    <div style={{ padding: "1.5rem" }}>
      <Card>
        <CardBody>
          <Title headingLevel="h1" style={{ color: "#06c", marginBottom: "0.5rem" }}>
            Create New Blend
          </Title>
          <p style={{ color: "#6a6e73", marginBottom: "1.5rem" }}>
            Create a blend by defining its name, description, base commodity, and
            composition. The total of all proportions must equal exactly 100%.
          </p>

          <Divider style={{ marginBottom: "1.5rem", marginTop: "1.5rem" }} />

          {error && (
            <Alert
              variant={AlertVariant.danger}
              title={error}
              actionClose={{
                onClose: () => setError(null),
                'aria-label': 'Close error alert',
              }}
              style={{ marginBottom: "1.5rem" }}
            />
          )}

          <div style={{ display: "grid", gridTemplateColumns: "58% 42%", gap: "1.5rem" }}>
            {/* Left Column: Blend Information & Components */}
            <div>
              <Card style={{ marginBottom: "1.5rem" }}>
                <CardBody>
                  <Title headingLevel="h3" style={{ color: "#06c", marginBottom: "1rem" }}>
                    Blend Information
                  </Title>

                  <FormGroup
                    label="Blend Name"
                    isRequired
                    fieldId="blend_name"
                    validated={validationErrors.blendName ? "error" : "default"}
                    helperTextInvalid={validationErrors.blendName}
                  >
                    <TextInput
                      isRequired
                      type="text"
                      id="blend_name"
                      value={blendName}
                      onChange={(event, value) => setBlendName(value)}
                      validated={validationErrors.blendName ? "error" : "default"}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Blend Description"
                    isRequired
                    fieldId="blend_description"
                    validated={validationErrors.blendDescription ? "error" : "default"}
                    helperTextInvalid={validationErrors.blendDescription}
                  >
                    <TextArea
                      isRequired
                      id="blend_description"
                      value={blendDescription}
                      onChange={(event, value) => setBlendDescription(value)}
                      validated={validationErrors.blendDescription ? "error" : "default"}
                      rows={2}
                    />
                  </FormGroup>

                  <FormGroup
                    label="Base Commodity"
                    isRequired
                    fieldId="base_commodity"
                    validated={validationErrors.baseCommodityId ? "error" : "default"}
                    helperTextInvalid={validationErrors.baseCommodityId}
                  >
                    <FormSelect
                      value={baseCommodityId}
                      onChange={(event, value) => setBaseCommodityId(value)}
                      aria-label="Base Commodity"
                      validated={validationErrors.baseCommodityId ? "error" : "default"}
                    >
                      <FormSelectOption key="placeholder" value="" label="Select base commodity" isDisabled />
                      {commodities.map((commodity) => (
                        <FormSelectOption
                          key={commodity.id}
                          value={commodity.id}
                          label={commodity.name}
                        />
                      ))}
                    </FormSelect>
                  </FormGroup>
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "1rem",
                    }}
                  >
                    <Title headingLevel="h3" style={{ color: "#06c" }}>
                      Blend Components
                    </Title>
                    <Button
                      variant="secondary"
                      icon={<PlusCircleIcon />}
                      onClick={addComponent}
                    >
                      Add Component
                    </Button>
                  </div>

                  {validationErrors.components && (
                    <Alert
                      variant={AlertVariant.danger}
                      title={validationErrors.components}
                      style={{ marginBottom: "1rem" }}
                    />
                  )}

                  {validationErrors.duplicates && (
                    <Alert
                      variant={AlertVariant.danger}
                      title={validationErrors.duplicates}
                      style={{ marginBottom: "1rem" }}
                    />
                  )}

                  <Table aria-label="Components table" variant="compact">
                    <Thead>
                      <Tr>
                        <Th width={45}>
                          <strong>Commodity</strong>
                        </Th>
                        <Th width={30}>
                          <strong>Proportion</strong>
                        </Th>
                        <Th width={15} modifier="fitContent">
                          <strong>Percentage</strong>
                        </Th>
                        <Th width={10} modifier="fitContent">
                          <strong>Action</strong>
                        </Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {components.map((comp) => (
                        <Tr key={comp.id}>
                          <Td>
                            <FormSelect
                              value={comp.commodity_id}
                              onChange={(event, value) =>
                                updateComponent(
                                  comp.id,
                                  "commodity_id",
                                  value
                                )
                              }
                              validated={
                                validationErrors[
                                  `component_${comp.id}_commodity`
                                ]
                                  ? "error"
                                  : "default"
                              }
                              aria-label="Select commodity"
                            >
                              <FormSelectOption value="" label="Select commodity" isDisabled />
                              {commodities.map((commodity) => (
                                <FormSelectOption
                                  key={commodity.id}
                                  value={commodity.id}
                                  label={commodity.name}
                                />
                              ))}
                            </FormSelect>
                            {validationErrors[
                              `component_${comp.id}_commodity`
                            ] && (
                              <div style={{ fontSize: "0.75rem", color: "#c9190b", marginTop: "0.25rem" }}>
                                {
                                  validationErrors[
                                    `component_${comp.id}_commodity`
                                  ]
                                }
                              </div>
                            )}
                          </Td>
                          <Td>
                            <TextInput
                              type="number"
                              value={comp.proportion}
                              onChange={(event, value) =>
                                updateComponent(
                                  comp.id,
                                  "proportion",
                                  value
                                )
                              }
                              placeholder="0.00 - 1.00"
                              validated={
                                validationErrors[
                                  `component_${comp.id}_proportion`
                                ]
                                  ? "error"
                                  : "default"
                              }
                            />
                            {validationErrors[
                              `component_${comp.id}_proportion`
                            ] && (
                              <div style={{ fontSize: "0.75rem", color: "#c9190b", marginTop: "0.25rem" }}>
                                {
                                  validationErrors[
                                    `component_${comp.id}_proportion`
                                  ]
                                }
                              </div>
                            )}
                          </Td>
                          <Td modifier="fitContent">
                            <Label color={comp.proportion ? "blue" : "grey"}>
                              {(
                                parseFloat(comp.proportion || '0') * 100
                              ).toFixed(1)}%
                            </Label>
                          </Td>
                          <Td modifier="fitContent">
                            <Button
                              variant="plain"
                              icon={<TrashIcon />}
                              onClick={() => removeComponent(comp.id)}
                              isDisabled={components.length === 1}
                              isDanger
                              aria-label="Delete component"
                            />
                          </Td>
                        </Tr>
                      ))}
                      <Tr>
                        <Td colSpan={2}>
                          <strong>Total:</strong>
                        </Td>
                        <Td modifier="fitContent">
                          <Label
                            color={
                              Math.abs(totalProportion - 1.0) < 0.001
                                ? "green"
                                : "orange"
                            }
                          >
                            {(totalProportion * 100).toFixed(2)}%
                          </Label>
                        </Td>
                        <Td />
                      </Tr>
                    </Tbody>
                  </Table>

                  {validationErrors.totalProportion && (
                    <Alert
                      variant={AlertVariant.warning}
                      title={validationErrors.totalProportion}
                      style={{ marginTop: "1rem" }}
                    />
                  )}
                </CardBody>
              </Card>
            </div>

            {/* Right Column: Pie Chart & Validation Status */}
            <div>
              <Card style={{ marginBottom: "1.5rem" }}>
                <CardBody>
                  <Title headingLevel="h3" style={{ color: "#06c", marginBottom: "1rem" }}>
                    Composition Preview
                  </Title>
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
                    <Alert
                      variant={AlertVariant.info}
                      title="Add components with proportions to see the pie chart"
                    />
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardBody>
                  <Title headingLevel="h3" style={{ color: "#06c", marginBottom: "1rem" }}>
                    Validation Status
                  </Title>

                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {blendName.trim() ? (
                        <Label color="green">✓ Blend name</Label>
                      ) : (
                        <Label color="red">✗ Blend name</Label>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {blendDescription.trim() ? (
                        <Label color="green">✓ Description</Label>
                      ) : (
                        <Label color="red">✗ Description</Label>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {baseCommodityId ? (
                        <Label color="green">✓ Base commodity</Label>
                      ) : (
                        <Label color="red">✗ Base commodity</Label>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {components.every((c) => c.commodity_id) ? (
                        <Label color="green">✓ All commodities selected</Label>
                      ) : (
                        <Label color="red">✗ Select commodities</Label>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {components.every(
                        (c) => c.proportion && parseFloat(c.proportion) > 0
                      ) ? (
                        <Label color="green">✓ All proportions filled</Label>
                      ) : (
                        <Label color="red">✗ Fill proportions</Label>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {Math.abs(totalProportion - 1.0) < 0.001 ? (
                        <Label color="green">✓ Total = 100%</Label>
                      ) : (
                        <Label color="red">
                          ✗ Total = {(totalProportion * 100).toFixed(2)}%
                        </Label>
                      )}
                    </div>

                    <Divider style={{ marginTop: "1rem", marginBottom: "1rem" }} />

                    {isFormValid() ? (
                      <Alert
                        variant={AlertVariant.success}
                        title="✓ Ready to submit! All validations passed."
                      />
                    ) : (
                      <Alert
                        variant={AlertVariant.warning}
                        title="Please complete all required fields and ensure total proportion equals 100%"
                      />
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", marginTop: "2rem" }}>
            <Button
              variant="secondary"
              icon={<TimesIcon />}
              onClick={handleCancel}
              isDisabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<SaveIcon />}
              onClick={handleSubmit}
              isDisabled={!isFormValid() || loading}
            >
              {loading ? "Creating..." : "Create Blend"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
};

export default CreateBlend;
