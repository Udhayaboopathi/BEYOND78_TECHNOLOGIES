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
import { PlusCircleIcon, UploadIcon, TrashIcon } from "@patternfly/react-icons";
import { DataTable, Column } from "./DataTable";
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

  const handleInputChange = (value: string, name: string) => {
    setCurrentCapacity((prev) => ({ ...prev, [name]: value }));

    // Auto-populate dependent data when commodity or location changes
    if (name === "commodity_id" && value) {
      fetchCommodityDetailsData(value);
    }
    if (name === "location_id" && value) {
      fetchLocationDetailsData(value);
    }
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant={AlertVariant.danger} title={error} />;

  const columns: Column[] = [
    { key: 'id', title: 'ID' },
    { key: 'commodity', title: 'Commodity' },
    { key: 'location', title: 'Location' },
    { key: 'quantity', title: 'Quantity' },
    { key: 'uom', title: 'UOM' },
    { key: 'eff_dt_from', title: 'Effective From' },
    { key: 'eff_dt_to', title: 'Effective To' },
    { key: 'dt_last_modified', title: 'Last Modified' },
  ];

  const renderCell = (item: CapacityType, columnKey: string) => {
    switch (columnKey) {
      case 'commodity':
        return item.commodity?.name || `ID: ${item.commodity_id}`;
      case 'location':
        return item.location?.name || `ID: ${item.location_id}`;
      case 'uom':
        return item.uom?.name || `ID: ${item.uom_id}`;
      default:
        return (item as any)[columnKey];
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
        <Title headingLevel="h1">Capacity</Title>
      </div>

      <DataTable
        data={capacity}
        columns={columns}
        getRowId={(item) => item.id || 0}
        onEdit={handleOpenDialog}
        onDelete={(item) => handleDelete(item.id!)}
        renderCell={renderCell}
        bulkActions={(selectedIds) => (
          <Button
            variant="danger"
            icon={<TrashIcon />}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.length} selected capacity records?`)) {
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
              <ExportButton onExport={exportCapacity} filename="capacity.csv" label="Export" />
            </ActionListItem>
            <ActionListItem>
              <Button
                variant="secondary"
                icon={<UploadIcon />}
                onClick={() => setOpenImportDialog(true)}
              >
                Import
              </Button>
            </ActionListItem>
            <ActionListItem>
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => handleOpenDialog()}
              >
                Add Capacity
              </Button>
            </ActionListItem>
          </ActionList>
        }
      />

      <Modal
        variant={ModalVariant.medium}
        title={editMode ? "Edit Capacity" : "Add Capacity"}
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
        <FormGroup label="Commodity" isRequired fieldId="commodity_id">
          <FormSelect
            value={currentCapacity.commodity_id}
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
            <FormGroup label="Energy UOM" fieldId="energy_uom_readonly">
              <TextInput
                type="text"
                id="energy_uom_readonly"
                value={commodityDetails.energy_uom || ""}
                isDisabled
              />
            </FormGroup>
          </div>
        )}

        <FormGroup label="Location" isRequired fieldId="location_id">
          <FormSelect
            value={currentCapacity.location_id}
            onChange={(event, value) => handleInputChange(value, "location_id")}
            aria-label="Location"
          >
            <FormSelectOption key="placeholder" value="" label="Select location" isDisabled />
            {locations.map((location) => (
              <FormSelectOption
                key={location.id}
                value={location.id}
                label={location.name}
              />
            ))}
          </FormSelect>
        </FormGroup>

        {/* Auto-populated Read-Only Location Details */}
        {locationDetails && (
          <div
            style={{ backgroundColor: "#f5f5f5", padding: "1rem", borderRadius: "4px", marginTop: "1rem", marginBottom: "1rem" }}
          >
            <Title headingLevel="h6" style={{ color: "#06c", marginBottom: "0.5rem" }}>
              Location Details (Read-Only)
            </Title>
            <FormGroup label="Location Name" fieldId="location_name_readonly">
              <TextInput
                type="text"
                id="location_name_readonly"
                value={locationDetails.name || ""}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Location Type" fieldId="location_type_readonly">
              <TextInput
                type="text"
                id="location_type_readonly"
                value={locationDetails.type || ""}
                isDisabled
              />
            </FormGroup>
            <FormGroup label="Description" fieldId="location_description_readonly">
              <TextInput
                type="text"
                id="location_description_readonly"
                value={locationDetails.description || ""}
                isDisabled
              />
            </FormGroup>
          </div>
        )}

        <FormGroup label="Capacity Value" isRequired fieldId="capacity_value">
          <TextInput
            isRequired
            type="number"
            id="capacity_value"
            name="capacity_value"
            value={currentCapacity.capacity_value}
            onChange={(event, value) => handleInputChange(value, "capacity_value")}
          />
        </FormGroup>
        <FormGroup label="Capacity UOM" isRequired fieldId="capacity_uom">
          <FormSelect
            value={currentCapacity.capacity_uom}
            onChange={(event, value) => handleInputChange(value, "capacity_uom")}
            aria-label="Capacity UOM"
          >
            <FormSelectOption key="placeholder" value="" label="Select UOM" isDisabled />
            {uoms.map((uom) => (
              <FormSelectOption
                key={uom.id}
                value={uom.id}
                label={uom.name}
              />
            ))}
          </FormSelect>
        </FormGroup>
        <FormGroup label="Effective From" isRequired fieldId="effective_from">
          <TextInput
            isRequired
            type="date"
            id="effective_from"
            name="effective_from"
            value={currentCapacity.effective_from}
            onChange={(event, value) => handleInputChange(value, "effective_from")}
          />
        </FormGroup>
        <FormGroup label="Effective To" isRequired fieldId="effective_to">
          <TextInput
            isRequired
            type="date"
            id="effective_to"
            name="effective_to"
            value={currentCapacity.effective_to}
            onChange={(event, value) => handleInputChange(value, "effective_to")}
          />
        </FormGroup>
        {validationError && (
          <Alert variant={AlertVariant.danger} title={validationError} style={{ marginTop: "1rem" }} />
        )}
      </Modal>

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
