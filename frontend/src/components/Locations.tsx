import { useState, useEffect } from "react";
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
  SelectChangeEvent,
  Grid,
} from "@mui/material";
import { Add, Edit, Delete, Upload, Refresh } from "@mui/icons-material";
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
  
  // Filter states
  const [filterName, setFilterName] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setCurrentLocation((prev) => ({ ...prev, [name]: value }));
  };

  // Filter locations
  const filteredLocations = locations.filter((location) => {
    const matchesName = filterName === "" || 
      location.name?.toLowerCase().includes(filterName.toLowerCase());
    const matchesType = filterType === "" || location.type === filterType;
    return matchesName && matchesType;
  });

  const handleClearFilters = () => {
    setFilterName("");
    setFilterType("");
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Typography variant="h4" mb={2}>Locations</Typography>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              size="small"
              label="Filter: Name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter: Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Filter: Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Port">Port</MenuItem>
                <MenuItem value="Pipeline">Pipeline</MenuItem>
                <MenuItem value="Storage">Storage</MenuItem>
                <MenuItem value="Refinery">Refinery</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button size="small" variant="outlined" onClick={handleClearFilters}>
                Clear filters
              </Button>
              <Button size="small" variant="contained" onClick={() => handleOpenDialog()}>
                New
              </Button>
              <IconButton size="small" color="primary" onClick={fetchLocations} title="Refresh">
                <Refresh />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <ExportButton onExport={exportLocations} label="Export Locations" />
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Upload />}
          onClick={() => setOpenImportDialog(true)}
        >
          Import Locations
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Parent Counterparty</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredLocations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.id}</TableCell>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.type}</TableCell>
                <TableCell>{location.description}</TableCell>
                <TableCell>
                  {location.parent_id ? `Parent ID: ${location.parent_id}` : "N/A"}
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(location)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(location.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>{editMode ? "Edit Location" : "Add Location"}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            name="name"
            value={currentLocation.name}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Type</InputLabel>
            <Select
              name="type"
              value={currentLocation.type}
              onChange={(e) => setCurrentLocation(prev => ({ ...prev, type: e.target.value }))}
              label="Type"
            >
              <MenuItem value="Port">Port</MenuItem>
              <MenuItem value="Pipeline">Pipeline</MenuItem>
              <MenuItem value="Storage">Storage</MenuItem>
              <MenuItem value="Refinery">Refinery</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            value={currentLocation.description}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Parent Counterparty</InputLabel>
            <Select
              name="parent_contvarcharerpartu_id"
              value={currentLocation.parent_contvarcharerpartu_id || ''}
              onChange={(e) => setCurrentLocation((prev) => ({ ...prev, parent_contvarcharerpartu_id: Number(e.target.value) }))}
              label="Parent Counterparty"
            >
              {counterParties.map((cp) => (
                <MenuItem
                  key={cp.CounterpartyID}
                  value={cp.CounterpartyID}
                >
                  {cp.LegalName}
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
