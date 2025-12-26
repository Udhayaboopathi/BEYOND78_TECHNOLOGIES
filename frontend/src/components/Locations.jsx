import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Add, Edit, Delete, Upload } from "@mui/icons-material";
import ExportButton from "./ExportButton";
import EnhancedImportDialog from "./EnhancedImportDialog";
import {
  getLocations,
  createLocation,
  updateLocation,
  deleteLocation,
  getCounterParties,
  exportLocations,
  importLocations,
} from "../api";

function Locations() {
  const [locations, setLocations] = useState([]);
  const [counterParties, setCounterParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentLocation, setCurrentLocation] = useState({
    name: "",
    type: "",
    description: "",
    parent_contvarcharerpartu_id: "",
  });

  useEffect(() => {
    fetchLocations();
    fetchCounterParties();
  }, []);

  const fetchCounterParties = async () => {
    try {
      const response = await getCounterParties();
      setCounterParties(response.data);
    } catch (err) {
      console.error("Failed to fetch counter parties:", err);
    }
  };

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

  const handleOpenDialog = (location = null) => {
    if (location) {
      setEditMode(true);
      setCurrentLocation({
        id: location.id,
        name: location.name,
        type: location.type,
        description: location.description,
        parent_contvarcharerpartu_id: location.parent_contvarcharerpartu_id,
      });
    } else {
      setEditMode(false);
      setCurrentLocation({
        name: "",
        type: "",
        description: "",
        parent_contvarcharerpartu_id: "",
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
        parent_contvarcharerpartu_id: parseInt(
          currentLocation.parent_contvarcharerpartu_id
        ),
      };
      if (editMode) {
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

  const handleDelete = async (id) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentLocation((prev) => ({ ...prev, [name]: value }));
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h4">Locations</Typography>
        <Box display="flex" gap={2}>
          <ExportButton onExport={exportLocations} label="Export Locations" />
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Upload />}
            onClick={() => setOpenImportDialog(true)}
          >
            Import Locations
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Location
          </Button>
        </Box>
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
            {locations.map((location) => (
              <TableRow key={location.id}>
                <TableCell>{location.id}</TableCell>
                <TableCell>{location.name}</TableCell>
                <TableCell>{location.type}</TableCell>
                <TableCell>{location.description}</TableCell>
                <TableCell>
                  {location.counter_party?.LegalName ||
                    `ID: ${location.parent_contvarcharerpartu_id}`}
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
          <TextField
            fullWidth
            margin="normal"
            label="Type"
            name="type"
            value={currentLocation.type}
            onChange={handleInputChange}
            required
          />
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
              value={currentLocation.parent_contvarcharerpartu_id}
              onChange={handleInputChange}
              label="Parent Counterparty"
            >
              {counterParties.map((party) => (
                <MenuItem
                  key={party.CounterpartyID}
                  value={party.CounterpartyID}
                >
                  {party.LegalName}
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
        title="Import Locations"
        entityKey="locations"
        onSuccess={fetchLocations}
      />
    </div>
  );
}

export default Locations;
