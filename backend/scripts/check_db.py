import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor

if __name__ == "__main__":
    try:
        with get_db_cursor() as cursor:
            cursor.execute("DESCRIBE users")
            columns = cursor.fetchall()
            print("Columns in users table:")
            for col in columns:
                print(f"- {col['Field']} ({col['Type']})")
    except Exception as e:
        print(f"Error: {e}")
