import os
import sys

# Add backend to path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import authenticate_user
from auth import create_access_token, SECRET_KEY, ALGORITHM
import jwt

def debug_login():
    username = "ali_yildiz"
    password = "password123"
    
    print(f"Attempting login for {username}...")
    user = authenticate_user(username, password)
    
    if not user:
        print("❌ Authentication failed!")
        return

    print(f"✅ Authenticated User: {user}")
    
    # Simulate main.py login endpoint logic
    app_role = user.get('user_role', 'employee')
    print(f"App Role Determined: {app_role}")
    
    token_data = {
        "sub": user['username'],
        "user_id": user['id'],
        "role": app_role
    }
    
    print(f"Token Data to be encoded: {token_data}")
    
    token = create_access_token(token_data)
    print(f"Generated Token: {token}")
    
    # Decode
    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    print(f"Decoded Payload: {decoded}")
    
    if decoded['role'] == 'admin':
        print("❌ ERROR: Token has admin role for employee user!")
    else:
        print("✅ Token role matches employee.")

    print("\n--- Checking Admin ---")
    user_admin = authenticate_user("ikadmin", "admin123") # Assuming password
    if user_admin: 
        print(f"Admin User: {user_admin}")
        print(f"Admin Role: {user_admin.get('user_role')}")
    else:
        print("Admin auth failed (password might be different)")

if __name__ == "__main__":
    debug_login()
