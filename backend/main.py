from fastapi import FastAPI, HTTPException, Depends, Header, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
import os
import shutil
from pathlib import Path
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from auth import create_access_token, verify_token
from logger import logger, log_auth_attempt, log_request, log_error
from repositories import (
    DatabaseManager,
    UserRepository,
    LeaveRepository,
    TaskRepository,
    AssetRepository,
    DashboardRepository,
    AnnouncementRepository,
    SessionRepository,
    WorkScheduleRepository,
    ReminderRepository,
    DocumentRepository
)

# Initialize Repositories
db_manager = DatabaseManager()
user_repo = UserRepository()
leave_repo = LeaveRepository()
task_repo = TaskRepository()
asset_repo = AssetRepository()
dashboard_repo = DashboardRepository()
announcement_repo = AnnouncementRepository()
session_repo = SessionRepository()
schedule_repo = WorkScheduleRepository()
reminder_repo = ReminderRepository()
doc_repo = DocumentRepository()

app = FastAPI(title="HR Dashboard API")

# Initialize rate limiter
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Serve uploaded files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test database connection on startup
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("🚀 HR Dashboard API Starting...")
    logger.info("=" * 60)
    logger.info("📊 Testing database connection...")
    logger.info("📊 Testing database connection...")
    conn = db_manager.get_connection()
    if conn:
        conn.close()
        logger.info("✅ Database connection pool initialized")
    else:
        logger.error("❌ Database connection failed")
    logger.info("🔒 JWT authentication enabled (30 min expiration)")
    logger.info("🚦 Rate limiting active (5 login attempts/minute)")
    logger.info("=" * 60)


class UserInfo(BaseModel):
    name: str
    role: str
    department: str
    email: str
    avatar: str


class LeaveBalance(BaseModel):
    annual: int
    sick: int
    personal: int


class Task(BaseModel):
    id: int
    title: str
    priority: str
    dueDate: str


class PerformanceMetric(BaseModel):
    label: str
    value: int
    maxValue: int


class Announcement(BaseModel):
    id: int
    title: str
    date: str
    updated_at: Optional[str] = None
    category: str


class DashboardData(BaseModel):
    userInfo: UserInfo
    leaveBalance: LeaveBalance
    pendingTasks: List[Task]
    performance: List[PerformanceMetric]
    announcements: List[Announcement]


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user_id: Optional[int] = None
    user_role: Optional[str] = None


class LogoutRequest(BaseModel):
    token: str


@app.get("/")
def read_root():
    return {
        "message": "HR Dashboard API is running",
        "version": "2.0",
        "database": "MariaDB Connected"
    }


@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring
    Returns system status and dependencies
    """
    try:
        # Check database connection
        conn = db_manager.get_connection()
        db_status = "healthy" if conn else "unhealthy"
        if conn:
            conn.close()
        
        return {
            "status": "healthy" if db_status == "healthy" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
            "services": {
                "api": "healthy",
                "database": db_status,
                "authentication": "healthy"
            },
            "uptime": "OK"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "error": str(e)
        }


# Dependency to verify JWT token
async def get_current_user(authorization: Optional[str] = Header(None, alias="Authorization")):
    """
    Verify JWT token from Authorization header
    Returns user data if valid, raises 401 if invalid/expired
    """
    if not authorization:
        logger.warning("❌ Authorization header missing")
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Extract token from "Bearer <token>"
    try:
        parts = authorization.split()
        if len(parts) != 2:
            logger.warning(f"❌ Invalid authorization header format: {authorization[:50]}")
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        scheme, token = parts
        if scheme.lower() != "bearer":
            logger.warning(f"❌ Invalid authentication scheme: {scheme}")
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError as e:
        logger.warning(f"❌ Error parsing authorization header: {e}")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    # Debug: Log token format (first/last 10 chars only for security)
    logger.debug(f"🔑 Verifying token: {token[:10]}...{token[-10:] if len(token) > 20 else ''}")
    
    # Verify token
    payload = verify_token(token)
    if not payload:
        logger.warning("❌ Token verification failed")
        raise HTTPException(status_code=401, detail="Token expired or invalid")
    
    logger.debug(f"✅ Token verified for user: {payload.get('sub')}")
    return payload


@app.post("/api/login", response_model=LoginResponse)
@limiter.limit("5/minute")  # Max 5 login attempts per minute per IP
def login(request: Request, credentials: LoginRequest):
    """
    HR Manager login endpoint with database authentication
    Credentials are stored in database with bcrypt hashing
    """
    client_ip = get_remote_address(request)
    
    # Log login attempt
    logger.info(f"🔐 Login attempt | Username: {credentials.username} | IP: {client_ip}")
    
    # Authenticate user against database
    user = user_repo.authenticate(credentials.username, credentials.password)
    
    if user:
        # Determine application role for authorization checks
        # Prefer the explicit user_role column; fall back to 'employee'
        app_role = user.get('user_role', 'employee')

        # Generate JWT token with expiration (30 minutes)
        token_data = {
            "sub": user['username'],
            "user_id": user['id'],
            "role": app_role
        }
        token = create_access_token(token_data)
        
        # Also store session in database for tracking (optional)
        expires_at = datetime.now() + timedelta(minutes=30)
        session_repo.create(user['id'], token, expires_at)
        
        # Log successful login
        log_auth_attempt(credentials.username, True, client_ip)
        logger.info(f"✅ Login successful | User: {user['username']} | Role: {user.get('user_role')} | IP: {client_ip}")
        
        return {
            "success": True,
            "message": "Giriş başarılı!",
            "token": token,
            "user_id": user['id'],
            "user_role": user.get('user_role', 'employee')
        }
    else:
        # Log failed login
        log_auth_attempt(credentials.username, False, client_ip)
        logger.warning(f"❌ Login failed | Username: {credentials.username} | IP: {client_ip}")
        raise HTTPException(
            status_code=401,
            detail="Kullanıcı adı veya şifre hatalı!"
        )


@app.post("/api/logout")
def logout(logout_req: LogoutRequest):
    """
    Logout endpoint - invalidate session token
    """
    session_repo.delete(logout_req.token)
    return {
        "success": True,
        "message": "Çıkış başarılı"
    }


@app.get("/api/dashboard")
def get_dashboard_data(current_user: dict = Depends(get_current_user)):
    """
    Returns dashboard data from database for authenticated user
    Supports both admin and employee roles
    Requires valid JWT token
    """
    user_id = current_user.get('user_id')
    user_role = current_user.get('role', 'employee')
    username = current_user.get('sub', 'unknown')
    
    logger.info(f"📊 Dashboard request | User: {username} (ID: {user_id}) | Role: {user_role}")
    
    try:
        if user_role == 'employee':
            dashboard_data = dashboard_repo.get_employee_data(user_id)
        else:
            dashboard_data = dashboard_repo.get_user_data(user_id)
        
        if dashboard_data:
            logger.info(f"✅ Dashboard data loaded | User: {username}")
            return dashboard_data
        else:
            logger.error(f"❌ Dashboard data not found | User ID: {user_id}")
            raise HTTPException(
                status_code=404,
                detail="Kullanıcı verileri bulunamadı"
            )
    except Exception as e:
        log_error(e, f"Dashboard data fetch for user {username}")
        raise HTTPException(status_code=500, detail="Veri yüklenirken hata oluştu")


@app.put("/api/tasks/{task_id}/status")
def update_task(task_id: int, status: str):
    """
    Update task status (pending, completed, cancelled)
    """
    if status not in ['pending', 'completed', 'cancelled']:
        raise HTTPException(
            status_code=400,
            detail="Geçersiz durum. Geçerli değerler: pending, completed, cancelled"
        )
    
    success = task_repo.update_status(task_id, status)
    
    if success:
        return {
            "success": True,
            "message": f"Görev durumu '{status}' olarak güncellendi"
        }
    else:
        raise HTTPException(
            status_code=404,
            detail="Görev bulunamadı"
        )


# ==================== LEAVE REQUEST ENDPOINTS ====================

class LeaveRequestCreate(BaseModel):
    leaveType: str
    startDate: str
    endDate: str
    totalDays: float
    reason: str


@app.post("/api/leave-requests")
def create_leave_req(user_id: int, leave_request: LeaveRequestCreate):
    """
    Create a new leave request (Employee)
    """
    request_id = leave_repo.create_request(user_id, leave_request.dict())
    
    if request_id:
        return {
            "success": True,
            "message": "İzin talebi oluşturuldu",
            "request_id": request_id
        }
    else:
        raise HTTPException(
            status_code=500,
            detail="İzin talebi oluşturulamadı"
        )


@app.get("/api/leave-requests")
def get_leave_reqs(
    user_id: Optional[int] = None, 
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """
    Belirtilen kullanıcı için izin taleplerini döndürür.
    Admin ise tüm bekleyen talepleri veya user_id belirtilmişse o kullanıcının taleplerini görebilir.
    """
    requester_role = current_user.get('role', 'employee')
    requester_id = current_user.get('user_id')
    
    # If user_id is not provided, default to current user
    target_user_id = user_id if user_id else requester_id

    # If Admin, fetch all requests if no specific user target is meant for personal view
    # Logic: 
    # - If Admin and NO user_id param -> Get ALL requests (for Admin Panel)
    # - If Admin and user_id param -> Get that user's requests
    # - If Employee -> Get ONLY own requests
    
    if requester_role == 'admin' and not user_id:
        requests = leave_repo.get_all_requests(status)
    else:
        # Security check: Employees can only view their own requests
        if requester_role != 'admin' and target_user_id != requester_id:
             raise HTTPException(status_code=403, detail="Başkasının izinlerini görüntüleme yetkiniz yok")
        
        requests = leave_repo.get_requests(target_user_id, status)

    return {"leaveRequests": requests}


@app.put("/api/leave-requests/{request_id}/approve")
def approve_leave(request_id: int, admin_id: int, approved: bool, reason: Optional[str] = None):
    """
    Approve or reject leave request (Admin only)
    """
    success = leave_repo.approve_request(request_id, admin_id, approved, reason)
    
    if success:
        status_text = "onaylandı" if approved else "reddedildi"
        return {
            "success": True,
            "message": f"İzin talebi {status_text}"
        }
    else:
        raise HTTPException(
            status_code=404,
            detail="İzin talebi bulunamadı"
        )


# ==================== WIDGET MANAGEMENT ====================

class WidgetConfig(BaseModel):
    widgetType: str
    position: int
    isVisible: bool = True


@app.get("/api/widgets")
def get_widgets(user_id: int):
    """
    Kullanıcının widget yapılandırmasını döndürür
    """
    widgets = dashboard_repo.get_widgets(user_id)
    return {"widgets": widgets}


@app.put("/api/widgets")
def update_widgets(user_id: int, widgets: List[WidgetConfig]):
    """
    Kullanıcının widget yapılandırmasını günceller
    """
    widget_list = [w.dict() for w in widgets]
    success = dashboard_repo.update_widgets(user_id, widget_list)
    
    if success:
        return {
            "success": True,
            "message": "Widget yapılandırması güncellendi"
        }
    else:
        raise HTTPException(
            status_code=500,
            detail="Widget güncellenemedi"
        )


@app.get("/api/work-schedule")
def get_work_sched(user_id: int, days: int = 7):
    """
    Çalışanın belirtilen gün sayısı için çalışma takvimini döndürür
    """
    schedule = schedule_repo.get_schedule(user_id, days)
    return {"workSchedule": schedule}


# ==================== ZİMMET (ASSET ATAMA) ====================

class AssetAssignmentCreate(BaseModel):
    employee_id: int
    asset_name: str
    category_id: int
    assigned_date: str
    document_url: str
    serial_number: Optional[str] = None
    description: Optional[str] = None
    document_filename: Optional[str] = None
    notes: Optional[str] = None


class AssetAssignmentUpdate(BaseModel):
    asset_name: Optional[str] = None
    category_id: Optional[int] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None
    document_url: Optional[str] = None
    document_filename: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None


@app.get("/api/assets/categories")
def get_categories(current_user: dict = Depends(get_current_user)):
    """
    Tüm zimmet kategorilerini döndürür
    """
    logger.info(f"📦 Asset categories request | User: {current_user.get('sub')}")
    categories = asset_repo.get_categories()
    return {"categories": categories}


@app.get("/api/assets/my")
def get_my_assets(current_user: dict = Depends(get_current_user), status: Optional[str] = None):
    """
    Giriş yapmış kullanıcının zimmetli eşyalarını döndürür
    """
    user_id = current_user.get('user_id')
    username = current_user.get('sub')
    
    logger.info(f"📦 My assets request | User: {username} | Status filter: {status}")
    
    try:
        assets = asset_repo.get_by_employee(user_id, status)
        stats = asset_repo.get_statistics(user_id)
        
        return {
            "assets": assets,
            "statistics": stats
        }
    except Exception as e:
        log_error(e, f"Get my assets for user {username}")
        raise HTTPException(status_code=500, detail="Eşyalar yüklenirken hata oluştu")


@app.get("/api/assets/all")
def get_all_asset_assignments(
    current_user: dict = Depends(get_current_user), 
    status: Optional[str] = None
):
    """
    Tüm zimmet kayıtlarını döndürür (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 All assets request | Admin: {username} | Status filter: {status}")
    
    try:
        assets = asset_repo.get_all(status)
        stats = asset_repo.get_statistics()
        
        return {
            "assets": assets,
            "statistics": stats
        }
    except Exception as e:
        log_error(e, f"Get all assets by admin {username}")
        raise HTTPException(status_code=500, detail="Eşyalar yüklenirken hata oluştu")


@app.post("/api/assets")
def create_asset(
    assignment: AssetAssignmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Yeni zimmet kaydı oluşturur (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    admin_id = current_user.get('user_id')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset creation attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Creating asset | Admin: {username} | Asset: {assignment.asset_name}")
    
    try:
        asset_id = asset_repo.create_assignment(assignment.dict())
        
        if asset_id:
            logger.info(f"✅ Asset created | ID: {asset_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Zimmet kaydı oluşturuldu",
                "asset_id": asset_id
            }
        else:
            raise HTTPException(status_code=500, detail="Zimmet kaydı oluşturulamadı")
    except Exception as e:
        log_error(e, f"Create asset by admin {username}")
        raise HTTPException(status_code=500, detail="Zimmet kaydı oluşturulurken hata oluştu")


@app.put("/api/assets/{asset_id}")
def update_asset(
    asset_id: int,
    update_data: AssetAssignmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Mevcut bir zimmet kaydını günceller (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset update attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Updating asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = asset_repo.update_assignment(asset_id, update_data.dict(exclude_unset=True))
        
        if success:
            logger.info(f"✅ Asset updated | ID: {asset_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Zimmet kaydı güncellendi"
            }
        else:
            raise HTTPException(status_code=404, detail="Zimmet kaydı bulunamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Update asset {asset_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Zimmet kaydı güncellenirken hata oluştu")


@app.post("/api/assets/{asset_id}/return")
def return_asset_endpoint(
    asset_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Zimmetli bir eşyayı iade edildi olarak işaretler (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset return attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Returning asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = asset_repo.return_asset(asset_id)
        
        if success:
            logger.info(f"✅ Asset returned | ID: {asset_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Eşya iade edildi olarak işaretlendi"
            }
        else:
            raise HTTPException(status_code=404, detail="Zimmet kaydı bulunamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Return asset {asset_id} by admin {username}")
        raise HTTPException(status_code=500, detail="İade işlemi sırasında hata oluştu")


@app.delete("/api/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir zimmet kaydını siler (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset deletion attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Deleting asset | ID: {asset_id} | Admin: {username}")
    
    logger.info(f"📦 Deleting asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = asset_repo.delete_assignment(asset_id)
        
        if success:
            logger.info(f"✅ Asset deleted | ID: {asset_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Zimmet kaydı silindi"
            }
        else:
            raise HTTPException(status_code=404, detail="Zimmet kaydı bulunamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Delete asset {asset_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Silme işlemi sırasında hata oluştu")


@app.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Doküman dosyası yükler (Sadece admin).
    Desteklenen formatlar: PDF, DOC, DOCX, JPG, PNG
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized file upload attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    # Dosya tipini doğrula
    allowed_extensions = {'.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'}
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya formatı. İzin verilen: {', '.join(allowed_extensions)}"
        )
    
    # Dosya boyutunu doğrula (maksimum 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to start
    
    if file_size > max_size:
        raise HTTPException(status_code=400, detail="Dosya boyutu maksimum 10MB olabilir")
    
    try:
        # Benzersiz bir dosya adı üret
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Dosyayı diske kaydet
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Erişim URL'sini üret
        file_url = f"/uploads/{safe_filename}"
        
        logger.info(f"📄 File uploaded | Filename: {safe_filename} | User: {username} | Size: {file_size} bytes")
        
        return {
            "success": True,
            "message": "Dosya başarıyla yüklendi",
            "filename": safe_filename,
            "url": file_url,
            "size": file_size
        }
    except Exception as e:
        log_error(e, f"File upload by {username}")
        raise HTTPException(status_code=500, detail="Dosya yüklenirken hata oluştu")


# ==================== ÇALIŞAN YÖNETİMİ ====================

class EmployeeCreate(BaseModel):
    name: str
    email: str
    department: str
    role: str
    phone: Optional[str] = None
    manager: Optional[str] = None
    location: Optional[str] = None
    startDate: str
    status: str = 'active'


class EmployeeNoteCreate(BaseModel):
    note: str


class AnnouncementCreate(BaseModel):
    title: str
    content: str
    category: str
    announcement_date: str


class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    role: Optional[str] = None
    phone: Optional[str] = None
    manager: Optional[int] = None
    location: Optional[str] = None
    startDate: Optional[str] = None
    status: Optional[str] = None


class DocumentApproval(BaseModel):
    approved: bool
    rejection_reason: Optional[str] = None


class EmployeeDocumentCreate(BaseModel):
    title: str
    type: str


@app.get("/api/employees")
def get_employees(current_user: dict = Depends(get_current_user)):
    """
    Tüm çalışanları döndürür (Sadece admin).
    EmployeeManagement ekranında kullanılan çalışan profil listesini sağlar.
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized employee list access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"👥 Employees list request | Admin: {username}")
    
    try:
        employees = user_repo.get_all_employees()
        logger.info(f"✅ Retrieved {len(employees)} employees | Admin: {username}")
        return employees
    except Exception as e:
        log_error(e, f"Get employees by admin {username}")
        raise HTTPException(status_code=500, detail="Çalışan listesi yüklenirken hata oluştu")


@app.get("/api/employees/stats")
def get_employee_statistics(current_user: dict = Depends(get_current_user)):
    """
    Çalışan istatistiklerini döndürür (Sadece admin).
    Toplam çalışan, izinde olanlar, bekleyen belgeler ve onboarding sayılarını içerir.
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized employee stats access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📊 Employee stats request | Admin: {username}")
    
    try:
        stats = user_repo.get_employee_stats()
        logger.info(f"✅ Employee stats retrieved | Admin: {username}")
        return stats
    except Exception as e:
        log_error(e, f"Get employee stats by admin {username}")
        raise HTTPException(status_code=500, detail="İstatistikler yüklenirken hata oluştu")


@app.post("/api/employees")
def create_new_employee(
    employee_data: EmployeeCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Yeni bir çalışan oluşturur (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    admin_id = current_user.get('user_id')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized employee creation attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"👤 Creating employee | Admin: {username} | Name: {employee_data.name}")
    
    try:
        # Zorunlu alanları doğrula
        if not employee_data.name or not employee_data.email or not employee_data.department or not employee_data.role:
            raise HTTPException(status_code=400, detail="Ad, e-posta, departman ve rol zorunludur")
        
        # E-posta formatını doğrula
        if '@' not in employee_data.email:
            raise HTTPException(status_code=400, detail="Geçerli bir e-posta adresi giriniz")
        
        employee_id = user_repo.create_employee(employee_data.dict())
        
        if employee_id:
            logger.info(f"✅ Employee created | ID: {employee_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Çalışan başarıyla oluşturuldu",
                "employee_id": employee_id
            }
        else:
            logger.warning(f"❌ Employee creation failed | Admin: {username}")
            raise HTTPException(status_code=400, detail="Çalışan oluşturulamadı. E-posta veya kullanıcı adı zaten kullanılıyor olabilir.")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Create employee by admin {username}")
        raise HTTPException(status_code=500, detail="Çalışan oluşturulurken hata oluştu")


@app.put("/api/employees/{employee_id}")
def update_employee_info(
    employee_id: int,
    employee_data: EmployeeUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir çalışanın bilgilerini günceller (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized employee update attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"✏️ Updating employee {employee_id} | Admin: {username}")
    
    try:
        success = user_repo.update_employee(employee_id, employee_data.dict(exclude_unset=True))
        
        if success:
            logger.info(f"✅ Employee updated | ID: {employee_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Çalışan bilgileri güncellendi"
            }
        else:
            logger.warning(f"❌ Employee update failed | ID: {employee_id} | Admin: {username}")
            raise HTTPException(status_code=400, detail="Çalışan güncellenemedi. E-posta zaten kullanılıyor olabilir.")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Update employee {employee_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Çalışan güncellenirken hata oluştu")


@app.delete("/api/employees/{employee_id}")
def delete_employee_info(
    employee_id: int,
    deactivate_only: bool = True,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir çalışanı siler veya devre dışı bırakır (Sadece admin).
    deactivate_only=True ise sadece status'u 'terminated' yapar.
    deactivate_only=False ise kullanıcıyı tamamen siler.
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized employee delete attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    # Prevent deleting yourself
    if employee_id == current_user.get('user_id'):
        raise HTTPException(status_code=400, detail="Kendi hesabınızı silemezsiniz")
    
    action = "deactivate" if deactivate_only else "delete"
    logger.info(f"🗑️ {action.capitalize()}ing employee {employee_id} | Admin: {username}")
    
    try:
        success = user_repo.delete_employee(employee_id, deactivate_only)
        
        if success:
            logger.info(f"✅ Employee {action}ed | ID: {employee_id} | Admin: {username}")
            return {
                "success": True,
                "message": f"Çalışan {'devre dışı bırakıldı' if deactivate_only else 'silindi'}"
            }
        else:
            logger.warning(f"❌ Employee {action} failed | ID: {employee_id} | Admin: {username}")
            raise HTTPException(status_code=500, detail=f"Çalışan {action} edilemedi")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"{action.capitalize()} employee {employee_id} by admin {username}")
        raise HTTPException(status_code=500, detail=f"Çalışan {action} edilirken hata oluştu")


@app.post("/api/announcements")
def create_new_announcement(
    announcement_data: AnnouncementCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Yeni bir duyuru oluşturur (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized announcement creation attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📢 Creating announcement | Admin: {username} | Title: {announcement_data.title}")
    
    try:
        if not announcement_data.title or not announcement_data.category:
            raise HTTPException(status_code=400, detail="Başlık ve kategori zorunludur")
        
        
        admin_id = current_user.get('user_id')
        announcement_id = announcement_repo.create(
            title=announcement_data.title,
            content=announcement_data.content or '',
            category=announcement_data.category,
            date=datetime.now().strftime('%Y-%m-%d %H:%M'),
            created_by=admin_id
        )
        
        if announcement_id:
            logger.info(f"✅ Announcement created | ID: {announcement_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Duyuru başarıyla oluşturuldu",
                "announcement_id": announcement_id
            }
        else:
            logger.warning(f"❌ Announcement creation failed | Admin: {username}")
            raise HTTPException(status_code=500, detail="Duyuru oluşturulamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Create announcement by admin {username}")
        raise HTTPException(status_code=500, detail="Duyuru oluşturulurken hata oluştu")


@app.put("/api/announcements/{announcement_id}")
def update_announcement(
    announcement_id: int,
    announcement_data: AnnouncementCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Duyuruyu günceller (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized announcement update attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"✏️ Updating announcement {announcement_id} | Admin: {username}")
    
    try:
        if not announcement_data.title or not announcement_data.category:
            raise HTTPException(status_code=400, detail="Başlık ve kategori zorunludur")
        
        success = announcement_repo.update(
            id=announcement_id,
            title=announcement_data.title,
            content=announcement_data.content or '',
            category=announcement_data.category,
            date=announcement_data.announcement_date
        )
        
        if success:
            logger.info(f"✅ Announcement updated | ID: {announcement_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Duyuru başarıyla güncellendi"
            }
        else:
            logger.warning(f"❌ Announcement update failed | ID: {announcement_id} | Admin: {username}")
            raise HTTPException(status_code=404, detail="Duyuru bulunamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Update announcement {announcement_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Duyuru güncellenirken hata oluştu")


@app.delete("/api/announcements/{announcement_id}")
def delete_announcement(
    announcement_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Duyuruyu siler (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized announcement delete attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"🗑️ Deleting announcement {announcement_id} | Admin: {username}")
    
    try:
        success = announcement_repo.delete(announcement_id)
        
        if success:
            logger.info(f"✅ Announcement deleted | ID: {announcement_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Duyuru silindi"
            }
        else:
            logger.warning(f"❌ Announcement delete failed | ID: {announcement_id} | Admin: {username}")
            raise HTTPException(status_code=404, detail="Duyuru bulunamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Delete announcement {announcement_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Duyuru silinirken hata oluştu")



@app.get("/api/reminders")
def get_reminders_endpoint(current_user: dict = Depends(get_current_user)):
    """
    Admin için hatırlatıcıları döndürür (deneme süresi, doğum günleri, vergi ödemeleri).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    admin_id = current_user.get('user_id')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized reminders access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"🔔 Getting reminders | Admin: {username}")
    
    try:
        reminders = reminder_repo.get_reminders(admin_id)
        logger.info(f"✅ Retrieved {len(reminders)} reminders | Admin: {username}")
        return reminders
    except Exception as e:
        log_error(e, f"Get reminders by admin {username}")
        raise HTTPException(status_code=500, detail="Hatırlatıcılar yüklenirken hata oluştu")





@app.post("/api/employees/{employee_id}/documents")
def upload_document_to_employee(
    employee_id: int,
    document_data: EmployeeDocumentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir çalışana belge kaydı ekler (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    admin_id = current_user.get('user_id')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized document upload attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    if not document_data.title or not document_data.title.strip():
        raise HTTPException(status_code=400, detail="Belge başlığı gerekli")
    
    if document_data.type not in ['contract', 'performance', 'discipline', 'other']:
        raise HTTPException(status_code=400, detail="Geçersiz belge tipi")
    
    logger.info(f"📄 Uploading document to employee {employee_id} | Admin: {username} | Title: {document_data.title}")
    
    try:
        doc_id = doc_repo.upload(
            employee_id=employee_id,
            title=document_data.title.strip(),
            doc_type=document_data.type,
            uploaded_by=admin_id
        )
        
        if doc_id:
            logger.info(f"✅ Document uploaded | Doc ID: {doc_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Belge yükleme kuyruğuna alındı",
                "document_id": doc_id
            }
        else:
            logger.warning(f"❌ Document upload failed | Employee ID: {employee_id} | Admin: {username}")
            raise HTTPException(status_code=500, detail="Belge yüklenemedi. employee_documents tablosu mevcut olmayabilir.")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Upload document to employee {employee_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Belge yüklenirken hata oluştu")


@app.put("/api/employees/{employee_id}/documents/{document_id}")
def update_document(
    employee_id: int,
    document_id: int,
    document_data: EmployeeDocumentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir belge kaydını günceller (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized document update attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    if not document_data.title or not document_data.title.strip():
        raise HTTPException(status_code=400, detail="Belge başlığı gerekli")
    
    if document_data.type not in ['contract', 'performance', 'discipline', 'other']:
        raise HTTPException(status_code=400, detail="Geçersiz belge tipi")
    
    logger.info(f"📝 Updating document {document_id} for employee {employee_id} | Admin: {username}")
    
    try:
        success = doc_repo.update(document_id, {
            "title": document_data.title.strip(),
            "type": document_data.type
        })
        
        if success:
            logger.info(f"✅ Document updated | Doc ID: {document_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Belge güncellendi"
            }
        else:
            logger.warning(f"❌ Document update failed | Doc ID: {document_id} | Admin: {username}")
            raise HTTPException(status_code=500, detail="Belge güncellenemedi")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Update document {document_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Belge güncellenirken hata oluştu")


@app.delete("/api/employees/{employee_id}/documents/{document_id}")
def delete_document(
    employee_id: int,
    document_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir belge kaydını siler (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized document delete attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"🗑️ Deleting document {document_id} for employee {employee_id} | Admin: {username}")
    
    try:
        success = doc_repo.delete(document_id)
        
        if success:
            logger.info(f"✅ Document deleted | Doc ID: {document_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Belge silindi"
            }
        else:
            logger.warning(f"❌ Document delete failed | Doc ID: {document_id} | Admin: {username}")
            raise HTTPException(status_code=500, detail="Belge silinemedi")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Delete document {document_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Belge silinirken hata oluştu")




@app.put("/api/employees/{employee_id}/documents/{document_id}/approve")
def approve_document(
    employee_id: int,
    document_id: int,
    approval_data: DocumentApproval,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir belgeyi onaylar veya reddeder (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    admin_id = current_user.get('user_id')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized document approval attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    if not approval_data.approved and not approval_data.rejection_reason:
        raise HTTPException(status_code=400, detail="Reddedilen belgeler için red nedeni gerekli")
    
    action = "approve" if approval_data.approved else "reject"
    logger.info(f"✅ {action.capitalize()}ing document {document_id} for employee {employee_id} | Admin: {username}")
    
    try:
        success = doc_repo.approve(
            document_id=document_id,
            approved_by=admin_id,
            approved=approval_data.approved,
            rejection_reason=approval_data.rejection_reason
        )
        
        if success:
            logger.info(f"✅ Document {action}d | Doc ID: {document_id} | Admin: {username}")
            return {
                "success": True,
                "message": f"Belge {'onaylandı' if approval_data.approved else 'reddedildi'}"
            }
        else:
            logger.warning(f"❌ Document {action} failed | Doc ID: {document_id} | Admin: {username}")
            raise HTTPException(status_code=500, detail=f"Belge {action} edilemedi")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"{action.capitalize()} document {document_id} by admin {username}")
        raise HTTPException(status_code=500, detail=f"Belge {action} edilirken hata oluştu")


# ==================== CALENDAR & REMINDERS ENDPOINTS ====================

class PersonalReminderCreate(BaseModel):
    title: str
    date: str

class PersonalReminderUpdate(BaseModel):
    is_completed: bool

@app.get("/api/reminders/personal")
def get_personal_reminders_endpoint(current_user: dict = Depends(get_current_user)):
    """
    Kullanıcının kişisel hatırlatıcılarını getirir
    """
    user_id = current_user.get('user_id')
    return reminder_repo.get_personal(user_id)

@app.post("/api/reminders/personal")
def create_personal_reminder_endpoint(
    reminder: PersonalReminderCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Yeni kişisel hatırlatıcı oluşturur
    """
    user_id = current_user.get('user_id')
    reminder_id = reminder_repo.create_personal(user_id, reminder.title, reminder.date)
    if reminder_id:
        return {"success": True, "id": reminder_id}
    else:
        raise HTTPException(status_code=500, detail="Hatırlatıcı oluşturulamadı")

@app.put("/api/reminders/personal/{reminder_id}")
def update_personal_reminder_endpoint(
    reminder_id: int,
    status: PersonalReminderUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Hatırlatıcı durumunu günceller (tamamlandı/tamamlanmadı)
    """
    success = reminder_repo.update_status(reminder_id, status.is_completed)
    if success:
        return {"success": True}
    else:
        raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")

@app.delete("/api/reminders/personal/{reminder_id}")
def delete_personal_reminder_endpoint(
    reminder_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Hatırlatıcıyı siler
    """
    success = reminder_repo.delete(reminder_id)
    if success:
        return {"success": True}
    else:
        raise HTTPException(status_code=404, detail="Hatırlatıcı bulunamadı")

@app.get("/api/events/upcoming")
def get_upcoming_events_endpoint(current_user: dict = Depends(get_current_user)):
    """
    Yaklaşan doğum günleri ve iş yıldönümlerini getirir
    """
    return user_repo.get_upcoming_events()

@app.get("/api/calendar/events")
def get_calendar_events_endpoint(current_user: dict = Depends(get_current_user)):
    """
    Takvim etkinliklerini getirir (İzinler ve Hatırlatıcılar)
    """
    user_id = current_user.get('user_id')
    
    try:
        # Get leaves
        leaves = leave_repo.get_requests(user_id, status='approved')
        
        # Get personal reminders
        reminders = reminder_repo.get_personal(user_id)
        
        # Format for FullCalendar
        events = []
        
        for leave in leaves:
            # Yapıya göre startDate / start_date kontrolü
            start = leave.get('startDate') or leave.get('start_date')
            end = leave.get('endDate') or leave.get('end_date')
            
            events.append({
                "id": f"leave-{leave['id']}",
                "title": f"İzin: {leave['leaveType']}",
                "start": start,
                "end": end,
                "backgroundColor": "#F59E0B", # Amber
                "borderColor": "#D97706",
                "extendedProps": {
                    "type": "leave"
                }
            })
            
        for reminder in reminders:
            events.append({
                "id": f"reminder-{reminder['id']}",
                "title": reminder['title'],
                "start": reminder['date'],
                "backgroundColor": "#3B82F6", # Blue
                "borderColor": "#2563EB",
                "extendedProps": {
                    "type": "reminder",
                    "isCompleted": reminder.get('isCompleted')
                }
            })
            
        return events
    except Exception as e:
        log_error(e, "Get calendar events")
        return []

@app.get("/api/users")
def get_users(current_user: dict = Depends(get_current_user)):
    """
    Tüm kullanıcıları döndürür (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized users list access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"👥 Users list request | Admin: {username}")
    
    try:
        users = get_all_users()
        logger.info(f"✅ Retrieved {len(users)} users | Admin: {username}")
        return users
    except Exception as e:
        log_error(e, f"Get users by admin {username}")
        raise HTTPException(status_code=500, detail="Kullanıcı listesi yüklenirken hata oluştu")


class AdminUserCreate(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    department: Optional[str] = None


@app.post("/api/users/admin")
def create_admin(
    user_data: AdminUserCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Yeni bir admin kullanıcı oluşturur (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized admin creation attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"👤 Creating admin user | Admin: {username} | New user: {user_data.username}")
    
    try:
        if not user_data.username or not user_data.email or not user_data.password:
            raise HTTPException(status_code=400, detail="Kullanıcı adı, e-posta ve şifre zorunludur")
        
        admin_id = create_admin_user(
            username=user_data.username,
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            department=user_data.department
        )
        
        if admin_id:
            logger.info(f"✅ Admin user created | ID: {admin_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Admin kullanıcı oluşturuldu",
                "user_id": admin_id
            }
        else:
            logger.warning(f"❌ Admin creation failed | Admin: {username}")
            raise HTTPException(status_code=400, detail="Admin oluşturulamadı. Kullanıcı adı veya e-posta zaten kullanılıyor olabilir.")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Create admin by admin {username}")
        raise HTTPException(status_code=500, detail="Admin oluşturulurken hata oluştu")


class UserRoleUpdate(BaseModel):
    user_role: str


@app.put("/api/users/{user_id}/role")
def update_role(
    user_id: int,
    role_data: UserRoleUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir kullanıcının rolünü günceller (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized role update attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    if role_data.user_role not in ['admin', 'employee']:
        raise HTTPException(status_code=400, detail="Geçersiz rol. 'admin' veya 'employee' olmalıdır.")
    
    logger.info(f"🔄 Updating user role | User ID: {user_id} | New role: {role_data.user_role} | Admin: {username}")
    
    try:
        success = update_user_role(user_id, role_data.user_role)
        
        if success:
            logger.info(f"✅ User role updated | User ID: {user_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Kullanıcı rolü güncellendi"
            }
        else:
            logger.warning(f"❌ Role update failed | User ID: {user_id} | Admin: {username}")
            raise HTTPException(status_code=500, detail="Rol güncellenemedi")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Update role by admin {username}")
        raise HTTPException(status_code=500, detail="Rol güncellenirken hata oluştu")


class PasswordReset(BaseModel):
    new_password: str


@app.put("/api/users/{user_id}/password")
def reset_password(
    user_id: int,
    password_data: PasswordReset,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir kullanıcının şifresini sıfırlar (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized password reset attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    if not password_data.new_password or len(password_data.new_password) < 6:
        raise HTTPException(status_code=400, detail="Şifre en az 6 karakter olmalıdır")
    
    logger.info(f"🔐 Resetting password | User ID: {user_id} | Admin: {username}")
    
    try:
        success = reset_user_password(user_id, password_data.new_password)
        
        if success:
            logger.info(f"✅ Password reset | User ID: {user_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Şifre sıfırlandı"
            }
        else:
            logger.warning(f"❌ Password reset failed | User ID: {user_id} | Admin: {username}")
            raise HTTPException(status_code=500, detail="Şifre sıfırlanamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Reset password by admin {username}")
        raise HTTPException(status_code=500, detail="Şifre sıfırlanırken hata oluştu")


# ==================== DEPARTMENT MANAGEMENT ENDPOINTS ====================

@app.get("/api/departments")
def get_departments(current_user: dict = Depends(get_current_user)):
    """
    Tüm departmanları döndürür (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized departments access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    try:
        departments = get_all_departments()
        return departments
    except Exception as e:
        log_error(e, f"Get departments by admin {username}")
        raise HTTPException(status_code=500, detail="Departmanlar yüklenirken hata oluştu")


# ==================== SYSTEM SETTINGS ENDPOINTS ====================

@app.get("/api/settings")
def get_settings(current_user: dict = Depends(get_current_user)):
    """
    Sistem ayarlarını döndürür (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized settings access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    try:
        settings = get_system_settings()
        return settings
    except Exception as e:
        log_error(e, f"Get settings by admin {username}")
        raise HTTPException(status_code=500, detail="Ayarlar yüklenirken hata oluştu")


@app.put("/api/settings")
def update_settings(
    settings_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Sistem ayarlarını günceller (Sadece admin).
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized settings update attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"⚙️ Updating settings | Admin: {username}")
    
    try:
        success = update_system_settings(settings_data)
        
        if success:
            logger.info(f"✅ Settings updated | Admin: {username}")
            return {
                "success": True,
                "message": "Ayarlar güncellendi"
            }
        else:
            raise HTTPException(status_code=500, detail="Ayarlar güncellenemedi")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Update settings by admin {username}")
        raise HTTPException(status_code=500, detail="Ayarlar güncellenirken hata oluştu")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

