from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:test%40123@localhost:3306/BEYOND')

print("Dropping unique constraint on commodities.uom...")
print("=" * 80)

try:
    with engine.begin() as conn:
        conn.execute(text("ALTER TABLE commodities DROP INDEX commodities_uom_unique"))
    print("✓ Successfully dropped commodities_uom_unique constraint")
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 80)
print("\nVerifying constraint was removed...")

with engine.connect() as conn:
    result = conn.execute(text("SHOW INDEX FROM commodities WHERE Non_unique = 0"))
    constraints = list(result)
    
    if any('uom' in str(row) for row in constraints):
        print("✗ UOM constraint still exists!")
        for row in constraints:
            if 'uom' in str(row):
                print(f"  {row}")
    else:
        print("✓ UOM constraint successfully removed!")
        print("\nRemaining unique constraints:")
        
        result = conn.execute(text("SHOW INDEX FROM commodities WHERE Non_unique = 0"))
        for row in result:
            print(f"  {row[2]}: {row[4]}")

print("\n" + "=" * 80)
print("✅ Done!")
