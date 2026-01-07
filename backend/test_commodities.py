import traceback
from database import get_db
from models import Commodity
from sqlalchemy.orm import joinedload

try:
    db = next(get_db())
    print("Database connection successful")
    
    # Try to query commodities
    commodities = db.query(Commodity).options(joinedload(Commodity.uom)).filter(Commodity.is_deleted == False).all()
    print(f"Found {len(commodities)} commodities")
    
    if commodities:
        print(f"\nFirst commodity: {commodities[0].name}")
        print(f"UOM relation: {commodities[0].uom}")
        if commodities[0].uom:
            print(f"UOM name: {commodities[0].uom.name}")
    
except Exception as e:
    print(f"Error occurred: {str(e)}")
    traceback.print_exc()
finally:
    db.close()
