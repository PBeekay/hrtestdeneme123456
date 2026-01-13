from database import get_db_cursor

if __name__ == "__main__":
    try:
        with get_db_cursor() as cursor:
            # Update user_role for ikadmin
            cursor.execute(
                "UPDATE users SET user_role = 'admin' WHERE username = 'ikadmin'"
            )
            print(f"Updated rows: {cursor.rowcount}")
            
            # Verify the update
            cursor.execute(
                "SELECT username, user_role FROM users WHERE username = 'ikadmin'"
            )
            user = cursor.fetchone()
            print(f"Verification: User {user['username']} has role {user['user_role']}")
            
    except Exception as e:
        print(f"Error: {e}")
