import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

from repositories import UserRepository
import json

repo = UserRepository()

# Fix user_role column type if it is restricting us
try:
    with repo.db.get_cursor() as cursor:
        cursor.execute("ALTER TABLE users MODIFY COLUMN user_role VARCHAR(50) NOT NULL DEFAULT 'employee'")
        print("✅ Fixed user_role column type.")
except Exception as e:
    print(f"⚠️ Could not fix user_role: {e}")

def ensure_user(username, email, password, full_name, user_role, permissions=None):
    # Check if exists
    with repo.db.get_cursor() as cursor:
        cursor.execute("SELECT id, user_role FROM users WHERE username = %s", (username,))
        existing = cursor.fetchone()
        
        if existing:
            print(f"User '{username}' already exists. (Role: {existing['user_role']})")
            # Update role/permissions if needed
            if existing['user_role'] != user_role or permissions:
                perm_json = json.dumps(permissions) if permissions else None
                cursor.execute("UPDATE users SET user_role = %s, permissions = %s WHERE id = %s", 
                              (user_role, perm_json, existing['id']))
                print(f"  -> Updated role to {user_role} and permissions.")
            return

    # Create
    print(f"Creating user '{username}'...")
    # Using existing create_employee or create_admin doesn't fully support custom roles perfectly directly in one go 
    # without permissions in create_admin, so I'll insert manually or use create_employee
    
    # Let's use create_employee logic but manually to ensure ID/Password is set as we want
    import bcrypt
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
    initials = full_name[:2].upper()
    perm_json = json.dumps(permissions) if permissions else None

    with repo.db.get_cursor() as cursor:
        cursor.execute("""
            INSERT INTO users (username, password_hash, full_name, email, role, department, avatar, user_role, permissions)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """, (username, hashed, full_name, email, 'System User', 'Management', initials, user_role, perm_json))
        print(f"  -> Created successfully.")

# Superadmin
ensure_user("superadmin", "super@pulse.com", "super123", "Super Admin", "superadmin", ["*"])

# Admin
ensure_user("admin", "admin@company.com", "hrpass123", "Company Admin", "admin", ["manage_users", "view_all"])

# IK Manager
ensure_user("ik_manager", "ik@company.com", "ikpass123", "IK Yöneticisi", "ik_manager", ["approve_leaves", "view_employees"])

print("\n--- CREDENTIALS ---")
print("Role: Superadmin | User: superadmin | Pass: super123")
print("Role: Admin      | User: admin      | Pass: hrpass123")
print("Role: IK Manager | User: ik_manager | Pass: ikpass123")
