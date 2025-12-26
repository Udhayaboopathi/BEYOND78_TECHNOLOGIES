from sqlalchemy import create_engine, text

engine = create_engine('mysql+pymysql://root:1234@localhost:3306/BEYOND')

with engine.connect() as conn:
    result = conn.execute(text('SELECT id, name, uom, energy_uom FROM commodities LIMIT 5'))
    print('Commodities data:')
    for row in result:
        print(f'ID: {row[0]}, Name: {row[1]}, UOM: {row[2]}, Energy UOM: {row[3]}')
    
    print('\nUOMs data:')
    result = conn.execute(text('SELECT id, name FROM uoms LIMIT 10'))
    for row in result:
        print(f'ID: {row[0]}, Name: {row[1]}')
