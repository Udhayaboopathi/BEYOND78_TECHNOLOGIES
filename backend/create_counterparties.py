from database import SessionLocal
from sqlalchemy import text

db = SessionLocal()

try:
    # Create counter parties with IDs 24, 25, 29
    db.execute(text("""
        INSERT INTO counter_parties (CounterpartyID, LegalName, ShortName, CounterpartyCode, Country, Type, CreditStatus, CreditLimit, CreatedAt, UpdatedAt, `delete`) 
        VALUES 
            (24, 'Saudi Aramco', 'Aramco', 'ARAMCO', 'Saudi Arabia', 'Operator', 'Approved', 0, NOW(), NOW(), UNHEX('00000000000000000000000000000000')),
            (25, 'ADNOC', 'ADNOC', 'ADNOC', 'UAE', 'Operator', 'Approved', 0, NOW(), NOW(), UNHEX('00000000000000000000000000000000')),
            (29, 'SATORP JV', 'SATORP', 'SATORP', 'Saudi Arabia', 'JV Partner', 'Approved', 0, NOW(), NOW(), UNHEX('00000000000000000000000000000000'))
        ON DUPLICATE KEY UPDATE LegalName=VALUES(LegalName), ShortName=VALUES(ShortName)
    """))
    db.commit()
    print("✓ Created counter parties 24, 25, 29")
except Exception as e:
    print(f"Error: {e}")
    db.rollback()
finally:
    db.close()
