"""
Unified Import Service
Handles validation, transformation, and persistence for all entities
"""

import pandas as pd
from typing import Dict, List, Any, Tuple
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import text
from .import_export_config import get_entity_config, ColumnConfig

class ImportError:
    """Represents an error during import"""
    def __init__(self, row_number: int, field: str, message: str, value: Any = None):
        self.row_number = row_number
        self.field = field
        self.message = message
        self.value = value
    
    def to_dict(self):
        return {
            "row": self.row_number,
            "field": self.field,
            "message": self.message,
            "value": str(self.value) if self.value is not None else None
        }

class ImportService:
    """Unified service for importing data across all entities"""
    
    def __init__(self, db: Session, entity_key: str):
        self.db = db
        self.entity_key = entity_key
        self.config = get_entity_config(entity_key)
        self.errors: List[ImportError] = []
        self.fk_cache: Dict[str, Dict[str, Any]] = {}
    
    def validate_and_import(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """
        Main entry point for import process
        Returns: {
            "message": str,
            "successful": int,
            "failed": int,
            "errors": List[Dict]
        }
        """
        # Step 1: Parse file
        try:
            df = self._parse_file(file_content, filename)
        except Exception as e:
            return {
                "message": f"Failed to parse file: {str(e)}",
                "successful": 0,
                "failed": 0,
                "errors": [{"row": 0, "field": "file", "message": str(e)}]
            }
        
        # Step 2: Validate headers
        header_errors = self._validate_headers(df)
        if header_errors:
            return {
                "message": "Invalid file headers",
                "successful": 0,
                "failed": 0,
                "errors": [e.to_dict() for e in header_errors]
            }
        
        # Step 3: Validate and transform each row
        validated_rows = []
        for idx, row in df.iterrows():
            row_data = self._validate_row(idx + 2, row)  # +2 because header is row 1
            if row_data:
                validated_rows.append(row_data)
        
        # Step 4: If validation errors, return immediately
        if self.errors:
            return {
                "message": f"Validation failed: {len(self.errors)} errors found",
                "successful": 0,
                "failed": len(self.errors),
                "errors": [e.to_dict() for e in self.errors]
            }
        
        # Step 5: Import data with transaction
        try:
            successful, failed = self._import_rows(validated_rows)
            self.db.commit()
            
            return {
                "message": f"Import completed: {successful} successful, {failed} failed",
                "successful": successful,
                "failed": failed,
                "errors": [e.to_dict() for e in self.errors]
            }
        except Exception as e:
            self.db.rollback()
            return {
                "message": f"Import failed: {str(e)}",
                "successful": 0,
                "failed": len(validated_rows),
                "errors": [{"row": 0, "field": "database", "message": str(e)}]
            }
    
    def _parse_file(self, file_content: bytes, filename: str) -> pd.DataFrame:
        """Parse CSV or Excel file"""
        if filename.endswith('.csv'):
            return pd.read_csv(pd.io.common.BytesIO(file_content))
        elif filename.endswith(('.xlsx', '.xls')):
            return pd.read_excel(pd.io.common.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format. Use CSV or Excel (.xlsx)")
    
    def _validate_headers(self, df: pd.DataFrame) -> List[ImportError]:
        """Validate that all required columns are present"""
        errors = []
        required_columns = [col.name for col in self.config.columns]
        missing_columns = set(required_columns) - set(df.columns)
        
        if missing_columns:
            for col in missing_columns:
                errors.append(ImportError(
                    row_number=1,
                    field=col,
                    message=f"Required column '{col}' is missing"
                ))
        
        return errors
    
    def _validate_row(self, row_number: int, row: pd.Series) -> Dict[str, Any]:
        """Validate and transform a single row"""
        validated_data = {}
        
        for col_config in self.config.columns:
            value = row.get(col_config.name)
            
            # Check required fields
            if col_config.required and (pd.isna(value) or value == ""):
                self.errors.append(ImportError(
                    row_number=row_number,
                    field=col_config.name,
                    message=f"Required field '{col_config.name}' is empty",
                    value=value
                ))
                continue
            
            # Skip empty optional fields
            if pd.isna(value) or value == "":
                if col_config.default_value is not None:
                    validated_data[col_config.field] = col_config.default_value
                continue
            
            # Validate data type
            transformed_value = self._validate_and_transform_value(
                row_number, col_config, value
            )
            
            # Add to validated data
            # For optional FK fields that couldn't be resolved, explicitly use None (NULL in database)
            if transformed_value is not None:
                validated_data[col_config.field] = transformed_value
            elif col_config.foreign_key and not col_config.required:
                # Optional FK that couldn't be resolved - use NULL
                validated_data[col_config.field] = None
        
        # Return None if this row has errors
        if any(e.row_number == row_number for e in self.errors):
            return None
        
        return validated_data
    
    def _validate_and_transform_value(
        self, row_number: int, col_config: ColumnConfig, value: Any
    ) -> Any:
        """Validate data type and transform value"""
        
        # Handle foreign keys
        if col_config.foreign_key:
            fk_id = self._resolve_foreign_key(
                row_number,
                col_config.name,  # Column name for error reporting
                col_config.foreign_key,
                col_config.fk_lookup_field,
                value,
                col_config.required  # Pass required flag
            )
            return fk_id
        
        # Validate and convert data types
        try:
            if col_config.data_type == "number":
                converted_value = float(value)
            elif col_config.data_type == "date":
                if isinstance(value, str):
                    converted_value = datetime.strptime(value, "%Y-%m-%d").date().isoformat()
                else:
                    converted_value = value
            elif col_config.data_type == "boolean":
                if isinstance(value, str):
                    converted_value = value.lower() in ['true', '1', 'yes']
                else:
                    converted_value = bool(value)
            else:  # string
                converted_value = str(value).strip()
            
            # Apply custom validation if provided
            if col_config.validation_fn:
                is_valid, error_msg = col_config.validation_fn(self.db, converted_value)
                if not is_valid:
                    self.errors.append(ImportError(
                        row_number=row_number,
                        field=col_config.name,
                        message=error_msg,
                        value=converted_value
                    ))
                    return None
            
            return converted_value
            
        except Exception as e:
            self.errors.append(ImportError(
                row_number=row_number,
                field=col_config.name,
                message=f"Invalid {col_config.data_type} value: {str(e)}",
                value=value
            ))
            return None
    
    def _resolve_foreign_key(
        self, row_number: int, field_name: str, fk_table: str, lookup_field: str, lookup_value: Any, is_required: bool = True
    ) -> int:
        """Resolve foreign key by looking up the referenced record"""
        
        # Use cache to avoid repeated queries
        cache_key = f"{fk_table}:{lookup_field}:{lookup_value}"
        if cache_key in self.fk_cache:
            return self.fk_cache[cache_key]
        
        # Get the FK table's config to determine the primary key field name
        fk_config = get_entity_config(fk_table)
        primary_key = fk_config.primary_key if fk_config else "id"
        
        # Query the foreign key table
        query = text(f"""
            SELECT {primary_key} FROM {fk_table}
            WHERE {lookup_field} = :lookup_value
            AND is_deleted = 0
            LIMIT 1
        """)
        
        result = self.db.execute(query, {"lookup_value": lookup_value}).fetchone()
        
        if not result:
            # For optional FK fields, treat invalid values as empty instead of error
            if not is_required:
                return None
            
            # For required FK fields, add error
            self.errors.append(ImportError(
                row_number=row_number,
                field=field_name,  # Use the import column name, not FK lookup field
                message=f"{fk_table} '{lookup_value}' not found",
                value=lookup_value
            ))
            return None
        
        fk_id = result[0]
        self.fk_cache[cache_key] = fk_id
        return fk_id
    
    def _import_rows(self, validated_rows: List[Dict[str, Any]]) -> Tuple[int, int]:
        """Import validated rows into database"""
        successful = 0
        failed = 0
        
        for row_data in validated_rows:
            try:
                # Check if record exists (for update)
                existing_record = self._find_existing_record(row_data)
                
                if existing_record and self.config.supports_update:
                    # Update existing record
                    pk_column = self.config.primary_key
                    self._update_record(existing_record[pk_column], row_data)
                    successful += 1
                elif not existing_record and self.config.supports_create:
                    # Create new record
                    self._create_record(row_data)
                    successful += 1
                else:
                    failed += 1
                    self.errors.append(ImportError(
                        row_number=0,
                        field="operation",
                        message="Record exists but updates not supported" if existing_record else "Create not supported"
                    ))
            except Exception as e:
                failed += 1
                self.errors.append(ImportError(
                    row_number=0,
                    field="database",
                    message=str(e)
                ))
        
        return successful, failed
    
    def _find_existing_record(self, row_data: Dict[str, Any]) -> Dict[str, Any]:
        """Find existing record based on unique key"""
        conditions = []
        params = {}
        
        for idx, key_field in enumerate(self.config.unique_key):
            if key_field in row_data:
                param_name = f"key_{idx}"
                conditions.append(f"{key_field} = :{param_name}")
                params[param_name] = row_data[key_field]
        
        if not conditions:
            return None
        
        # Use the configured primary key column name
        pk_column = self.config.primary_key
        
        query = text(f"""
            SELECT {pk_column} FROM {self.config.table_name}
            WHERE {' AND '.join(conditions)}
            AND is_deleted = 0
            LIMIT 1
        """)
        
        result = self.db.execute(query, params).fetchone()
        return {pk_column: result[0]} if result else None
    
    def _create_record(self, row_data: Dict[str, Any]):
        """Create new record"""
        # Add auto-populated fields for soft delete
        row_data['is_deleted'] = False
        
        # Build INSERT query - escape column names with backticks
        columns = ', '.join([f"`{key}`" for key in row_data.keys()])
        placeholders = ', '.join([f":{key}" for key in row_data.keys()])
        
        query = text(f"""
            INSERT INTO {self.config.table_name} ({columns})
            VALUES ({placeholders})
        """)
        
        self.db.execute(query, row_data)
    
    def _update_record(self, record_id: int, row_data: Dict[str, Any]):
        """Update existing record"""
        # Note: Timestamp fields should be included in the import data if needed
        # Different tables have different timestamp column names (update_at, UpdatedAt, dt_last_modified)
        
        # Use the configured primary key column name
        pk_column = self.config.primary_key
        
        # Build UPDATE query - escape column names with backticks
        set_clauses = ', '.join([f"`{key}` = :{key}" for key in row_data.keys()])
        
        query = text(f"""
            UPDATE {self.config.table_name}
            SET {set_clauses}
            WHERE {pk_column} = :record_id
        """)
        
        params = {**row_data, 'record_id': record_id}
        self.db.execute(query, params)
