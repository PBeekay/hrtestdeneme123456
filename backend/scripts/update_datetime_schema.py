from database import get_db_cursor

def run_migration():
    try:
        with get_db_cursor() as cursor:
            print("Migrating leave_requests...")
            cursor.execute("ALTER TABLE leave_requests MODIFY COLUMN start_date DATETIME NOT NULL")
            cursor.execute("ALTER TABLE leave_requests MODIFY COLUMN end_date DATETIME NOT NULL")
            cursor.execute("ALTER TABLE leave_requests MODIFY COLUMN total_days FLOAT NOT NULL")
            
            print("Migrating tasks...")
            cursor.execute("ALTER TABLE tasks MODIFY COLUMN due_date DATETIME NOT NULL")
            
            print("Migrating announcements...")
            cursor.execute("ALTER TABLE announcements MODIFY COLUMN announcement_date DATETIME NOT NULL")
            
            print("✅ Migration successful!")
            
    except Exception as e:
        print(f"❌ Migration failed: {e}")

if __name__ == "__main__":
    run_migration()
