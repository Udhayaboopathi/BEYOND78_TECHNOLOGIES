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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
              <TableRow key={party.id}>
                <TableCell>{party.id}</TableCell>
                <TableCell>{party.legal_name}</TableCell>
                <TableCell>{party.short_name}</TableCell>
                <TableCell>{party.counterparty_code}</TableCell>
                <TableCell>{party.country}</TableCell>
                <TableCell>{party.type}</TableCell>
                <TableCell>{party.credit_status}</TableCell>
                <TableCell>${party.credit_limit?.toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(party)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(party.id!)}
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
            name="legal_name"
            value={currentParty.legal_name}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Short Name"
            name="short_name"
            value={currentParty.short_name}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Code"
            name="counterparty_code"
            value={currentParty.counterparty_code}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Country"
            name="country"
            value={currentParty.country}
            onChange={handleInputChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Type"
            name="type"
            value={currentParty.type}
            onChange={handleInputChange}
            required
          />
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Credit Status</InputLabel>
            <Select
              name="credit_status"
              value={currentParty.credit_status}
              onChange={(e) => setCurrentParty((prev) => ({ ...prev, credit_status: e.target.value }))}
              label="Credit Status"
            >
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Under Review">Under Review</MenuItem>
              <MenuItem value="Suspended">Suspended</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Credit Limit"
            name="credit_limit"
            type="number"
            value={currentParty.credit_limit}
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
