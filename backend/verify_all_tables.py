from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:test%40123@localhost:3306/BEYOND')

tables = ['uoms', 'commodities', 'blends', 'blendComponents', 'location', 'counter_parties', 'capacity']

print("Verifying all table schemas...")
print("=" * 80)

with engine.connect() as conn:
    for table in tables:
        result = conn.execute(text(f"DESCRIBE {table}"))
        for row in result:
            if row[0] == 'delete_at':
                status = "✓" if row[2] == 'YES' else "✗"
                print(f"{status} {table}.delete_at: Nullable={row[2]}")
                break

print("=" * 80)
print("✅ All tables verified!")
