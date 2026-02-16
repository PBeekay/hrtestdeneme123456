from datetime import datetime
from typing import List, Optional
from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, ForeignKey, Text, Enum, JSON
from sqlalchemy.orm import relationship, Mapped, mapped_column, DeclarativeBase
from sqlalchemy.sql import func
from db import Base

class User(Base):
    """
    Tüm sistem kullanıcıları için ortak özellikleri içeren temel Kullanıcı sınıfı.
    'type' ayrıştırıcısı ile Joined Table Inheritance uygular.
    """
    __tablename__ = 'users'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(100), nullable=False)
    first_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # Ad
    last_name: Mapped[Optional[str]] = mapped_column(String(50), nullable=True) # Soyad
    salary: Mapped[Optional[float]] = mapped_column(Float, nullable=True) # Maaş
    avatar: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), onupdate=func.now(), nullable=True)
    type: Mapped[str] = mapped_column(String(50))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Ortak İlişkiler
    tasks: Mapped[List["Task"]] = relationship("Task", back_populates="user", foreign_keys="Task.user_id")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
    widgets: Mapped[List["DashboardWidget"]] = relationship("DashboardWidget", back_populates="user", cascade="all, delete-orphan")
    leave_requests: Mapped[List["LeaveRequest"]] = relationship("LeaveRequest", back_populates="user", foreign_keys="LeaveRequest.user_id")
    
    __mapper_args__ = {
        "polymorphic_identity": "user",
        "polymorphic_on": type,
    }

class Owner(User):
    """
    Firma Sahibi Modeli
    """
    __tablename__ = 'owners'

    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    share_rate: Mapped[float] = mapped_column(Float, default=0.0) # Hisse Oranı

    __mapper_args__ = {
        "polymorphic_identity": "firma_sahibi",
    }

class HRManager(User):
    """
    İK Yöneticisi Modeli
    """
    __tablename__ = 'hr_managers'

    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    hr_cert_no: Mapped[str] = mapped_column(String(50), nullable=True) # İK Sertifika No

    __mapper_args__ = {
        "polymorphic_identity": "ik_yönetici",
    }

class Employee(User):
    """
    Çalışan Modeli
    """
    __tablename__ = 'employees'

    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    start_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    phone: Mapped[Optional[str]] = mapped_column(String(20), nullable=True)
    location: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    manager_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)

    # İlişkiler
    manager: Mapped[Optional["User"]] = relationship("User", remote_side="User.id", foreign_keys=[manager_id])
    assets: Mapped[List["EmployeeAsset"]] = relationship("EmployeeAsset", back_populates="employee", foreign_keys="EmployeeAsset.employee_id")
    work_schedules: Mapped[List["WorkSchedule"]] = relationship("WorkSchedule", back_populates="employee")
    leave_balance: Mapped["LeaveBalance"] = relationship("LeaveBalance", uselist=False, back_populates="employee")

    __mapper_args__ = {
        "polymorphic_identity": "personel",
        "inherit_condition": (id == User.id),
    }

class Manager(User):
    """
    Yönetici Modeli (Eski/Legacy)
    """
    __tablename__ = 'managers'

    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    admin_level: Mapped[int] = mapped_column(Integer, default=1)

    # İlişkiler
    
    __mapper_args__ = {
        "polymorphic_identity": "manager",
    }

class AssistantManager(User):
    """
    Yönetici Yardımcısı Modeli
    """
    __tablename__ = 'assistant_managers'

    id: Mapped[int] = mapped_column(ForeignKey("users.id"), primary_key=True)
    department: Mapped[str] = mapped_column(String(100), nullable=True)
    
    __mapper_args__ = {
        "polymorphic_identity": "assistant_manager",
    }

class Task(Base):
    """
    Kullanıcıya atanan görev varlığı (Task entity).
    """
    __tablename__ = 'tasks'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(Enum('low', 'medium', 'high', name='priority_enum'), default='medium')
    status: Mapped[str] = mapped_column(Enum('pending', 'in_progress', 'completed', name='status_enum'), default='pending')
    due_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    user: Mapped["User"] = relationship("User", back_populates="tasks")

class LeaveRequest(Base):
    """
    Bir çalışan tarafından yapılan izin talebi (Leave request).
    """
    __tablename__ = 'leave_requests'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    leave_type: Mapped[str] = mapped_column(String(50), nullable=False)
    start_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    end_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    total_days: Mapped[float] = mapped_column(Float, nullable=False)
    reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(Enum('pending', 'approved', 'rejected', name='leave_status_enum'), default='pending')
    rejection_reason: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    approved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    approved_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="leave_requests", foreign_keys=[user_id])
    approver: Mapped[Optional["User"]] = relationship("User", foreign_keys=[approved_by])

class LeaveBalance(Base):
    """
    Bir çalışanın belirli bir yıldaki izin bakiyelerini takip eder.
    """
    __tablename__ = 'leave_balance'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False, unique=False) # Yıl bazlı benzersizlik
    year: Mapped[int] = mapped_column(Integer, nullable=False, default=2025)
    annual_leave: Mapped[int] = mapped_column(Integer, default=15)
    sick_leave: Mapped[int] = mapped_column(Integer, default=10)
    personal_leave: Mapped[int] = mapped_column(Integer, default=3)
    
    employee: Mapped["Employee"] = relationship("Employee", back_populates="leave_balance")

class Announcement(Base):
    """
    Sistem genelinde veya özel kategorili duyurular (Announcements).
    """
    __tablename__ = 'announcements'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    created_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    announcement_date: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, onupdate=func.now(), nullable=True)

    author: Mapped[Optional["User"]] = relationship("User")

class DashboardWidget(Base):
    """
    Kullanıcılar için gösterge paneli widget tercihleri.
    """
    __tablename__ = 'dashboard_widgets'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    widget_type: Mapped[str] = mapped_column(String(50), nullable=False)
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_visible: Mapped[bool] = mapped_column(Boolean, default=True)
    settings: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)

    user: Mapped["User"] = relationship("User", back_populates="widgets")

class AssetCategory(Base):
    """
    Şirket varlıkları için kategoriler (Categories for company assets).
    """
    __tablename__ = 'asset_categories'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    icon: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    assets: Mapped[List["EmployeeAsset"]] = relationship("EmployeeAsset", back_populates="category")

class EmployeeAsset(Base):
    """
    Çalışanlara atanan varlıklar (Assets assigned to employees).
    """
    __tablename__ = 'employee_assets'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    category_id: Mapped[int] = mapped_column(ForeignKey("asset_categories.id"), nullable=False)
    asset_name: Mapped[str] = mapped_column(String(100), nullable=False)
    serial_number: Mapped[Optional[str]] = mapped_column(String(100), nullable=True)
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    assigned_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    assigned_date: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    return_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default='active')
    document_url: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    document_filename: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    notes: Mapped[Optional[str]] = mapped_column(Text, nullable=True)

    employee: Mapped["Employee"] = relationship("Employee", back_populates="assets", foreign_keys=[employee_id])
    category: Mapped["AssetCategory"] = relationship("AssetCategory", back_populates="assets")
    assigner: Mapped[Optional["User"]] = relationship("User", foreign_keys=[assigned_by])

class WorkSchedule(Base):
    """
    Çalışma takvimi ve devam kayıtları (Work schedule and attendance records).
    """
    __tablename__ = 'work_schedule'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("employees.id"), nullable=False)
    work_date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    check_in: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    check_out: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    total_hours: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default='present')

    employee: Mapped["Employee"] = relationship("Employee", back_populates="work_schedules")

class Notification(Base):
    """
    Kullanıcı bildirimleri (User notifications).
    """
    __tablename__ = 'notifications'

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    title: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    
    user: Mapped["User"] = relationship("User", back_populates="notifications")

class AuditLog(Base):
    """
    Sistem eylemleri için denetim kayıtları (Audit logs for system actions).
    """
    __tablename__ = 'audit_logs'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

class Session(Base):
    """
    Aktif kullanıcı oturumları (Active user sessions).
    """
    __tablename__ = 'sessions'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    token: Mapped[str] = mapped_column(String(500), unique=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

class Reminder(Base):
    """
    Sistem hatırlatıcıları (System reminders).
    """
    __tablename__ = 'reminders'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    date: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

class Document(Base):
    """
    Doküman kayıtları (Document records).
    """
    __tablename__ = 'documents'
    
    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    file_path: Mapped[str] = mapped_column(String(500), nullable=False)
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
