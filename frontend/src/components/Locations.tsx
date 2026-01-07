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
import ExportButton from "./ExportButton";
import EnhancedImportDialog from "./EnhancedImportDialog";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  exportLocations,
  importLocations,
  getCounterParties,
} from "../api";
import { Location, LocationFormData, CounterParty } from '../types';

const Locations: React.FC = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [counterParties, setCounterParties] = useState<CounterParty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentLocation, setCurrentLocation] = useState<LocationFormData>({
    name: "",
    type: "",
    description: "",
    parent_contvarcharerpartu_id: 0,
  });

  useEffect(() => {
    fetchLocations();
    fetchCounterParties();
  }, []);

  const fetchLocations = async () => {
    try {
      setLoading(true);
      const response = await getLocations();
      setLocations(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch locations.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCounterParties = async () => {
    try {
      const response = await getCounterParties();
      setCounterParties(response.data);
    } catch (err) {
      console.error("Failed to fetch counter parties:", err);
    }
  };

  const handleOpenDialog = (location: Location | null = null) => {
    if (location) {
      setEditMode(true);
      setCurrentLocation({
        id: location.id,
        name: location.name || "",
        type: location.type || "",
        description: location.description || "",
        parent_contvarcharerpartu_id: location.parent_contvarcharerpartu_id || 0,
      });
    } else {
      setEditMode(false);
      setCurrentLocation({
        name: "",
        type: "",
        description: "",
        parent_contvarcharerpartu_id: 0,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      const data = {
        ...currentLocation,
        parent_id: currentLocation.parent_id ? parseInt(currentLocation.parent_id as string) : undefined,
      };
      if (editMode && currentLocation.id) {
        await updateLocation(currentLocation.id, data);
      } else {
        await createLocation(data);
      }
      handleCloseDialog();
      fetchLocations();
    } catch (err) {
      setError("Failed to save location.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this location?")) {
      try {
        await deleteLocation(id);
        fetchLocations();
      } catch (err) {
        setError("Failed to delete location.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (value: string, name: string) => {
    setCurrentLocation((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant={AlertVariant.danger} title={error} />;

  const columns: Column[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'type', title: 'Type' },
    { key: 'description', title: 'Description' },
    { key: 'parent_id', title: 'Parent Counterparty' },
  ];

  const renderCell = (location: Location, columnKey: string) => {
    if (columnKey === 'parent_id') {
      return location.parent_id ? `Parent ID: ${location.parent_id}` : 'N/A';
    }
    return (location as any)[columnKey];
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
        <Title headingLevel="h1">Locations</Title>
      </div>

      <DataTable
        data={locations}
        columns={columns}
        getRowId={(location) => location.id || 0}
        onEdit={handleOpenDialog}
        onDelete={(location) => handleDelete(location.id)}
        renderCell={renderCell}
        bulkActions={(selectedIds) => (
          <Button
            variant="danger"
            icon={<TrashIcon />}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.length} selected locations?`)) {
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
              <ExportButton onExport={exportLocations} label="Export" />
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
                Add Location
              </Button>
            </ActionListItem>
          </ActionList>
        }
      />

      <Modal
        variant={ModalVariant.medium}
        title={editMode ? "Edit Location" : "Add Location"}
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
        <FormGroup label="Name" isRequired fieldId="name">
          <TextInput
            isRequired
            type="text"
            id="name"
            name="name"
            value={currentLocation.name}
            onChange={(event, value) => handleInputChange(value, "name")}
          />
        </FormGroup>
        <FormGroup label="Type" isRequired fieldId="type">
          <TextInput
            isRequired
            type="text"
            id="type"
            name="type"
            value={currentLocation.type}
            onChange={(event, value) => handleInputChange(value, "type")}
          />
        </FormGroup>
        <FormGroup label="Description" isRequired fieldId="description">
          <TextInput
            isRequired
            type="text"
            id="description"
            name="description"
            value={currentLocation.description}
            onChange={(event, value) => handleInputChange(value, "description")}
          />
        </FormGroup>
        <FormGroup label="Parent Counterparty" isRequired fieldId="parent_contvarcharerpartu_id">
          <FormSelect
            value={currentLocation.parent_contvarcharerpartu_id || ''}
            onChange={(event, value) => setCurrentLocation((prev) => ({ ...prev, parent_contvarcharerpartu_id: Number(value) }))}
            aria-label="Parent Counterparty"
          >
            <FormSelectOption key="placeholder" value="" label="Select a counterparty" isDisabled />
            {counterParties.map((cp) => (
              <FormSelectOption
                key={cp.CounterpartyID}
                value={cp.CounterpartyID}
                label={cp.LegalName}
              />
            ))}
          </FormSelect>
        </FormGroup>
      </Modal>

      <EnhancedImportDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={importLocations}
        entityName="Locations"
        entityKey="locations"
        onSuccess={fetchLocations}
        templateColumns={['name', 'type', 'description', 'parent_id', 'country', 'region', 'is_active']}
      />
    </div>
  );
}

export default Locations;
