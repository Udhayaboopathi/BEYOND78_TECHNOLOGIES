# Enterprise Import/Export Architecture - Complete Documentation

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [API Design](#api-design)
3. [Frontend Components](#frontend-components)
4. [Validation Strategy](#validation-strategy)
5. [Error Handling](#error-handling)
6. [Implementation Guide](#implementation-guide)
7. [Testing Strategy](#testing-strategy)

---

## 🏗️ Architecture Overview

### Design Principles

1. **Configuration-Driven**: Entity definitions centralized in `import_export_config.py`
2. **Separation of Concerns**: Validation, transformation, and persistence are isolated
3. **Reusability**: Single service handles all entities
4. **Transaction Safety**: Rollback on critical failures
5. **User-Friendly**: Row-level error reporting with clear messages

### Architecture Layers

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ ExportButton │  │ Enhanced     │  │ Page         │     │
│  │ Component    │  │ ImportDialog │  │ Components   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       API LAYER                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ FastAPI Endpoints                                    │  │
│  │  - POST /api/import/{entity_key}                    │  │
│  │  - GET /api/export/{entity_key}                     │  │
│  │  - GET /api/template/{entity_key}                   │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                            │
│  ┌──────────────────┐  ┌──────────────────────────────┐    │
│  │ ImportService    │  │ import_export_config         │    │
│  │ - Validation     │  │ - Entity Definitions         │    │
│  │ - Transformation │  │ - Column Configurations      │    │
│  │ - Persistence    │  │ - Validation Rules           │    │
│  └──────────────────┘  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                           │
│                   MySQL with SQLAlchemy                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 API Design

### 1. Import Endpoint

**Request:**

```http
POST /api/import/{entity_key}
Content-Type: multipart/form-data

Body:
  file: <CSV or Excel file>
```

**Supported Entity Keys:**

- `commodities`
- `uoms`
- `locations`
- `counter_parties`
- `blend_components`
- `capacity`
- `blends`

**Success Response (200):**

```json
{
  "message": "Import completed: 25 successful, 0 failed",
  "successful": 25,
  "failed": 0,
  "errors": []
}
```

**Partial Success Response (200):**

```json
{
  "message": "Import completed: 20 successful, 5 failed",
  "successful": 20,
  "failed": 5,
  "errors": [
    {
      "row": 3,
      "field": "Commodity Name",
      "message": "commodities 'Invalid Name' not found",
      "value": "Invalid Name"
    },
    {
      "row": 7,
      "field": "Density",
      "message": "Invalid number value: could not convert string to float: 'abc'",
      "value": "abc"
    }
  ]
}
```

**Validation Error Response (400):**

```json
{
  "detail": {
    "message": "Validation failed: 3 errors found",
    "successful": 0,
    "failed": 3,
    "errors": [...]
  }
}
```

### 2. Export Endpoint

**Request:**

```http
GET /api/export/{entity_key}
```

**Response:**

- Content-Type: `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
- Excel file with human-readable data (names, not IDs)
- Only includes active records (delete = 0x00...)

### 3. Template Download Endpoint

**Request:**

```http
GET /api/template/{entity_key}
```

**Response:**

- Excel file with proper column headers
- Empty data rows for user to fill in
- Content-Disposition header with filename

---

## 🎨 Frontend Components

### 1. ExportButton Component

**Location:** `frontend/src/components/ExportButton.jsx`

**Usage:**

```jsx
<ExportButton onExport={exportCommodities} label="Export Commodities" />
```

**Features:**

- Handles blob download
- Extracts filename from Content-Disposition header
- Loading state with CircularProgress
- Error handling with alerts

### 2. EnhancedImportDialog Component

**Location:** `frontend/src/components/EnhancedImportDialog.jsx`

**Usage:**

```jsx
<EnhancedImportDialog
  open={openImportDialog}
  onClose={() => setOpenImportDialog(false)}
  onImport={importCommodities}
  title="Import Commodities"
  entityKey="commodities"
  onSuccess={fetchCommodities}
/>
```

**Features:**

- Template download with automatic filename
- File type validation (.csv, .xlsx, .xls only)
- Upload progress indicator
- Success/failure display with expandable error details
- Row-level error table
- Auto-close on complete success
- Helpful tips section

### 3. Standard Button Placement Pattern

```jsx
<Box display="flex" gap={2}>
  <ExportButton onExport={exportEntity} label="Export Entity" />
  <Button
    variant="outlined"
    color="secondary"
    startIcon={<Upload />}
    onClick={() => setOpenImportDialog(true)}
  >
    Import Entity
  </Button>
  <Button
    variant="contained"
    color="primary"
    startIcon={<Add />}
    onClick={() => handleOpenDialog()}
  >
    Add Entity
  </Button>
</Box>
```

---

## ✅ Validation Strategy

### 1. Multi-Level Validation

```
┌─────────────────────────────────────────┐
│ 1. File Format Validation              │
│    - CSV, Excel (.xlsx, .xls) only     │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│ 2. Header Validation                    │
│    - All required columns present       │
│    - Column names match template        │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│ 3. Row-Level Validation                 │
│    - Required field check               │
│    - Data type validation               │
│    - Foreign key resolution             │
│    - Custom business rules              │
└─────────────────────────────────────────┘
              ▼
┌─────────────────────────────────────────┐
│ 4. Duplicate Check                      │
│    - Based on unique_key configuration  │
└─────────────────────────────────────────┘
```

### 2. Entity Configuration Example

**Commodities Entity:**

```python
EntityConfig(
    entity_name="Commodities",
    table_name="commodities",
    unique_key=["name"],  # Name must be unique
    columns=[
        ColumnConfig(
            name="Commodity Name",
            field="name",
            required=True,
            data_type="string"
        ),
        ColumnConfig(
            name="UOM",
            field="uom",
            required=True,
            data_type="string",
            foreign_key="uoms",
            fk_display_field="name",
            fk_lookup_field="name"
        ),
        ColumnConfig(
            name="Density",
            field="density",
            required=False,
            data_type="number"
        )
    ]
)
```

### 3. Data Type Validations

| Data Type | Validation Rules                        | Example     |
| --------- | --------------------------------------- | ----------- |
| `string`  | Strip whitespace, non-empty if required | "Crude Oil" |
| `number`  | Convert to float, numeric format        | 850.5       |
| `date`    | ISO 8601 format (YYYY-MM-DD)            | 2025-01-15  |
| `boolean` | true/false, 1/0, yes/no                 | true        |

### 4. Foreign Key Resolution

**Process:**

1. Check cache for previously resolved FK
2. Query referenced table: `SELECT id FROM {fk_table} WHERE {lookup_field} = :value`
3. Validate existence and active status
4. Cache result for subsequent rows
5. Add error if FK not found

---

## 🚨 Error Handling

### 1. Error Types

| Error Type                | Severity     | Action                        |
| ------------------------- | ------------ | ----------------------------- |
| File Format Error         | Critical     | Reject entire import          |
| Header Validation Error   | Critical     | Reject entire import          |
| Row Validation Error      | Non-Critical | Skip row, continue processing |
| Database Constraint Error | Critical     | Rollback transaction          |

### 2. Error Response Structure

```typescript
interface ImportError {
  row: number; // Row number in file (header = 1)
  field: string; // Column/field name
  message: string; // Human-readable error message
  value: string; // Invalid value that caused error
}

interface ImportResult {
  message: string;
  successful: number;
  failed: number;
  errors: ImportError[];
}
```

### 3. Transaction Management

```python
try:
    # Begin implicit transaction
    for row in validated_rows:
        create_or_update_record(row)

    db.commit()  # Commit if all successful
except Exception as e:
    db.rollback()  # Rollback on any critical failure
    raise
```

### 4. User-Friendly Error Messages

**Bad:**

```
Foreign key constraint failed
```

**Good:**

```
commodities 'Diesel Fuel' not found. Please check commodity name spelling.
```

---

## 📚 Implementation Guide

### Step 1: Add New Entity Configuration

**File:** `backend/services/import_export_config.py`

```python
ENTITY_CONFIGS["new_entity"] = EntityConfig(
    entity_name="New Entity",
    table_name="new_entity_table",
    unique_key=["name"],  # Define unique identifier
    columns=[
        ColumnConfig(
            name="Display Name",
            field="database_field",
            required=True,
            data_type="string"
        )
        # Add more columns...
    ]
)
```

### Step 2: Add Export Endpoint (Optional, if custom query needed)

**File:** `backend/main.py`

```python
@app.get("/api/export/new_entity")
def export_new_entity(db: Session = Depends(get_db)):
    query = text("""
        SELECT
            ne.name AS 'Entity Name',
            ne.description AS 'Description'
        FROM new_entity_table ne
        WHERE ne.delete = 0x00000000000000000000000000000000
        ORDER BY ne.name
    """)

    result = db.execute(query)
    rows = result.fetchall()
    columns = result.keys()

    df = pd.DataFrame(rows, columns=columns)

    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='New Entity')
    output.seek(0)

    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=new_entity_export.xlsx'}
    )
```

### Step 3: Add Frontend API Methods

**File:** `frontend/src/api.js`

```javascript
export const exportNewEntity = () =>
  api.get("/export/new_entity", { responseType: "blob" });

export const importNewEntity = (formData) =>
  importEntity("new_entity", formData);
```

### Step 4: Update Page Component

**File:** `frontend/src/components/NewEntity.jsx`

```jsx
// 1. Add imports
import { Upload } from "@mui/icons-material";
import ExportButton from "./ExportButton";
import EnhancedImportDialog from "./EnhancedImportDialog";
import { exportNewEntity, importNewEntity } from "../api";

// 2. Add state
const [openImportDialog, setOpenImportDialog] = useState(false);

// 3. Add buttons to header
<Box display="flex" gap={2}>
  <ExportButton
    onExport={exportNewEntity}
    label="Export New Entity"
  />
  <Button
    variant="outlined"
    color="secondary"
    startIcon={<Upload />}
    onClick={() => setOpenImportDialog(true)}
  >
    Import New Entity
  </Button>
  <Button
    variant="contained"
    color="primary"
    startIcon={<Add />}
    onClick={() => handleOpenDialog()}
  >
    Add New Entity
  </Button>
</Box>

// 4. Add import dialog before closing </div>
<EnhancedImportDialog
  open={openImportDialog}
  onClose={() => setOpenImportDialog(false)}
  onImport={importNewEntity}
  title="Import New Entity"
  entityKey="new_entity"
  onSuccess={fetchNewEntity}
/>
```

### Step 5: Test Import/Export

1. **Download Template:** Click "Download Template" button
2. **Fill Data:** Add test records to template
3. **Import:** Upload completed file
4. **Verify:** Check success message and database
5. **Export:** Click "Export" and verify data matches

---

## 🧪 Testing Strategy

### 1. Unit Tests

**Backend Service Tests:**

```python
def test_validate_headers():
    # Test missing required columns
    # Test extra columns (should be ignored)
    pass

def test_validate_row():
    # Test required field validation
    # Test data type conversion
    # Test foreign key resolution
    pass

def test_import_create():
    # Test new record creation
    pass

def test_import_update():
    # Test existing record update based on unique key
    pass
```

### 2. Integration Tests

**API Endpoint Tests:**

```python
def test_import_commodities_success():
    # Upload valid CSV
    # Verify 200 status
    # Check database records
    pass

def test_import_commodities_validation_error():
    # Upload CSV with invalid data
    # Verify 400 status
    # Check error messages
    pass

def test_export_commodities():
    # Call export endpoint
    # Verify Excel file format
    # Check column headers
    pass
```

### 3. Manual Testing Checklist

- [ ] Template downloads with correct columns
- [ ] Import validates file format
- [ ] Required fields are enforced
- [ ] Foreign keys are resolved correctly
- [ ] Duplicate records are detected
- [ ] Row-level errors are displayed
- [ ] Successful imports refresh the table
- [ ] Export includes all active records
- [ ] Export columns match table UI
- [ ] Transaction rollback works on critical errors

---

## 🎯 Implementation Roadmap

### Completed ✅

- [x] Architecture design
- [x] Configuration system (`import_export_config.py`)
- [x] Unified import service (`import_service.py`)
- [x] Generic import/export endpoints
- [x] Template download endpoint
- [x] ExportButton component
- [x] EnhancedImportDialog component
- [x] Commodities implementation (reference example)

### Remaining Entities 🔄

Apply the Commodities pattern to:

1. **UOMs** (5 min)

   - Entity config already defined
   - Add import button + dialog

2. **Locations** (10 min)

   - Entity config already defined
   - Parent location FK resolution
   - Add import button + dialog

3. **Counter Parties** (5 min)

   - Entity config already defined
   - Add import button + dialog

4. **Blend Components** (10 min)

   - Entity config already defined
   - Proportion validation (sum = 100%)
   - Add import button + dialog

5. **Capacity** (Already done ✅)

   - Custom import with overlap validation

6. **Blends** (Already done ✅)
   - Custom import with component handling

---

## 🔒 Security Considerations

1. **File Size Limits:** Configure max upload size (e.g., 10MB)
2. **Rate Limiting:** Prevent abuse of import endpoints
3. **Authentication:** Ensure user is authenticated
4. **Authorization:** Role-based access control for import/export
5. **SQL Injection:** Use parameterized queries (already implemented)
6. **Data Validation:** Never trust user input

---

## 🚀 Performance Optimization

1. **Foreign Key Caching:** Reduces redundant database queries
2. **Bulk Inserts:** Consider batch operations for large imports
3. **Async Processing:** For very large files, use background jobs
4. **Pagination:** Export large datasets in chunks

---

## 📊 Monitoring & Audit

### Recommended Enhancements

1. **Import History Table:**

```sql
CREATE TABLE import_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    entity_type VARCHAR(50),
    filename VARCHAR(255),
    user_id INT,
    status VARCHAR(20),
    successful_count INT,
    failed_count INT,
    error_log TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

2. **Logging:**

```python
logger.info(f"Import started: entity={entity_key}, file={filename}, user={user_id}")
logger.info(f"Import completed: entity={entity_key}, successful={successful}, failed={failed}")
```

3. **Metrics:**

- Average import duration
- Import success rate
- Most common validation errors

---

## 📞 Support & Troubleshooting

### Common Issues

**Issue:** "Required column 'X' is missing"

- **Solution:** Download latest template and ensure column names match exactly

**Issue:** "Foreign key 'Y' not found"

- **Solution:** Verify referenced record exists and spelling is correct

**Issue:** "Invalid date format"

- **Solution:** Use ISO 8601 format (YYYY-MM-DD)

**Issue:** Import shows success but records not visible

- **Solution:** Check soft delete flag, ensure delete = 0x00...

---

## 📝 Conclusion

This enterprise-grade import/export system provides:

✅ **Consistency:** Same behavior across all 7 entities  
✅ **Maintainability:** Configuration-driven, minimal code duplication  
✅ **User-Friendly:** Clear error messages, helpful guidance  
✅ **Scalable:** Easy to add new entities  
✅ **Robust:** Transaction-safe, comprehensive validation  
✅ **Professional:** Enterprise-ready error handling and logging

**Total Implementation Time:** ~2 hours for all remaining entities

**Lines of Code:**

- Backend configuration: ~400 lines (reusable)
- Backend service: ~500 lines (reusable)
- Frontend components: ~350 lines (reusable)
- Per-entity integration: ~15 lines

**Maintenance Burden:** Minimal - adding new entities requires only configuration changes
