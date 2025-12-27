from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:test%40123@localhost:3306/BEYOND')

print("Checking commodities table structure...")
print("=" * 80)

with engine.connect() as conn:
    # Check table structure
    result = conn.execute(text("DESCRIBE commodities"))
    print("\nCommodities table columns:")
    for row in result:
        nullable = "NULL" if row[2] == 'YES' else "NOT NULL"
        print(f"  {row[0]:<20} {row[1]:<20} {nullable:<10} Key: {row[3]}")
    
    # Check foreign key constraints
    print("\n" + "=" * 80)
    print("\nForeign key constraints:")
    result = conn.execute(text("""
        SELECT 
            CONSTRAINT_NAME,
            COLUMN_NAME,
            REFERENCED_TABLE_NAME,
            REFERENCED_COLUMN_NAME
        FROM information_schema.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = 'BEYOND' 
        AND TABLE_NAME = 'commodities'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    """))
    
    for row in result:
        print(f"  {row[0]}: {row[1]} -> {row[2]}.{row[3]}")
    
    # Check unique constraints
    print("\n" + "=" * 80)
    print("\nUnique constraints:")
    result = conn.execute(text("SHOW INDEX FROM commodities WHERE Non_unique = 0"))
    for row in result:
        print(f"  {row[2]}: {row[4]}")

print("\n" + "=" * 80)
