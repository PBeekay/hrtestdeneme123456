import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy.orm import Session
from db import SessionLocal
from models import Manager
from core.security import get_password_hash

def create_admin_user():
    db = SessionLocal()
    try:
        username = "admin"
        email = "admin@company.com"
        password = "hrpass123"
        
        # Check if user exists
        existing_user = db.query(Manager).filter(Manager.username == username).first()
        if existing_user:
            print(f"User '{username}' already exists. Skipping.")
            return

        print(f"Creating user '{username}'...")
        
        admin_user = Manager(
            username=username,
            email=email,
            password_hash=get_password_hash(password),
            full_name="Company Admin",
            first_name="Company",
            last_name="Admin",
            is_active=True,
            type="manager",
            admin_level=1, # Default admin level
            department="Management"
        )
        
        db.add(admin_user)
        db.commit()
        print(f"User '{username}' created successfully.")
        print(f"Username: {username}")
        print(f"Password: {password}")
        
    except Exception as e:
        print(f"Error creating user: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_admin_user()
