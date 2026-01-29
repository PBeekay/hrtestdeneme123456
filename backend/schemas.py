from pydantic import BaseModel
from typing import List, Optional

# ==================== USER MODELS ====================

class BaseUser(BaseModel):
    """
    Temel kullanıcı sınıfı - Tüm kullanıcı rollerinde ortak olan özellikler
    """
    name: str
    email: str
    role: str
    avatar: Optional[str] = None
    tcNo: Optional[str] = None
    startDate: Optional[str] = None
    
    def has_permission(self, permission: str) -> bool:
        """Temel yetki kontrolü"""
        return False

class EmployeeUser(BaseUser):
    """
    Çalışan sınıfı - Sadece çalışanlara özel alanlar ve yetkiler
    """
    department: str
    
    def has_permission(self, permission: str) -> bool:
        # Çalışanlar sadece temel izinlere sahiptir
        return permission in ["create_leave_request", "view_own_data"]

class AdminUser(BaseUser):
    """
    Yönetici sınıfı - Yönetimsel yetkiler
    """
    department: str
    admin_level: int = 1
    
    def has_permission(self, permission: str) -> bool:
        # Yöneticiler her yetkiye sahiptir
        return True

# Geriye dönük uyumluluk için UserInfo şimdilik EmployeeUser yapısını kullanabilir
class UserInfo(EmployeeUser):
    pass


# ==================== USER MANAGEMENT MODELS ====================

class CreateAdminRequest(BaseModel):
    username: str
    email: str
    password: str
    full_name: str
    department: Optional[str] = "İK"

class CreateEmployeeRequest(BaseModel):
    name: str
    email: str
    department: str
    role: str
    startDate: str
    phone: Optional[str] = None
    location: Optional[str] = None
    manager: Optional[str] = None
    status: Optional[str] = "active"
    password: Optional[str] = None
    user_role: Optional[str] = "employee"
    permissions: Optional[List[str]] = None

class UpdateUserRoleRequest(BaseModel):
    user_role: str

class UpdateUserPasswordRequest(BaseModel):
    new_password: str


# ==================== DASHBOARD MODELS ====================

class LeaveBalance(BaseModel):
    annual: int
    sick: int
    personal: int
    paternity: int = 5
    maternity: int = 112  # 16 weeks * 7 days
    marriage: int = 3
    death: int = 3


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


class WidgetConfig(BaseModel):
    widgetType: str
    position: int
    isVisible: bool = True


# ==================== AUTH MODELS ====================

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


# ==================== LEAVE MODELS ====================

class LeaveRequestCreate(BaseModel):
    leaveType: str
    startDate: str
    endDate: str
    totalDays: float
    reason: str


# ==================== ASSET MODELS ====================

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


class MonitorTarget(BaseModel):
    target_id: int
    name: str
    url: str
    status: str
    latency_ms: float
    last_check: str
    history_preview: List[float]

