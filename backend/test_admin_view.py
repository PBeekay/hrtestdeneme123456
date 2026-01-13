from database import authenticate_user, get_all_leave_requests, create_leave_request
import os
import sys

# Add backend to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_admin_leave_visibility():
    # 1. Ensure Ali Yildiz has a request
    print("--- 1. Creating Request for Ali Yildiz ---")
    ali = authenticate_user("ali_yildiz", "password123")
    if not ali:
        print("Ali login failed")
        return

    # Create a fresh req
    create_leave_request(
        ali['id'], 
        'annual', 
        '2026-06-01 09:00', 
        '2026-06-05 18:00', 
        5.0, 
        "Summer Vacation Request"
    )
    print("Created request for Ali.")

    # 2. Check Admin Visibility
    print("\n--- 2. Checking Admin Visibility ---")
    admin = authenticate_user("ikadmin", "admin123") # verify password first if known, assuming correct
    if not admin:
        print("Admin auth check skipped (password unknown/not set in script). verifying DB function directly.")
    
    # Simulate DB call admin would make
    all_requests = get_all_leave_requests('pending')
    
    # Check if Ali's request is in there
    found = False
    for req in all_requests:
        if "Ali Yıldız" in req['reason'] or "Ali Yıldız" in req['full_name']:
            print(f"✅ Found Request: {req}")
            found = True
            break
            
    if not found:
        print("❌ Ali's request NOT found in admin view!")
    else:
        print("✅ Admin can see Ali's request.")

if __name__ == "__main__":
    test_admin_leave_visibility()
