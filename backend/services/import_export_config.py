"""
Entity Configuration for Import/Export System
Defines validation rules, column mappings, and business rules per entity
"""

from typing import Dict, List, Optional, Callable, Any
from pydantic import BaseModel

class ColumnConfig(BaseModel):
    """Column configuration for import/export"""
    name: str  # Display name in export/import
    field: str  # Database field name
    required: bool = False
    data_type: str = "string"  # string, number, date, boolean
    foreign_key: Optional[str] = None  # Table name if FK
    fk_display_field: Optional[str] = None  # Field to display (e.g., 'name')
    fk_lookup_field: Optional[str] = None  # Field to lookup by (e.g., 'name')
    validation_fn: Optional[Callable] = None
    transform_fn: Optional[Callable] = None
    default_value: Optional[Any] = None

class EntityConfig(BaseModel):
    """Complete entity configuration"""
    entity_name: str
    table_name: str
    columns: List[ColumnConfig]
    unique_key: List[str]  # Fields that uniquely identify a record
    primary_key: str = "id"  # Primary key field name (default: "id")
    supports_update: bool = True
    supports_create: bool = True
    custom_validations: List[Callable] = []
    export_join_query: Optional[str] = None

# ================================
# ENTITY CONFIGURATIONS
# ================================

ENTITY_CONFIGS: Dict[str, EntityConfig] = {
    "commodities": EntityConfig(
        entity_name="Commodities",
        table_name="commodities",
        unique_key=["name"],  # Commodity name must be unique
        columns=[
            ColumnConfig(
                name="Commodity Name",
                field="name",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Description",
                field="description",
                required=False,
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
            ),
            ColumnConfig(
                name="Energy UOM",
                field="energy_uom",
                required=False,  # Made optional - not all commodities need this
                data_type="string",
                foreign_key="uoms",
                fk_display_field="name",
                fk_lookup_field="name"
            ),
            ColumnConfig(
                name="Is Active",
                field="is_active",
                required=False,
                data_type="boolean",
                default_value=bytes.fromhex('01' * 16)  # Default to active (BINARY(16) with all 1s)
            )
        ]
    ),
    
    "uoms": EntityConfig(
        entity_name="UOMs",
        table_name="uoms",
        unique_key=["name"],
        columns=[
            ColumnConfig(
                name="UOM Name",
                field="name",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Type",
                field="type",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Base UOM",
                field="base_uom",
                required=False,
                data_type="string"
            ),
            ColumnConfig(
                name="Description",
                field="description",
                required=False,
                data_type="string"
            )
        ]
    ),
    
    "locations": EntityConfig(
        entity_name="Locations",
        table_name="location",
        unique_key=["name"],
        columns=[
            ColumnConfig(
                name="Location Name",
                field="name",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Type",
                field="type",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Description",
                field="description",
                required=False,
                data_type="string"
            ),
            ColumnConfig(
                name="ParentCounterpartyID",
                field="parent_contvarcharerpartu_id",
                required=True,
                data_type="number",
                foreign_key="counter_parties",
                fk_display_field="LegalName",
                fk_lookup_field="CounterpartyID"
            )
        ]
    ),
    
    "counter_parties": EntityConfig(
        entity_name="Counter Parties",
        table_name="counter_parties",
        primary_key="CounterpartyID",  # Custom primary key field name
        unique_key=["CounterpartyCode"],
        columns=[
            ColumnConfig(
                name="Legal Name",
                field="LegalName",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Short Name",
                field="ShortName",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Code",
                field="CounterpartyCode",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Country",
                field="Country",
                required=False,
                data_type="string"
            ),
            ColumnConfig(
                name="Type",
                field="Type",
                required=False,
                data_type="string"
            ),
            ColumnConfig(
                name="Credit Status",
                field="CreditStatus",
                required=False,
                data_type="string"
            ),
            ColumnConfig(
                name="Credit Limit",
                field="CreditLimit",
                required=False,
                data_type="number"
            )
        ]
    ),
    
    "blend_components": EntityConfig(
        entity_name="Blend Components",
        table_name="blendcomponents",
        unique_key=["blend_id", "commodity_id"],
        supports_update=False,  # Delete and recreate instead
        columns=[
            ColumnConfig(
                name="Blend Name",
                field="blend_id",
                required=True,
                data_type="string",
                foreign_key="blends",
                fk_display_field="name",
                fk_lookup_field="name"
            ),
            ColumnConfig(
                name="Component Commodity Name",
                field="commodity_id",
                required=True,
                data_type="string",
                foreign_key="commodities",
                fk_display_field="name",
                fk_lookup_field="name"
            ),
            ColumnConfig(
                name="Proportion (%)",
                field="proportion",
                required=True,
                data_type="number",
                transform_fn=lambda x: float(x) / 100.0  # Convert % to decimal
            )
        ]
    ),
    
    "capacity": EntityConfig(
        entity_name="Capacity",
        table_name="capacity",
        unique_key=["commodity_id", "location_id", "eff_dt_from"],
        columns=[
            ColumnConfig(
                name="Commodity Name",
                field="commodity_id",
                required=True,
                data_type="string",
                foreign_key="commodities",
                fk_display_field="name",
                fk_lookup_field="name"
            ),
            ColumnConfig(
                name="Location Name",
                field="location_id",
                required=True,
                data_type="string",
                foreign_key="location",
                fk_display_field="name",
                fk_lookup_field="name"
            ),
            ColumnConfig(
                name="UOM",
                field="uom_id",
                required=True,
                data_type="string",
                foreign_key="uoms",
                fk_display_field="name",
                fk_lookup_field="name"
            ),
            ColumnConfig(
                name="Quantity",
                field="quantity",
                required=True,
                data_type="number"
            ),
            ColumnConfig(
                name="Effective From",
                field="eff_dt_from",
                required=True,
                data_type="date"
            ),
            ColumnConfig(
                name="Effective To",
                field="eff_dt_to",
                required=True,
                data_type="date"
            )
        ]
    ),
    
    "blends": EntityConfig(
        entity_name="Blends",
        table_name="blends",
        unique_key=["name"],
        columns=[
            ColumnConfig(
                name="Blend Name",
                field="name",
                required=True,
                data_type="string"
            ),
            ColumnConfig(
                name="Description",
                field="description",
                required=False,
                data_type="string"
            ),
            ColumnConfig(
                name="Base Commodity Name",
                field="base_commodity_id",
                required=True,
                data_type="string",
                foreign_key="commodities",
                fk_display_field="name",
                fk_lookup_field="name"
            )
        ]
    )
}

def get_entity_config(entity_key: str) -> EntityConfig:
    """Get configuration for an entity"""
    if entity_key not in ENTITY_CONFIGS:
        raise ValueError(f"Unknown entity: {entity_key}")
    return ENTITY_CONFIGS[entity_key]

def get_template_columns(entity_key: str) -> List[str]:
    """Get column names for template download"""
    config = get_entity_config(entity_key)
    return [col.name for col in config.columns]
