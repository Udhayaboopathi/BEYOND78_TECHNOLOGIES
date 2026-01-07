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
  getCounterParties,
  createCounterParty,
  updateCounterParty,
  deleteCounterParty,
  exportCounterParties,
  importCounterParties,
} from "../api";
import { CounterParty, CounterPartyFormData } from '../types';

const CounterParties: React.FC = () => {
  const [parties, setParties] = useState<CounterParty[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentParty, setCurrentParty] = useState<CounterPartyFormData>({
    legal_name: "",
    short_name: "",
    counterparty_code: "",
    country: "",
    type: "",
    credit_status: "",
    credit_limit: 0,
  });

  useEffect(() => {
    fetchCounterParties();
  }, []);

  const fetchCounterParties = async () => {
    try {
      setLoading(true);
      const response = await getCounterParties();
      setParties(response.data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch counter parties.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (party: CounterParty | null = null) => {
    if (party) {
      setEditMode(true);
      setCurrentParty({
        id: party.id,
        legal_name: party.legal_name || "",
        short_name: party.short_name || "",
        counterparty_code: party.counterparty_code || "",
        country: party.country || "",
        type: party.type || "",
        credit_status: party.credit_status || "",
        credit_limit: party.credit_limit || 0,
      });
    } else {
      setEditMode(false);
      setCurrentParty({
        legal_name: "",
        short_name: "",
        counterparty_code: "",
        country: "",
        type: "",
        credit_status: "",
        credit_limit: 0,
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
        legal_name: currentParty.legal_name,
        short_name: currentParty.short_name,
        counterparty_code: currentParty.counterparty_code,
        country: currentParty.country,
        type: currentParty.type,
        credit_status: currentParty.credit_status,
        credit_limit: typeof currentParty.credit_limit === 'string' ? parseFloat(currentParty.credit_limit) : currentParty.credit_limit,
      };
      if (editMode && currentParty.id) {
        await updateCounterParty(currentParty.id, data);
      } else {
        await createCounterParty(data);
      }
      handleCloseDialog();
      fetchCounterParties();
    } catch (err) {
      setError("Failed to save counter party.");
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this counter party?")) {
      try {
        await deleteCounterParty(id);
        fetchCounterParties();
      } catch (err) {
        setError("Failed to delete counter party.");
        console.error(err);
      }
    }
  };

  const handleInputChange = (value: string, name: string) => {
    setCurrentParty((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant={AlertVariant.danger} title={error} />;

  const columns: Column[] = [
    { key: 'id', title: 'ID' },
    { key: 'legal_name', title: 'Legal Name' },
    { key: 'short_name', title: 'Short Name' },
    { key: 'counterparty_code', title: 'Code' },
    { key: 'country', title: 'Country' },
    { key: 'type', title: 'Type' },
    { key: 'credit_status', title: 'Credit Status' },
    { key: 'credit_limit', title: 'Credit Limit' },
  ];

  const renderCell = (party: CounterParty, columnKey: string) => {
    if (columnKey === 'credit_limit') {
      return `$${party.credit_limit?.toLocaleString()}`;
    }
    return (party as any)[columnKey];
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
        <Title headingLevel="h1">Counter Parties</Title>
      </div>

      <DataTable
        data={parties}
        columns={columns}
        getRowId={(party) => party.id || 0}
        onEdit={handleOpenDialog}
        onDelete={(party) => handleDelete(party.id!)}
        renderCell={renderCell}
        bulkActions={(selectedIds) => (
          <Button
            variant="danger"
            icon={<TrashIcon />}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.length} selected counter parties?`)) {
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
                onExport={exportCounterParties}
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
                Add Counter Party
              </Button>
            </ActionListItem>
          </ActionList>
        }
      />

      <Modal
        variant={ModalVariant.medium}
        title={editMode ? "Edit Counter Party" : "Add Counter Party"}
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
        <FormGroup label="Legal Name" isRequired fieldId="legal_name">
          <TextInput
            isRequired
            type="text"
            id="legal_name"
            name="legal_name"
            value={currentParty.legal_name}
            onChange={(event, value) => handleInputChange(value, "legal_name")}
          />
        </FormGroup>
        <FormGroup label="Short Name" isRequired fieldId="short_name">
          <TextInput
            isRequired
            type="text"
            id="short_name"
            name="short_name"
            value={currentParty.short_name}
            onChange={(event, value) => handleInputChange(value, "short_name")}
          />
        </FormGroup>
        <FormGroup label="Code" isRequired fieldId="counterparty_code">
          <TextInput
            isRequired
            type="text"
            id="counterparty_code"
            name="counterparty_code"
            value={currentParty.counterparty_code}
            onChange={(event, value) => handleInputChange(value, "counterparty_code")}
          />
        </FormGroup>
        <FormGroup label="Country" isRequired fieldId="country">
          <TextInput
            isRequired
            type="text"
            id="country"
            name="country"
            value={currentParty.country}
            onChange={(event, value) => handleInputChange(value, "country")}
          />
        </FormGroup>
        <FormGroup label="Type" isRequired fieldId="type">
          <TextInput
            isRequired
            type="text"
            id="type"
            name="type"
            value={currentParty.type}
            onChange={(event, value) => handleInputChange(value, "type")}
          />
        </FormGroup>
        <FormGroup label="Credit Status" isRequired fieldId="credit_status">
          <FormSelect
            value={currentParty.credit_status}
            onChange={(event, value) => setCurrentParty((prev) => ({ ...prev, credit_status: value }))}
            aria-label="Credit Status"
          >
            <FormSelectOption key="placeholder" value="" label="Select status" isDisabled />
            <FormSelectOption value="Approved" label="Approved" />
            <FormSelectOption value="Under Review" label="Under Review" />
            <FormSelectOption value="Suspended" label="Suspended" />
            <FormSelectOption value="Rejected" label="Rejected" />
            <FormSelectOption value="Pending" label="Pending" />
          </FormSelect>
        </FormGroup>
        <FormGroup label="Credit Limit" isRequired fieldId="credit_limit">
          <TextInput
            isRequired
            type="number"
            id="credit_limit"
            name="credit_limit"
            value={currentParty.credit_limit}
            onChange={(event, value) => handleInputChange(value, "credit_limit")}
          />
        </FormGroup>
      </Modal>

      <EnhancedImportDialog
        open={openImportDialog}
        onClose={() => setOpenImportDialog(false)}
        onImport={importCounterParties}
        entityName="Counter Parties"
        entityKey="counter_parties"
        templateColumns={[
          "Legal Name",
          "Short Name",
          "Code",
          "Country",
          "Type",
          "Credit Status",
          "Credit Limit",
        ]}
        onSuccess={fetchCounterParties}
      />
    </div>
  );
}

export default CounterParties;
