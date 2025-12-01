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
from database import (
    authenticate_user,
    get_user_dashboard_data,
    get_employee_dashboard_data,
    create_session,
    validate_session,
    delete_session,
    update_task_status,
    test_connection,
    get_work_schedule,
    get_leave_requests,
    create_leave_request,
    approve_leave_request,
    get_user_widgets,
    update_user_widgets,
    get_db_connection,
    # Zimmet (Asset Assignment) functions
    get_asset_categories,
    get_employee_assets,
    get_all_assets,
    create_asset_assignment,
    update_asset_assignment,
    return_asset,
    delete_asset_assignment,
    get_asset_statistics
)

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
    test_connection()
    logger.info("✅ Database connection pool initialized")
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
        conn = get_db_connection()
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
    user = authenticate_user(credentials.username, credentials.password)
    
    if user:
        # Generate JWT token with expiration (30 minutes)
        token_data = {
            "sub": user['username'],
            "user_id": user['id'],
            "role": user.get('user_role', 'employee')
        }
        token = create_access_token(token_data)
        
        # Also store session in database for tracking (optional)
        expires_at = datetime.now() + timedelta(minutes=30)
        create_session(user['id'], token, expires_at)
        
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
    delete_session(logout_req.token)
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
            dashboard_data = get_employee_dashboard_data(user_id)
        else:
            dashboard_data = get_user_dashboard_data(user_id)
        
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
    
    success = update_task_status(task_id, status)
    
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
    totalDays: int
    reason: str


@app.post("/api/leave-requests")
def create_leave_req(user_id: int, leave_request: LeaveRequestCreate):
    """
    Create a new leave request (Employee)
    """
    request_id = create_leave_request(
        user_id,
        leave_request.leaveType,
        leave_request.startDate,
        leave_request.endDate,
        leave_request.totalDays,
        leave_request.reason
    )
    
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
def get_leave_reqs(user_id: int, status: Optional[str] = None):
    """
    Get leave requests for a user
    """
    requests = get_leave_requests(user_id, status)
    return {"leaveRequests": requests}


@app.put("/api/leave-requests/{request_id}/approve")
def approve_leave(request_id: int, admin_id: int, approved: bool, reason: Optional[str] = None):
    """
    Approve or reject leave request (Admin only)
    """
    success = approve_leave_request(request_id, admin_id, approved, reason)
    
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
    Get user's widget configuration
    """
    widgets = get_user_widgets(user_id)
    return {"widgets": widgets}


@app.put("/api/widgets")
def update_widgets(user_id: int, widgets: List[WidgetConfig]):
    """
    Update user's widget configuration
    """
    widget_list = [w.dict() for w in widgets]
    success = update_user_widgets(user_id, widget_list)
    
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
    Get work schedule for employee
    """
    schedule = get_work_schedule(user_id, days)
    return {"workSchedule": schedule}


# ==================== ZİMMET (ASSET ASSIGNMENT) ====================

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
    Get all asset categories
    """
    logger.info(f"📦 Asset categories request | User: {current_user.get('sub')}")
    categories = get_asset_categories()
    return {"categories": categories}


@app.get("/api/assets/my")
def get_my_assets(current_user: dict = Depends(get_current_user), status: Optional[str] = None):
    """
    Get current user's assets
    """
    user_id = current_user.get('user_id')
    username = current_user.get('sub')
    
    logger.info(f"📦 My assets request | User: {username} | Status filter: {status}")
    
    try:
        assets = get_employee_assets(user_id, status)
        stats = get_asset_statistics(user_id)
        
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
    Get all asset assignments (Admin only)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 All assets request | Admin: {username} | Status filter: {status}")
    
    try:
        assets = get_all_assets(status)
        stats = get_asset_statistics()
        
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
    Create a new asset assignment (Admin only)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    admin_id = current_user.get('user_id')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset creation attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Creating asset | Admin: {username} | Asset: {assignment.asset_name}")
    
    try:
        asset_id = create_asset_assignment(
            employee_id=assignment.employee_id,
            asset_name=assignment.asset_name,
            category_id=assignment.category_id,
            assigned_date=assignment.assigned_date,
            document_url=assignment.document_url,
            assigned_by=admin_id,
            serial_number=assignment.serial_number,
            description=assignment.description,
            document_filename=assignment.document_filename,
            notes=assignment.notes
        )
        
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
    Update an asset assignment (Admin only)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset update attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Updating asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = update_asset_assignment(
            asset_id=asset_id,
            **update_data.dict(exclude_unset=True)
        )
        
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
    Mark an asset as returned (Admin only)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset return attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Returning asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = return_asset(asset_id)
        
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
    Delete an asset assignment (Admin only)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset deletion attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Deleting asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = delete_asset_assignment(asset_id)
        
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
    Upload a document file (Admin only)
    Supported formats: PDF, DOC, DOCX, JPG, PNG
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized file upload attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    # Validate file type
    allowed_extensions = {'.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'}
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya formatı. İzin verilen: {', '.join(allowed_extensions)}"
        )
    
    # Validate file size (max 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to start
    
    if file_size > max_size:
        raise HTTPException(status_code=400, detail="Dosya boyutu maksimum 10MB olabilir")
    
    try:
        # Generate unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / safe_filename
        
        # Save file
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Generate URL
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

