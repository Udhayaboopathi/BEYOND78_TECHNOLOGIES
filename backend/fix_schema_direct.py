from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:test%40123@localhost:3306/BEYOND"
)

engine = create_engine(DATABASE_URL)

# Try each ALTER statement one by one with explicit error handling
alterstatements = [
    "ALTER TABLE uoms MODIFY COLUMN delete_at DATETIME NULL",
    "ALTER TABLE commodities MODIFY COLUMN delete_at DATETIME NULL",
    "ALTER TABLE blends MODIFY COLUMN delete_at DATETIME NULL",
    "ALTER TABLE blendComponents MODIFY COLUMN delete_at DATETIME NULL",
    "ALTER TABLE blendComponents MODIFY COLUMN proportion DECIMAL(10, 6) NOT NULL",
    "ALTER TABLE location MODIFY COLUMN delete_at DATETIME NULL",
    "ALTER TABLE counter_parties MODIFY COLUMN delete_at DATETIME NULL",
    "ALTER TABLE counter_parties MODIFY COLUMN CreditLimit DECIMAL(15, 2) NOT NULL",
    "ALTER TABLE capacity MODIFY COLUMN delete_at DATETIME NULL",
    "ALTER TABLE capacity MODIFY COLUMN quantity DECIMAL(15, 4) NOT NULL",
]

print("Executing ALTER TABLE statements...")
print("=" * 80)

for i, stmt in enumerate(alterstatements, 1):
    try:
        print(f"\n[{i}] {stmt}")
        with engine.begin() as conn:  # Use begin() for automatic transaction
            conn.execute(text(stmt))
        print("    ✓ Success")
    except Exception as e:
        print(f"    ✗ Error: {str(e)}")

print("\n" + "=" * 80)

# Drop the unique constraint
try:
    print("\nDropping unique constraint on commodities.uom...")
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE commodities DROP INDEX IF EXISTS commodities_uom_unique"))
    print("✓ Success")
except Exception as e:
    print(f"✗ Error: {str(e)}")

print("\n" + "=" * 80)
print("\nVerifying changes...")

# Verify
with engine.connect() as conn:
    result = conn.execute(text("DESCRIBE uoms"))
    for row in result:
        if row[0] == 'delete_at':
            status = "✓ FIXED" if row[2] == 'YES' else "✗ STILL NOT NULL"
            print(f"uoms.delete_at - Nullable: {row[2]} {status}")
            break

print("\n✅ Done!")
