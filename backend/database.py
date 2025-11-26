import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import bcrypt
from typing import Optional, Dict, List, Any

# Load environment variables
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', 3307)),  # MariaDB port
    'user': os.getenv('DB_USER', 'hrapp'),
    'password': os.getenv('DB_PASSWORD', 'hrpass123'),
    'database': os.getenv('DB_NAME', 'hrtest_db'),
    'charset': 'utf8mb4',
    'cursorclass': DictCursor,
    'auth_plugin_map': {
        'mysql_native_password': '',
        'caching_sha2_password': '',
    },
    'client_flag': 0
}


def get_db_connection():
    """
    Create and return a database connection
    """
    try:
        connection = pymysql.connect(**DB_CONFIG)
        return connection
    except pymysql.Error as e:
        print(f"Database connection error: {e}")
        return None


@contextmanager
def get_db_cursor():
    """
    Context manager for database operations
    Automatically handles connection and cursor cleanup
    """
    connection = get_db_connection()
    if connection is None:
        raise Exception("Could not connect to database")
    
    try:
        cursor = connection.cursor()
        yield cursor
        connection.commit()
    except Exception as e:
        connection.rollback()
        raise e
    finally:
        cursor.close()
        connection.close()


# ==================== USER OPERATIONS ====================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt
    """
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def authenticate_user(username: str, password: str) -> Optional[Dict[str, Any]]:
    """
    Authenticate a user by username and password
    Returns user data if successful, None otherwise
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT * FROM users WHERE username = %s",
                (username,)
            )
            user = cursor.fetchone()
            
            if user and verify_password(password, user['password_hash']):
                # Remove password hash from returned data
                user.pop('password_hash', None)
                return user
            return None
    except Exception as e:
        print(f"Authentication error: {e}")
        return None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Get user by ID
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "SELECT id, username, full_name, email, role, department, avatar FROM users WHERE id = %s",
                (user_id,)
            )
            return cursor.fetchone()
    except Exception as e:
        print(f"Get user error: {e}")
        return None


# ==================== DASHBOARD DATA ====================

def get_user_dashboard_data(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Get all dashboard data for a user
    """
    try:
        user_info = get_user_by_id(user_id)
        if not user_info:
            return None
        
        leave_balance = get_leave_balance(user_id)
        pending_tasks = get_user_tasks(user_id, status='pending')
        performance = get_performance_metrics(user_id)
        announcements = get_active_announcements()
        
        return {
            "userInfo": {
                "name": user_info['full_name'],
                "role": user_info['role'],
                "department": user_info['department'],
                "email": user_info['email'],
                "avatar": user_info['avatar']
            },
            "leaveBalance": leave_balance,
            "pendingTasks": pending_tasks,
            "performance": performance,
            "announcements": announcements
        }
    except Exception as e:
        print(f"Get dashboard data error: {e}")
        return None


def get_leave_balance(user_id: int, year: int = 2025) -> Dict[str, int]:
    """
    Get leave balance for a user
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT annual_leave, sick_leave, personal_leave 
                FROM leave_balance 
                WHERE user_id = %s AND year = %s
                """,
                (user_id, year)
            )
            result = cursor.fetchone()
            
            if result:
                return {
                    "annual": result['annual_leave'],
                    "sick": result['sick_leave'],
                    "personal": result['personal_leave']
                }
            return {"annual": 0, "sick": 0, "personal": 0}
    except Exception as e:
        print(f"Get leave balance error: {e}")
        return {"annual": 0, "sick": 0, "personal": 0}


def get_user_tasks(user_id: int, status: str = 'pending') -> List[Dict[str, Any]]:
    """
    Get tasks for a user
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, title, priority, DATE_FORMAT(due_date, '%%Y-%%m-%%d') AS `dueDate`
                FROM tasks 
                WHERE user_id = %s AND status = %s
                ORDER BY 
                    CASE priority 
                        WHEN 'high' THEN 1 
                        WHEN 'medium' THEN 2 
                        WHEN 'low' THEN 3 
                    END,
                    due_date ASC
                """,
                (user_id, status)
            )
            return cursor.fetchall()
    except Exception as e:
        print(f"Get tasks error: {e}")
        return []


def update_task_status(task_id: int, status: str) -> bool:
    """
    Update task status
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "UPDATE tasks SET status = %s WHERE id = %s",
                (status, task_id)
            )
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Update task error: {e}")
        return False


def get_performance_metrics(user_id: int) -> List[Dict[str, Any]]:
    """
    Get performance metrics for a user
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT label, value, max_value AS `maxValue`
                FROM performance_metrics 
                WHERE user_id = %s AND period = 'current'
                ORDER BY id
                """,
                (user_id,)
            )
            return cursor.fetchall()
    except Exception as e:
        print(f"Get performance metrics error: {e}")
        return []


def get_active_announcements(limit: int = 10) -> List[Dict[str, Any]]:
    """
    Get active announcements
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    id, 
                    title, 
                    category, 
                    DATE_FORMAT(announcement_date, '%%Y-%%m-%%d') AS `date`
                FROM announcements 
                WHERE is_active = TRUE
                ORDER BY announcement_date DESC
                LIMIT %s
                """,
                (limit,)
            )
            return cursor.fetchall()
    except Exception as e:
        print(f"Get announcements error: {e}")
        return []


# ==================== SESSION MANAGEMENT ====================

def create_session(user_id: int, token: str, expires_at) -> bool:
    """
    Create a new session
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
                (user_id, token, expires_at)
            )
            return True
    except Exception as e:
        print(f"Create session error: {e}")
        return False


def validate_session(token: str) -> Optional[int]:
    """
    Validate a session token and return user_id if valid
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT user_id FROM sessions 
                WHERE token = %s AND expires_at > NOW()
                """,
                (token,)
            )
            result = cursor.fetchone()
            return result['user_id'] if result else None
    except Exception as e:
        print(f"Validate session error: {e}")
        return None


def delete_session(token: str) -> bool:
    """
    Delete a session (logout)
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "DELETE FROM sessions WHERE token = %s",
                (token,)
            )
            return True
    except Exception as e:
        print(f"Delete session error: {e}")
        return False


# ==================== UTILITY FUNCTIONS ====================

def test_connection():
    """
    Test database connection
    """
    try:
        connection = get_db_connection()
        if connection:
            print("✅ Database connection successful!")
            connection.close()
            return True
        else:
            print("❌ Database connection failed!")
            return False
    except Exception as e:
        print(f"❌ Connection test error: {e}")
        return False


if __name__ == "__main__":
    # Test the connection when run directly
    test_connection()

