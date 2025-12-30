from database import get_db, engine
from sqlalchemy import text
from datetime import datetime

db = next(get_db())

# Check if Liter and MJ exist
liter = db.execute(text("SELECT * FROM uoms WHERE name = :name AND `delete` = 0x00000000000000000000000000000000"), {"name": "Liter"}).fetchone()
mj = db.execute(text("SELECT * FROM uoms WHERE name = :name AND `delete` = 0x00000000000000000000000000000000"), {"name": "MJ"}).fetchone()

print(f"Liter exists: {liter is not None}")
print(f"MJ exists: {mj is not None}")

if liter and mj:
    # Try to insert a test commodity
    try:
        result = db.execute(text("""
            INSERT INTO commodities (`name`, `description`, `uom`, `density`, `energy_uom`, `is_active`, `delete`)
            VALUES (:name, :description, :uom, :density, :energy_uom, :is_active, :delete)
        """), {
            "name": "Test Diesel",
            "description": "Ultra-low sulfur diesel",
            "uom": "Liter",
            "density": 0.83,
            "energy_uom": "MJ",
            "is_active": b'\x01' + b'\x00' * 15,
            "delete": b'\x00' * 16
        })
        db.commit()
        print("✓ Commodity inserted successfully!")
        
        # Clean up
        db.execute(text("DELETE FROM commodities WHERE name = 'Test Diesel'"))
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"✗ Error: {e}")
else:
    print("UOMs not found!")

db.close()
