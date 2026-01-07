import { useState, useEffect } from "react";
import {
  Title,
  Button,
  Modal,
  ModalVariant,
  Form,
  FormGroup,
  TextInput,
  TextArea,
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
  getUOMs,
  createUOM,
  updateUOM,
  deleteUOM,
  exportUOMs,
  importUOMs,
} from "../api";
import { UOM, UOMFormData } from "../types";

const UOMs: React.FC = () => {
  const [uoms, setUOMs] = useState<UOM[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentUOM, setCurrentUOM] = useState<UOMFormData>({
    name: "",
    type: "",
    base_uom: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    fetchUOMs();
  }, []);

  const fetchUOMs = async () => {
    try {
      setLoading(true);
      const response = await getUOMs();
      setUOMs(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch UOMs.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (uom: UOM | null = null) => {
    if (uom) {
      setEditMode(true);
      setCurrentUOM({
        id: uom.id,
        name: uom.name || "",
        type: uom.type || "",
        base_uom: uom.base_uom?.toString() || "",
        description: uom.description || "",
        is_active: uom.is_active ?? true,
      });
    } else {
      setEditMode(false);
      setCurrentUOM({
        name: "",
        type: "",
        base_uom: "",
        description: "",
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
      const uomData = {
        ...currentUOM,
        base_uom:
          typeof currentUOM.base_uom === "string"
            ? currentUOM.base_uom
              ? parseFloat(currentUOM.base_uom)
              : undefined
            : currentUOM.base_uom,
      };

      if (editMode && currentUOM.id) {
        await updateUOM(currentUOM.id, uomData);
      } else {
        await createUOM(uomData);
      }
      handleCloseDialog();
      fetchUOMs();
    } catch (err) {
      setError("Failed to save UOM.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
    if (window.confirm("Are you sure you want to delete this UOM?")) {
      try {
        await deleteUOM(id);
        fetchUOMs();
      } catch (err) {
        setError("Failed to delete UOM.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (value: string, name: string) => {
    setCurrentUOM((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <Spinner size="xl" />;
  if (error) return <Alert variant={AlertVariant.danger} title={error} />;

  const columns: Column[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'type', title: 'Type' },
    { key: 'base_uom', title: 'Base UOM' },
    { key: 'description', title: 'Description' },
  ];

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <Title headingLevel="h1">Units of Measurement (UOMs)</Title>
      </div>

      <DataTable
        data={uoms}
        columns={columns}
        getRowId={(uom) => uom.id || 0}
        onEdit={handleOpenDialog}
        onDelete={(uom) => handleDelete(uom.id)}
        bulkActions={(selectedIds) => (
          <Button
            variant="danger"
            icon={<TrashIcon />}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.length} selected UOMs?`)) {
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
              <ExportButton onExport={exportUOMs} label="Export" />
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
                Add UOM
              </Button>
            </ActionListItem>
          </ActionList>
        }
      />

      <Modal
        variant={ModalVariant.medium}
        title={editMode ? "Edit UOM" : "Add UOM"}
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
              value={currentUOM.name}
              onChange={(_, value) => handleInputChange(value, "name")}
              isRequired
            />
          </FormGroup>
          <FormGroup label="Type" isRequired fieldId="type">
            <TextInput
              id="type"
              name="type"
              value={currentUOM.type}
              onChange={(_, value) => handleInputChange(value, "type")}
              isRequired
            />
          </FormGroup>
          <FormGroup label="Base Conversion" fieldId="base_uom">
            <TextInput
              id="base_uom"
              name="base_uom"
              type="number"
              value={currentUOM.base_uom}
              onChange={(_, value) => handleInputChange(value, "base_uom")}
            />
          </FormGroup>
          <FormGroup label="Description" isRequired fieldId="description">
            <TextArea
              id="description"
              name="description"
              value={currentUOM.description}
              onChange={(_, value) => handleInputChange(value, "description")}
              isRequired
            />
          </FormGroup>
        </Form>
      </Modal>

      <EnhancedImportDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={importUOMs}
        entityName="UOMs"
        entityKey="uoms"
        onSuccess={fetchUOMs}
        templateColumns={[
          "name",
          "type",
          "description",
          "base_uom",
          "is_active",
        ]}
      />
    </div>
  );
};

export default UOMs;
