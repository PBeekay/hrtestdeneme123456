import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import bcrypt
from typing import Optional, Dict, List, Any
from dbutils.pooled_db import PooledDB

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

# Create connection pool
# This will maintain a pool of 2-10 connections
db_pool = PooledDB(
    creator=pymysql,
    maxconnections=10,  # Maximum number of connections in pool
    mincached=2,        # Minimum number of idle connections
    maxcached=5,        # Maximum number of idle connections
    maxshared=3,        # Maximum number of shared connections
    blocking=True,      # Wait if no connection available
    **DB_CONFIG
)

print("✅ Database connection pool initialized")


def get_db_connection():
    """
    Bağlantı havuzundan bir veritabanı bağlantısı döndürür.
    Her seferinde yeni bağlantı açmaktan çok daha performanslıdır.
    """
    try:
        connection = db_pool.connection()
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
            
            print(f"[DEBUG] User found: {user is not None}")
            if user:
                print(f"[DEBUG] Username: {user['username']}")
                print(f"[DEBUG] Hash length: {len(user['password_hash'])}")
                print(f"[DEBUG] Password to check: {password}")
                
                # Verify password
                is_valid = verify_password(password, user['password_hash'])
                print(f"[DEBUG] Password valid: {is_valid}")
                
                if is_valid:
                    # Remove password hash from returned data
                    user.pop('password_hash', None)
                    return user
            
            return None
    except Exception as e:
        print(f"Authentication error: {e}")
        import traceback
        traceback.print_exc()
        return None


def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Kullanıcı ID'sine göre kullanıcı bilgilerini döndürür.
    """
    try:
        with get_db_cursor() as cursor:
            # Try to get start_date if column exists
            try:
                cursor.execute(
                    "SELECT id, username, full_name, email, role, department, avatar, user_role, start_date FROM users WHERE id = %s",
                    (user_id,)
                )
            except:
                # If start_date column doesn't exist, fallback to original query
                cursor.execute(
                    "SELECT id, username, full_name, email, role, department, avatar, user_role FROM users WHERE id = %s",
                    (user_id,)
                )
            return cursor.fetchone()
    except Exception as e:
        print(f"Get user error: {e}")
        return None


# ==================== DASHBOARD DATA ====================

def get_user_dashboard_data(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Yönetici / İK kullanıcısı için tüm dashboard verilerini döndürür.
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
                "avatar": user_info['avatar'],
                "userRole": user_info.get('user_role', 'employee'),
                "startDate": user_info.get('start_date').strftime('%Y-%m-%d') if user_info.get('start_date') else None
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
    Belirtilen kullanıcı için yıl bazında izin bakiyelerini döndürür.
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
    Belirtilen kullanıcı için görev listesini döndürür.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT id, title, priority, DATE_FORMAT(due_date, '%%Y-%%m-%%d %%H:%%i') AS `dueDate`
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
    Kullanıcıya ait performans metriklerini döndürür.
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
    Aktif duyuruları döndürür.
    """
    try:
        with get_db_cursor() as cursor:
            # Try to get created_by if column exists
            try:
                cursor.execute(
                    """
                    SELECT 
                        a.id, 
                        a.title, 
                        a.content as description,
                        a.category, 
                        DATE_FORMAT(a.announcement_date, '%%Y-%%m-%%d %%H:%%i') AS `date`,
                        DATE_FORMAT(a.updated_at, '%%Y-%%m-%%d %%H:%%i') AS `updated_at`,
                        COALESCE(u.full_name, 'Sistem') as author_name
                    FROM announcements a
                    LEFT JOIN users u ON a.created_by = u.id
                    WHERE a.is_active = TRUE
                    ORDER BY a.announcement_date DESC
                    LIMIT %s
                    """,
                    (limit,)
                )
            except:
                # Fallback if created_by column doesn't exist
                cursor.execute(
                    """
                    SELECT 
                        id, 
                        title, 
                        content as description,
                        category, 
                        DATE_FORMAT(announcement_date, '%%Y-%%m-%%d %%H:%%i') AS `date`,
                        DATE_FORMAT(updated_at, '%%Y-%%m-%%d %%H:%%i') AS `updated_at`,
                        'Sistem' as author_name
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


def create_announcement(
    title: str,
    content: str,
    category: str,
    announcement_date: str,
    created_by: Optional[int] = None
) -> Optional[int]:
    """
    Yeni bir duyuru oluşturur.
    Returns the new announcement ID if successful
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor() as cursor:
            # Try to insert with created_by if column exists
            try:
                query = """
                    INSERT INTO announcements (title, content, category, announcement_date, is_active, created_by)
                    VALUES (%s, %s, %s, %s, TRUE, %s)
                """
                cursor.execute(query, (title, content, category, announcement_date, created_by))
            except:
                # Fallback if created_by column doesn't exist
                query = """
                    INSERT INTO announcements (title, content, category, announcement_date, is_active)
                    VALUES (%s, %s, %s, %s, TRUE)
                """
                cursor.execute(query, (title, content, category, announcement_date))
            conn.commit()
            return cursor.lastrowid
    except Exception as e:
        print(f"Create announcement error: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()


# ==================== EMPLOYEE FEATURES ====================

def get_work_schedule(user_id: int, days: int = 7) -> List[Dict[str, Any]]:
    """
    Kullanıcının son N gün için çalışma takvimini döndürür.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    DATE_FORMAT(work_date, '%%Y-%%m-%%d') AS `date`,
                    TIME_FORMAT(check_in, '%%H:%%i') AS checkIn,
                    TIME_FORMAT(check_out, '%%H:%%i') AS checkOut,
                    total_hours AS totalHours,
                    status
                FROM work_schedule 
                WHERE user_id = %s 
                ORDER BY work_date DESC
                LIMIT %s
                """,
                (user_id, days)
            )
            return cursor.fetchall()
    except Exception as e:
        print(f"Get work schedule error: {e}")
        return []


def get_leave_requests(user_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Belirtilen kullanıcı için izin taleplerini döndürür.
    """
    try:
        with get_db_cursor() as cursor:
            if status:
                cursor.execute(
                    """
                    SELECT 
                        id,
                        leave_type AS leaveType,
                        DATE_FORMAT(start_date, '%%Y-%%m-%%d %%H:%%i') AS startDate,
                        DATE_FORMAT(end_date, '%%Y-%%m-%%d %%H:%%i') AS endDate,
                        total_days AS totalDays,
                        reason,
                        status
                    FROM leave_requests 
                    WHERE user_id = %s AND status = %s
                    ORDER BY created_at DESC
                    """,
                    (user_id, status)
                )
            else:
                cursor.execute(
                    """
                    SELECT 
                        id,
                        leave_type AS leaveType,
                        DATE_FORMAT(start_date, '%%Y-%%m-%%d %%H:%%i') AS startDate,
                        DATE_FORMAT(end_date, '%%Y-%%m-%%d %%H:%%i') AS endDate,
                        total_days AS totalDays,
                        reason,
                        status
                    FROM leave_requests 
                    WHERE user_id = %s
                    ORDER BY created_at DESC
                    """,
                    (user_id,)
                )
            return cursor.fetchall()
    except Exception as e:
        print(f"Get leave requests error: {e}")
        return []


def get_all_leave_requests(status: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Tüm çalışanların izin taleplerini döndürür (Admin için).
    """
    try:
        with get_db_cursor() as cursor:
            query = """
                SELECT 
                    lr.id,
                    lr.leave_type AS leaveType,
                    DATE_FORMAT(lr.start_date, '%%Y-%%m-%%d %%H:%%i') AS startDate,
                    DATE_FORMAT(lr.end_date, '%%Y-%%m-%%d %%H:%%i') AS endDate,
                    lr.total_days AS totalDays,
                    CONCAT(u.full_name, ' | ', lr.reason) AS reason,
                    lr.status,
                    u.full_name,
                    u.avatar
                FROM leave_requests lr
                JOIN users u ON lr.user_id = u.id
            """
            params = []
            
            if status:
                query += " WHERE lr.status = %s"
                params.append(status)
            
            query += " ORDER BY lr.created_at DESC"
            
            cursor.execute(query, tuple(params))
            return cursor.fetchall()
    except Exception as e:
        print(f"Get all leave requests error: {e}")
        return []


def create_leave_request(user_id: int, leave_type: str, start_date: str, end_date: str, total_days: float, reason: str) -> Optional[int]:
    """
    Create a new leave request
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (user_id, leave_type, start_date, end_date, total_days, reason)
            )
            return cursor.lastrowid
    except Exception as e:
        print(f"Create leave request error: {e}")
        return None


def approve_leave_request(request_id: int, admin_id: int, approved: bool, reason: Optional[str] = None) -> bool:
    """
    Approve or reject a leave request
    """
    try:
        with get_db_cursor() as cursor:
            status = 'approved' if approved else 'rejected'
            cursor.execute(
                """
                UPDATE leave_requests 
                SET status = %s, approved_by = %s, approved_at = NOW(), rejection_reason = %s
                WHERE id = %s
                """,
                (status, admin_id, reason, request_id)
            )
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Approve leave request error: {e}")
        return False


# ==================== WIDGET MANAGEMENT ====================

def get_user_widgets(user_id: int) -> List[Dict[str, Any]]:
    """
    Kullanıcının dashboard widget tercihlerini döndürür.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    widget_type AS widgetType,
                    position,
                    is_visible AS isVisible,
                    settings
                FROM dashboard_widgets 
                WHERE user_id = %s
                ORDER BY position
                """,
                (user_id,)
            )
            return cursor.fetchall()
    except Exception as e:
        print(f"Get widgets error: {e}")
        return []


def update_user_widgets(user_id: int, widgets: List[Dict[str, Any]]) -> bool:
    """
    Update user's widget preferences
    """
    try:
        with get_db_cursor() as cursor:
            # Delete existing widgets
            cursor.execute("DELETE FROM dashboard_widgets WHERE user_id = %s", (user_id,))
            
            # Insert new configuration
            for widget in widgets:
                cursor.execute(
                    """
                    INSERT INTO dashboard_widgets (user_id, widget_type, position, is_visible, settings)
                    VALUES (%s, %s, %s, %s, %s)
                    """,
                    (user_id, widget['widgetType'], widget['position'], widget.get('isVisible', True), None)
                )
            return True
    except Exception as e:
        print(f"Update widgets error: {e}")
        return False


# ==================== ENHANCED DASHBOARD ====================

def get_employee_dashboard_data(user_id: int) -> Optional[Dict[str, Any]]:
    """
    Çalışan rolü için özelleştirilmiş dashboard verilerini döndürür
    """
    try:
        user_info = get_user_by_id(user_id)
        if not user_info:
            return None
        
        return {
            "userInfo": {
                "name": user_info['full_name'],
                "role": user_info['role'],
                "department": user_info['department'],
                "email": user_info['email'],
                "avatar": user_info['avatar'],
                "userRole": user_info.get('user_role', 'employee'),
                "startDate": user_info.get('start_date').strftime('%Y-%m-%d') if user_info.get('start_date') else None
            },
            "leaveBalance": get_leave_balance(user_id),
            "workSchedule": get_work_schedule(user_id, 7),
            "leaveRequests": get_leave_requests(user_id),
            "pendingTasks": get_user_tasks(user_id, 'pending'),
            "performance": get_performance_metrics(user_id),
            "announcements": get_active_announcements(),
            "widgets": get_user_widgets(user_id)
        }
    except Exception as e:
        print(f"Get employee dashboard error: {e}")
        return None


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


# ==================== ZİMMET (ASSET ASSIGNMENT) FUNCTIONS ====================

def get_asset_categories() -> List[Dict]:
    """
    Tüm zimmet kategorilerini döndürür.
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("""
                SELECT id, name, description, icon, created_at
                FROM asset_categories
                ORDER BY name
            """)
            return cursor.fetchall()
    except Exception as e:
        print(f"Get asset categories error: {e}")
        return []
    finally:
        conn.close()


def get_employee_assets(employee_id: int, status: Optional[str] = None) -> List[Dict]:
    """
    Belirtilen çalışana zimmetlenmiş eşyaları döndürür.
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        with conn.cursor() as cursor:
            if status:
                query = """
                    SELECT 
                        ea.id,
                        ea.asset_name as `assetName`,
                        ea.serial_number as `serialNumber`,
                        ea.description,
                        ea.assigned_date as `assignedDate`,
                        ea.return_date as `returnDate`,
                        ea.document_url as `documentUrl`,
                        ea.document_filename as `documentFilename`,
                        ea.status,
                        ea.notes,
                        ac.name as `categoryName`,
                        ac.icon as `categoryIcon`,
                        u.full_name as `assignedByName`
                    FROM employee_assets ea
                    LEFT JOIN asset_categories ac ON ea.category_id = ac.id
                    LEFT JOIN users u ON ea.assigned_by = u.id
                    WHERE ea.employee_id = %s AND ea.status = %s
                    ORDER BY ea.assigned_date DESC
                """
                cursor.execute(query, (employee_id, status))
            else:
                query = """
                    SELECT 
                        ea.id,
                        ea.asset_name as `assetName`,
                        ea.serial_number as `serialNumber`,
                        ea.description,
                        ea.assigned_date as `assignedDate`,
                        ea.return_date as `returnDate`,
                        ea.document_url as `documentUrl`,
                        ea.document_filename as `documentFilename`,
                        ea.status,
                        ea.notes,
                        ac.name as `categoryName`,
                        ac.icon as `categoryIcon`,
                        u.full_name as `assignedByName`
                    FROM employee_assets ea
                    LEFT JOIN asset_categories ac ON ea.category_id = ac.id
                    LEFT JOIN users u ON ea.assigned_by = u.id
                    WHERE ea.employee_id = %s
                    ORDER BY ea.assigned_date DESC
                """
                cursor.execute(query, (employee_id,))
            
            return cursor.fetchall()
    except Exception as e:
        print(f"Get employee assets error: {e}")
        return []
    finally:
        conn.close()


def get_all_assets(status: Optional[str] = None) -> List[Dict]:
    """
    Tüm zimmet kayıtlarını (admin görünümü) döndürür.
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        with conn.cursor() as cursor:
            if status:
                query = """
                    SELECT 
                        ea.id,
                        ea.employee_id as `employeeId`,
                        emp.full_name as `employeeName`,
                        ea.asset_name as `assetName`,
                        ea.serial_number as `serialNumber`,
                        ea.description,
                        ea.assigned_date as `assignedDate`,
                        ea.return_date as `returnDate`,
                        ea.document_url as `documentUrl`,
                        ea.document_filename as `documentFilename`,
                        ea.status,
                        ea.notes,
                        ac.name as `categoryName`,
                        ac.icon as `categoryIcon`,
                        u.full_name as `assignedByName`
                    FROM employee_assets ea
                    LEFT JOIN users emp ON ea.employee_id = emp.id
                    LEFT JOIN asset_categories ac ON ea.category_id = ac.id
                    LEFT JOIN users u ON ea.assigned_by = u.id
                    WHERE ea.status = %s
                    ORDER BY ea.assigned_date DESC
                """
                cursor.execute(query, (status,))
            else:
                query = """
                    SELECT 
                        ea.id,
                        ea.employee_id as `employeeId`,
                        emp.full_name as `employeeName`,
                        ea.asset_name as `assetName`,
                        ea.serial_number as `serialNumber`,
                        ea.description,
                        ea.assigned_date as `assignedDate`,
                        ea.return_date as `returnDate`,
                        ea.document_url as `documentUrl`,
                        ea.document_filename as `documentFilename`,
                        ea.status,
                        ea.notes,
                        ac.name as `categoryName`,
                        ac.icon as `categoryIcon`,
                        u.full_name as `assignedByName`
                    FROM employee_assets ea
                    LEFT JOIN users emp ON ea.employee_id = emp.id
                    LEFT JOIN asset_categories ac ON ea.category_id = ac.id
                    LEFT JOIN users u ON ea.assigned_by = u.id
                    ORDER BY ea.assigned_date DESC
                """
                cursor.execute(query)
            
            return cursor.fetchall()
    except Exception as e:
        print(f"Get all assets error: {e}")
        return []
    finally:
        conn.close()


def create_asset_assignment(
    employee_id: int,
    asset_name: str,
    category_id: int,
    assigned_date: str,
    document_url: str,
    assigned_by: int,
    serial_number: Optional[str] = None,
    description: Optional[str] = None,
    document_filename: Optional[str] = None,
    notes: Optional[str] = None
) -> Optional[int]:
    """
    Create a new asset assignment
    Returns the new asset ID if successful
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor() as cursor:
            query = """
                INSERT INTO employee_assets (
                    employee_id, asset_name, category_id, serial_number,
                    description, assigned_date, document_url, document_filename,
                    assigned_by, notes, status
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
            """
            cursor.execute(query, (
                employee_id, asset_name, category_id, serial_number,
                description, assigned_date, document_url, document_filename,
                assigned_by, notes
            ))
            conn.commit()
            return cursor.lastrowid
    except Exception as e:
        print(f"Create asset assignment error: {e}")
        conn.rollback()
        return None
    finally:
        conn.close()


def update_asset_assignment(
    asset_id: int,
    asset_name: Optional[str] = None,
    category_id: Optional[int] = None,
    serial_number: Optional[str] = None,
    description: Optional[str] = None,
    document_url: Optional[str] = None,
    document_filename: Optional[str] = None,
    notes: Optional[str] = None,
    status: Optional[str] = None
) -> bool:
    """
    Update an asset assignment
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            # Build dynamic update query
            updates = []
            values = []
            
            if asset_name is not None:
                updates.append("asset_name = %s")
                values.append(asset_name)
            if category_id is not None:
                updates.append("category_id = %s")
                values.append(category_id)
            if serial_number is not None:
                updates.append("serial_number = %s")
                values.append(serial_number)
            if description is not None:
                updates.append("description = %s")
                values.append(description)
            if document_url is not None:
                updates.append("document_url = %s")
                values.append(document_url)
            if document_filename is not None:
                updates.append("document_filename = %s")
                values.append(document_filename)
            if notes is not None:
                updates.append("notes = %s")
                values.append(notes)
            if status is not None:
                updates.append("status = %s")
                values.append(status)
                if status == 'returned':
                    updates.append("return_date = CURDATE()")
            
            if not updates:
                return False
            
            values.append(asset_id)
            query = f"UPDATE employee_assets SET {', '.join(updates)} WHERE id = %s"
            
            cursor.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Update asset assignment error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def return_asset(asset_id: int) -> bool:
    """
    Mark an asset as returned
    """
    return update_asset_assignment(asset_id, status='returned')


def delete_asset_assignment(asset_id: int) -> bool:
    """
    Delete an asset assignment
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM employee_assets WHERE id = %s", (asset_id,))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Delete asset assignment error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def get_asset_statistics(employee_id: Optional[int] = None) -> Dict:
    """
    Zimmet istatistiklerini döndürür.
    employee_id verilirse sadece o çalışanın; verilmezse genel istatistikleri hesaplar.
    """
    conn = get_db_connection()
    if not conn:
        return {}
    
    try:
        with conn.cursor() as cursor:
            if employee_id:
                query = """
                    SELECT 
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                        COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_count,
                        COUNT(CASE WHEN status = 'damaged' THEN 1 END) as damaged_count,
                        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_count,
                        COUNT(*) as total_count
                    FROM employee_assets
                    WHERE employee_id = %s
                """
                cursor.execute(query, (employee_id,))
            else:
                query = """
                    SELECT 
                        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
                        COUNT(CASE WHEN status = 'returned' THEN 1 END) as returned_count,
                        COUNT(CASE WHEN status = 'damaged' THEN 1 END) as damaged_count,
                        COUNT(CASE WHEN status = 'lost' THEN 1 END) as lost_count,
                        COUNT(*) as total_count,
                        COUNT(DISTINCT employee_id) as employee_count
                    FROM employee_assets
                """
                cursor.execute(query)
            
            result = cursor.fetchone()
            return result if result else {}
    except Exception as e:
        print(f"Get asset statistics error: {e}")
        return {}
    finally:
        conn.close()


# ==================== ÇALIŞAN YÖNETİMİ ====================

def get_all_employees() -> List[Dict[str, Any]]:
    """
    Kullanıcılar tablosundan tüm çalışanları getirir.
    EmployeeManagement ekranının ihtiyaç duyduğu çalışan profil listesini üretir.
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        with conn.cursor() as cursor:
            # Tüm kullanıcıların temel bilgilerini al
            # Not: users tablosunda bazı alanlar olmayabilir, bu durumda eksikleri zarifçe atlıyoruz
            query = """
                SELECT 
                    id,
                    full_name as name,
                    role,
                    department,
                    email,
                    avatar,
                    user_role,
                    created_at as startDate
                FROM users
                ORDER BY full_name ASC
            """
            cursor.execute(query)
            employees = cursor.fetchall()
            
            # Sonuçları frontend'deki EmployeeProfile tipine uygun hale getir
            result = []
            for emp in employees:
                employee_data = {
                    'id': emp['id'],
                    'name': emp['name'],
                    'role': emp['role'],
                    'department': emp['department'] or 'Belirtilmemiş',
                    'email': emp['email'],
                    'avatar': emp.get('avatar', emp['name'][:2].upper()),
                    'startDate': emp['startDate'].strftime('%Y-%m-%d') if emp['startDate'] else '',
                    'status': 'active',  # Default, will be updated when status column exists
                    'documents': []  # Will be populated when employee_documents table exists
                }
                
                # phone, manager, location alanları varsa almaya çalış
                try:
                    cursor.execute("""
                        SELECT phone, manager, location, status
                        FROM users WHERE id = %s
                    """, (emp['id'],))
                    extra = cursor.fetchone()
                    if extra:
                        if extra.get('phone'):
                            employee_data['phone'] = extra['phone']
                        if extra.get('manager'):
                            employee_data['manager'] = extra['manager']
                        if extra.get('location'):
                            employee_data['location'] = extra['location']
                        if extra.get('status'):
                            employee_data['status'] = extra['status']
                except:
                    pass  # Columns don't exist yet, skip
                
                # employee_documents tablosu varsa belge bilgilerini almaya çalış
                try:
                    cursor.execute("""
                        SELECT id, title, type, uploaded_at, status, uploaded_by
                        FROM employee_documents
                        WHERE employee_id = %s
                        ORDER BY uploaded_at DESC
                    """, (emp['id'],))
                    docs = cursor.fetchall()
                    if docs:
                        employee_data['documents'] = [
                            {
                                'id': doc['id'],
                                'title': doc['title'],
                                'type': doc['type'],
                                'uploadedAt': doc['uploaded_at'].strftime('%Y-%m-%d') if doc['uploaded_at'] else '',
                                'status': doc['status'],
                                'uploadedBy': 'HR'  # Will be updated when we have user lookup
                            }
                            for doc in docs
                        ]
                except:
                    pass  # Table doesn't exist yet
                
                result.append(employee_data)
            
            return result
    except Exception as e:
        print(f"Get all employees error: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        conn.close()


def get_employee_stats() -> Dict[str, Any]:
    """
    Çalışan istatistiklerini döndürür.
    Toplam çalışan, izinde olanlar, bekleyen belgeler ve onboarding sayılarını hesaplar.
    """
    conn = get_db_connection()
    if not conn:
        return {
            'totalEmployees': 0,
            'onLeave': 0,
            'pendingDocuments': 0,
            'onboarding': 0
        }
    
    try:
        with conn.cursor() as cursor:
            # Toplam çalışan sayısı
            cursor.execute("SELECT COUNT(*) as total FROM users")
            total_result = cursor.fetchone()
            total_employees = total_result['total'] if total_result else 0
            
            # İzinli çalışan sayısı (status kolonu varsa)
            on_leave = 0
            try:
                cursor.execute("SELECT COUNT(*) as count FROM users WHERE status = 'on_leave'")
                on_leave_result = cursor.fetchone()
                on_leave = on_leave_result['count'] if on_leave_result else 0
            except:
                pass  # Column doesn't exist yet
            
            # Bekleyen belge sayısı (employee_documents tablosu varsa)
            pending_docs = 0
            try:
                cursor.execute("SELECT COUNT(*) as count FROM employee_documents WHERE status = 'pending'")
                pending_result = cursor.fetchone()
                pending_docs = pending_result['count'] if pending_result else 0
            except:
                pass  # Table doesn't exist yet
            
            # Son 30 günde eklenen çalışan sayısı (onboarding)
            try:
                cursor.execute("""
                    SELECT COUNT(*) as count 
                    FROM users 
                    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                """)
                onboarding_result = cursor.fetchone()
                onboarding = onboarding_result['count'] if onboarding_result else 0
            except:
                onboarding = 0
            
            return {
                'totalEmployees': total_employees,
                'onLeave': on_leave,
                'pendingDocuments': pending_docs,
                'onboarding': onboarding
            }
    except Exception as e:
        print(f"Get employee stats error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'totalEmployees': 0,
            'onLeave': 0,
            'pendingDocuments': 0,
            'onboarding': 0
        }
    finally:
        conn.close()


def update_employee(
    employee_id: int,
    name: Optional[str] = None,
    email: Optional[str] = None,
    department: Optional[str] = None,
    role: Optional[str] = None,
    phone: Optional[str] = None,
    manager: Optional[int] = None,
    location: Optional[str] = None,
    start_date: Optional[str] = None,
    status: Optional[str] = None
) -> bool:
    """
    Bir çalışanın bilgilerini günceller.
    Başarılı olursa True, aksi halde False döner.
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            # Build dynamic update query
            updates = []
            values = []
            
            if name is not None:
                updates.append("full_name = %s")
                values.append(name)
            if email is not None:
                # Check if email is already taken by another user
                cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", (email, employee_id))
                if cursor.fetchone():
                    return False
                updates.append("email = %s")
                values.append(email)
                # Also update username if email changed
                username = email.split('@')[0]
                updates.append("username = %s")
                values.append(username)
            if department is not None:
                updates.append("department = %s")
                values.append(department)
            if role is not None:
                updates.append("role = %s")
                values.append(role)
            if phone is not None:
                updates.append("phone = %s")
                values.append(phone)
            if manager is not None:
                updates.append("manager = %s")
                values.append(manager)
            if location is not None:
                updates.append("location = %s")
                values.append(location)
            if start_date is not None:
                updates.append("start_date = %s")
                values.append(start_date)
            if status is not None:
                updates.append("status = %s")
                values.append(status)
            
            if not updates:
                return False
            
            values.append(employee_id)
            query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
            
            cursor.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Update employee error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    finally:
        conn.close()


def delete_employee(employee_id: int, deactivate_only: bool = True) -> bool:
    """
    Bir çalışanı siler veya devre dışı bırakır.
    deactivate_only=True ise sadece status'u 'terminated' yapar.
    deactivate_only=False ise kullanıcıyı tamamen siler (CASCADE ile ilişkili kayıtlar da silinir).
    Başarılı olursa True, aksi halde False döner.
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            if deactivate_only:
                # Just deactivate the employee
                cursor.execute("UPDATE users SET status = 'terminated' WHERE id = %s", (employee_id,))
            else:
                # Delete the employee completely (CASCADE will handle related records)
                cursor.execute("DELETE FROM users WHERE id = %s", (employee_id,))
            
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Delete employee error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    finally:
        conn.close()


def create_employee(
    name: str,
    email: str,
    department: str,
    role: str,
    password: Optional[str] = None,
    phone: Optional[str] = None,
    manager: Optional[str] = None,
    location: Optional[str] = None,
    start_date: Optional[str] = None,
    status: str = 'active'
) -> Optional[int]:
    """
    Yeni bir çalışan/kullanıcı oluşturur.
    Başarılı olursa yeni çalışan ID'sini döndürür, hata durumunda None döner.
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor() as cursor:
            # E-postadan otomatik kullanıcı adı üret
            username = email.split('@')[0]
            
            # Kullanıcı adı veya e-posta zaten kullanılıyor mu kontrol et
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
            if cursor.fetchone():
                print(f"User with username {username} or email {email} already exists")
                return None
            
            # Şifreyi hashle (şifre verilmemişse varsayılan bir şifre kullan)
            if not password:
                password = "TempPass123!"  # Should be changed on first login
            password_hash = hash_password(password)
            
            # İsim baş harflerinden avatar kısaltması oluştur
            initials = ''.join([word[0].upper() for word in name.split()[:2]])
            
            # Mevcut kolonlara göre INSERT sorgusunu dinamik oluştur
            base_query = """
                INSERT INTO users (username, password_hash, full_name, email, role, department, avatar, user_role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'employee')
            """
            base_values = [username, password_hash, name, email, role, department, initials]
            
            # Opsiyonel alanlar (phone, manager, location, start_date, status) varsa ekle
            extra_fields = []
            extra_values = []
            
            if phone:
                try:
                    cursor.execute("SHOW COLUMNS FROM users LIKE 'phone'")
                    if cursor.fetchone():
                        extra_fields.append("phone")
                        extra_values.append(phone)
                except:
                    pass
            
            if manager:
                try:
                    cursor.execute("SHOW COLUMNS FROM users LIKE 'manager'")
                    if cursor.fetchone():
                        extra_fields.append("manager")
                        extra_values.append(manager)
                except:
                    pass
            
            if location:
                try:
                    cursor.execute("SHOW COLUMNS FROM users LIKE 'location'")
                    if cursor.fetchone():
                        extra_fields.append("location")
                        extra_values.append(location)
                except:
                    pass
            
            if start_date:
                try:
                    cursor.execute("SHOW COLUMNS FROM users LIKE 'start_date'")
                    if cursor.fetchone():
                        extra_fields.append("start_date")
                        extra_values.append(start_date)
                except:
                    pass
            
            if status:
                try:
                    cursor.execute("SHOW COLUMNS FROM users LIKE 'status'")
                    if cursor.fetchone():
                        extra_fields.append("status")
                        extra_values.append(status)
                except:
                    pass
            
            if extra_fields:
                base_query = base_query.replace(")", f", {', '.join(extra_fields)})")
                base_query = base_query.replace("VALUES (%s" * 7, f"VALUES ({', '.join(['%s'] * (7 + len(extra_fields)))}")
            
            all_values = base_values + extra_values
            cursor.execute(base_query, all_values)
            conn.commit()
            
            new_id = cursor.lastrowid
            print(f"Created new employee with ID: {new_id}")
            return new_id
    except Exception as e:
        print(f"Create employee error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return None
    finally:
        conn.close()





def get_reminders(admin_id: int) -> List[Dict[str, Any]]:
    """
    Admin için hatırlatıcıları getirir:
    - Deneme süresi bitişi (start_date + 3 ay)
    - Doğum günleri (email'den çıkarılabilir veya ayrı bir alan eklenebilir)
    - Vergi ödemeleri (aylık sabit)
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        from datetime import datetime, timedelta
        reminders = []
        today = datetime.now().date()
        
        with conn.cursor(pymysql.cursors.DictCursor) as cursor:
            # Deneme süresi bitişi - start_date + 3 ay
            cursor.execute("""
                SELECT 
                    id,
                    full_name as name,
                    start_date,
                    DATE_ADD(start_date, INTERVAL 3 MONTH) as probation_end_date
                FROM users
                WHERE start_date IS NOT NULL
                AND status = 'active'
                AND DATE_ADD(start_date, INTERVAL 3 MONTH) BETWEEN %s AND DATE_ADD(%s, INTERVAL 14 DAY)
            """, (today, today))
            
            probation_employees = cursor.fetchall()
            for emp in probation_employees:
                days_until = (emp['probation_end_date'] - today).days
                reminders.append({
                    'id': f"probation_{emp['id']}",
                    'type': 'probation',
                    'title': f"{emp['name']}'in deneme süresi {days_until} gün sonra bitiyor",
                    'message': f"{emp['name']}'in deneme süresi haftaya bitiyor",
                    'date': emp['probation_end_date'].strftime('%Y-%m-%d'),
                    'employee_id': emp['id'],
                    'employee_name': emp['name'],
                    'priority': 'high' if days_until <= 7 else 'medium'
                })
            
            # Doğum günleri - email'den çıkaramayacağımız için şimdilik atlıyoruz
            # Gelecekte users tablosuna birthday kolonu eklenebilir
            
            # Vergi ödemesi hatırlatması - her ayın 26'sı
            tax_date = today.replace(day=26)
            if tax_date >= today and tax_date <= today + timedelta(days=14):
                days_until_tax = (tax_date - today).days
                reminders.append({
                    'id': f"tax_{tax_date.strftime('%Y-%m')}",
                    'type': 'tax',
                    'title': f'Vergi ödemesi hatırlatması',
                    'message': f'Vergi ödemesi {days_until_tax} gün sonra',
                    'date': tax_date.strftime('%Y-%m-%d'),
                    'priority': 'medium'
                })
        
        return reminders
    except Exception as e:
        print(f"Get reminders error: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        conn.close()


def upload_employee_document(
    employee_id: int,
    title: str,
    doc_type: str,
    uploaded_by: int,
    document_url: Optional[str] = None,
    document_filename: Optional[str] = None
) -> Optional[int]:
    """
    Bir çalışana belge kaydı ekler.
    Başarılı olursa belge ID'sini döndürür, aksi halde None döner.
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor() as cursor:
            # Tablo var mı kontrol et
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM information_schema.tables
                WHERE table_schema = DATABASE()
                AND table_name = 'employee_documents'
            """)
            table_exists = cursor.fetchone()['count'] > 0
            
            if not table_exists:
                print("employee_documents table does not exist yet")
                return None
            
            cursor.execute("""
                INSERT INTO employee_documents 
                (employee_id, title, type, uploaded_by, document_url, document_filename, status)
                VALUES (%s, %s, %s, %s, %s, %s, 'pending')
            """, (employee_id, title, doc_type, uploaded_by, document_url, document_filename))
            conn.commit()
            
            return cursor.lastrowid
    except Exception as e:
        print(f"Upload employee document error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return None
    finally:
        conn.close()


def approve_employee_document(
    document_id: int,
    approved_by: int,
    approved: bool,
    rejection_reason: Optional[str] = None
) -> bool:
    """
    Bir belgeyi onaylar veya reddeder.
    Başarılı olursa True, aksi halde False döner.
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            if approved:
                cursor.execute("""
                    UPDATE employee_documents 
                    SET status = 'approved', approved_by = %s, approved_at = CURRENT_TIMESTAMP, rejection_reason = NULL
                    WHERE id = %s
                """, (approved_by, document_id))
            else:
                cursor.execute("""
                    UPDATE employee_documents 
                    SET status = 'rejected', approved_by = %s, approved_at = CURRENT_TIMESTAMP, rejection_reason = %s
                    WHERE id = %s
                """, (approved_by, rejection_reason, document_id))
            
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Approve employee document error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    finally:
        conn.close()


def update_employee_document(
    document_id: int,
    title: Optional[str] = None,
    doc_type: Optional[str] = None,
    status: Optional[str] = None,
    document_url: Optional[str] = None,
    document_filename: Optional[str] = None
) -> bool:
    """
    Bir belge kaydını günceller.
    Başarılı olursa True, aksi halde False döner.
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            # Build dynamic update query
            updates = []
            values = []
            
            if title is not None:
                updates.append("title = %s")
                values.append(title)
            if doc_type is not None:
                updates.append("type = %s")
                values.append(doc_type)
            if status is not None:
                updates.append("status = %s")
                values.append(status)
            if document_url is not None:
                updates.append("document_url = %s")
                values.append(document_url)
            if document_filename is not None:
                updates.append("document_filename = %s")
                values.append(document_filename)
            
            if not updates:
                return False
            
            values.append(document_id)
            query = f"UPDATE employee_documents SET {', '.join(updates)} WHERE id = %s"
            
            cursor.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Update employee document error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    finally:
        conn.close()


def delete_employee_document(document_id: int) -> bool:
    """
    Bir belge kaydını siler.
    Başarılı olursa True, aksi halde False döner.
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("DELETE FROM employee_documents WHERE id = %s", (document_id,))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Delete employee document error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return False
    finally:
        conn.close()





# ==================== USER MANAGEMENT ====================

def get_all_users() -> List[Dict[str, Any]]:
    """
    Tüm kullanıcıları getirir (admin için).
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor(pymysql.cursors.DictCursor)
        cursor.execute("""
            SELECT 
                id,
                username,
                full_name,
                email,
                role,
                department,
                user_role,
                status,
                created_at
            FROM users
            ORDER BY full_name ASC
        """)
        users = cursor.fetchall()
        cursor.close()
        return users
    except Exception as e:
        print(f"Get all users error: {e}")
        return []
    finally:
        conn.close()


def create_admin_user(
    username: str,
    email: str,
    password: str,
    full_name: str,
    department: Optional[str] = None
) -> Optional[int]:
    """
    Yeni bir admin kullanıcı oluşturur.
    """
    conn = get_db_connection()
    if not conn:
        return None
    
    try:
        with conn.cursor() as cursor:
            # Check if username or email already exists
            cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
            if cursor.fetchone():
                return None
            
            password_hash = hash_password(password)
            initials = ''.join([word[0].upper() for word in full_name.split()[:2]])
            
            cursor.execute("""
                INSERT INTO users (username, password_hash, full_name, email, role, department, avatar, user_role)
                VALUES (%s, %s, %s, %s, %s, %s, %s, 'admin')
            """, (username, password_hash, full_name, email, 'Admin', department or 'İK', initials))
            conn.commit()
            
            return cursor.lastrowid
    except Exception as e:
        print(f"Create admin user error: {e}")
        import traceback
        traceback.print_exc()
        conn.rollback()
        return None
    finally:
        conn.close()


def update_user_role(user_id: int, user_role: str) -> bool:
    """
    Bir kullanıcının rolünü günceller (admin/employee).
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            cursor.execute("UPDATE users SET user_role = %s WHERE id = %s", (user_role, user_id))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Update user role error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


def reset_user_password(user_id: int, new_password: str) -> bool:
    """
    Bir kullanıcının şifresini sıfırlar.
    """
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        with conn.cursor() as cursor:
            password_hash = hash_password(new_password)
            cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (password_hash, user_id))
            conn.commit()
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Reset user password error: {e}")
        conn.rollback()
        return False
    finally:
        conn.close()


# ==================== DEPARTMENT MANAGEMENT ====================

def get_all_departments() -> List[str]:
    """
    Tüm departmanları getirir.
    """
    conn = get_db_connection()
    if not conn:
        return []
    
    try:
        cursor = conn.cursor()
        cursor.execute("SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != '' ORDER BY department ASC")
        departments = [row[0] for row in cursor.fetchall()]
        cursor.close()
        return departments
    except Exception as e:
        print(f"Get all departments error: {e}")
        return []
    finally:
        conn.close()


# ==================== SYSTEM SETTINGS ====================

def get_system_settings() -> Dict[str, Any]:
    """
    Sistem ayarlarını getirir (varsayılan değerler döner, gerçek tablo yoksa).
    """
    # For now, return default settings
    # In the future, this could read from a settings table
    return {
        'leave_policy': {
            'annual_leave_days': 14,
            'sick_leave_days': 5,
            'personal_leave_days': 3,
        },
        'notifications': {
            'email_enabled': True,
            'sms_enabled': False,
        },
        'system': {
            'maintenance_mode': False,
            'allow_registration': False,
        }
    }


def update_system_settings(settings: Dict[str, Any]) -> bool:
    """
    Sistem ayarlarını günceller.
    """
    # For now, just return True
    # In the future, this could write to a settings table
    return True


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


# ==================== CALENDAR & REMINDERS ====================

def get_personal_reminders(user_id: int) -> List[Dict[str, Any]]:
    """
    Kullanıcının kişisel hatırlatıcılarını döndürür.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                SELECT 
                    id, 
                    title, 
                    DATE_FORMAT(date, '%%Y-%%m-%%d %%H:%%i') as date,
                    is_completed as isCompleted
                FROM personal_reminders 
                WHERE user_id = %s
                ORDER BY date ASC
                """,
                (user_id,)
            )
            return cursor.fetchall()
    except Exception as e:
        print(f"Get personal reminders error: {e}")
        return []


def create_personal_reminder(user_id: int, title: str, date: str) -> Optional[int]:
    """
    Yeni bir kişisel hatırlatıcı oluşturur.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO personal_reminders (user_id, title, date)
                VALUES (%s, %s, %s)
                """,
                (user_id, title, date)
            )
            return cursor.lastrowid
    except Exception as e:
        print(f"Create personal reminder error: {e}")
        return None


def update_personal_reminder(reminder_id: int, is_completed: bool) -> bool:
    """
    Hatırlatıcı durumunu günceller.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute(
                "UPDATE personal_reminders SET is_completed = %s WHERE id = %s",
                (is_completed, reminder_id)
            )
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Update personal reminder error: {e}")
        return False


def delete_personal_reminder(reminder_id: int) -> bool:
    """
    Hatırlatıcıyı siler.
    """
    try:
        with get_db_cursor() as cursor:
            cursor.execute("DELETE FROM personal_reminders WHERE id = %s", (reminder_id,))
            return cursor.rowcount > 0
    except Exception as e:
        print(f"Delete personal reminder error: {e}")
        return False


def get_upcoming_team_events(days: int = 30) -> Dict[str, List[Dict]]:
    """
    Yaklaşan doğum günleri ve iş yıldönümlerini döndürür.
    """
    conn = get_db_connection()
    if not conn:
        return {"birthdays": [], "anniversaries": []}
        
    try:
        with conn.cursor() as cursor:
            # Birthdays (ignores year, checks Month-Day)
            # This logic finds birthdays in next 30 days
            cursor.execute(
                """
                SELECT 
                    id, full_name, avatar, department, 
                    DATE_FORMAT(birth_date, '%%Y-%%m-%%d') as original_date,
                    DATE_FORMAT(birth_date, '%%m-%%d') as day_month
                FROM users 
                WHERE birth_date IS NOT NULL
                AND (
                    DATE_FORMAT(birth_date, '%%m-%%d') BETWEEN DATE_FORMAT(NOW(), '%%m-%%d') 
                    AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL %s DAY), '%%m-%%d')
                )
                ORDER BY day_month ASC
                LIMIT 5
                """,
                (days,)
            )
            birthdays = cursor.fetchall()
            
            # Work Anniversaries
            cursor.execute(
                """
                SELECT 
                    id, full_name, avatar, department,
                    DATE_FORMAT(start_date, '%%Y-%%m-%%d') as original_date,
                    TIMESTAMPDIFF(YEAR, start_date, NOW()) as years,
                    DATE_FORMAT(start_date, '%%m-%%d') as day_month
                FROM users 
                WHERE start_date IS NOT NULL
                AND TIMESTAMPDIFF(YEAR, start_date, NOW()) > 0
                AND (
                    DATE_FORMAT(start_date, '%%m-%%d') BETWEEN DATE_FORMAT(NOW(), '%%m-%%d') 
                    AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL %s DAY), '%%m-%%d')
                )
                ORDER BY day_month ASC
                LIMIT 5
                """,
                (days,)
            )
            anniversaries = cursor.fetchall()
            
            return {
                "birthdays": birthdays,
                "anniversaries": anniversaries
            }
    except Exception as e:
        print(f"Get team events error: {e}")
        return {"birthdays": [], "anniversaries": []}
    finally:
        conn.close()


if __name__ == "__main__":
    # Test the connection when run directly
    test_connection()

