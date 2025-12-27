"""
Sample Data Import Script
This script imports all sample CSV files into the database in the correct order.
Run this after the backend server is running.
"""

import requests
import csv
from datetime import datetime

BASE_URL = "http://localhost:8000/api"

def import_uoms():
    """Import UOMs from CSV"""
    print("Importing UOMs...")
    with open('sample_data/uoms_sample.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data = {
                "name": row['name'],
                "type": row['type'],
                "base_uom": row['base_uom'],
                "description": row['description'],
                "delete_at": datetime.now().isoformat()
            }
            try:
                response = requests.post(f"{BASE_URL}/uoms", json=data)
                if response.status_code == 200:
                    print(f"  ✓ Created UOM: {row['name']}")
                else:
                    print(f"  ✗ Failed to create UOM {row['name']}: {response.text}")
            except Exception as e:
                print(f"  ✗ Error creating UOM {row['name']}: {str(e)}")

def import_commodities():
    """Import Commodities from CSV"""
    print("\nImporting Commodities...")
    with open('sample_data/commodities_sample.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data = {
                "name": row['name'],
                "description": row['description'],
                "uom": row['uom'],
                "density": float(row['density']),
                "energy_uom": row['energy_uom'],
                "is_active": True
            }
            try:
                response = requests.post(f"{BASE_URL}/commodities", json=data)
                if response.status_code == 200:
                    print(f"  ✓ Created Commodity: {row['name']}")
                else:
                    print(f"  ✗ Failed to create Commodity {row['name']}: {response.text}")
            except Exception as e:
                print(f"  ✗ Error creating Commodity {row['name']}: {str(e)}")

def import_counter_parties():
    """Import Counter Parties from CSV"""
    print("\nImporting Counter Parties...")
    with open('sample_data/counter_parties_sample.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            data = {
                "LegalName": row['LegalName'],
                "ShortName": row['ShortName'],
                "CounterpartyCode": row['CounterpartyCode'],
                "Country": row['Country'],
                "Type": row['Type'],
                "CreditStatus": row['CreditStatus'],
                "CreditLimit": float(row['CreditLimit'])
            }
            try:
                response = requests.post(f"{BASE_URL}/counter-parties", json=data)
                if response.status_code == 200:
                    print(f"  ✓ Created Counter Party: {row['LegalName']}")
                else:
                    print(f"  ✗ Failed to create Counter Party {row['LegalName']}: {response.text}")
            except Exception as e:
                print(f"  ✗ Error creating Counter Party {row['LegalName']}: {str(e)}")

def import_locations():
    """Import Locations from CSV"""
    print("\nImporting Locations...")
    
    # First, get all counter parties to map names to IDs
    response = requests.get(f"{BASE_URL}/counter-parties")
    counter_parties = {cp['LegalName']: cp['CounterpartyID'] for cp in response.json()}
    
    with open('sample_data/locations_sample.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            parent_id = counter_parties.get(row['parent_counterparty_legal_name'])
            if not parent_id:
                print(f"  ✗ Counter party not found: {row['parent_counterparty_legal_name']}")
                continue
                
            data = {
                "name": row['name'],
                "type": row['type'],
                "description": row['description'],
                "parent_contvarcharerpartu_id": parent_id
            }
            try:
                response = requests.post(f"{BASE_URL}/locations", json=data)
                if response.status_code == 200:
                    print(f"  ✓ Created Location: {row['name']}")
                else:
                    print(f"  ✗ Failed to create Location {row['name']}: {response.text}")
            except Exception as e:
                print(f"  ✗ Error creating Location {row['name']}: {str(e)}")

def import_capacity():
    """Import Capacity from CSV"""
    print("\nImporting Capacity...")
    
    # Get reference data
    commodities = {c['name']: c['id'] for c in requests.get(f"{BASE_URL}/commodities").json()}
    locations = {l['name']: l['id'] for l in requests.get(f"{BASE_URL}/locations").json()}
    uoms = {u['name']: u['id'] for u in requests.get(f"{BASE_URL}/uoms").json()}
    
    with open('sample_data/capacity_sample.csv', 'r') as f:
        reader = csv.DictReader(f)
        for row in reader:
            commodity_id = commodities.get(row['Commodity Name'])
            location_id = locations.get(row['Location Name'])
            uom_id = uoms.get(row['UOM'])
            
            if not all([commodity_id, location_id, uom_id]):
                print(f"  ✗ Missing reference data for capacity record")
                continue
                
            data = {
                "commodity_id": commodity_id,
                "location_id": location_id,
                "quantity": float(row['Quantity']),
                "uom_id": uom_id,
                "eff_dt_from": row['Effective From'],
                "eff_dt_to": row['Effective To']
            }
            try:
                response = requests.post(f"{BASE_URL}/capacity", json=data)
                if response.status_code == 200:
                    print(f"  ✓ Created Capacity: {row['Commodity Name']} at {row['Location Name']}")
                else:
                    print(f"  ✗ Failed to create Capacity: {response.text}")
            except Exception as e:
                print(f"  ✗ Error creating Capacity: {str(e)}")

if __name__ == "__main__":
    print("=" * 60)
    print("Sample Data Import Script")
    print("=" * 60)
    print("\nMake sure the backend server is running at http://localhost:8000")
    print("\nImporting data in correct order...\n")
    
    try:
        import_uoms()
        import_commodities()
        import_counter_parties()
        import_locations()
        import_capacity()
        
        print("\n" + "=" * 60)
        print("Import completed!")
        print("=" * 60)
        print("\nYou can now view the data at http://localhost:3000")
        
    except requests.exceptions.ConnectionError:
        print("\n✗ ERROR: Cannot connect to backend server.")
        print("Please make sure the backend is running at http://localhost:8000")
    except Exception as e:
        print(f"\n✗ ERROR: {str(e)}")
