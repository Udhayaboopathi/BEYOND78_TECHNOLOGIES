import { useState, useEffect } from "react";
import {
  Title,
  Button,
  Modal,
  ModalVariant,
  TextInput,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Alert,
  AlertVariant,
  Spinner,
  ActionList,
  ActionListItem,
} from "@patternfly/react-core";
import { PlusCircleIcon, TrashIcon } from "@patternfly/react-icons";
import { DataTable, Column } from "./DataTable";
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

  const handleInputChange = (value: string, name: string) => {
    setCurrentComponent((prev) => ({ ...prev, [name]: value }));

    // Auto-populate dependent data when commodity changes
    if (name === "commodity_id" && value) {
      fetchCommodityDetailsData(value);
    }

    // Recalculate proportion total when blend changes
    if (name === "blend_id" && value) {
      calculateProportionTotal(value, editMode && currentComponent.id ? currentComponent.id : null);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant={AlertVariant.danger} title={error} />;

  const columns: Column[] = [
    { key: 'id', title: 'ID' },
    { key: 'blend', title: 'Blend' },
    { key: 'commodity', title: 'Commodity' },
    { key: 'proportion', title: 'Proportion' },
  ];

  const renderCell = (component: BlendComponent, columnKey: string) => {
    switch (columnKey) {
      case 'blend':
        return component.blend?.name || `ID: ${component.blend_id}`;
      case 'commodity':
        return component.commodity?.name || `ID: ${component.commodity_id}`;
      default:
        return (component as any)[columnKey];
    }
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <Title headingLevel="h1">Blend Components</Title>
      </div>

      <DataTable
        data={components}
        columns={columns}
        getRowId={(component) => component.id || 0}
        onEdit={handleOpenDialog}
        onDelete={(component) => handleDelete(component.id)}
        renderCell={renderCell}
        bulkActions={(selectedIds) => (
          <Button
            variant="danger"
            icon={<TrashIcon />}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.length} selected blend components?`)) {
                selectedIds.forEach(id => handleDelete(id as number));
              }
            }}
          >
            Delete Selected ({selectedIds.length})
          </Button>
        )}
        actions={
          <ActionList>
            <ActionListItem>
              <ExportButton
                onExport={exportBlendComponents}
                filename="blend_components.csv"
                label="Export"
              />
            </ActionListItem>
            <ActionListItem>
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Component
              </Button>
            </ActionListItem>
          </ActionList>
        }
      />

      <Modal
        variant={ModalVariant.medium}
        title={editMode ? "Edit Blend Component" : "Add Blend Component"}
        isOpen={openDialog}
        onClose={handleCloseDialog}
        actions={[
          <Button key="save" variant="primary" onClick={handleSave}>
            {editMode ? "Update" : "Create"}
          </Button>,
          <Button key="cancel" variant="link" onClick={handleCloseDialog}>
            Cancel
          </Button>,
        ]}
      >
        <FormGroup label="Blend" isRequired fieldId="blend_id">
          <FormSelect
            value={currentComponent.blend_id}
            onChange={(event, value) => handleInputChange(value, "blend_id")}
            aria-label="Blend"
          >
            <FormSelectOption key="placeholder" value="" label="Select blend" isDisabled />
            {blends.map((blend) => (
              <FormSelectOption
                key={blend.id}
                value={blend.id}
                label={blend.name}
              />
            ))}
          </FormSelect>
        </FormGroup>

        {/* Proportion Total Display */}
        {currentComponent.blend_id && (
          <Alert
            variant={AlertVariant.info}
            title={`Current Total for this Blend: ${(proportionTotal * 100).toFixed(2)}% - Remaining: ${((1 - proportionTotal) * 100).toFixed(2)}%`}
            style={{ marginTop: "1rem" }}
          />
        )}

        <FormGroup label="Commodity" isRequired fieldId="commodity_id">
          <FormSelect
            value={currentComponent.commodity_id}
            onChange={(event, value) => handleInputChange(value, "commodity_id")}
            aria-label="Commodity"
          >
            <FormSelectOption key="placeholder" value="" label="Select commodity" isDisabled />
            {commodities.map((commodity) => (
              <FormSelectOption
                key={commodity.id}
                value={commodity.id}
                label={commodity.name}
              />
            ))}
          </FormSelect>
        </FormGroup>

        {/* Auto-populated Read-Only Commodity Details */}
        {commodityDetails && (
          <div
            style={{ backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "4px", marginTop: "1rem", marginBottom: "1rem" }}
          >
            <Title headingLevel="h6" style={{ color: "#06c", marginBottom: "0.5rem" }}>
              Commodity Details (Read-Only)
            </Title>
            <FormGroup label="Commodity Name" fieldId="commodity_name_readonly">
              <TextInput
                type="text"
                id="commodity_name_readonly"
                value={commodityDetails.name || ""}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Density" fieldId="density_readonly">
              <TextInput
                type="text"
                id="density_readonly"
                value={commodityDetails.density || ""}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="UOM" fieldId="uom_readonly">
              <TextInput
                type="text"
                id="uom_readonly"
                value={commodityDetails.uom || ""}
                isDisabled
              />
            </FormGroup>
          </div>
        )}

        <FormGroup
          label="Proportion (0-1, e.g., 0.5 for 50%)"
          isRequired
          fieldId="proportion"
          helperText={`Enter proportion as decimal (0-1). Currently entered: ${(
            parseFloat(currentComponent.proportion || '0') * 100
          ).toFixed(2)}%`}
        >
          <TextInput
            isRequired
            type="number"
            id="proportion"
            name="proportion"
            value={currentComponent.proportion}
            onChange={(event, value) => handleInputChange(value, "proportion")}
          />
        </FormGroup>

        {validationError && (
          <Alert variant={AlertVariant.danger} title={validationError} style={{ marginTop: "1rem" }} />
        )}
      </Modal>
    </div>
  );
};

export default BlendComponents;
