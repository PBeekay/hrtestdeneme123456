import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import bcrypt
from database import get_db_cursor

def create_demo_employee():
    username = "ali.yildiz"
    password = "password123"
    full_name = "Ali Yıldız"
    email = "ali.yildiz@sirket.com"
    role_title = "Yazılım Geliştirici"
    department = "Bilgi Teknolojileri"
    user_role = "employee"
    
    # Hash password
    salt = bcrypt.gensalt()
    password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

    try:
        with get_db_cursor() as cursor:
            # Check if user exists
            cursor.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cursor.fetchone():
                print(f"User {username} already exists.")
                return

            # Insert user
            print(f"Creating user {username}...")
            cursor.execute("""
                INSERT INTO users (username, password_hash, full_name, email, role, department, user_role, avatar)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'AY')
            """, (username, password_hash, full_name, email, role_title, department, user_role))
            
            user_id = cursor.lastrowid
            print(f"User created with ID: {user_id}")

            # Insert leave balance
            print("Adding leave balance...")
            cursor.execute("""
                INSERT INTO leave_balance (user_id, annual_leave, sick_leave, personal_leave, year)
                VALUES (%s, 14, 5, 3, 2025)
            """, (user_id,))
            
            print("✅ Demo employee created successfully!")
            print(f"Username: {username}")
            print(f"Password: {password}")

    except Exception as e:
        print(f"❌ Error creating user: {e}")

if __name__ == "__main__":
    create_demo_employee()
