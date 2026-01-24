import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def verify_new_leave_types():
    print("1. Logging in as admin to test new leaves...")
    try:
        resp = requests.post(f"{BASE_URL}/api/login", json={
            "username": "ikadmin",
            "password": "admin123"
        })
        if resp.status_code != 200:
            print(f"Login failed: {resp.text}")
            return False
            
        data = resp.json()
        token = data.get("token")
        user_id = data.get("user_id")
        headers = {"Authorization": f"Bearer {token}"}
        
        # 1. Check if balance includes new types
        print("\n2. Checking new leave balances...")
        resp = requests.get(f"{BASE_URL}/api/dashboard", headers=headers)
        if resp.status_code != 200:
            print("Dashboard fetch failed")
            return False
            
        balance = resp.json().get('leaveBalance', {})
        print(f"Current Balance: {json.dumps(balance, indent=2)}")
        
        required_keys = ['paternity', 'maternity', 'marriage', 'death']
        missing = [k for k in required_keys if k not in balance]
        
        if missing:
            print(f"❌ Missing new leave types in balance: {missing}")
            return False
        else:
            print("✅ New leave types found in balance")

        # 2. Create a Paternity Leave Request
        print("\n3. Creating Paternity Leave Request (5 days)...")
        payload = {
            "leaveType": "paternity",
            "startDate": "2025-06-01 09:00", 
            "endDate": "2025-06-05 18:00",
            "totalDays": 5.0,
            "reason": "New born baby"
        }
        resp = requests.post(f"{BASE_URL}/api/leave-requests", json=payload, headers=headers)
        
        if resp.status_code == 200:
            print("✅ Paternity Leave Created Successfully")
        else:
            print(f"❌ Failed to create paternity leave: {resp.text}")
            return False

        return True

    except Exception as e:
        print(f"Test failed with error: {e}")
        return False

if __name__ == "__main__":
    if verify_new_leave_types():
        print("\n🎉 All checks passed!")
    else:
        print("\n💥 Some checks failed!")
        sys.exit(1)
