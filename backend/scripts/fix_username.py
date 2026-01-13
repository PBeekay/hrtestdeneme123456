from database import get_db_cursor

def fix_demo_username():
    old_username = "ali.yildiz"
    new_username = "ali_yildiz"

    try:
        with get_db_cursor() as cursor:
            # Check if old user exists
            cursor.execute("SELECT id FROM users WHERE username = %s", (old_username,))
            user = cursor.fetchone()
            
            if user:
                print(f"Updating user {old_username} to {new_username}...")
                cursor.execute(
                    "UPDATE users SET username = %s WHERE username = %s", 
                    (new_username, old_username)
                )
                print(f"✅ User updated successfully.")
                print(f"New Username: {new_username}")
            else:
                print(f"User {old_username} not found. Checking if {new_username} exists...")
                cursor.execute("SELECT id FROM users WHERE username = %s", (new_username,))
                if cursor.fetchone():
                     print(f"User {new_username} already exists.")
                else:
                    print("No user found to update.")

    except Exception as e:
        print(f"❌ Error updating user: {e}")

if __name__ == "__main__":
    fix_demo_username()
