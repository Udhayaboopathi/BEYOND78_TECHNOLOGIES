from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:test%40123@localhost:3306/BEYOND"
)

engine = create_engine(DATABASE_URL)

# Check the schema of the uoms table
with engine.connect() as conn:
    result = conn.execute(text("DESCRIBE uoms"))
    print("UOMs table structure:")
    print("-" * 80)
    for row in result:
        print(f"Field: {row[0]:<20} Type: {row[1]:<20} Null: {row[2]:<5} Key: {row[3]:<5} Default: {row[4]}")
    
    print("\n" + "=" * 80 + "\n")
    
    # Check commodities table
    result = conn.execute(text("DESCRIBE commodities"))
    print("Commodities table structure:")
    print("-" * 80)
    for row in result:
        print(f"Field: {row[0]:<20} Type: {row[1]:<20} Null: {row[2]:<5} Key: {row[3]:<5} Default: {row[4]}")
