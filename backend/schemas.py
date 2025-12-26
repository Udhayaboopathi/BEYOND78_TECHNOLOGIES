from pydantic import BaseModel
from datetime import datetime, date
from typing import Optional

# Nested schemas for relationships
class CommodityNested(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class UOMNested(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class BlendNested(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

class CounterPartyNested(BaseModel):
    CounterpartyID: int
    LegalName: str
    ShortName: str

# Blend Component for transactional creation
class BlendComponentInput(BaseModel):
    commodity_id: int
    proportion: float  # Store as decimal (0.5 for 50%)

class CreateBlendWithComponents(BaseModel):
    name: str
    description: str
    commodity_id: int
    components: list[BlendComponentInput]
    
    class Config:
        from_attributes = True

class LocationNested(BaseModel):
    id: int
    name: str
    
    class Config:
        from_attributes = True

# Commodity schemas
class CommodityCreate(BaseModel):
    name: str
    description: str
    uom: str
    density: float
    energy_uom: str
    is_active: bool = True

class CommodityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    uom: Optional[str] = None
    density: Optional[float] = None
    energy_uom: Optional[str] = None
    is_active: Optional[bool] = None

class Commodity(BaseModel):
    id: int
    name: str
    description: str
    uom: str
    density: float
    energy_uom: str
    create_at: datetime
    update_at: datetime
    
    class Config:
        from_attributes = True

# UOM schemas
class UOMCreate(BaseModel):
    name: str
    type: str
    base_uom: str
    description: str

class UOMUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    base_uom: Optional[str] = None
    description: Optional[str] = None

class UOM(BaseModel):
    id: int
    name: str
    type: str
    base_uom: str
    description: str
    
    class Config:
        from_attributes = True

# Blend schemas
class BlendCreate(BaseModel):
    name: str
    description: str
    commodity_id: int

class BlendUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    commodity_id: Optional[int] = None

class Blend(BaseModel):
    id: int
    name: str
    description: str
    commodity_id: int
    commodity: Optional[CommodityNested] = None
    
    class Config:
        from_attributes = True

# BlendComponent schemas
class BlendComponentCreate(BaseModel):
    blend_id: int
    commodity_id: int
    proportion: float

class BlendComponentUpdate(BaseModel):
    blend_id: Optional[int] = None
    commodity_id: Optional[int] = None
    proportion: Optional[float] = None

class BlendComponent(BaseModel):
    id: int
    blend_id: int
    commodity_id: int
    proportion: float
    blend: Optional[BlendNested] = None
    commodity: Optional[CommodityNested] = None
    
    class Config:
        from_attributes = True

# CounterParty schemas
class CounterPartyCreate(BaseModel):
    LegalName: str
    ShortName: str
    CounterpartyCode: str
    Country: str
    Type: str
    CreditStatus: str
    CreditLimit: float

class CounterPartyUpdate(BaseModel):
    LegalName: Optional[str] = None
    ShortName: Optional[str] = None
    CounterpartyCode: Optional[str] = None
    Country: Optional[str] = None
    Type: Optional[str] = None
    CreditStatus: Optional[str] = None
    CreditLimit: Optional[float] = None

class CounterParty(BaseModel):
    CounterpartyID: int
    LegalName: str
    ShortName: str
    CounterpartyCode: str
    Country: str
    Type: str
    CreditStatus: str
    CreditLimit: float
    CreatedAt: datetime
    UpdatedAt: datetime
    
    class Config:
        from_attributes = True

# Location schemas
class LocationCreate(BaseModel):
    name: str
    type: str
    description: str
    parent_contvarcharerpartu_id: int

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    parent_contvarcharerpartu_id: Optional[int] = None

class Location(BaseModel):
    id: int
    name: str
    type: str
    description: str
    parent_contvarcharerpartu_id: int
    counter_party: Optional[CounterPartyNested] = None
    
    class Config:
        from_attributes = True

# Capacity schemas
class CapacityCreate(BaseModel):
    commodity_id: int
    location_id: int
    quantity: float
    uom_id: int
    eff_dt_from: date
    eff_dt_to: date

class CapacityUpdate(BaseModel):
    commodity_id: Optional[int] = None
    location_id: Optional[int] = None
    quantity: Optional[float] = None
    uom_id: Optional[int] = None
    eff_dt_from: Optional[date] = None
    eff_dt_to: Optional[date] = None

class Capacity(BaseModel):
    id: int
    commodity_id: int
    location_id: int
    quantity: float
    uom_id: int
    eff_dt_from: date
    eff_dt_to: date
    dt_last_modified: date
    commodity: Optional[CommodityNested] = None
    location: Optional[LocationNested] = None
    uom: Optional[UOMNested] = None
    
    class Config:
        from_attributes = True
