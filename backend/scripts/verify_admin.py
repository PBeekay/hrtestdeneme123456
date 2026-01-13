import requests
import sys

BASE_URL = "http://localhost:8000"

def verify_admin():
    # 1. Login
    print("Logging in as ikadmin...")
    try:
        resp = requests.post(f"{BASE_URL}/api/login", json={
            "username": "ikadmin",
            "password": "admin123"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.status_code} - {resp.text}")
            return False
            
        data = resp.json()
        token = data.get("token")
        role = data.get("user_role")
        print(f"Login success. Token obtained. Role in response: {role}")
        
        if role != 'admin':
            print("❌ Role verification failed: Expected 'admin'")
            return False
            
        # 2. Check Admin Endpoint (e.g. get all assets)
        print("Testing admin endpoint (get all assets)...")
        headers = {"Authorization": f"Bearer {token}"}
        resp = requests.get(f"{BASE_URL}/api/assets/all", headers=headers)
        
        if resp.status_code == 200:
            print("✅ Admin endpoint access successful (200 OK)")
            return True
        elif resp.status_code == 403:
            print("❌ Admin endpoint access denied (403 Forbidden)")
            return False
        else:
            print(f"❌ Admin endpoint unexpected error: {resp.status_code}")
            return False
            
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to backend. Is it running?")
        return False

if __name__ == "__main__":
    if verify_admin():
        sys.exit(0)
    else:
        sys.exit(1)
