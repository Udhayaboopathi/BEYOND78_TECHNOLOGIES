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
} from "@mui/material";
import { Add, Edit, Delete, Upload } from "@mui/icons-material";
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

function CounterParties() {
  const [parties, setParties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openImportDialog, setOpenImportDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentParty, setCurrentParty] = useState({
    LegalName: "",
    ShortName: "",
    CounterpartyCode: "",
    Country: "",
    Type: "",
    CreditStatus: "",
    CreditLimit: "",
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

  const handleOpenDialog = (party = null) => {
    if (party) {
      setEditMode(true);
      setCurrentParty(party);
    } else {
      setEditMode(false);
      setCurrentParty({
        LegalName: "",
        ShortName: "",
        CounterpartyCode: "",
        Country: "",
        Type: "",
        CreditStatus: "",
        CreditLimit: "",
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
        ...currentParty,
        CreditLimit: parseFloat(currentParty.CreditLimit),
      };
      if (editMode) {
        await updateCounterParty(currentParty.CounterpartyID, data);
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

  const handleDelete = async (id) => {
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentParty((prev) => ({ ...prev, [name]: value }));
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
        <Typography variant="h4">Counter Parties</Typography>
        <Box display="flex" gap={2}>
          <ExportButton
            onExport={exportCounterParties}
            label="Export Counter Parties"
          />
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<Upload />}
            onClick={() => setOpenImportDialog(true)}
          >
            Import Counter Parties
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
          >
            Add Counter Party
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Legal Name</TableCell>
              <TableCell>Short Name</TableCell>
              <TableCell>Code</TableCell>
              <TableCell>Country</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Credit Status</TableCell>
              <TableCell>Credit Limit</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {parties.map((party) => (
              <TableRow key={party.CounterpartyID}>
                <TableCell>{party.CounterpartyID}</TableCell>
                <TableCell>{party.LegalName}</TableCell>
                <TableCell>{party.ShortName}</TableCell>
                <TableCell>{party.CounterpartyCode}</TableCell>
                <TableCell>{party.Country}</TableCell>
                <TableCell>{party.Type}</TableCell>
                <TableCell>{party.CreditStatus}</TableCell>
                <TableCell>{party.CreditLimit}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(party)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(party.CounterpartyID)}
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
        <DialogTitle>
          {editMode ? "Edit Counter Party" : "Add Counter Party"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Legal Name"
            name="LegalName"
            value={currentParty.LegalName}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Short Name"
            name="ShortName"
            value={currentParty.ShortName}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Counterparty Code"
            name="CounterpartyCode"
            value={currentParty.CounterpartyCode}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Country"
            name="Country"
            value={currentParty.Country}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Type"
            name="Type"
            value={currentParty.Type}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Credit Status"
            name="CreditStatus"
            value={currentParty.CreditStatus}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Credit Limit"
            name="CreditLimit"
            type="number"
            value={currentParty.CreditLimit}
            onChange={handleInputChange}
            required
          />
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
        onImport={importCounterParties}
        title="Import Counter Parties"
        entityKey="counter_parties"
        onSuccess={fetchCounterParties}
      />
    </div>
  );
}

export default CounterParties;
