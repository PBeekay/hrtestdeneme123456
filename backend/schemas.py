from pydantic import BaseModel, ConfigDict, Field, computed_field
from typing import List, Optional
from datetime import datetime

# ==================== ORTAK ====================


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginResponse(BaseModel):
    success: bool
    message: str
    token: str
    user_id: int
    user_role: str


# ==================== KULLANICILAR ====================

class UserBase(BaseModel):
    username: str
    email: str
    full_name: str
    is_active: Optional[bool] = True


class UserCreate(UserBase):
    password: str
    type: str = "employee" # employee, manager, assistant_manager


class UserUpdate(BaseModel):
    email: Optional[str] = None
    full_name: Optional[str] = None
    password: Optional[str] = None
    avatar: Optional[str] = None


class UserResponse(UserBase):
    id: int
    avatar: Optional[str] = None
    created_at: datetime
    type: str # discriminator

    @computed_field
    def name(self) -> str:
        return self.full_name

    @computed_field
    def role(self) -> str:
        return self.type

    model_config = ConfigDict(from_attributes=True)

# ==================== ÇALIŞANLAR ====================


class EmployeeBase(UserBase):
    department: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None


class EmployeeCreate(EmployeeBase):
    password: str
    manager_id: Optional[int] = None
    start_date: Optional[datetime] = None


class EmployeeResponse(UserResponse):
    department: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    start_date: Optional[datetime] = None
    manager_id: Optional[int] = None

    model_config = ConfigDict(from_attributes=True)

# ==================== GÖREVLER ====================


class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"
    due_date: Optional[datetime] = None


class TaskCreate(TaskBase):
    user_id: int


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    due_date: Optional[datetime] = None


class TaskResponse(TaskBase):
    id: int
    status: str
    created_at: datetime
    user_id: int

    model_config = ConfigDict(from_attributes=True)

# ==================== İZİNLER ====================


class LeaveRequestBase(BaseModel):
    leave_type: str
    start_date: datetime
    end_date: datetime
    total_days: float
    reason: Optional[str] = None


class LeaveRequestCreate(LeaveRequestBase):
    pass


class LeaveRequestUpdate(BaseModel):
    status: str
    rejection_reason: Optional[str] = None


class LeaveRequestResponse(LeaveRequestBase):
    id: int
    user_id: int
    status: str
    created_at: datetime
    rejection_reason: Optional[str] = None
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)

# ==================== VARLIKLAR ====================


class AssetCategoryBase(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None


class AssetCategoryCreate(AssetCategoryBase):
    pass


class AssetCategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    icon: Optional[str] = None


class AssetCategoryResponse(AssetCategoryBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


class EmployeeAssetBase(BaseModel):
    asset_name: str
    serial_number: Optional[str] = None
    description: Optional[str] = None
    status: str = "active"


class EmployeeAssetCreate(EmployeeAssetBase):
    employee_id: int
    category_id: int
    notes: Optional[str] = None


class EmployeeAssetUpdate(BaseModel):
    asset_name: Optional[str] = None
    serial_number: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None
    employee_id: Optional[int] = None
    category_id: Optional[int] = None
    return_date: Optional[datetime] = None
    notes: Optional[str] = None


class EmployeeAssetResponse(EmployeeAssetBase):
    id: int
    employee_id: int
    category_id: int
    assigned_date: datetime
    return_date: Optional[datetime] = None
    document_url: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)

# ==================== DUYURULAR ====================


class AnnouncementBase(BaseModel):
    title: str
    content: str
    category: str


class AnnouncementCreate(AnnouncementBase):
    pass


class AnnouncementResponse(AnnouncementBase):
    id: int
    created_by: Optional[int] = None
    announcement_date: datetime
    is_active: bool

    model_config = ConfigDict(from_attributes=True)


class Izin(BaseModel):
    id: int
    tip: str = Field(validation_alias="leave_type")
    baslangic: datetime = Field(validation_alias="start_date")
    bitis: datetime = Field(validation_alias="end_date")
    durum: str = Field(validation_alias="status")
    
    model_config = ConfigDict(from_attributes=True)


# ==================== DASHBOARD ====================


class LeaveBalance(BaseModel):
    annual: float
    sick: float
    personal: float


class PerformanceMetric(BaseModel):
    label: str
    value: int
    maxValue: int


class DashboardData(BaseModel):
    userInfo: UserResponse
    leaveBalance: LeaveBalance
    pendingTasks: List[TaskResponse]
    performance: List[PerformanceMetric]
    announcements: List[AnnouncementResponse]
    leaveRequests: Optional[List[LeaveRequestResponse]] = None
    employees: Optional[List[EmployeeResponse]] = None
    employeeStats: Optional[dict] = None


Announcement = AnnouncementResponse


class TemelKullanici(BaseModel):
    id: int
    tip: str = Field(validation_alias="type")
    ad: Optional[str] = Field(validation_alias="first_name")
    soyad: Optional[str] = Field(validation_alias="last_name")
    departman: Optional[str] = Field(validation_alias="department")
    maas: Optional[float] = Field(validation_alias="salary")
    ise_baslama_tarihi: Optional[datetime] = Field(validation_alias="start_date")
    izinler: List[Izin] = Field(default_factory=list, validation_alias="leave_requests")

    model_config = ConfigDict(from_attributes=True)


class FirmaSahibi(TemelKullanici):
    hisse_orani: float = Field(validation_alias="share_rate")


class IKYonetici(TemelKullanici):
    ik_sertifika_no: str = Field(validation_alias="hr_cert_no")


class Personel(TemelKullanici):
    pass
