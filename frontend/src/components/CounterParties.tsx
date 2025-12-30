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
  Grid,
} from "@mui/material";
import { Add, Edit, Delete, Upload, Refresh } from "@mui/icons-material";
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
    LegalName: "",
    ShortName: "",
    CounterpartyCode: "",
    Country: "",
    Type: "",
    CreditStatus: "",
    CreditLimit: 0,
  });
  
  // Filter states
  const [filterName, setFilterName] = useState<string>("");
  const [filterCountry, setFilterCountry] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");

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
        CounterpartyID: party.CounterpartyID,
        LegalName: party.LegalName || "",
        ShortName: party.ShortName || "",
        CounterpartyCode: party.CounterpartyCode || "",
        Country: party.Country || "",
        Type: party.Type || "",
        CreditStatus: party.CreditStatus || "",
        CreditLimit: party.CreditLimit || 0,
      });
    } else {
      setEditMode(false);
      setCurrentParty({
        LegalName: "",
        ShortName: "",
        CounterpartyCode: "",
        Country: "",
        Type: "",
        CreditStatus: "",
        CreditLimit: 0,
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
        LegalName: currentParty.LegalName,
        ShortName: currentParty.ShortName,
        CounterpartyCode: currentParty.CounterpartyCode,
        Country: currentParty.Country,
        Type: currentParty.Type,
        CreditStatus: currentParty.CreditStatus,
        CreditLimit: typeof currentParty.CreditLimit === 'string' ? parseFloat(currentParty.CreditLimit) : currentParty.CreditLimit,
      };
      if (editMode && currentParty.CounterpartyID) {
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

  // Filter counter parties
  const filteredParties = parties.filter((party) => {
    const matchesName = filterName === "" || 
      party.LegalName?.toLowerCase().includes(filterName.toLowerCase()) ||
      party.ShortName?.toLowerCase().includes(filterName.toLowerCase());
    const matchesCountry = filterCountry === "" || 
      party.Country?.toLowerCase().includes(filterCountry.toLowerCase());
    const matchesType = filterType === "" || party.Type === filterType;
    return matchesName && matchesCountry && matchesType;
  });

  const handleClearFilters = () => {
    setFilterName("");
    setFilterCountry("");
    setFilterType("");
  };

  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;

  return (
    <div>
      <Typography variant="h4" mb={2}>Counter Parties</Typography>

      {/* Filter Section */}
      <Paper sx={{ p: 2, mb: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Filter: Name"
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              fullWidth
              size="small"
              label="Filter: Country"
              value={filterCountry}
              onChange={(e) => setFilterCountry(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter: Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Filter: Type"
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="Supplier">Supplier</MenuItem>
                <MenuItem value="Customer">Customer</MenuItem>
                <MenuItem value="Both">Both</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Button size="small" variant="outlined" onClick={handleClearFilters}>
                Clear filters
              </Button>
              <Button size="small" variant="contained" onClick={() => handleOpenDialog()}>
                New
              </Button>
              <IconButton size="small" color="primary" onClick={fetchCounterParties} title="Refresh">
                <Refresh />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={2} flexWrap="wrap">
        <ExportButton onExport={exportCounterParties} label="Export Counter Parties" />
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<Upload />}
          onClick={() => setOpenImportDialog(true)}
        >
          Import Counter Parties
        </Button>
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
            {filteredParties.map((party) => (
              <TableRow key={party.CounterpartyID}>
                <TableCell>{party.CounterpartyID}</TableCell>
                <TableCell>{party.LegalName}</TableCell>
                <TableCell>{party.ShortName}</TableCell>
                <TableCell>{party.CounterpartyCode}</TableCell>
                <TableCell>{party.Country}</TableCell>
                <TableCell>{party.Type}</TableCell>
                <TableCell>{party.CreditStatus}</TableCell>
                <TableCell>${party.CreditLimit?.toLocaleString()}</TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    onClick={() => handleOpenDialog(party)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(party.CounterpartyID!)}
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
            label="Code"
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
          <FormControl fullWidth margin="normal" required>
            <InputLabel>Credit Status</InputLabel>
            <Select
              name="CreditStatus"
              value={currentParty.CreditStatus}
              onChange={(e) => setCurrentParty((prev) => ({ ...prev, CreditStatus: e.target.value }))}
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
        entityName="Counter Parties"
        entityKey="counter_parties"
        templateColumns={[
          "Name",
          "Description",
          "Credit Status",
          "Credit Limit",
        ]}
        onSuccess={fetchCounterParties}
      />
    </div>
  );
}

export default CounterParties;
