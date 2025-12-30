from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import text
from typing import List
from datetime import datetime
import models
import schemas
from database import engine, get_db
import pandas as pd
import io
from decimal import Decimal
from services.import_service import ImportService
from services.import_export_config import get_template_columns

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Data Management API")

# CORS configuration - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for development
    allow_credentials=False,  # Must be False when allow_origins is ["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Data Management API is running"}

# ============== Dependent Data Lookup Endpoints ==============
@app.get("/api/commodities/{commodity_id}/details")
def get_commodity_details(commodity_id: int, db: Session = Depends(get_db)):
    """Fetch complete commodity details with UOM information for auto-population"""
    commodity = db.query(models.Commodity).filter(
        models.Commodity.id == commodity_id,
        models.Commodity.delete == b'\x00' * 16
    ).first()
    
    if not commodity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    
    # Fetch UOM details
    uom = db.query(models.UOM).filter(models.UOM.name == commodity.uom).first()
    energy_uom = db.query(models.UOM).filter(models.UOM.name == commodity.energy_uom).first()
    
    return {
        "id": commodity.id,
        "name": commodity.name,
        "description": commodity.description,
        "density": commodity.density,
        "uom": {
            "name": commodity.uom,
            "type": uom.type if uom else None,
            "base_uom": uom.base_uom if uom else None,
            "description": uom.description if uom else None
        },
        "energy_uom": {
            "name": commodity.energy_uom,
            "type": energy_uom.type if energy_uom else None,
            "base_uom": energy_uom.base_uom if energy_uom else None,
            "description": energy_uom.description if energy_uom else None
        }
    }

@app.get("/api/locations/{location_id}/details")
def get_location_details(location_id: int, db: Session = Depends(get_db)):
    """Fetch complete location details with parent hierarchy for auto-population"""
    location = db.query(models.Location).options(
        joinedload(models.Location.counter_party)
    ).filter(
        models.Location.id == location_id,
        models.Location.delete == b'\x00' * 16
    ).first()
    
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    # Fetch parent location if exists
    parent_location = None
    if location.parent_contvarcharerpartu_id:
        parent = db.query(models.Location).filter(
            models.Location.id == location.parent_contvarcharerpartu_id
        ).first()
        if parent:
            parent_location = {
                "id": parent.id,
                "name": parent.name,
                "type": parent.type
            }
    
    return {
        "id": location.id,
        "name": location.name,
        "type": location.type,
        "description": location.description,
        "counter_party": {
            "id": location.counter_party.CounterpartyID if location.counter_party else None,
            "legal_name": location.counter_party.LegalName if location.counter_party else None,
            "short_name": location.counter_party.ShortName if location.counter_party else None
        },
        "parent_location": parent_location
    }

@app.post("/api/capacity/validate")
def validate_capacity(capacity_data: schemas.CapacityCreate, db: Session = Depends(get_db)):
    """Validate capacity data - check for overlapping date ranges"""
    overlapping = db.query(models.Capacity).filter(
        models.Capacity.commodity_id == capacity_data.commodity_id,
        models.Capacity.location_id == capacity_data.location_id,
        models.Capacity.delete == b'\x00' * 16,
        models.Capacity.eff_dt_from <= capacity_data.eff_dt_to,
        models.Capacity.eff_dt_to >= capacity_data.eff_dt_from
    ).first()
    
    if overlapping:
        return {
            "valid": False,
            "error": f"Overlapping date range found with existing capacity record (ID: {overlapping.id})"
        }
    
    return {"valid": True}

@app.post("/api/blend-components/validate-proportion")
def validate_blend_proportion(blend_id: int, db: Session = Depends(get_db)):
    """Validate that blend component proportions sum to 100%"""
    components = db.query(models.BlendComponent).filter(
        models.BlendComponent.blend_id == blend_id,
        models.BlendComponent.delete == b'\x00' * 16
    ).all()
    
    total = sum(float(c.proportion) for c in components)
    
    return {
        "valid": abs(total - 100.0) < 0.01 or abs(total - 1.0) < 0.01,
        "total": total,
        "message": f"Current total: {total}%. Must equal 100% or 1.0"
    }

# ============== Commodities endpoints ==============
@app.get("/api/commodities", response_model=List[schemas.Commodity])
def get_commodities(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    commodities = db.query(models.Commodity).filter(models.Commodity.delete == b'\x00' * 16).offset(skip).limit(limit).all()
    return commodities

@app.get("/api/commodities/{commodity_id}", response_model=schemas.Commodity)
def get_commodity(commodity_id: int, db: Session = Depends(get_db)):
    commodity = db.query(models.Commodity).filter(models.Commodity.id == commodity_id, models.Commodity.delete == b'\x00' * 16).first()
    if not commodity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    return commodity

@app.post("/api/commodities", response_model=schemas.Commodity)
def create_commodity(commodity: schemas.CommodityCreate, db: Session = Depends(get_db)):
    try:
        db_commodity = models.Commodity(
            **commodity.model_dump(exclude={'is_active'}),
            is_active=b'\x01' + b'\x00' * 15 if commodity.is_active else b'\x00' * 16,
            create_at=datetime.now(),
            update_at=datetime.now(),
            delete=b'\x00' * 16
        )
        db.add(db_commodity)
        db.commit()
        db.refresh(db_commodity)
        return db_commodity
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        if "Duplicate entry" in error_msg and "commodities_uom_unique" in error_msg:
            raise HTTPException(status_code=400, detail="A commodity with this UOM already exists. Each commodity must have a unique UOM.")
        elif "Duplicate entry" in error_msg:
            raise HTTPException(status_code=400, detail="A commodity with these details already exists.")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to create commodity: {error_msg}")

@app.put("/api/commodities/{commodity_id}", response_model=schemas.Commodity)
def update_commodity(commodity_id: int, commodity: schemas.CommodityUpdate, db: Session = Depends(get_db)):
    db_commodity = db.query(models.Commodity).filter(models.Commodity.id == commodity_id).first()
    if not db_commodity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    
    update_data = commodity.model_dump(exclude_unset=True)
    if 'is_active' in update_data:
        update_data['is_active'] = b'\x01' + b'\x00' * 15 if update_data['is_active'] else b'\x00' * 16
    update_data['update_at'] = datetime.now()
    
    for key, value in update_data.items():
        setattr(db_commodity, key, value)
    
    db.commit()
    db.refresh(db_commodity)
    return db_commodity

@app.delete("/api/commodities/{commodity_id}")
def delete_commodity(commodity_id: int, db: Session = Depends(get_db)):
    db_commodity = db.query(models.Commodity).filter(models.Commodity.id == commodity_id).first()
    if not db_commodity:
        raise HTTPException(status_code=404, detail="Commodity not found")
    
    db_commodity.delete = b'\x01' + b'\x00' * 15
    db_commodity.delete_at = datetime.now()
    db.commit()
    return {"message": "Commodity deleted successfully"}

# ============== UOMs endpoints ==============
@app.get("/api/uoms", response_model=List[schemas.UOM])
def get_uoms(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    uoms = db.query(models.UOM).filter(models.UOM.delete == b'\x00' * 16).offset(skip).limit(limit).all()
    return uoms

@app.get("/api/uoms/{uom_id}", response_model=schemas.UOM)
def get_uom(uom_id: int, db: Session = Depends(get_db)):
    uom = db.query(models.UOM).filter(models.UOM.id == uom_id, models.UOM.delete == b'\x00' * 16).first()
    if not uom:
        raise HTTPException(status_code=404, detail="UOM not found")
    return uom

@app.post("/api/uoms", response_model=schemas.UOM)
def create_uom(uom: schemas.UOMCreate, db: Session = Depends(get_db)):
    db_uom = models.UOM(**uom.model_dump(), delete=b'\x00' * 16)
    db.add(db_uom)
    db.commit()
    db.refresh(db_uom)
    return db_uom

@app.put("/api/uoms/{uom_id}", response_model=schemas.UOM)
def update_uom(uom_id: int, uom: schemas.UOMUpdate, db: Session = Depends(get_db)):
    db_uom = db.query(models.UOM).filter(models.UOM.id == uom_id).first()
    if not db_uom:
        raise HTTPException(status_code=404, detail="UOM not found")
    
    update_data = uom.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_uom, key, value)
    
    db.commit()
    db.refresh(db_uom)
    return db_uom

@app.delete("/api/uoms/{uom_id}")
def delete_uom(uom_id: int, db: Session = Depends(get_db)):
    db_uom = db.query(models.UOM).filter(models.UOM.id == uom_id).first()
    if not db_uom:
        raise HTTPException(status_code=404, detail="UOM not found")
    
    db_uom.delete = b'\x01' + b'\x00' * 15
    db_uom.delete_at = datetime.now()
    db.commit()
    return {"message": "UOM deleted successfully"}

# ============== Blends endpoints ==============
@app.get("/api/blends", response_model=List[schemas.Blend])
def get_blends(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    blends = db.query(models.Blend).options(joinedload(models.Blend.commodity)).filter(models.Blend.delete == b'\x00' * 16).offset(skip).limit(limit).all()
    return blends

@app.get("/api/blends/{blend_id}", response_model=schemas.Blend)
def get_blend(blend_id: int, db: Session = Depends(get_db)):
    blend = db.query(models.Blend).options(joinedload(models.Blend.commodity)).filter(models.Blend.id == blend_id, models.Blend.delete == b'\x00' * 16).first()
    if not blend:
        raise HTTPException(status_code=404, detail="Blend not found")
    return blend

@app.post("/api/blends", response_model=schemas.Blend)
def create_blend(blend: schemas.BlendCreate, db: Session = Depends(get_db)):
    db_blend = models.Blend(**blend.model_dump(), delete=b'\x00' * 16)
    db.add(db_blend)
    db.commit()
    db.refresh(db_blend)
    return db_blend

@app.put("/api/blends/{blend_id}", response_model=schemas.Blend)
def update_blend(blend_id: int, blend: schemas.BlendUpdate, db: Session = Depends(get_db)):
    db_blend = db.query(models.Blend).filter(models.Blend.id == blend_id).first()
    if not db_blend:
        raise HTTPException(status_code=404, detail="Blend not found")
    
    update_data = blend.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_blend, key, value)
    
    db.commit()
    db.refresh(db_blend)
    return db_blend

@app.delete("/api/blends/{blend_id}")
def delete_blend(blend_id: int, db: Session = Depends(get_db)):
    db_blend = db.query(models.Blend).filter(models.Blend.id == blend_id).first()
    if not db_blend:
        raise HTTPException(status_code=404, detail="Blend not found")
    
    db_blend.delete = b'\x01' + b'\x00' * 15
    db_blend.delete_at = datetime.now()
    db.commit()
    return {"message": "Blend deleted successfully"}

# ============== Transactional Blend Creation ==============
@app.post("/api/blends/create-with-components")
def create_blend_with_components(data: schemas.CreateBlendWithComponents, db: Session = Depends(get_db)):
    """
    Enterprise-grade transactional endpoint to create blend + components atomically.
    Validates:
    - Proportion sum = 100% (1.0)
    - No duplicate commodities
    - All commodities exist
    """
    try:
        # Validation 1: Check proportion sum equals 100% (1.0)
        total_proportion = sum(c.proportion for c in data.components)
        if abs(total_proportion - 1.0) > 0.001:  # Allow 0.1% tolerance
            raise HTTPException(
                status_code=400,
                detail=f"Total proportion must equal 100% (1.0). Current total: {total_proportion * 100:.2f}%"
            )
        
        # Validation 2: Check for duplicate commodities
        commodity_ids = [c.commodity_id for c in data.components]
        if len(commodity_ids) != len(set(commodity_ids)):
            raise HTTPException(
                status_code=400,
                detail="Duplicate commodities found. Each commodity can only appear once in a blend."
            )
        
        # Validation 3: Verify all commodities exist
        for component in data.components:
            commodity = db.query(models.Commodity).filter(
                models.Commodity.id == component.commodity_id,
                models.Commodity.delete == b'\x00' * 16
            ).first()
            if not commodity:
                raise HTTPException(
                    status_code=404,
                    detail=f"Commodity with ID {component.commodity_id} not found"
                )
        
        # Validation 4: Verify base commodity exists
        base_commodity = db.query(models.Commodity).filter(
            models.Commodity.id == data.commodity_id,
            models.Commodity.delete == b'\x00' * 16
        ).first()
        if not base_commodity:
            raise HTTPException(status_code=404, detail="Base commodity not found")
        
        # Transaction: Create blend
        db_blend = models.Blend(
            name=data.name,
            description=data.description,
            commodity_id=data.commodity_id,
            delete=b'\x00' * 16
        )
        db.add(db_blend)
        db.flush()  # Get blend_id without committing
        
        # Transaction: Create all blend components
        for component in data.components:
            db_component = models.BlendComponent(
                blend_id=db_blend.id,
                commodity_id=component.commodity_id,
                proportion=component.proportion,
                delete=b'\x00' * 16
            )
            db.add(db_component)
        
        # Commit transaction
        db.commit()
        db.refresh(db_blend)
        
        # Fetch complete blend with components for response
        blend_with_components = db.query(models.Blend).options(
            joinedload(models.Blend.commodity)
        ).filter(models.Blend.id == db_blend.id).first()
        
        components_list = db.query(models.BlendComponent).options(
            joinedload(models.BlendComponent.commodity)
        ).filter(
            models.BlendComponent.blend_id == db_blend.id,
            models.BlendComponent.delete == b'\x00' * 16
        ).all()
        
        return {
            "blend": {
                "id": blend_with_components.id,
                "name": blend_with_components.name,
                "description": blend_with_components.description,
                "commodity_id": blend_with_components.commodity_id,
                "commodity": {
                    "id": blend_with_components.commodity.id,
                    "name": blend_with_components.commodity.name
                } if blend_with_components.commodity else None
            },
            "components": [
                {
                    "id": comp.id,
                    "blend_id": comp.blend_id,
                    "commodity_id": comp.commodity_id,
                    "proportion": float(comp.proportion),
                    "commodity": {
                        "id": comp.commodity.id,
                        "name": comp.commodity.name
                    } if comp.commodity else None
                }
                for comp in components_list
            ],
            "total_proportion": sum(float(c.proportion) for c in components_list),
            "message": "Blend and components created successfully"
        }
        
    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create blend: {str(e)}")

# ============== Blend Components endpoints ==============
@app.get("/api/blend-components", response_model=List[schemas.BlendComponent])
def get_blend_components(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    components = db.query(models.BlendComponent).options(joinedload(models.BlendComponent.blend), joinedload(models.BlendComponent.commodity)).filter(models.BlendComponent.delete == b'\x00' * 16).offset(skip).limit(limit).all()
    return components

@app.get("/api/blend-components/{component_id}", response_model=schemas.BlendComponent)
def get_blend_component(component_id: int, db: Session = Depends(get_db)):
    component = db.query(models.BlendComponent).filter(models.BlendComponent.id == component_id, models.BlendComponent.delete == b'\x00' * 16).first()
    if not component:
        raise HTTPException(status_code=404, detail="Blend Component not found")
    return component

@app.post("/api/blend-components", response_model=schemas.BlendComponent)
def create_blend_component(component: schemas.BlendComponentCreate, db: Session = Depends(get_db)):
    # Check for duplicate commodity in same blend
    existing = db.query(models.BlendComponent).filter(
        models.BlendComponent.blend_id == component.blend_id,
        models.BlendComponent.commodity_id == component.commodity_id,
        models.BlendComponent.delete == b'\x00' * 16
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="This commodity already exists in this blend"
        )
    
    db_component = models.BlendComponent(**component.model_dump(), delete=b'\x00' * 16)
    db.add(db_component)
    db.commit()
    db.refresh(db_component)
    return db_component

@app.put("/api/blend-components/{component_id}", response_model=schemas.BlendComponent)
def update_blend_component(component_id: int, component: schemas.BlendComponentUpdate, db: Session = Depends(get_db)):
    db_component = db.query(models.BlendComponent).filter(models.BlendComponent.id == component_id).first()
    if not db_component:
        raise HTTPException(status_code=404, detail="Blend Component not found")
    
    update_data = component.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_component, key, value)
    
    db.commit()
    db.refresh(db_component)
    return db_component

@app.delete("/api/blend-components/{component_id}")
def delete_blend_component(component_id: int, db: Session = Depends(get_db)):
    db_component = db.query(models.BlendComponent).filter(models.BlendComponent.id == component_id).first()
    if not db_component:
        raise HTTPException(status_code=404, detail="Blend Component not found")
    
    db_component.delete = b'\x01' + b'\x00' * 15
    db_component.delete_at = datetime.now()
    db.commit()
    return {"message": "Blend Component deleted successfully"}

# ============== Locations endpoints ==============
@app.get("/api/locations", response_model=List[schemas.Location])
def get_locations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    locations = db.query(models.Location).options(joinedload(models.Location.counter_party)).filter(models.Location.delete == b'\x00' * 16).offset(skip).limit(limit).all()
    return locations

@app.get("/api/locations/{location_id}", response_model=schemas.Location)
def get_location(location_id: int, db: Session = Depends(get_db)):
    location = db.query(models.Location).filter(models.Location.id == location_id, models.Location.delete == b'\x00' * 16).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@app.post("/api/locations", response_model=schemas.Location)
def create_location(location: schemas.LocationCreate, db: Session = Depends(get_db)):
    db_location = models.Location(**location.model_dump(), delete=b'\x00' * 16)
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@app.put("/api/locations/{location_id}", response_model=schemas.Location)
def update_location(location_id: int, location: schemas.LocationUpdate, db: Session = Depends(get_db)):
    db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    update_data = location.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_location, key, value)
    
    db.commit()
    db.refresh(db_location)
    return db_location

@app.delete("/api/locations/{location_id}")
def delete_location(location_id: int, db: Session = Depends(get_db)):
    db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if not db_location:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db_location.delete = b'\x01' + b'\x00' * 15
    db_location.delete_at = datetime.now()
    db.commit()
    return {"message": "Location deleted successfully"}

# ============== Counter Parties endpoints ==============
@app.get("/api/counter-parties", response_model=List[schemas.CounterParty])
def get_counter_parties(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    parties = db.query(models.CounterParty).filter(models.CounterParty.delete == b'\x00' * 16).offset(skip).limit(limit).all()
    return parties

@app.get("/api/counter-parties/{party_id}", response_model=schemas.CounterParty)
def get_counter_party(party_id: int, db: Session = Depends(get_db)):
    party = db.query(models.CounterParty).filter(models.CounterParty.CounterpartyID == party_id, models.CounterParty.delete == b'\x00' * 16).first()
    if not party:
        raise HTTPException(status_code=404, detail="Counter Party not found")
    return party

@app.post("/api/counter-parties", response_model=schemas.CounterParty)
def create_counter_party(party: schemas.CounterPartyCreate, db: Session = Depends(get_db)):
    try:
        db_party = models.CounterParty(
            **party.model_dump(),
            CreatedAt=datetime.now(),
            UpdatedAt=datetime.now(),
            delete=b'\x00' * 16
        )
        db.add(db_party)
        db.commit()
        db.refresh(db_party)
        return db_party
    except Exception as e:
        db.rollback()
        error_msg = str(e)
        if "Duplicate entry" in error_msg:
            if "counter_parties_legalname_unique" in error_msg or "LegalName" in error_msg:
                raise HTTPException(status_code=400, detail="A counter party with this legal name already exists.")
            elif "CounterpartyCode" in error_msg:
                raise HTTPException(status_code=400, detail="A counter party with this code already exists.")
            else:
                raise HTTPException(status_code=400, detail="A counter party with these details already exists.")
        else:
            raise HTTPException(status_code=500, detail=f"Failed to create counter party: {error_msg}")

@app.put("/api/counter-parties/{party_id}", response_model=schemas.CounterParty)
def update_counter_party(party_id: int, party: schemas.CounterPartyUpdate, db: Session = Depends(get_db)):
    db_party = db.query(models.CounterParty).filter(models.CounterParty.CounterpartyID == party_id).first()
    if not db_party:
        raise HTTPException(status_code=404, detail="Counter Party not found")
    
    update_data = party.model_dump(exclude_unset=True)
    update_data['UpdatedAt'] = datetime.now()
    
    for key, value in update_data.items():
        setattr(db_party, key, value)
    
    db.commit()
    db.refresh(db_party)
    return db_party

@app.delete("/api/counter-parties/{party_id}")
def delete_counter_party(party_id: int, db: Session = Depends(get_db)):
    db_party = db.query(models.CounterParty).filter(models.CounterParty.CounterpartyID == party_id).first()
    if not db_party:
        raise HTTPException(status_code=404, detail="Counter Party not found")
    
    db_party.delete = b'\x01' + b'\x00' * 15
    db_party.delete_at = datetime.now()
    db.commit()
    return {"message": "Counter Party deleted successfully"}

# ============== Capacity endpoints ==============
@app.get("/api/capacity", response_model=List[schemas.Capacity])
def get_capacity(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    capacity = db.query(models.Capacity).options(
        joinedload(models.Capacity.commodity),
        joinedload(models.Capacity.location),
        joinedload(models.Capacity.uom)
    ).filter(models.Capacity.delete == b'\x00' * 16).offset(skip).limit(limit).all()
    return capacity

@app.get("/api/capacity/{capacity_id}", response_model=schemas.Capacity)
def get_capacity_item(capacity_id: int, db: Session = Depends(get_db)):
    capacity = db.query(models.Capacity).filter(models.Capacity.id == capacity_id, models.Capacity.delete == b'\x00' * 16).first()
    if not capacity:
        raise HTTPException(status_code=404, detail="Capacity not found")
    return capacity

@app.post("/api/capacity", response_model=schemas.Capacity)
def create_capacity(capacity: schemas.CapacityCreate, db: Session = Depends(get_db)):
    try:
        # Validate no overlapping date ranges
        overlapping = db.query(models.Capacity).filter(
            models.Capacity.commodity_id == capacity.commodity_id,
            models.Capacity.location_id == capacity.location_id,
            models.Capacity.delete == b'\x00' * 16,
            models.Capacity.eff_dt_from <= capacity.eff_dt_to,
            models.Capacity.eff_dt_to >= capacity.eff_dt_from
        ).first()
        
        if overlapping:
            raise HTTPException(
                status_code=400, 
                detail=f"Overlapping date range with existing capacity record (ID: {overlapping.id})"
            )
        
        db_capacity = models.Capacity(
            **capacity.model_dump(),
            dt_last_modified=datetime.now().date(),
            delete=b'\x00' * 16
        )
        db.add(db_capacity)
        db.commit()
        db.refresh(db_capacity)
        return db_capacity
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create capacity: {str(e)}")

@app.put("/api/capacity/{capacity_id}", response_model=schemas.Capacity)
def update_capacity(capacity_id: int, capacity: schemas.CapacityUpdate, db: Session = Depends(get_db)):
    db_capacity = db.query(models.Capacity).filter(models.Capacity.id == capacity_id).first()
    if not db_capacity:
        raise HTTPException(status_code=404, detail="Capacity not found")
    
    update_data = capacity.model_dump(exclude_unset=True)
    update_data['dt_last_modified'] = datetime.now().date()
    
    for key, value in update_data.items():
        setattr(db_capacity, key, value)
    
    db.commit()
    db.refresh(db_capacity)
    return db_capacity

@app.delete("/api/capacity/{capacity_id}")
def delete_capacity(capacity_id: int, db: Session = Depends(get_db)):
    db_capacity = db.query(models.Capacity).filter(models.Capacity.id == capacity_id).first()
    if not db_capacity:
        raise HTTPException(status_code=404, detail="Capacity not found")
    
    db_capacity.delete = b'\x01' + b'\x00' * 15
    db_capacity.delete_at = datetime.now()
    db.commit()
    return {"message": "Capacity deleted successfully"}

# ============== EXPORT ENDPOINTS ==============

@app.get("/api/export/commodities")
def export_commodities(db: Session = Depends(get_db)):
    """
    Export commodities with UOM names (no IDs exposed)
    JOIN query to get human-readable data
    """
    query = text("""
        SELECT 
            c.name AS 'Commodity Name',
            c.description AS 'Description',
            c.density AS 'Density',
            u1.name AS 'UOM',
            u2.name AS 'Energy UOM'
        FROM commodities c
        LEFT JOIN uoms u1 ON c.uom = u1.name
        LEFT JOIN uoms u2 ON c.energy_uom = u2.name
        WHERE c.delete = 0x00000000000000000000000000000000
        ORDER BY c.name
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    columns = result.keys()
    
    # Create DataFrame
    df = pd.DataFrame(rows, columns=columns)
    
    # Generate Excel file
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Commodities')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=commodities_export.xlsx'}
    )

@app.get("/api/export/capacity")
def export_capacity(db: Session = Depends(get_db)):
    """
    Export capacity with names instead of IDs
    Uses JOINs to resolve all foreign keys
    """
    query = text("""
        SELECT 
            c.name AS 'Commodity Name',
            l.name AS 'Location Name',
            l.type AS 'Location Type',
            u.name AS 'UOM',
            cap.quantity AS 'Quantity',
            cap.eff_dt_from AS 'Effective From',
            cap.eff_dt_to AS 'Effective To',
            cap.dt_last_modified AS 'Last Modified'
        FROM capacity cap
        INNER JOIN commodities c ON cap.commodity_id = c.id
        INNER JOIN location l ON cap.location_id = l.id
        INNER JOIN uoms u ON cap.uom_id = u.id
        WHERE cap.delete = 0x00000000000000000000000000000000
            AND c.delete = 0x00000000000000000000000000000000
            AND l.delete = 0x00000000000000000000000000000000
        ORDER BY c.name, l.name, cap.eff_dt_from
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    columns = result.keys()
    
    df = pd.DataFrame(rows, columns=columns)
    
    # Format dates
    if 'Effective From' in df.columns:
        df['Effective From'] = pd.to_datetime(df['Effective From']).dt.strftime('%Y-%m-%d')
    if 'Effective To' in df.columns:
        df['Effective To'] = pd.to_datetime(df['Effective To']).dt.strftime('%Y-%m-%d')
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Capacity')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=capacity_export.xlsx'}
    )

@app.get("/api/export/blends")
def export_blends(db: Session = Depends(get_db)):
    """
    Export blends with base commodity name
    """
    query = text("""
        SELECT 
            b.name AS 'Blend Name',
            b.description AS 'Description',
            c.name AS 'Base Commodity'
        FROM blends b
        INNER JOIN commodities c ON b.commodity_id = c.id
        WHERE b.delete = 0x00000000000000000000000000000000
            AND c.delete = 0x00000000000000000000000000000000
        ORDER BY b.name
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    columns = result.keys()
    
    df = pd.DataFrame(rows, columns=columns)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Blends')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=blends_export.xlsx'}
    )

@app.get("/api/export/blend-components")
def export_blend_components(db: Session = Depends(get_db)):
    """
    Export blend components with blend and commodity names
    Shows proportion as percentage
    """
    query = text("""
        SELECT 
            b.name AS 'Blend Name',
            c.name AS 'Commodity Name',
            ROUND(bc.proportion * 100, 2) AS 'Proportion (%)',
            bc.proportion AS 'Proportion (Decimal)'
        FROM blendComponents bc
        INNER JOIN blends b ON bc.blend_id = b.id
        INNER JOIN commodities c ON bc.commodity_id = c.id
        WHERE bc.delete = 0x00000000000000000000000000000000
            AND b.delete = 0x00000000000000000000000000000000
            AND c.delete = 0x00000000000000000000000000000000
        ORDER BY b.name, bc.proportion DESC
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    columns = result.keys()
    
    df = pd.DataFrame(rows, columns=columns)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Blend Components')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=blend_components_export.xlsx'}
    )

# ============== IMPORT ENDPOINTS ==============

@app.post("/api/import/capacity")
async def import_capacity(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import capacity from Excel/CSV file
    Validates all data before inserting
    Uses transaction for atomicity
    """
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="File must be Excel (.xlsx, .xls) or CSV (.csv)")
    
    try:
        # Read file
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['Commodity Name', 'Location Name', 'UOM', 'Quantity', 'Effective From', 'Effective To']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400, 
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        successful_imports = []
        failed_imports = []
        
        # Begin transaction
        try:
            for index, row in df.iterrows():
                row_number = index + 2  # +2 because Excel starts at 1 and header is row 1
                errors = []
                
                # Resolve Commodity ID
                commodity = db.query(models.Commodity).filter(
                    models.Commodity.name == str(row['Commodity Name']).strip(),
                    models.Commodity.delete == b'\x00' * 16
                ).first()
                if not commodity:
                    errors.append(f"Commodity '{row['Commodity Name']}' not found")
                
                # Resolve Location ID
                location = db.query(models.Location).filter(
                    models.Location.name == str(row['Location Name']).strip(),
                    models.Location.delete == b'\x00' * 16
                ).first()
                if not location:
                    errors.append(f"Location '{row['Location Name']}' not found")
                
                # Resolve UOM ID
                uom = db.query(models.UOM).filter(
                    models.UOM.name == str(row['UOM']).strip(),
                    models.UOM.delete == b'\x00' * 16
                ).first()
                if not uom:
                    errors.append(f"UOM '{row['UOM']}' not found")
                
                # Validate quantity
                try:
                    quantity = float(row['Quantity'])
                    if quantity <= 0:
                        errors.append("Quantity must be greater than 0")
                except (ValueError, TypeError):
                    errors.append(f"Invalid quantity: {row['Quantity']}")
                    quantity = None
                
                # Validate dates
                try:
                    eff_from = pd.to_datetime(row['Effective From']).strftime('%Y-%m-%d')
                    eff_to = pd.to_datetime(row['Effective To']).strftime('%Y-%m-%d')
                    if eff_from >= eff_to:
                        errors.append("Effective From must be before Effective To")
                except Exception as e:
                    errors.append(f"Invalid date format: {str(e)}")
                    eff_from = eff_to = None
                
                if errors:
                    failed_imports.append({
                        "row": row_number,
                        "data": row.to_dict(),
                        "errors": errors
                    })
                    continue
                
                # Check for overlaps (business rule validation)
                overlap = db.query(models.Capacity).filter(
                    models.Capacity.commodity_id == commodity.id,
                    models.Capacity.location_id == location.id,
                    models.Capacity.delete == b'\x00' * 16,
                    models.Capacity.eff_dt_from < eff_to,
                    models.Capacity.eff_dt_to > eff_from
                ).first()
                
                if overlap:
                    errors.append("Overlapping capacity record exists for this commodity/location/date range")
                    failed_imports.append({
                        "row": row_number,
                        "data": row.to_dict(),
                        "errors": errors
                    })
                    continue
                
                # Insert record
                db_capacity = models.Capacity(
                    commodity_id=commodity.id,
                    location_id=location.id,
                    uom_id=uom.id,
                    quantity=quantity,
                    eff_dt_from=eff_from,
                    eff_dt_to=eff_to,
                    delete=b'\x00' * 16
                )
                db.add(db_capacity)
                successful_imports.append({
                    "row": row_number,
                    "commodity": commodity.name,
                    "location": location.name
                })
            
            # Commit transaction if no critical errors
            if failed_imports and not successful_imports:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Import failed - no valid records",
                        "failed": failed_imports
                    }
                )
            
            db.commit()
            
            return {
                "message": f"Import completed: {len(successful_imports)} successful, {len(failed_imports)} failed",
                "successful": successful_imports,
                "failed": failed_imports
            }
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.post("/api/import/blends")
async def import_blends(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """
    Import blends with components from Excel/CSV
    Validates proportion sum = 100% per blend
    Uses transaction for atomicity
    """
    if not file.filename.endswith(('.xlsx', '.xls', '.csv')):
        raise HTTPException(status_code=400, detail="File must be Excel (.xlsx, .xls) or CSV (.csv)")
    
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        else:
            df = pd.read_excel(io.BytesIO(contents))
        
        # Validate required columns
        required_columns = ['Blend Name', 'Blend Description', 'Base Commodity', 'Component Commodity', 'Proportion (%)']
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        successful_imports = []
        failed_imports = []
        
        # Group by blend
        blend_groups = df.groupby('Blend Name')
        
        try:
            for blend_name, blend_rows in blend_groups:
                row_numbers = blend_rows.index + 2
                errors = []
                
                # Validate blend doesn't exist
                existing_blend = db.query(models.Blend).filter(
                    models.Blend.name == str(blend_name).strip(),
                    models.Blend.delete == b'\x00' * 16
                ).first()
                if existing_blend:
                    errors.append(f"Blend '{blend_name}' already exists")
                
                # Get blend info from first row
                first_row = blend_rows.iloc[0]
                blend_description = str(first_row['Blend Description']).strip()
                
                # Resolve base commodity
                base_commodity = db.query(models.Commodity).filter(
                    models.Commodity.name == str(first_row['Base Commodity']).strip(),
                    models.Commodity.delete == b'\x00' * 16
                ).first()
                if not base_commodity:
                    errors.append(f"Base commodity '{first_row['Base Commodity']}' not found")
                
                # Validate components
                components = []
                total_proportion = 0
                commodity_ids = []
                
                for idx, row in blend_rows.iterrows():
                    # Resolve component commodity
                    component_commodity = db.query(models.Commodity).filter(
                        models.Commodity.name == str(row['Component Commodity']).strip(),
                        models.Commodity.delete == b'\x00' * 16
                    ).first()
                    if not component_commodity:
                        errors.append(f"Component commodity '{row['Component Commodity']}' not found")
                        continue
                    
                    # Check for duplicates
                    if component_commodity.id in commodity_ids:
                        errors.append(f"Duplicate commodity '{row['Component Commodity']}' in blend")
                        continue
                    
                    # Validate proportion
                    try:
                        proportion_pct = float(row['Proportion (%)'])
                        if proportion_pct <= 0 or proportion_pct > 100:
                            errors.append(f"Proportion must be between 0 and 100, got {proportion_pct}")
                            continue
                        proportion = proportion_pct / 100.0
                        total_proportion += proportion
                        commodity_ids.append(component_commodity.id)
                        components.append({
                            "commodity_id": component_commodity.id,
                            "proportion": proportion
                        })
                    except (ValueError, TypeError):
                        errors.append(f"Invalid proportion: {row['Proportion (%)']}")
                
                # Validate total proportion
                if abs(total_proportion - 1.0) > 0.001:
                    errors.append(f"Total proportion must equal 100%, got {total_proportion * 100:.2f}%")
                
                if errors:
                    failed_imports.append({
                        "blend": blend_name,
                        "rows": list(row_numbers),
                        "errors": errors
                    })
                    continue
                
                # Create blend
                db_blend = models.Blend(
                    name=str(blend_name).strip(),
                    description=blend_description,
                    commodity_id=base_commodity.id,
                    delete=b'\x00' * 16
                )
                db.add(db_blend)
                db.flush()  # Get blend ID
                
                # Create components
                for component in components:
                    db_component = models.BlendComponent(
                        blend_id=db_blend.id,
                        commodity_id=component['commodity_id'],
                        proportion=component['proportion'],
                        delete=b'\x00' * 16
                    )
                    db.add(db_component)
                
                successful_imports.append({
                    "blend": blend_name,
                    "components": len(components)
                })
            
            if failed_imports and not successful_imports:
                db.rollback()
                raise HTTPException(
                    status_code=400,
                    detail={
                        "message": "Import failed - no valid records",
                        "failed": failed_imports
                    }
                )
            
            db.commit()
            
            return {
                "message": f"Import completed: {len(successful_imports)} blends successful, {len(failed_imports)} failed",
                "successful": successful_imports,
                "failed": failed_imports
            }
            
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.get("/api/export/uoms")
def export_uoms(db: Session = Depends(get_db)):
    """
    Export UOMs - all fields are human-readable, no IDs exposed
    """
    query = text("""
        SELECT 
            name AS 'UOM Name',
            type AS 'Type',
            base_uom AS 'Base UOM',
            description AS 'Description'
        FROM uoms
        WHERE `delete` = 0x00000000000000000000000000000000
        ORDER BY name
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    columns = result.keys()
    
    df = pd.DataFrame(rows, columns=columns)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='UOMs')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=uoms_export.xlsx'}
    )

@app.get("/api/export/locations")
def export_locations(db: Session = Depends(get_db)):
    """
    Export locations with parent location and counter party names
    """
    query = text("""
        SELECT 
            l.name AS 'Location Name',
            l.type AS 'Type',
            l.description AS 'Description',
            pl.name AS 'Parent Location',
            cp.LegalName AS 'Counter Party Legal Name',
            cp.ShortName AS 'Counter Party Short Name'
        FROM location l
        LEFT JOIN location pl ON l.parent_location_id = pl.id
        LEFT JOIN counter_parties cp ON l.counterparty_id = cp.id
        WHERE l.delete = 0x00000000000000000000000000000000
        ORDER BY l.name
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    columns = result.keys()
    
    df = pd.DataFrame(rows, columns=columns)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Locations')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=locations_export.xlsx'}
    )

@app.get("/api/export/counter-parties")
def export_counter_parties(db: Session = Depends(get_db)):
    """
    Export counter parties - all fields are human-readable
    """
    query = text("""
        SELECT 
            LegalName AS 'Legal Name',
            ShortName AS 'Short Name',
            CounterpartyCode AS 'Code',
            Country AS 'Country',
            Type AS 'Type',
            CreditStatus AS 'Credit Status',
            CreditLimit AS 'Credit Limit'
        FROM counter_parties
        WHERE `delete` = 0x00000000000000000000000000000000
        ORDER BY LegalName
    """)
    
    result = db.execute(query)
    rows = result.fetchall()
    columns = result.keys()
    
    df = pd.DataFrame(rows, columns=columns)
    
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, index=False, sheet_name='Counter Parties')
    output.seek(0)
    
    return StreamingResponse(
        output,
        media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        headers={'Content-Disposition': 'attachment; filename=counter_parties_export.xlsx'}
    )

# ================================
# GENERIC IMPORT ENDPOINTS
# ================================

@app.post("/api/import/{entity_key}")
async def import_entity(
    entity_key: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Generic import endpoint for any entity
    Supported entities: commodities, uoms, locations, counter_parties, blend_components, capacity, blends
    """
    try:
        # Read file content
        content = await file.read()
        
        # Use ImportService for validation and import
        import_service = ImportService(db, entity_key)
        result = import_service.validate_and_import(content, file.filename)
        
        # Return appropriate status code
        if result["failed"] > 0 and result["successful"] == 0:
            raise HTTPException(status_code=400, detail=result)
        
        return result
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Import failed: {str(e)}")

@app.get("/api/template/{entity_key}")
def download_template(entity_key: str):
    """
    Download import template for any entity
    Returns an Excel file with proper column headers
    """
    try:
        columns = get_template_columns(entity_key)
        
        # Create empty DataFrame with column headers
        df = pd.DataFrame(columns=columns)
        
        # Generate Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, sheet_name='Template')
        output.seek(0)
        
        return StreamingResponse(
            output,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename={entity_key}_import_template.xlsx'}
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
