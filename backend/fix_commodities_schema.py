from database import engine
from sqlalchemy import text

with engine.connect() as conn:
    try:
        # Fix create_at and update_at columns to have default values
        conn.execute(text('ALTER TABLE commodities MODIFY create_at DATETIME DEFAULT CURRENT_TIMESTAMP'))
        conn.execute(text('ALTER TABLE commodities MODIFY update_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'))
        conn.commit()
        print('✓ Schema updated successfully - commodities table timestamps now have defaults')
    except Exception as e:
        print(f'Error updating schema: {e}')
