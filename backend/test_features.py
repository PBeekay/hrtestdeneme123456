import requests
import json
import sys

BASE_URL = "http://localhost:8000"

def verify_features():
    print("1. Logging in...")
    resp = requests.post(f"{BASE_URL}/api/login", json={
        "username": "ikadmin",
        "password": "admin123"
    })
    if resp.status_code != 200:
        print("Login failed")
        return False
    
    data = resp.json()
    token = data.get("token")
    user_id = data.get("user_id")
    headers = {"Authorization": f"Bearer {token}"}
    print(f"Logged in as ID: {user_id}")

    # 2. Daily Leave (Standard)
    print("\n2. Creating Daily Leave...")
    payload_daily = {
        "leaveType": "annual",
        "startDate": "2025-12-01 09:00", # Should be appended by frontend, but testing backend acceptance
        "endDate": "2025-12-01 18:00",
        "totalDays": 1.0,
        "reason": "Test Daily Leave"
    }
    resp = requests.post(f"{BASE_URL}/api/leave-requests?user_id={user_id}", json=payload_daily, headers=headers)
    if resp.status_code == 200:
        print("✅ Daily Leave Created")
    else:
        print(f"❌ Daily Leave Failed: {resp.text}")
        return False

    # 3. Hourly Leave
    print("\n3. Creating Hourly Leave (2 Hours)...")
    payload_hourly = {
        "leaveType": "personal",
        "startDate": "2025-12-02 14:00",
        "endDate": "2025-12-02 16:00",
        "totalDays": 0.22, # roughly 2/9
        "reason": "Test Hourly Leave"
    }
    resp = requests.post(f"{BASE_URL}/api/leave-requests?user_id={user_id}", json=payload_hourly, headers=headers)
    if resp.status_code == 200:
        print("✅ Hourly Leave Created")
    else:
        print(f"❌ Hourly Leave Failed: {resp.text}")
        return False

    # 4. Verification Check
    print("\n4. Verifying stored data...")
    resp = requests.get(f"{BASE_URL}/api/leave-requests?user_id={user_id}", headers=headers)
    requests_list = resp.json().get('leaveRequests', [])
    
    print(f"DEBUG Response: {json.dumps(requests_list, indent=2)}")
    
    found_hourly = False
    for req in requests_list:
        # Check keys - backend might return snake_case or camelCase depending on View vs Model
        # database.py returns camelCase aliases (startDate, totalDays)
        start_date = req.get('startDate') or req.get('start_date')
        total_days = req.get('totalDays') or req.get('total_days')
        
        print(f" - ID: {req.get('id')} | {start_date} -> {req.get('endDate')} | Days: {total_days}")
        
        if start_date and "14:00" in start_date and float(total_days) < 1.0:
            found_hourly = True
    
    if found_hourly:
        print("\n✅ Verification Successful: Found hourly leave with correct time and partial days.")
        return True
    else:
        print("\n❌ Verification Failed: Could not find the hourly leave record.")
        return False

if __name__ == "__main__":
    try:
        if verify_features():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
