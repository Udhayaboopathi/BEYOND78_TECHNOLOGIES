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
  Label,
  Card,
  CardBody,
  ActionList,
  ActionListItem,
} from "@patternfly/react-core";
import { Table, Thead, Tbody, Tr, Th, Td } from "@patternfly/react-table";
import {
  PlusCircleIcon,
  TrashIcon,
  EyeIcon,
  PlusCircleIcon as AddCircleIcon,
  UploadIcon,
} from "@patternfly/react-icons";
import { DataTable, Column } from "./DataTable";
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
import { Blend, BlendComponent, Commodity } from '../types';
import { useNavigate } from "react-router-dom";
import {
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF6B9D'];

const Blends: React.FC = () => {
  const navigate = useNavigate();
  const [blends, setBlends] = useState<Blend[]>([]);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [blendComponents, setBlendComponents] = useState<BlendComponent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [openViewDialog, setOpenViewDialog] = useState<boolean>(false);
  const [openImportDialog, setOpenImportDialog] = useState<boolean>(false);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [currentBlend, setCurrentBlend] = useState<{
    id?: number;
    name: string;
    description: string;
    uom?: string;
  }>({
    name: "",
    description: "",
    uom: "",
  });
  const [viewingBlend, setViewingBlend] = useState<Blend | null>(null);
  const [blendComposition, setBlendComposition] = useState<Array<{
    name: string;
    value: number;
    proportion: number;
  }>>([]);

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

  const handleViewBlend = (blend: Blend) => {
    setViewingBlend(blend);

    // Get all components for this blend
    const components = blendComponents.filter((c) => c.blend_id === blend.id!);

    // Prepare data for pie chart
    const chartData = components.map((component) => ({
      name: component.commodity?.name || `Commodity ${component.commodity_id}`,
      value: component.proportion * 100,
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

  const handleOpenDialog = (blend: Blend | null = null) => {
    if (blend) {
      setEditMode(true);
      setCurrentBlend({
        id: blend.id,
        name: blend.name || "",
        description: blend.description || "",
        uom: blend.uom || "",
      });
    } else {
      setEditMode(false);
      setCurrentBlend({ name: "", description: "", uom: "" });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSave = async () => {
    try {
      const data = {
        name: currentBlend.name,
        description: currentBlend.description,
        uom: currentBlend.uom,
      };
      if (editMode && currentBlend.id) {
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

  const handleDelete = async (id: number | undefined) => {
    if (!id) return;
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

  const handleInputChange = (value: string, name: string) => {
    setCurrentBlend((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <Spinner />;
  if (error) return <Alert variant={AlertVariant.danger} title={error} />;

  const columns: Column[] = [
    { key: 'id', title: 'ID' },
    { key: 'name', title: 'Name' },
    { key: 'description', title: 'Description' },
    { key: 'uom', title: 'Commodity' },
    { key: 'components', title: 'Components' },
    { key: 'view', title: 'View' },
  ];

  const renderCell = (blend: Blend, columnKey: string) => {
    switch (columnKey) {
      case 'uom':
        return blend.uom || 'N/A';
      case 'components': {
        const components = blendComponents.filter((c) => c.blend_id === blend.id);
        const totalProportion = components.reduce((sum, c) => sum + (c.proportion || 0), 0);
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Label color="blue" variant="outline">
              {components.length} commodities
            </Label>
            <Label color={Math.abs(totalProportion - 1) < 0.01 ? "green" : "orange"}>
              {(totalProportion * 100).toFixed(0)}%
            </Label>
          </div>
        );
      }
      case 'view':
        return (
          <Button
            variant="plain"
            icon={<EyeIcon />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewBlend(blend);
            }}
            aria-label="View Details"
          >
            View
          </Button>
        );
      default:
        return (blend as any)[columnKey];
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
        <Title headingLevel="h1">Blends</Title>
      </div>

      <DataTable
        data={blends}
        columns={columns}
        getRowId={(blend) => blend.id || 0}
        onEdit={handleOpenDialog}
        onDelete={(blend) => handleDelete(blend.id)}
        renderCell={renderCell}
        bulkActions={(selectedIds) => (
          <Button
            variant="danger"
            icon={<TrashIcon />}
            onClick={() => {
              if (window.confirm(`Delete ${selectedIds.length} selected blends?`)) {
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
              <ExportButton onExport={exportBlends} label="Export" />
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
                variant="success"
                icon={<AddCircleIcon />}
                onClick={() => navigate("/create-blend")}
              >
                Create Blend with Components
              </Button>
            </ActionListItem>
            <ActionListItem>
              <Button
                variant="primary"
                icon={<PlusCircleIcon />}
                onClick={() => handleOpenDialog()}
              >
                Quick Add Blend
              </Button>
            </ActionListItem>
          </ActionList>
        }
      />

      <Modal
        variant={ModalVariant.medium}
        title={editMode ? "Edit Blend" : "Add Blend"}
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
            value={currentBlend.name}
            onChange={(event, value) => handleInputChange(value, "name")}
          />
        </FormGroup>
        <FormGroup label="Description" isRequired fieldId="description">
          <TextInput
            isRequired
            type="text"
            id="description"
            name="description"
            value={currentBlend.description}
            onChange={(event, value) => handleInputChange(value, "description")}
          />
        </FormGroup>
        <FormGroup label="UOM" fieldId="uom">
          <FormSelect
            value={currentBlend.uom || ''}
            onChange={(event, value) => handleInputChange(value, "uom")}
            aria-label="UOM"
          >
            <FormSelectOption key="placeholder" value="" label="Select UOM" />
            {commodities.map((commodity) => (
              <FormSelectOption
                key={commodity.id}
                value={commodity.uom?.name || ''}
                label={commodity.uom?.name || 'N/A'}
              />
            ))}
          </FormSelect>
        </FormGroup>
      </Modal>

      {/* View Blend Details Dialog with Pie Chart */}
      <Modal
        variant={ModalVariant.large}
        title={`Blend Details: ${viewingBlend?.name}`}
        isOpen={openViewDialog}
        onClose={handleCloseViewDialog}
        actions={[
          <Button key="close" variant="primary" onClick={handleCloseViewDialog}>
            Close
          </Button>,
        ]}
      >
        {viewingBlend && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div>
              <Card>
                <CardBody>
                  <Title headingLevel="h3" style={{ color: "#06c", marginBottom: "1rem" }}>
                    Blend Information
                  </Title>
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.875rem", color: "#6a6e73", marginBottom: "0.25rem" }}>
                      ID
                    </div>
                    <div>{viewingBlend.id}</div>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.875rem", color: "#6a6e73", marginBottom: "0.25rem" }}>
                      Name
                    </div>
                    <div>{viewingBlend.name}</div>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.875rem", color: "#6a6e73", marginBottom: "0.25rem" }}>
                      Description
                    </div>
                    <div>{viewingBlend.description}</div>
                  </div>
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.875rem", color: "#6a6e73", marginBottom: "0.25rem" }}>
                      Unit of Measure
                    </div>
                    <div>{viewingBlend.uom || "N/A"}</div>
                  </div>
                </CardBody>
              </Card>

              <Card style={{ marginTop: "1rem" }}>
                <CardBody>
                  <Title headingLevel="h3" style={{ color: "#06c", marginBottom: "1rem" }}>
                    Composition Details
                  </Title>
                  <Table aria-label="Composition table" variant="compact">
                    <Thead>
                      <Tr>
                        <Th><strong>Commodity</strong></Th>
                        <Th modifier="fitContent"><strong>Proportion</strong></Th>
                        <Th modifier="fitContent"><strong>Percentage</strong></Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {blendComposition.map((item, index) => (
                        <Tr key={index}>
                          <Td>{item.name}</Td>
                          <Td modifier="fitContent">
                            {item.proportion.toFixed(4)}
                          </Td>
                          <Td modifier="fitContent">
                            <Label color="blue">
                              {item.value.toFixed(2)}%
                            </Label>
                          </Td>
                        </Tr>
                      ))}
                      <Tr>
                        <Td><strong>Total</strong></Td>
                        <Td modifier="fitContent">
                          <strong>
                            {blendComposition
                              .reduce(
                                (sum, item) =>
                                  sum + item.proportion,
                                0
                              )
                              .toFixed(4)}
                          </strong>
                        </Td>
                        <Td modifier="fitContent">
                          <Label
                            color={
                              Math.abs(
                                blendComposition.reduce(
                                  (sum, item) => sum + item.value,
                                  0
                                ) - 100
                              ) < 1
                                ? "green"
                                : "orange"
                            }
                          >
                            {blendComposition
                              .reduce((sum, item) => sum + item.value, 0)
                              .toFixed(2)}%
                          </Label>
                        </Td>
                      </Tr>
                    </Tbody>
                  </Table>
                </CardBody>
              </Card>
            </div>

            <div>
              <Card>
                <CardBody>
                  <Title headingLevel="h3" style={{ color: "#06c", marginBottom: "1rem" }}>
                    Composition Pie Chart
                  </Title>
                  {blendComposition.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <PieChart>
                        <Pie
                          data={blendComposition}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(entry: any) =>
                            `${entry.name}: ${entry.value.toFixed(1)}%`
                          }
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {blendComposition.map((_, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(value: any) => `${Number(value).toFixed(2)}%`}
                        />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value: any, entry: any) =>
                            `${value}: ${entry?.payload?.value?.toFixed(2) || 0}%`
                          }
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <Alert variant={AlertVariant.info} title="No components defined for this blend yet." />
                  )}
                </CardBody>
              </Card>

              {blendComposition.length > 0 && (
                <Card style={{ marginTop: "1rem" }}>
                  <CardBody>
                    <Title headingLevel="h3" style={{ color: "#06c", marginBottom: "1rem" }}>
                      Validation Status
                    </Title>
                    {Math.abs(
                      blendComposition.reduce(
                        (sum, item) => sum + item.value,
                        0
                      ) - 100
                    ) < 1 ? (
                      <Alert variant={AlertVariant.success} title="✓ Total proportion equals 100% - Blend is valid!" />
                    ) : (
                      <Alert
                        variant={AlertVariant.warning}
                        title={`⚠ Total proportion is ${blendComposition
                          .reduce((sum, item) => sum + item.value, 0)
                          .toFixed(2)}% - Should equal 100%`}
                      />
                    )}
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        )}
      </Modal>

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
};

export default Blends;
