# Quick Implementation Script for Remaining Entities

# Copy this pattern to each component

## UOMs.jsx - Add Import

### 1. Update imports (around line 26)

```jsx
import { Add, Edit, Delete, Upload } from "@mui/icons-material";
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
```

### 2. Add state (around line 44)

```jsx
const [openImportDialog, setOpenImportDialog] = useState(false);
```

### 3. Update header buttons (around line 115)

```jsx
<Box display="flex" gap={2}>
  <ExportButton onExport={exportUOMs} label="Export UOMs" />
  <Button
    variant="outlined"
    color="secondary"
    startIcon={<Upload />}
    onClick={() => setOpenImportDialog(true)}
  >
    Import UOMs
  </Button>
  <Button
    variant="contained"
    color="primary"
    startIcon={<Add />}
    onClick={() => handleOpenDialog()}
  >
    Add UOM
  </Button>
</Box>
```

### 4. Add dialog before closing </div> (before line 223)

```jsx
<EnhancedImportDialog
  open={openImportDialog}
  onClose={() => setOpenImportDialog(false)}
  onImport={importUOMs}
  title="Import UOMs"
  entityKey="uoms"
  onSuccess={fetchUOMs}
/>
```

---

## Locations.jsx - Add Import

### 1. Update imports

```jsx
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
```

### 2. Add state

```jsx
const [openImportDialog, setOpenImportDialog] = useState(false);
```

### 3. Update header buttons

```jsx
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
```

### 4. Add dialog

```jsx
<EnhancedImportDialog
  open={openImportDialog}
  onClose={() => setOpenImportDialog(false)}
  onImport={importLocations}
  title="Import Locations"
  entityKey="locations"
  onSuccess={fetchLocations}
/>
```

---

## CounterParties.jsx - Add Import

### 1. Update imports

```jsx
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
```

### 2. Add state

```jsx
const [openImportDialog, setOpenImportDialog] = useState(false);
```

### 3. Update header buttons

```jsx
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
```

### 4. Add dialog

```jsx
<EnhancedImportDialog
  open={openImportDialog}
  onClose={() => setOpenImportDialog(false)}
  onImport={importCounterParties}
  title="Import Counter Parties"
  entityKey="counter_parties"
  onSuccess={fetchCounterParties}
/>
```

---

## BlendComponents.jsx - Add Import

### 1. Update imports

```jsx
import { Add, Edit, Delete, Upload } from "@mui/icons-material";
import ExportButton from "./ExportButton";
import EnhancedImportDialog from "./EnhancedImportDialog";
import {
  getBlendComponents,
  createBlendComponent,
  updateBlendComponent,
  deleteBlendComponent,
  getBlends,
  getCommodities,
  getCommodityDetails,
  validateBlendProportion,
  exportBlendComponents,
  importBlendComponents,
} from "../api";
```

### 2. Add state

```jsx
const [openImportDialog, setOpenImportDialog] = useState(false);
```

### 3. Update header buttons

```jsx
<Box display="flex" gap={2}>
  <ExportButton
    onExport={exportBlendComponents}
    label="Export Blend Components"
  />
  <Button
    variant="outlined"
    color="secondary"
    startIcon={<Upload />}
    onClick={() => setOpenImportDialog(true)}
  >
    Import Blend Components
  </Button>
  <Button
    variant="contained"
    color="primary"
    startIcon={<Add />}
    onClick={() => handleOpenDialog()}
  >
    Add Component
  </Button>
</Box>
```

### 4. Add dialog

```jsx
<EnhancedImportDialog
  open={openImportDialog}
  onClose={() => setOpenImportDialog(false)}
  onImport={importBlendComponents}
  title="Import Blend Components"
  entityKey="blend_components"
  onSuccess={fetchComponents}
/>
```

---

## Quick Replace Commands (VS Code)

For each component, use Find & Replace with these patterns:

### Pattern 1: Add Upload icon

**Find:** `import { Add, Edit, Delete } from "@mui/icons-material";`
**Replace:** `import { Add, Edit, Delete, Upload } from "@mui/icons-material";`

### Pattern 2: Add Enhanced Import Dialog

**Find:** `import ExportButton from "./ExportButton";`
**Replace:**

```
import ExportButton from "./ExportButton";
import EnhancedImportDialog from "./EnhancedImportDialog";
```

### Pattern 3: Add state

**Find:** `const [openDialog, setOpenDialog] = useState(false);`
**Replace:**

```
const [openDialog, setOpenDialog] = useState(false);
const [openImportDialog, setOpenImportDialog] = useState(false);
```

---

## Testing Checklist

After implementing each component:

- [ ] Component compiles without errors
- [ ] Export button appears and downloads Excel file
- [ ] Import button opens dialog
- [ ] Template download works
- [ ] File upload validates format
- [ ] Import with valid data succeeds
- [ ] Import with invalid data shows errors
- [ ] Table refreshes after successful import
- [ ] Error messages are clear and helpful

---

## Time Estimate

| Component        | Time Required  |
| ---------------- | -------------- |
| UOMs             | 5 minutes      |
| Locations        | 10 minutes     |
| Counter Parties  | 5 minutes      |
| Blend Components | 10 minutes     |
| **TOTAL**        | **30 minutes** |

---

## Notes

1. **Capacity and Blends** already have import functionality (custom implementation)
2. **Commodities** now has the standardized implementation (reference example)
3. All remaining components follow the exact same pattern
4. The backend service automatically handles all entities through configuration
5. No backend code changes needed for remaining entities - only frontend integration
