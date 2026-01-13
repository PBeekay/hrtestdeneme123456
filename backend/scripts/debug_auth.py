import os
import sys

# Add backend to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import authenticate_user

def debug_auth():
    print("--- Testing ali_yildiz ---")
    user = authenticate_user("ali_yildiz", "password123")
    if user:
        print(f"✅ User Authenticated: {user}")
        print(f"Expected Role for Token: {user.get('user_role', 'employee')}")
    else:
        print("❌ Auth failed for ali_yildiz")

    print("\n--- Testing ikadmin ---")
    user_admin = authenticate_user("ikadmin", "admin123") # Assuming admin123 or similar
    if user_admin:
        print(f"✅ User Authenticated: {user_admin}")
        print(f"Expected Role for Token: {user_admin.get('user_role', 'employee')}")
    else:
        # Passwords might be different in this env, but we just want to check role mapping
        from database import get_user_by_id
        # Assuming admin ID is 1
        with open('main.py', 'r') as f:
            pass # just a placeholder
        
        # We can try to fetch admin by username directly using a custom query if needed, 
        # but let's stick to ali_yildiz first as that's the reported issue.

if __name__ == "__main__":
    debug_auth()
