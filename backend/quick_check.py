from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:test%40123@localhost:3306/BEYOND')

with engine.connect() as conn:
    result = conn.execute(text("SHOW INDEX FROM commodities WHERE Key_name = 'commodities_uom_unique'"))
    rows = list(result)
    
    if rows:
        print("✗ Constraint still exists!")
        for row in rows:
            print(f"  {row}")
    else:
        print("✓ Constraint successfully removed!")
