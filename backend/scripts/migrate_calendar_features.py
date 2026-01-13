import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database import get_db_connection

def migrate_db():
    conn = get_db_connection()
    if not conn:
        print("Failed to connect to database")
        return False
        
    try:
        with conn.cursor() as cursor:
            # 1. Create personal_reminders table
            print("Creating personal_reminders table...")
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS personal_reminders (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    title VARCHAR(255) NOT NULL,
                    date DATETIME NOT NULL,
                    is_completed BOOLEAN DEFAULT FALSE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
                ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
            """)
            
            # 2. Add birth_date to users if missing
            print("Checking/Adding birth_date to users...")
            cursor.execute("SHOW COLUMNS FROM users LIKE 'birth_date'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE users ADD COLUMN birth_date DATE NULL")
                print("Added birth_date column")
            else:
                print("birth_date column already exists")

            # 3. Add start_date to users if missing (just in case, based on previous code checks)
            print("Checking/Adding start_date to users...")
            cursor.execute("SHOW COLUMNS FROM users LIKE 'start_date'")
            if not cursor.fetchone():
                cursor.execute("ALTER TABLE users ADD COLUMN start_date DATE NULL")
                print("Added start_date column")
            else:
                print("start_date column already exists")
                
            conn.commit()
            print("Migration completed successfully")
            return True
    except Exception as e:
        print(f"Migration failed: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    migrate_db()
