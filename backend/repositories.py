import pymysql
from pymysql.cursors import DictCursor
from contextlib import contextmanager
import os
from dotenv import load_dotenv
import bcrypt
from typing import Optional, Dict, List, Any
from dbutils.pooled_db import PooledDB
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

class DatabaseManager:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DatabaseManager, cls).__new__(cls)
            cls._instance.init_pool()
        return cls._instance

    def init_pool(self):
        db_config = {
            'host': os.getenv('DB_HOST', 'localhost'),
            'port': int(os.getenv('DB_PORT', 3307)),
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
        
        self.pool = PooledDB(
            creator=pymysql,
            maxconnections=10,
            mincached=2,
            maxcached=5,
            maxshared=3,
            blocking=True,
            **db_config
        )
        print("✅ Database connection pool initialized (OOP)")

    def get_connection(self):
        try:
            return self.pool.connection()
        except pymysql.Error as e:
            print(f"Database connection error: {e}")
            return None

    @contextmanager
    def get_cursor(self):
        connection = self.get_connection()
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

class BaseRepository:
    def __init__(self):
        self.db = DatabaseManager()

class UserRepository(BaseRepository):
    def __init__(self):
        super().__init__()
        self._ensure_schema()

    def _ensure_schema(self):
        try:
            with self.db.get_cursor() as cursor:
                # Check/Add start_date
                try:
                    cursor.execute("SELECT start_date FROM users LIMIT 1")
                except:
                    try:
                        cursor.execute("ALTER TABLE users ADD COLUMN start_date DATETIME NULL")
                        print("✅ Added start_date column to users table")
                    except Exception as e:
                        print(f"⚠️ Failed to add start_date column: {e}")

                # Check/Add tc_no
                try:
                    cursor.execute("SELECT tc_no FROM users LIMIT 1")
                except:
                    try:
                        cursor.execute("ALTER TABLE users ADD COLUMN tc_no VARCHAR(11) NULL")
                        print("✅ Added tc_no column to users table")
                    except Exception as e:
                        print(f"⚠️ Failed to add tc_no column: {e}")
        except Exception as e:
            print(f"❌ Schema check error: {e}")

    def get_by_id(self, user_id: int) -> Optional[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                try:
                    cursor.execute(
                        "SELECT id, username, full_name, email, role, department, avatar, user_role, start_date, tc_no FROM users WHERE id = %s",
                        (user_id,)
                    )
                except:
                    try:
                        cursor.execute(
                            "SELECT id, username, full_name, email, role, department, avatar, user_role, start_date FROM users WHERE id = %s",
                            (user_id,)
                        )
                    except:
                        cursor.execute(
                            "SELECT id, username, full_name, email, role, department, avatar, user_role FROM users WHERE id = %s",
                            (user_id,)
                        )
                return cursor.fetchone()
        except Exception as e:
            print(f"Get user error: {e}")
            return None

    def authenticate(self, username: str, password: str) -> Optional[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
                user = cursor.fetchone()
                
                if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
                    user.pop('password_hash', None)
                    return user
                return None
        except Exception as e:
            print(f"Authentication error: {e}")
            return None

    def create_admin(self, username: str, email: str, password: str, full_name: str, department: Optional[str] = None) -> Optional[int]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
                if cursor.fetchone():
                    return None
                
                salt = bcrypt.gensalt()
                hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
                initials = ''.join([word[0].upper() for word in full_name.split()[:2]])
                
                cursor.execute("""
                    INSERT INTO users (username, password_hash, full_name, email, role, department, avatar, user_role)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, 'admin')
                """, (username, hashed, full_name, email, 'Admin', department or 'İK', initials))
                return cursor.lastrowid
        except Exception as e:
            print(f"Create admin user error: {e}")
            return None

    def update_role(self, user_id: int, user_role: str) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("UPDATE users SET user_role = %s WHERE id = %s", (user_role, user_id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update user role error: {e}")
            return False

    def reset_password(self, user_id: int, new_password: str) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                salt = bcrypt.gensalt()
                hashed = bcrypt.hashpw(new_password.encode('utf-8'), salt).decode('utf-8')
                cursor.execute("UPDATE users SET password_hash = %s WHERE id = %s", (hashed, user_id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Reset user password error: {e}")
            return False

    def get_all(self) -> List[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    SELECT id, username, full_name, email, role, department, user_role, status, created_at
                    FROM users ORDER BY full_name ASC
                """)
                return cursor.fetchall()
        except Exception as e:
            print(f"Get all users error: {e}")
            return []

    def get_all_employees(self) -> List[Dict[str, Any]]:
        conn = self.db.get_connection()
        if not conn: return []
        try:
            with conn.cursor() as cursor:
                query = """
                    SELECT id, full_name as name, role, department, email, avatar, user_role, created_at as startDate
                    FROM users ORDER BY full_name ASC
                """
                cursor.execute(query)
                employees = cursor.fetchall()
                
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
                        'status': 'active',
                        'documents': []
                    }
                    result.append(employee_data)
                return result
        except Exception as e:
            print(f"Get all employees error: {e}")
            return []
        finally:
            conn.close()
    
    def get_employee_stats(self) -> Dict[str, Any]:
        conn = self.db.get_connection()
        if not conn:
            return {'totalEmployees': 0, 'onLeave': 0, 'pendingDocuments': 0, 'onboarding': 0}
        
        try:
            with conn.cursor() as cursor:
                cursor.execute("SELECT COUNT(*) as total FROM users")
                total = cursor.fetchone()['total']
                
                try:
                    cursor.execute("SELECT COUNT(*) as count FROM users WHERE status = 'on_leave'")
                    on_leave = cursor.fetchone()['count']
                except: on_leave = 0

                try:
                    cursor.execute("SELECT COUNT(*) as count FROM employee_documents WHERE status = 'pending'")
                    pending = cursor.fetchone()['count']
                except: pending = 0

                try:
                    cursor.execute("SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)")
                    onboarding = cursor.fetchone()['count']
                except: onboarding = 0

                return {
                    'totalEmployees': total,
                    'onLeave': on_leave,
                    'pendingDocuments': pending,
                    'onboarding': onboarding
                }
        except:
             return {'totalEmployees': 0, 'onLeave': 0, 'pendingDocuments': 0, 'onboarding': 0}
        finally:
            conn.close()

    def create_employee(self, data: Dict[str, Any]) -> Optional[int]:
        try:
            with self.db.get_cursor() as cursor:
                # E-postadan otomatik kullanıcı adı üret
                email = data['email']
                username = email.split('@')[0]
                
                # Kullanıcı adı veya e-posta zaten kullanılıyor mu kontrol et
                cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s", (username, email))
                if cursor.fetchone():
                    return None
                
                # Şifreyi hashle
                password = data.get('password', "TempPass123!")
                salt = bcrypt.gensalt()
                hashed = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
                
                # İsim baş harflerinden avatar kısaltması oluştur
                initials = ''.join([word[0].upper() for word in data['name'].split()[:2]])
                
                # Temel sorgu
                columns = ["username", "password_hash", "full_name", "email", "role", "department", "avatar", "user_role"]
                values = [username, hashed, data['name'], email, data['role'], data['department'], initials, 'employee']
                placeholders = ["%s"] * 8
                
                # Opsiyonel alanlar
                optional_fields = {
                    'phone': data.get('phone'),
                    'manager': data.get('manager'),
                    'location': data.get('location'),
                    'start_date': data.get('startDate'),
                    'status': data.get('status', 'active')
                }
                
                for field, value in optional_fields.items():
                    if value:
                        # Bu alanın tabloda var olup olmadığını kontrol etmek ideal olurdu ama
                        # repository içinde bunu yapmak performanslı değil.
                        # Şimdilik var olduğunu varsayıyoruz veya try-catch ile yönetiyoruz.
                        columns.append(field)
                        values.append(value)
                        placeholders.append("%s")
                
                query = f"INSERT INTO users ({', '.join(columns)}) VALUES ({', '.join(placeholders)})"
                cursor.execute(query, values)
                return cursor.lastrowid
        except Exception as e:
            print(f"Create employee error: {e}")
            return None

    def update_employee(self, employee_id: int, data: Dict[str, Any]) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                updates = []
                values = []
                
                # Mapping dict keys to db columns
                field_map = {
                    'name': 'full_name',
                    'email': 'email',
                    'department': 'department',
                    'role': 'role',
                    'phone': 'phone',
                    'manager': 'manager',
                    'location': 'location',
                    'startDate': 'start_date',
                    'status': 'status'
                }
                
                for key, val in data.items():
                    if val is not None and key in field_map:
                        db_col = field_map[key]
                        
                        if db_col == 'email':
                            # Email uniqueness check
                            cursor.execute("SELECT id FROM users WHERE email = %s AND id != %s", (val, employee_id))
                            if cursor.fetchone():
                                return False
                            updates.append(f"{db_col} = %s")
                            values.append(val)
                            # Update username too
                            updates.append("username = %s")
                            values.append(val.split('@')[0])
                        else:
                            updates.append(f"{db_col} = %s")
                            values.append(val)
                
                if not updates:
                    return False
                
                values.append(employee_id)
                query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
                cursor.execute(query, values)
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update employee error: {e}")
            return False

    def get_all_departments(self) -> List[str]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("SELECT DISTINCT department FROM users WHERE department IS NOT NULL AND department != '' ORDER BY department ASC")
                return [row['department'] for row in cursor.fetchall()]
        except Exception as e:
            print(f"Get all departments error: {e}")
            return []

    def get_upcoming_events(self, days: int = 30) -> Dict[str, List[Dict]]:
        conn = self.db.get_connection()
        if not conn: return {"birthdays": [], "anniversaries": []}
        try:
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, full_name, avatar, department, DATE_FORMAT(birth_date, '%%Y-%%m-%%d') as original_date,
                    DATE_FORMAT(birth_date, '%%m-%%d') as day_month
                    FROM users WHERE birth_date IS NOT NULL AND (DATE_FORMAT(birth_date, '%%m-%%d') BETWEEN DATE_FORMAT(NOW(), '%%m-%%d') AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL %s DAY), '%%m-%%d'))
                    ORDER BY day_month ASC LIMIT 5
                    """, (days,)
                )
                birthdays = cursor.fetchall()
                
                cursor.execute(
                    """
                    SELECT id, full_name, avatar, department, DATE_FORMAT(start_date, '%%Y-%%m-%%d') as original_date,
                    TIMESTAMPDIFF(YEAR, start_date, NOW()) as years, DATE_FORMAT(start_date, '%%m-%%d') as day_month
                    FROM users WHERE start_date IS NOT NULL AND TIMESTAMPDIFF(YEAR, start_date, NOW()) > 0 AND (DATE_FORMAT(start_date, '%%m-%%d') BETWEEN DATE_FORMAT(NOW(), '%%m-%%d') AND DATE_FORMAT(DATE_ADD(NOW(), INTERVAL %s DAY), '%%m-%%d'))
                    ORDER BY day_month ASC LIMIT 5
                    """, (days,)
                )
                anniversaries = cursor.fetchall()
                return {"birthdays": birthdays, "anniversaries": anniversaries}
        except Exception as e:
            print(f"Get team events error: {e}")
            return {"birthdays": [], "anniversaries": []}
        finally:
            conn.close()

class LeaveRepository(BaseRepository):
    def __init__(self):
        super().__init__()
        self._ensure_leave_columns()

    def _ensure_leave_columns(self):
        """
        Yeni izin türleri için veritabanı şemasını otomatik günceller
        """
        try:
            with self.db.get_cursor() as cursor:
                # 1. Update leave_requests.leave_type column to support new values
                try:
                    # Convert ENUM to VARCHAR to allow any leave type
                    cursor.execute("ALTER TABLE leave_requests MODIFY COLUMN leave_type VARCHAR(50)")
                    print("✅ Updated leave_type column to VARCHAR(50)")
                except Exception as e:
                    print(f"⚠️ Failed to update leave_type column: {e}")

                # 2. Check/Add new balance columns
                new_columns = {
                    'paternity_leave': 'INT DEFAULT 5',
                    'maternity_leave': 'INT DEFAULT 112',
                    'marriage_leave': 'INT DEFAULT 3',
                    'death_leave': 'INT DEFAULT 3'
                }
                
                cursor.execute("SHOW COLUMNS FROM leave_balance")
                existing_columns = [row['Field'] for row in cursor.fetchall()]
                
                for col, definition in new_columns.items():
                    if col not in existing_columns:
                        try:
                            cursor.execute(f"ALTER TABLE leave_balance ADD COLUMN {col} {definition}")
                            print(f"✅ Added {col} to leave_balance table")
                        except Exception as e:
                            print(f"⚠️ Failed to add {col} column: {e}")

        except Exception as e:
            print(f"❌ Leave Request schema check error: {e}")

    def get_requests(self, user_id: int, status: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                query = """
                    SELECT id, leave_type AS leaveType, DATE_FORMAT(start_date, '%%Y-%%m-%%d %%H:%%i') AS startDate,
                    DATE_FORMAT(end_date, '%%Y-%%m-%%d %%H:%%i') AS endDate, total_days AS totalDays, reason, status
                    FROM leave_requests WHERE user_id = %s
                """
                params = [user_id]
                if status:
                    query += " AND status = %s"
                    params.append(status)
                query += " ORDER BY created_at DESC"
                
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            print(f"Get leave requests error: {e}")
            return []

    def get_all_requests(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                query = """
                    SELECT lr.id, lr.leave_type AS leaveType, DATE_FORMAT(lr.start_date, '%%Y-%%m-%%d %%H:%%i') AS startDate,
                    DATE_FORMAT(lr.end_date, '%%Y-%%m-%%d %%H:%%i') AS endDate, lr.total_days AS totalDays,
                    CONCAT(u.full_name, ' | ', lr.reason) AS reason, lr.status, u.full_name, u.avatar
                    FROM leave_requests lr JOIN users u ON lr.user_id = u.id
                """
                params = []
                if status:
                    query += " WHERE lr.status = %s"
                    params.append(status)
                query += " ORDER BY lr.created_at DESC"
                
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            print(f"Get all leave requests error: {e}")
            return []

    def create_request(self, user_id: int, data: Dict[str, Any]) -> Optional[int]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute(
                    """
                    INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                    """,
                    (user_id, data['leaveType'], data['startDate'], data['endDate'], data['totalDays'], data['reason'])
                )
                return cursor.lastrowid
        except Exception as e:
            print(f"Create leave request error: {e}")
            return None

    def approve_request(self, request_id: int, admin_id: int, approved: bool, reason: Optional[str] = None) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                # 1. Get request details first
                cursor.execute(
                    "SELECT user_id, leave_type, total_days, status FROM leave_requests WHERE id = %s",
                    (request_id,)
                )
                request = cursor.fetchone()
                if not request:
                    return False

                current_status = request['status']
                if current_status != 'pending':
                    # Already processed
                    return False

                # 2. Update status
                status = 'approved' if approved else 'rejected'
                cursor.execute(
                    """
                    UPDATE leave_requests SET status = %s, approved_by = %s, approved_at = NOW(), rejection_reason = %s
                    WHERE id = %s
                    """,
                    (status, admin_id, reason, request_id)
                )
                
                # 3. If approved, deduct from balance
                if approved:
                    self._deduct_balance(cursor, request['user_id'], request['leave_type'], request['total_days'])
                
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Approve leave request error: {e}")
            return False

    def _deduct_balance(self, cursor, user_id: int, leave_type: str, days: float):
        """
        Helper to deduct days from specific leave balance
        """
        # Map frontend leave types to database columns
        column_map = {
            'annual': 'annual_leave',
            'sick': 'sick_leave',
            'personal': 'personal_leave',
            'paternity': 'paternity_leave',
            'maternity': 'maternity_leave',
            'marriage': 'marriage_leave',
            'death': 'death_leave'
        }
        
        col_name = column_map.get(leave_type)
        if col_name:
            try:
                # Subtract days. We cast days to int for simplicity, or handle float if db supports it. 
                # Assuming integer columns for now, rounding up half days or using float columns would be next step.
                # For now, converting to int (ceil) or just int.
                days_int = int(days) if days % 1 == 0 else int(days) + 1
                
                query = f"UPDATE leave_balance SET {col_name} = {col_name} - %s WHERE user_id = %s"
                cursor.execute(query, (days_int, user_id))
                print(f"✅ Deducted {days_int} days from {col_name} for user {user_id}")
            except Exception as e:
                print(f"❌ Failed to deduct balance: {e}")

    def get_balance(self, user_id: int, year: int = 2025) -> Dict[str, int]:
        # First, check if annual leave should be renewed based on seniority
        self._check_seniority_accrual(user_id)
        
        try:
            with self.db.get_cursor() as cursor:
                # ... existing query ...
                try:
                    cursor.execute(
                        """
                        SELECT annual_leave, sick_leave, personal_leave,
                        paternity_leave, maternity_leave, marriage_leave, death_leave
                        FROM leave_balance WHERE user_id = %s AND year = %s
                        """,
                        (user_id, year)
                    )
                except:
                   # ... fallback ...
                    cursor.execute(
                        "SELECT annual_leave, sick_leave, personal_leave FROM leave_balance WHERE user_id = %s AND year = %s",
                        (user_id, year)
                    )
                
                result = cursor.fetchone()
                if result:
                    return {
                        "annual": result.get('annual_leave', 0),
                        "sick": result.get('sick_leave', 0),
                        "personal": result.get('personal_leave', 0),
                        "paternity": result.get('paternity_leave', 5),
                        "maternity": result.get('maternity_leave', 112),
                        "marriage": result.get('marriage_leave', 3),
                        "death": result.get('death_leave', 3)
                    }
                
                return {
                    "annual": 0, "sick": 0, "personal": 0,
                    "paternity": 5, "maternity": 112,
                    "marriage": 3, "death": 3
                }
        except Exception as e:
            print(f"Get leave balance error: {e}")
            return {
                "annual": 0, "sick": 0, "personal": 0,
                "paternity": 5, "maternity": 112,
                "marriage": 3, "death": 3
            }

    def _check_seniority_accrual(self, user_id: int):
        """
        Check if user deserves new annual leave based on start_date
        This is a simplified implementation. ideally this runs as a daily cron job.
        For now, it runs on balance check and checks if 'last_accrual_year' < current_year
        """
        try:
            with self.db.get_cursor() as cursor:
                # 1. Get user start_date
                cursor.execute("SELECT start_date FROM users WHERE id = %s", (user_id,))
                user = cursor.fetchone()
                if not user or not user['start_date']:
                    return

                # Parse start date
                # Assuming start_date is stored as string 'YYYY-MM-DD' or date object
                start_date_str = str(user['start_date'])
                try:
                    from datetime import datetime
                    start_date = datetime.strptime(start_date_str, '%Y-%m-%d')
                except:
                    # Try other formats or skip
                    return

                now = datetime.now()
                # Calculate simple tenure in years
                tenure_years = now.year - start_date.year
                
                # Determine entitlement based on Turkish Labor Law
                # 1-5 years: 14 days
                # 5-15 years: 20 days
                # 15+ years: 26 days
                entitlement = 0
                if tenure_years >= 1 and tenure_years < 5:
                    entitlement = 14
                elif tenure_years >= 5 and tenure_years < 15:
                    entitlement = 20
                elif tenure_years >= 15:
                    entitlement = 26
                
                if entitlement > 0:
                    # Check if balance record exists for this year
                    try:
                        cursor.execute(
                            "SELECT id FROM leave_balance WHERE user_id = %s AND year = %s",
                            (user_id, now.year)
                        )
                        balance_record = cursor.fetchone()
                        
                        if not balance_record:
                            # Create new record with entitlement
                            cursor.execute(
                                """
                                INSERT INTO leave_balance (user_id, year, annual_leave, sick_leave, personal_leave, paternity_leave, maternity_leave, marriage_leave, death_leave)
                                VALUES (%s, %s, %s, 5, 3, 5, 112, 3, 3)
                                """,
                                (user_id, now.year, entitlement)
                            )
                            print(f"✅ Created leave balance for user {user_id} year {now.year} with {entitlement} annual days")
                        else:
                            # Record exists. 
                            # Optional: If we want to support 'adding' entitlement on anniversary while record exists...
                            # That requires tracking 'last_accrual_date'. For now, we only handle year initialization.
                            pass

                    except Exception as e:
                        print(f"Failed to update seniority balance: {e}")

        except Exception as e:
            print(f"Seniority check error: {e}")

class AssetRepository(BaseRepository):
    def get_categories(self) -> List[Dict]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("SELECT id, name, description, icon, created_at FROM asset_categories ORDER BY name")
                return cursor.fetchall()
        except Exception as e:
            print(f"Get asset categories error: {e}")
            return []

    def get_by_employee(self, employee_id: int, status: Optional[str] = None) -> List[Dict]:
        try:
            with self.db.get_cursor() as cursor:
                query = """
                    SELECT ea.id, ea.asset_name as `assetName`, ea.serial_number as `serialNumber`,
                    ea.description, ea.assigned_date as `assignedDate`, ea.return_date as `returnDate`,
                    ea.document_url as `documentUrl`, ea.document_filename as `documentFilename`,
                    ea.status, ea.notes, ac.name as `categoryName`, ac.icon as `categoryIcon`,
                    u.full_name as `assignedByName`
                    FROM employee_assets ea
                    LEFT JOIN asset_categories ac ON ea.category_id = ac.id
                    LEFT JOIN users u ON ea.assigned_by = u.id
                    WHERE ea.employee_id = %s
                """
                params = [employee_id]
                if status:
                    query += " AND ea.status = %s"
                    params.append(status)
                query += " ORDER BY ea.assigned_date DESC"
                
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            print(f"Get employee assets error: {e}")
            return []

    def get_all(self, status: Optional[str] = None) -> List[Dict]:
        try:
            with self.db.get_cursor() as cursor:
                query = """
                    SELECT ea.id, ea.employee_id as `employeeId`, emp.full_name as `employeeName`,
                    ea.asset_name as `assetName`, ea.serial_number as `serialNumber`, ea.description,
                    ea.assigned_date as `assignedDate`, ea.return_date as `returnDate`,
                    ea.document_url as `documentUrl`, ea.status, ac.name as `categoryName`
                    FROM employee_assets ea
                    LEFT JOIN users emp ON ea.employee_id = emp.id
                    LEFT JOIN asset_categories ac ON ea.category_id = ac.id
                """
                params = []
                if status:
                    query += " WHERE ea.status = %s"
                    params.append(status)
                query += " ORDER BY ea.assigned_date DESC"
                
                cursor.execute(query, params)
                return cursor.fetchall()
        except Exception as e:
            print(f"Get all assets error: {e}")
            return []

    def create_assignment(self, data: Dict[str, Any]) -> Optional[int]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO employee_assets (employee_id, asset_name, category_id, serial_number, description,
                    assigned_date, document_url, document_filename, assigned_by, notes, status)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'active')
                """, (
                    data['employee_id'], data['asset_name'], data['category_id'], data.get('serial_number'),
                    data.get('description'), data['assigned_date'], data.get('document_url'),
                    data.get('document_filename'), data['assigned_by'], data.get('notes')
                ))
                return cursor.lastrowid
        except Exception as e:
            print(f"Create asset error: {e}")
            return None

    def update_assignment(self, asset_id: int, data: Dict[str, Any]) -> bool:
        # Implementation similar to original update_asset_assignment using dynamic SQL
        pass

    def return_asset(self, asset_id: int) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("UPDATE employee_assets SET status = 'returned', return_date = CURDATE() WHERE id = %s", (asset_id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Return asset error: {e}")
            return False

    def delete_assignment(self, asset_id: int) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("DELETE FROM employee_assets WHERE id = %s", (asset_id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Delete asset error: {e}")
            return False

    def get_statistics(self, employee_id: Optional[int] = None) -> Dict:
        conn = self.db.get_connection()
        if not conn: return {}
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
                return cursor.fetchone() or {}
        except Exception as e:
            print(f"Get asset statistics error: {e}")
            return {}
        finally:
            conn.close()

class TaskRepository(BaseRepository):
    def get_by_user(self, user_id: int, status: str = 'pending') -> List[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    SELECT id, title, priority, DATE_FORMAT(due_date, '%%Y-%%m-%%d %%H:%%i') AS `dueDate`
                    FROM tasks WHERE user_id = %s AND status = %s
                    ORDER BY CASE priority WHEN 'high' THEN 1 WHEN 'medium' THEN 2 WHEN 'low' THEN 3 END, due_date ASC
                """, (user_id, status))
                return cursor.fetchall()
        except Exception as e:
            print(f"Get tasks error: {e}")
            return []

    def update_status(self, task_id: int, status: str) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("UPDATE tasks SET status = %s WHERE id = %s", (status, task_id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update task error: {e}")
            return False

class AnnouncementRepository(BaseRepository):
    def __init__(self):
        super().__init__()
        self._ensure_updated_at_column()

    def _ensure_updated_at_column(self):
        try:
            with self.db.get_cursor() as cursor:
                # Check if column exists by selecting it
                cursor.execute("SELECT updated_at FROM announcements LIMIT 1")
        except:
            try:
                with self.db.get_cursor() as cursor:
                    # Add column if it fails
                    cursor.execute("ALTER TABLE announcements ADD COLUMN updated_at DATETIME NULL")
                    print("Added updated_at column to announcements table")
            except Exception as e:
                print(f"Schema update error: {e}")

    def get_active(self, limit: int = 10) -> List[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                try:
                    cursor.execute("""
                        SELECT a.id, a.title, a.content as description, a.category, 
                        DATE_FORMAT(a.announcement_date, '%%Y-%%m-%%d %%H:%%i') AS `date`,
                        DATE_FORMAT(a.updated_at, '%%Y-%%m-%%d %%H:%%i') AS `updated_at`,
                        COALESCE(u.full_name, 'Sistem') as author_name
                        FROM announcements a LEFT JOIN users u ON a.created_by = u.id
                        WHERE a.is_active = TRUE ORDER BY a.announcement_date DESC LIMIT %s
                    """, (limit,))
                except:
                    # Fallback if query fails (e.g. column not found despite attempt to add)
                    cursor.execute("""
                        SELECT id, title, content as description, category, 
                        DATE_FORMAT(announcement_date, '%%Y-%%m-%%d %%H:%%i') AS `date`, 
                        NULL as updated_at,
                        'Sistem' as author_name
                        FROM announcements WHERE is_active = TRUE ORDER BY announcement_date DESC LIMIT %s
                    """, (limit,))
                return cursor.fetchall()
        except Exception as e:
            print(f"Get announcements error: {e}")
            return []

    def create(self, title: str, content: str, category: str, date: str, created_by: Optional[int] = None) -> Optional[int]:
        try:
            with self.db.get_cursor() as cursor:
                try:
                    cursor.execute(
                        "INSERT INTO announcements (title, content, category, announcement_date, is_active, created_by) VALUES (%s, %s, %s, %s, TRUE, %s)",
                        (title, content, category, date, created_by)
                    )
                except:
                    cursor.execute(
                        "INSERT INTO announcements (title, content, category, announcement_date, is_active) VALUES (%s, %s, %s, %s, TRUE)",
                        (title, content, category, date)
                    )
                return cursor.lastrowid
        except Exception as e:
            print(f"Create announcement error: {e}")
            return None

    def update(self, id: int, title: str, content: str, category: str, date: str) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                try:
                    cursor.execute(
                        """
                        UPDATE announcements 
                        SET title = %s, content = %s, category = %s, announcement_date = %s, updated_at = NOW()
                        WHERE id = %s
                        """,
                        (title, content, category, date, id)
                    )
                except Exception as e:
                    print(f"Update announcement with updated_at failed: {e}. Trying without updated_at column...")
                    cursor.execute(
                        """
                        UPDATE announcements 
                        SET title = %s, content = %s, category = %s, announcement_date = %s
                        WHERE id = %s
                        """,
                        (title, content, category, date, id)
                    )
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update announcement error: {e}")
            return False

    def delete(self, id: int) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("SELECT id FROM announcements WHERE id = %s", (id,))
                if not cursor.fetchone():
                    return False
                
                cursor.execute("UPDATE announcements SET is_active = FALSE WHERE id = %s", (id,))
                return True
        except Exception as e:
            print(f"Delete announcement error: {e}")
            return False

class DashboardRepository(BaseRepository):
    def __init__(self):
        super().__init__()
        self.user_repo = UserRepository()
        self.leave_repo = LeaveRepository()
        self.task_repo = TaskRepository()
        self.announcement_repo = AnnouncementRepository()
        self.work_schedule_repo = WorkScheduleRepository()
        self.asset_repo = AssetRepository()

    def get_user_data(self, user_id: int) -> Optional[Dict[str, Any]]:
        user_info = self.user_repo.get_by_id(user_id)
        if not user_info: return None
        
        return {
            "userInfo": {
                "name": user_info['full_name'],
                "role": user_info['role'],
                "department": user_info['department'],
                "email": user_info['email'],
                "avatar": user_info['avatar'],
                "userRole": user_info.get('user_role', 'employee'),
                "startDate": user_info.get('start_date').strftime('%Y-%m-%d') if user_info.get('start_date') else None,
                "tcNo": user_info.get('tc_no')
            },
            "leaveBalance": self.leave_repo.get_balance(user_id),
            "pendingTasks": self.task_repo.get_by_user(user_id, 'pending'),
            "performance": [], # Placeholder
            "announcements": self.announcement_repo.get_active()
        }

    def get_employee_data(self, user_id: int) -> Optional[Dict[str, Any]]:
        user_info = self.user_repo.get_by_id(user_id)
        if not user_info: return None
        
        return {
            "userInfo": {
                "name": user_info['full_name'],
                "role": user_info['role'],
                "department": user_info['department'],
                "email": user_info['email'],
                "avatar": user_info['avatar'],
                "userRole": user_info.get('user_role', 'employee'),
                "startDate": user_info.get('start_date').strftime('%Y-%m-%d') if user_info.get('start_date') else None,
                "tcNo": user_info.get('tc_no')
            },
            "leaveBalance": self.leave_repo.get_balance(user_id),
            "workSchedule": self.work_schedule_repo.get_schedule(user_id, 7),
            "leaveRequests": self.leave_repo.get_requests(user_id),
            "pendingTasks": self.task_repo.get_by_user(user_id, 'pending'),
            "performance": [],
            "announcements": self.announcement_repo.get_active(),
            "widgets": self.get_widgets(user_id)
        }

    def get_widgets(self, user_id: int) -> List[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute(
                    "SELECT widget_type AS widgetType, position, is_visible AS isVisible, settings FROM dashboard_widgets WHERE user_id = %s ORDER BY position",
                    (user_id,)
                )
                return cursor.fetchall()
        except Exception as e:
            print(f"Get widgets error: {e}")
            return []

    def update_widgets(self, user_id: int, widgets: List[Dict[str, Any]]) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("DELETE FROM dashboard_widgets WHERE user_id = %s", (user_id,))
                for widget in widgets:
                    cursor.execute(
                        "INSERT INTO dashboard_widgets (user_id, widget_type, position, is_visible, settings) VALUES (%s, %s, %s, %s, %s)",
                        (user_id, widget['widgetType'], widget['position'], widget.get('isVisible', True), None)
                    )
                return True
        except Exception as e:
            print(f"Update widgets error: {e}")
            return False

class SessionRepository(BaseRepository):
    def create(self, user_id: int, token: str, expires_at) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)", (user_id, token, expires_at))
                return True
        except Exception as e:
            print(f"Create session error: {e}")
            return False

    def validate(self, token: str) -> Optional[int]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("SELECT user_id FROM sessions WHERE token = %s AND expires_at > NOW()", (token,))
                result = cursor.fetchone()
                return result['user_id'] if result else None
        except Exception as e:
            print(f"Validate session error: {e}")
            return None

    def delete(self, token: str) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("DELETE FROM sessions WHERE token = %s", (token,))
                return True
        except Exception as e:
            print(f"Delete session error: {e}")
            return False

class WorkScheduleRepository(BaseRepository):
    def get_schedule(self, user_id: int, days: int = 7) -> List[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute(
                    """
                    SELECT DATE_FORMAT(work_date, '%%Y-%%m-%%d') AS `date`,
                    TIME_FORMAT(check_in, '%%H:%%i') AS checkIn,
                    TIME_FORMAT(check_out, '%%H:%%i') AS checkOut,
                    total_hours AS totalHours, status
                    FROM work_schedule WHERE user_id = %s ORDER BY work_date DESC LIMIT %s
                    """,
                    (user_id, days)
                )
                return cursor.fetchall()
        except Exception as e:
            print(f"Get work schedule error: {e}")
            return []

class ReminderRepository(BaseRepository):
    def get_personal(self, user_id: int) -> List[Dict[str, Any]]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute(
                    """
                    SELECT id, title, DATE_FORMAT(date, '%%Y-%%m-%%d %%H:%%i') as date, is_completed as isCompleted
                    FROM personal_reminders WHERE user_id = %s ORDER BY date ASC
                    """,
                    (user_id,)
                )
                return cursor.fetchall()
        except Exception as e:
            print(f"Get personal reminders error: {e}")
            return []

    def get_reminders(self, admin_id: int) -> List[Dict[str, Any]]:
        # Logic for probation and tax reminders
        conn = self.db.get_connection()
        if not conn: return []
        try:
            reminders = []
            today = datetime.now().date()
            with conn.cursor() as cursor:
                # Probation end (3 months from start_date)
                cursor.execute("""
                    SELECT id, full_name as name, start_date, DATE_ADD(start_date, INTERVAL 3 MONTH) as probation_end_date
                    FROM users WHERE start_date IS NOT NULL AND status = 'active'
                    AND DATE_ADD(start_date, INTERVAL 3 MONTH) BETWEEN %s AND DATE_ADD(%s, INTERVAL 14 DAY)
                """, (today, today))
                for emp in cursor.fetchall():
                    days_until = (emp['probation_end_date'] - today).days
                    reminders.append({
                        'id': f"probation_{emp['id']}", 'type': 'probation',
                        'title': f"{emp['name']}'in deneme süresi {days_until} gün sonra bitiyor",
                        'message': f"{emp['name']}'in deneme süresi haftaya bitiyor",
                        'date': emp['probation_end_date'].strftime('%Y-%m-%d'),
                        'employee_id': emp['id'], 'employee_name': emp['name'],
                        'priority': 'high' if days_until <= 7 else 'medium'
                    })
                
                # Tax reminder
                tax_date = today.replace(day=26)
                if today <= tax_date <= today + timedelta(days=14):
                    days_until = (tax_date - today).days
                    reminders.append({
                        'id': f"tax_{tax_date.strftime('%Y-%m')}", 'type': 'tax',
                        'title': 'Vergi ödemesi hatırlatması', 'message': f'Vergi ödemesi {days_until} gün sonra',
                        'date': tax_date.strftime('%Y-%m-%d'), 'priority': 'medium'
                    })
            return reminders
        except Exception as e:
            print(f"Get reminders error: {e}")
            return []
        finally:
            conn.close()

    def create_personal(self, user_id: int, title: str, date: str) -> Optional[int]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute(
                    "INSERT INTO personal_reminders (user_id, title, date) VALUES (%s, %s, %s)",
                    (user_id, title, date)
                )
                return cursor.lastrowid
        except Exception as e:
            print(f"Create personal reminder error: {e}")
            return None

    def update_status(self, reminder_id: int, is_completed: bool) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("UPDATE personal_reminders SET is_completed = %s WHERE id = %s", (is_completed, reminder_id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update personal reminder status error: {e}")
            return False

    def delete(self, reminder_id: int) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("DELETE FROM personal_reminders WHERE id = %s", (reminder_id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Delete reminder error: {e}")
            return False

class DocumentRepository(BaseRepository):
    def upload(self, employee_id: int, title: str, doc_type: str, uploaded_by: int, 
               document_url: Optional[str] = None, document_filename: Optional[str] = None) -> Optional[int]:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("""
                    INSERT INTO employee_documents (employee_id, title, type, uploaded_by, document_url, document_filename, status)
                    VALUES (%s, %s, %s, %s, %s, %s, 'pending')
                """, (employee_id, title, doc_type, uploaded_by, document_url, document_filename))
                return cursor.lastrowid
        except Exception as e:
            print(f"Upload document error: {e}")
            return None

    def approve(self, document_id: int, approved_by: int, approved: bool, rejection_reason: Optional[str] = None) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                status = 'approved' if approved else 'rejected'
                cursor.execute("""
                    UPDATE employee_documents SET status = %s, approved_by = %s, approved_at = NOW(), rejection_reason = %s
                    WHERE id = %s
                """, (status, approved_by, rejection_reason, document_id))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Approve document error: {e}")
            return False
    
    def update(self, document_id: int, data: Dict[str, Any]) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                updates = []
                values = []
                
                if 'title' in data:
                    updates.append("title = %s")
                    values.append(data['title'])
                if 'type' in data:
                    updates.append("type = %s")
                    values.append(data['type'])
                if 'status' in data:
                    updates.append("status = %s")
                    values.append(data['status'])
                if 'document_url' in data:
                    updates.append("document_url = %s")
                    values.append(data['document_url'])
                if 'document_filename' in data:
                    updates.append("document_filename = %s")
                    values.append(data['document_filename'])
                    
                if not updates:
                    return False
                    
                values.append(document_id)
                query = f"UPDATE employee_documents SET {', '.join(updates)} WHERE id = %s"
                cursor.execute(query, values)
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Update document error: {e}")
            return False

    def delete(self, document_id: int) -> bool:
        try:
            with self.db.get_cursor() as cursor:
                cursor.execute("DELETE FROM employee_documents WHERE id = %s", (document_id,))
                return cursor.rowcount > 0
        except Exception as e:
            print(f"Delete document error: {e}")
            return False
