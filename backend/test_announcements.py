import requests
import sys
from datetime import datetime

BASE_URL = "http://localhost:8000"

def test_announcement_timestamp():
    print("1. Logging in as admin...")
    resp = requests.post(f"{BASE_URL}/api/login", json={
        "username": "ikadmin",
        "password": "admin123"
    })
    
    if resp.status_code != 200:
        print("Login failed")
        return False
    
    token = resp.json().get("token")
    headers = {"Authorization": f"Bearer {token}"}
    
    # Define a future date to test if it gets ignored
    future_date = "2030-01-01 12:00"
    
    print(f"2. Creating announcement with future date: {future_date}...")
    payload = {
        "title": "Test Announcement Timestamp",
        "content": "Testing auto-timestamp feature",
        "category": "General",
        "announcement_date": future_date
    }
    
    resp = requests.post(f"{BASE_URL}/api/announcements", json=payload, headers=headers)
    
    if resp.status_code != 200:
        print(f"Failed to create announcement: {resp.text}")
        return False
        
    data = resp.json()
    announcement_id = data.get("announcement_id")
    print(f"Announcement created with ID: {announcement_id}")
    
    print("3. Fetching dashboard data to check announcement date...")
    # Using dashboard endpoint as it returns announcements
    resp = requests.get(f"{BASE_URL}/api/dashboard", headers=headers)
    
    if resp.status_code != 200:
        print(f"Failed to fetch dashboard: {resp.text}")
        return False
        
    dashboard_data = resp.json()
    announcements = dashboard_data.get("announcements", [])
    
    target_announcement = None
    for ann in announcements:
        if ann.get("id") == announcement_id:
            target_announcement = ann
            break
            
    if not target_announcement:
        print("Could not find the created announcement in dashboard data.")
        return False
        
    actual_date = target_announcement.get("date")
    print(f"Actual date on server: {actual_date}")
    
    # Check if the date matches the future date (Should fail after fix) or is close to now (Should pass after fix)
    # Note: The format returned by dashboard is 'YYYY-MM-DD HH:MM'
    
    if actual_date == future_date:
        print("❌ FAIL: Server accepted the client-provided future date.")
        return False
    else:
        print("✅ PASS: Server ignored client date and used its own.")
        return True

if __name__ == "__main__":
    try:
        if test_announcement_timestamp():
            sys.exit(0)
        else:
            sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
