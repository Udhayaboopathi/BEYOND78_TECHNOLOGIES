from sqlalchemy import Column, Integer, String, Text, Float, BINARY, DateTime, DECIMAL, Date, BigInteger, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Commodity(Base):
    __tablename__ = "commodities"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(Text, nullable=False)
    uom = Column(String(255), nullable=False)
    density = Column(Float, nullable=False)
    energy_uom = Column(String(255), nullable=False)
    is_active = Column(BINARY(16), nullable=False)
    create_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    update_at = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    delete_at = Column(DateTime, nullable=True)
    delete = Column(BINARY(16), nullable=False, default=b'\x00' * 16)

class UOM(Base):
    __tablename__ = "uoms"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    type = Column(String(255), nullable=False)
    base_uom = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    delete_at = Column(DateTime, nullable=True)
    delete = Column(BINARY(16), nullable=False, default=b'\x00' * 16)

class Blend(Base):
    __tablename__ = "blends"
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(255), nullable=False)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    delete_at = Column(DateTime, nullable=True)
    delete = Column(BINARY(16), nullable=False, default=b'\x00' * 16)
    
    commodity = relationship("Commodity")

class BlendComponent(Base):
    __tablename__ = "blendComponents"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    blend_id = Column(BigInteger, ForeignKey("blends.id"), nullable=False)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    proportion = Column(DECIMAL(10, 6), nullable=False)
    delete_at = Column(DateTime, nullable=True)
    delete = Column(BINARY(16), nullable=False, default=b'\x00' * 16)
    
    blend = relationship("Blend")
    commodity = relationship("Commodity")

class CounterParty(Base):
    __tablename__ = "counter_parties"
    
    CounterpartyID = Column(Integer, primary_key=True, autoincrement=True)
    LegalName = Column(String(255), unique=True, nullable=False)
    ShortName = Column(String(255), nullable=False)
    CounterpartyCode = Column(String(255), nullable=False)
    Country = Column(String(255), nullable=False)
    Type = Column(String(255), nullable=False)
    CreditStatus = Column(String(255), nullable=False)
    CreditLimit = Column(DECIMAL(15, 2), nullable=False)
    CreatedAt = Column(DateTime, nullable=False, default=datetime.utcnow)
    UpdatedAt = Column(DateTime, nullable=False, default=datetime.utcnow, onupdate=datetime.utcnow)
    delete_at = Column(DateTime, nullable=True)
    delete = Column(BINARY(16), nullable=False, default=b'\x00' * 16)

class Location(Base):
    __tablename__ = "location"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(255), nullable=False)
    type = Column(String(255), nullable=False)
    description = Column(String(255), nullable=False)
    parent_contvarcharerpartu_id = Column(Integer, ForeignKey("counter_parties.CounterpartyID"), nullable=False)
    delete_at = Column(DateTime, nullable=True)
    delete = Column(BINARY(16), nullable=False, default=b'\x00' * 16)
    
    counter_party = relationship("CounterParty")

class Capacity(Base):
    __tablename__ = "capacity"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    commodity_id = Column(Integer, ForeignKey("commodities.id"), nullable=False)
    location_id = Column(Integer, ForeignKey("location.id"), nullable=False)
    quantity = Column(DECIMAL(15, 4), nullable=False)
    uom_id = Column(Integer, ForeignKey("uoms.id"), nullable=False)
    eff_dt_from = Column(Date, nullable=False)
    eff_dt_to = Column(Date, nullable=False)
    dt_last_modified = Column(Date, nullable=False, default=datetime.utcnow)
    delete_at = Column(DateTime, nullable=True)
    delete = Column(BINARY(16), nullable=False, default=b'\x00' * 16)
    
    commodity = relationship("Commodity")
    location = relationship("Location")
    uom = relationship("UOM")
