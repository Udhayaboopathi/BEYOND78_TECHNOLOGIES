import React, { useState, useEffect } from "react";
import {
  Title,
  Button,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  TextArea,
  Checkbox,
  Alert,
  AlertVariant,
  Spinner,
  ActionList,
  ActionListItem,
  FormSelect,
  FormSelectOption,
} from "@patternfly/react-core";
import { PlusCircleIcon, UploadIcon, TrashIcon } from "@patternfly/react-icons";
import { DataTable, Column } from "./DataTable";
import ExportButton from "./ExportButton";
import EnhancedImportDialog from "./EnhancedImportDialog";
import {
  getCommodities,
  createCommodity,
  updateCommodity,
  deleteCommodity,
  getUOMs,
  exportCommodities,
  importCommodities,
} from "../api";
import { Commodity, UOM, CommodityFormData } from '../types';

const Commodities: React.FC = () => {
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [uoms, setUOMs] = useState<UOM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentCommodity, setCurrentCommodity] = useState<CommodityFormData>({
    name: "",
    description: "",
    uom_id: "",
    density: "",
    energy_uom: "",
    is_active: true,
  });

  useEffect(() => {
    fetchCommodities();
    fetchUOMs();
  }, []);

  const fetchUOMs = async () => {
    try {
      const response = await getUOMs();
      setUOMs(response.data);
    } catch (err) {
      console.error("Failed to fetch UOMs:", err);
    }
  };

  const fetchCommodities = async () => {
    try {
      setLoading(true);
      const response = await getCommodities();
      setCommodities(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch commodities.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (commodity: Commodity | null = null) => {
    if (commodity) {
      setEditMode(true);
      setCurrentCommodity({
        id: commodity.id,
        name: commodity.name || "",
        description: commodity.description || "",
        uom_id: commodity.uom_id || "",
        density: commodity.density?.toString() || "",
        energy_uom: commodity.energy_uom || "",
        is_active: commodity.is_active ?? true,
      });
    } else {
      setEditMode(false);
      setCurrentCommodity({
        name: "",
        description: "",
        uom_id: "",
        density: "",
        energy_uom: "",
        is_active: true,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      const commodityData = {
        ...currentCommodity,
        uom_id: typeof currentCommodity.uom_id === 'string' 
          ? parseInt(currentCommodity.uom_id) 
          : currentCommodity.uom_id,
        density: typeof currentCommodity.density === 'string' 
          ? (currentCommodity.density ? parseFloat(currentCommodity.density) : undefined)
          : currentCommodity.density,
      };
      
      if (editMode && currentCommodity.id) {
        await updateCommodity(currentCommodity.id, commodityData);
      } else {
        await createCommodity(commodityData);
      }
      handleCloseDialog();
      fetchCommodities();
    } catch (err) {
      setError("Failed to save commodity.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this commodity?")) {
      try {
        await deleteCommodity(id);
        fetchCommodities();
      } catch (err) {
        setError("Failed to delete commodity.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (value: string, name: string) => {
    setCurrentCommodity((prev: CommodityFormData) => ({
      ...prev,
      [name]: name === "density" ? parseFloat(value) : value,
    }));
  };

  if (loading) return <Spinner size="xl" />;
  if (error) return <Alert variant={AlertVariant.danger} title={error} />;

  const columns: Column[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'description', title: 'Description' },
    { key: 'uom', title: 'UOM' },
    { key: 'density', title: 'Density' },
    { key: 'energy_uom', title: 'Energy UOM' },
    { key: 'is_active', title: 'Is Active' },
  ];

  const renderCell = (commodity: Commodity, columnKey: string) => {
    switch (columnKey) {
      case 'uom':
        return commodity.uom?.name || commodity.uom_id;
      case 'is_active':
        return commodity.is_active ? 'Yes' : 'No';
      default:
        return (commodity as any)[columnKey];
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <Title headingLevel="h1">Commodities</Title>
      </div>

      <DataTable
        data={commodities}
        columns={columns}
        getRowId={(commodity) => commodity.id || 0}
        onEdit={handleOpenDialog}
        onDelete={(commodity) => handleDelete(commodity.id)}
        renderCell={renderCell}
        bulkActions={(selectedIds) => (
          <Button
            variant="danger"
            icon={<TrashIcon />}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.length} selected commodities?`)) {
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
                onExport={exportCommodities}
                label="Export"
              />
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
                Add Commodity
              </Button>
            </ActionListItem>
          </ActionList>
        }
      />

      <Modal
        variant={ModalVariant.medium}
        title={editMode ? "Edit Commodity" : "Add Commodity"}
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
        <Form>
          <FormGroup label="Name" isRequired fieldId="name">
            <TextInput
              id="name"
              name="name"
              value={currentCommodity.name}
              onChange={(_, value) => handleInputChange(value, "name")}
              isRequired
            />
          </FormGroup>
          <FormGroup label="Description" isRequired fieldId="description">
            <TextArea
              id="description"
              name="description"
              value={currentCommodity.description}
              onChange={(_, value) => handleInputChange(value, "description")}
              isRequired
              rows={3}
            />
          </FormGroup>
          <FormGroup label="UOM" isRequired fieldId="uom_id">
            <FormSelect
              id="uom_id"
              name="uom_id"
              value={currentCommodity.uom_id.toString()}
              onChange={(_, value) => handleInputChange(value, "uom_id")}
              isRequired
            >
              <FormSelectOption key="empty" value="" label="Select UOM" isDisabled />
              {uoms.map((uom) => (
                <FormSelectOption key={uom.id} value={uom.id?.toString() || ""} label={uom.name || ""} />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup label="Density" isRequired fieldId="density">
            <TextInput
              id="density"
              name="density"
              type="number"
              value={currentCommodity.density}
              onChange={(_, value) => handleInputChange(value, "density")}
              isRequired
            />
          </FormGroup>
          <FormGroup label="Energy UOM" isRequired fieldId="energy_uom">
            <FormSelect
              id="energy_uom"
              name="energy_uom"
              value={currentCommodity.energy_uom}
              onChange={(_, value) => handleInputChange(value, "energy_uom")}
              isRequired
            >
              <FormSelectOption key="empty" value="" label="Select Energy UOM" isDisabled />
              {uoms.map((uom) => (
                <FormSelectOption key={uom.id} value={uom.name || ""} label={uom.name || ""} />
              ))}
            </FormSelect>
          </FormGroup>
          <FormGroup fieldId="is_active">
            <Checkbox
              id="is_active"
              name="is_active"
              label="Is Active"
              isChecked={currentCommodity.is_active}
              onChange={(_, checked) =>
                setCurrentCommodity((prev: CommodityFormData) => ({
                  ...prev,
                  is_active: checked,
                }))
              }
            />
          </FormGroup>
        </Form>
      </Modal>

      <EnhancedImportDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={importCommodities}
        entityName="Commodities"
        entityKey="commodities"
        onSuccess={fetchCommodities}
        templateColumns={['name', 'description', 'uom', 'density', 'energy_uom', 'is_active']}
      />
    </div>
  );
}

export default Commodities;
