import requests
import json

try:
    response = requests.get("http://localhost:8000/api/commodities")
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text[:500]}")
    if response.status_code == 200:
        data = response.json()
        print(f"\nNumber of commodities: {len(data)}")
        if data:
            print(f"First commodity: {json.dumps(data[0], indent=2)}")
except Exception as e:
    print(f"Error: {str(e)}")
    import traceback
    traceback.print_exc()
