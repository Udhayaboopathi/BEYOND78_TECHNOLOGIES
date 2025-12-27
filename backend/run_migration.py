from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "mysql+pymysql://root:test%40123@localhost:3306/BEYOND"
)

engine = create_engine(DATABASE_URL)

# Read and execute migration script
with open('../fix_database_schema.sql', 'r') as f:
    sql_script = f.read()

# Split by semicolon and execute each statement
statements = [stmt.strip() for stmt in sql_script.split(';') if stmt.strip() and not stmt.strip().startswith('--')]

print("Starting database migration...")
print("=" * 80)

with engine.connect() as conn:
    for i, statement in enumerate(statements, 1):
        if statement and not statement.startswith('USE'):
            try:
                # Show what we're executing
                preview = statement.replace('\n', ' ').replace('\r', '')[:70]
                print(f"\n[{i}] Executing: {preview}...")
                
                # Execute and commit immediately
                result = conn.execute(text(statement))
                conn.commit()
                
                print(f"    ✓ Success")
            except Exception as e:
                print(f"    ✗ Error: {e}")
                # Continue with other statements

print("\n" + "=" * 80)
print("✅ Migration script completed!")
print("\nVerifying changes...")

# Verify the changes
with engine.connect() as conn:
    result = conn.execute(text("DESCRIBE uoms"))
    for row in result:
        if row[0] == 'delete_at':
            print(f"uoms.delete_at - Nullable: {row[2]}")
            break

