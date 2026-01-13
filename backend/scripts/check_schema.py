import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_cursor

if __name__ == "__main__":
    try:
        with get_db_cursor() as cursor:
            # Check leave_requests table
            cursor.execute("DESCRIBE leave_requests")
            columns = cursor.fetchall()
            print("Columns in leave_requests table:")
            for col in columns:
                print(f"- {col['Field']} ({col['Type']})")
    except Exception as e:
        print(f"Error: {e}")
