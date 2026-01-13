import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor

def check_users_db():
    users_to_check = ["ikadmin", "ali_yildiz"]
    
    try:
        with get_db_cursor() as cursor:
            for username in users_to_check:
                print(f"\n--- Checking {username} ---")
                cursor.execute("SELECT id, username, role, user_role FROM users WHERE username = %s", (username,))
                user = cursor.fetchone()
                if user:
                    print(f"DB Record: {user}")
                else:
                    print(f"❌ User {username} not found in DB!")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users_db()
