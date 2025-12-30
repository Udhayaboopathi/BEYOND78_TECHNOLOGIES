from pydantic import BaseModel, ConfigDict
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
    id: int
    legal_name: str
    short_name: str

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
    uom_id: int
    density: Optional[float] = None
    energy_uom: Optional[str] = None
    is_active: bool = True

class CommodityUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    uom_id: Optional[int] = None
    density: Optional[float] = None
    energy_uom: Optional[str] = None
    is_active: Optional[bool] = None

class Commodity(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: str
    uom_id: int
    density: Optional[float] = None
    energy_uom: Optional[str] = None
    is_active: Optional[bool] = True
    created_at: datetime
    updated_at: datetime
    uom: Optional[UOMNested] = None

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
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    type: str
    base_uom: str
    description: str

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
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    description: str
    commodity_id: int
    commodity: Optional[CommodityNested] = None

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
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    blend_id: int
    commodity_id: int
    proportion: float
    blend: Optional[BlendNested] = None
    commodity: Optional[CommodityNested] = None

# CounterParty schemas
# CounterParty schemas
class CounterPartyCreate(BaseModel):
    legal_name: str
    short_name: str
    counterparty_code: str
    country: str
    type: str
    credit_status: str
    credit_limit: float

class CounterPartyUpdate(BaseModel):
    legal_name: Optional[str] = None
    short_name: Optional[str] = None
    counterparty_code: Optional[str] = None
    country: Optional[str] = None
    type: Optional[str] = None
    credit_status: Optional[str] = None
    credit_limit: Optional[float] = None

class CounterParty(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    legal_name: str
    short_name: str
    counterparty_code: str
    country: str
    type: str
    credit_status: str
    credit_limit: float
    created_at: datetime
    updated_at: datetime

# Location schemas
class LocationCreate(BaseModel):
    name: str
    type: str
    description: str
    counterparty_id: int

class LocationUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    description: Optional[str] = None
    counterparty_id: Optional[int] = None

class Location(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    name: str
    type: str
    description: str
    counterparty_id: int
    counter_party: Optional[CounterPartyNested] = None

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
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    commodity_id: int
    location_id: int
    quantity: float
    uom_id: int
    eff_dt_from: date
    eff_dt_to: date
    last_modified: datetime
    commodity: Optional[CommodityNested] = None
    location: Optional[LocationNested] = None
    uom: Optional[UOMNested] = None
