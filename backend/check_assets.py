import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def check_endpoint(endpoint):
    url = f"{BASE_URL}{endpoint}"
    try:
        response = requests.get(url)
        print(f"GET {url} - Status: {response.status_code}")
        if response.status_code == 200:
            print(f"Response: {response.json()[:2]}") # Print first 2 items
            return True
        else:
            print(f"Error: {response.text}")
            return False
    except Exception as e:
        print(f"Exception: {e}")
        return False

print("Verifying Assets API...")
assets_ok = check_endpoint("/assets/all")
categories_ok = check_endpoint("/assets/categories")

if assets_ok and categories_ok:
    print("SUCCESS: Both endpoints are working.")
    sys.exit(0)
else:
    print("FAILURE: One or more endpoints failed.")
    sys.exit(1)
