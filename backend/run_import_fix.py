from sqlalchemy.orm import Session
from database import SessionLocal
from services.import_service import ImportService
import os

def run_import():
    db = SessionLocal()
    try:
        # 1. Import Blends
        blends_path = "../sample_data/blends_import.csv"
        if os.path.exists(blends_path):
            print(f"Importing {blends_path}...")
            with open(blends_path, "rb") as f:
                service = ImportService(db, "blends")
                result = service.validate_and_import(f.read(), "blends_import.csv")
                print("Blends Result:", result)
        else:
            print(f"File not found: {blends_path}")

        # 2. Import Blend Components
        components_path = "../sample_data/blend_components_import.csv"
        if os.path.exists(components_path):
            print(f"Importing {components_path}...")
            with open(components_path, "rb") as f:
                service = ImportService(db, "blend_components")
                result = service.validate_and_import(f.read(), "blend_components_import.csv")
                print("Components Result:", result)
        else:
            print(f"File not found: {components_path}")

    finally:
        db.close()

if __name__ == "__main__":
    run_import()
