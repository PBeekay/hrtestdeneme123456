from database import get_db_cursor
import json

if __name__ == "__main__":
    try:
        with get_db_cursor() as cursor:
            cursor.execute("SELECT * FROM leave_requests")
            rows = cursor.fetchall()
            print("Raw Leave Requests:")
            # Convert datetime objects to string for printing
            for row in rows:
                for k, v in row.items():
                    if hasattr(v, 'isoformat'):
                        row[k] = v.isoformat()
            print(json.dumps(rows, indent=2))
            
            # Check user 1 specifically
            cursor.execute("SELECT * FROM leave_requests WHERE user_id = 1")
            user_rows = cursor.fetchall()
            print(f"\nRequests for user_id=1: {len(user_rows)}")
            
    except Exception as e:
        print(f"Error: {e}")
