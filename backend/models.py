from sqlalchemy import Column, Integer, String, Text, Float, BINARY, DateTime, DECIMAL, Date, BigInteger, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Commodity(Base):
    __tablename__ = "commodities"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    uom_id = Column(Integer, ForeignKey("uoms.id"), nullable=False)
    density = Column(Float, nullable=False)
    energy_uom = Column(String(50))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    
    uom = relationship("UOM")

class UOM(Base):
    __tablename__ = "uoms"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    type = Column(String(50), nullable=False)
    base_uom = Column(String(50), nullable=False)
    description = Column(String(255))
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)

class Blend(Base):
    __tablename__ = "blends"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(255))
    base_commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    
    commodity = relationship("Commodity")

class BlendComponent(Base):
    __tablename__ = "blend_components"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    blend_id = Column(BigInteger, ForeignKey("blends.id"), nullable=False)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    proportion = Column(DECIMAL(10, 6), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    
    blend = relationship("Blend")
    commodity = relationship("Commodity")

class CounterParty(Base):
    __tablename__ = "counter_parties"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    legal_name = Column(String(255), unique=True, nullable=False)
    short_name = Column(String(255))
    counterparty_code = Column(String(100))
    country = Column(String(100))
    type = Column(String(50))
    credit_status = Column(String(50))
    credit_limit = Column(DECIMAL(15, 2))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)

class Location(Base):
    __tablename__ = "locations"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type = Column(String(50))
    description = Column(String(255))
    parent_location_id = Column(Integer, ForeignKey("locations.id"), nullable=True)
    counterparty_id = Column(Integer, ForeignKey("counter_parties.id"), nullable=False)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    
    counter_party = relationship("CounterParty")

class Capacity(Base):
    __tablename__ = "capacity"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("locations.id"), nullable=False)
    quantity = Column(DECIMAL(15, 4), nullable=False)
    uom_id = Column(Integer, ForeignKey("uoms.id"), nullable=False)
    eff_dt_from = Column(Date, nullable=False)
    eff_dt_to = Column(Date, nullable=False)
    sys_config = Column(Text, nullable=True)
    last_modified = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)
    is_deleted = Column(Boolean, default=False)
    commodity = relationship("Commodity")
    location = relationship("Location")
    uom = relationship("UOM")
