# Sample Data for Manual Import

This directory contains sample CSV files that you can use to manually import data into your database.

## Import Order

**IMPORTANT**: Import files in this exact order to satisfy foreign key dependencies:

1. **uoms_sample.csv** - Units of Measure (no dependencies)
2. **commodities_sample.csv** - Commodities (depends on UOMs)
3. **counter_parties_sample.csv** - Counter Parties (no dependencies)
4. **locations_sample.csv** - Locations (depends on Counter Parties)
5. **capacity_sample.csv** - Capacity (depends on Commodities, Locations, UOMs)

## How to Import

### Option 1: Using the API Import Endpoints

The backend provides import endpoints that you can use:

```bash
# Import capacity data
curl -X POST "http://localhost:8000/api/import/capacity" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@capacity_sample.csv"
```

### Option 2: Manual Database Import

You can also insert data directly using SQL or through the frontend UI once it's running.

### Option 3: Using MySQL Command Line

```bash
# For UOMs
mysql -u root -ptest@123 BEYOND -e "LOAD DATA LOCAL INFILE 'uoms_sample.csv' INTO TABLE uoms FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 ROWS (name, type, base_uom, description) SET delete_at=NOW(), delete=0x00000000000000000000000000000000;"
```

## File Descriptions

- **uoms_sample.csv**: 8 sample units of measure including mass, volume, and energy units
- **commodities_sample.csv**: 7 sample commodities including crude oil, natural gas, and refined products
- **counter_parties_sample.csv**: 7 sample trading partners with various credit statuses
- **locations_sample.csv**: 7 sample locations including ports, refineries, and pipelines
- **capacity_sample.csv**: 7 sample capacity records with date ranges

## Notes

- All CSV files include headers
- Dates are in YYYY-MM-DD format
- Decimal values use period (.) as separator
- The `is_active` field for commodities defaults to true when imported via API
- The `delete` field is automatically set to indicate active records
- Timestamps (`create_at`, `update_at`, `delete_at`) are automatically managed by the API

## Testing the Import

After importing, you can verify the data by:

1. Opening the frontend at http://localhost:3000
2. Navigating to each section (UOMs, Commodities, etc.)
3. Checking that the sample data appears in the tables
4. Using the API docs at http://localhost:8000/docs to query the endpoints

## Customizing the Data

Feel free to modify these CSV files to add your own data. Just ensure:

- Foreign key references are valid (e.g., UOM names in commodities exist in UOMs table)
- Date ranges don't overlap for the same commodity/location combination
- Required fields are not empty
- Numeric values are properly formatted
