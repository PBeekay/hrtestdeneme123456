from database import get_db_cursor, authenticate_user
from main import create_access_token
import jwt
import os

# Mock environment for JWT decoding (should match main.py)
SECRET_KEY = os.getenv("SECRET_KEY", "gizli_anahtar_123")
ALGORITHM = "HS256"

def check_users():
    users_to_check = ["ikadmin", "ali_yildiz"]
    
    try:
        with get_db_cursor() as cursor:
            for username in users_to_check:
                print(f"\n--- Checking {username} ---")
                cursor.execute("SELECT id, username, role, user_role FROM users WHERE username = %s", (username,))
                user = cursor.fetchone()
                
                if user:
                    print(f"DB Record: {user}")
                    
                    # Simulate Authentication logic from main.py
                    # We can't call main.login directly easily without context, but we can check what authenticate_user returns
                    # and how main.py uses it.
                    
                    # In main.py:
                    # app_role = user.get('user_role', 'employee')
                    # token_data = { ..., "role": app_role }
                    
                    app_role = user.get('user_role', 'employee')
                    print(f"Resolved App Role (for Token): {app_role}")
                    
                    # Create token
                    token_data = {
                        "sub": user['username'],
                        "user_id": user['id'],
                        "role": app_role
                    }
                    token = create_access_token(token_data)
                    
                    # Decode token to verify
                    decoded = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
                    print(f"Decoded Token Payload: {decoded}")
                    
                else:
                    print(f"❌ User {username} not found in DB!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users()
