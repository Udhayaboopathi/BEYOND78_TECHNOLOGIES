from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        # Step 1: Drop the foreign key constraint
        conn.execute(text('ALTER TABLE commodities DROP FOREIGN KEY commodities_uom_foreign'))
        print('✓ Dropped foreign key constraint')
        
        # Step 2: Drop the unique index
        conn.execute(text('ALTER TABLE commodities DROP INDEX commodities_uom_unique'))
        print('✓ Dropped unique index on uom')
        
        # Step 3: Add a regular index (not unique) for foreign key
        conn.execute(text('ALTER TABLE commodities ADD INDEX idx_commodities_uom (uom)'))
        print('✓ Added regular index on uom')
        
        # Step 4: Re-create the foreign key constraint without unique requirement
        conn.execute(text('ALTER TABLE commodities ADD CONSTRAINT commodities_uom_foreign FOREIGN KEY (uom) REFERENCES uoms(name)'))
        print('✓ Re-created foreign key constraint')
        
        conn.commit()
        print('\n✓ Successfully fixed commodities.uom constraint!')
        print('  Multiple commodities can now use the same UOM')
    except Exception as e:
        conn.rollback()
        print(f'✗ Error: {e}')
