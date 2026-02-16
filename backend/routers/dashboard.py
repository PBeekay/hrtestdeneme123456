from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from dependencies import get_db, get_current_active_user
from repositories.leave_repo import leave_repo
from repositories.task_repo import task_repo
from repositories.user_repo import user_repo
from models import User
from schemas import DashboardData, LeaveBalance, PerformanceMetric, Announcement

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"]
)

@router.get("/", response_model=DashboardData)
def get_dashboard_data(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Mock Veri Yapısı
    # Veri Çekme İşlemi
    
    # İzin Bakiyesi
    # İzin İlişkisi Kontrolü
    lb = current_user.leave_balance if hasattr(current_user, 'leave_balance') and current_user.leave_balance else None
    leave_balance = LeaveBalance(
        annual=lb.annual_leave if lb else 0,
        sick=lb.sick_leave if lb else 0,
        personal=lb.personal_leave if lb else 0
    )

    # Görevler
    tasks = task_repo.get_multi_by_owner(db, user_id=current_user.id, limit=5)
    
    # Performans
    performance = [
        PerformanceMetric(label="Verimlilik", value=85, maxValue=100),
        PerformanceMetric(label="Devamlılık", value=95, maxValue=100)
    ]
    
    # Duyurular
    announcements = [] # Duyuru Reposu Eklenecek
    
    # İzin Talepleri ve Çalışanlar
    leave_requests = []
    employees = []
    employee_stats = None

    if current_user.type in ['manager', 'admin', 'assistant_manager', 'boss']:
        # Yönetici ise tüm izin taleplerini ve çalışanları görebilir
        leave_requests = leave_repo.get_multi(db, limit=5)
        # Tüm kullanıcıları çekiyoruz ama sadece tip kontrolü yapıp employee olanları filtreleyebiliriz veya direkt dönebiliriz
        # Şimdilik user_repo.get_multi kullanıyoruz
        all_users = user_repo.get_multi(db, limit=10)
        employees = all_users # Frontend UserResponse bekliyor, EmployeeResponse UserResponse'dan türüyor
        
        # İstatistikler (Mock veya gerçek count metodu varsa)
        # BaseRepository'de count metodu olmayabilir, len() alabiliriz veya implemente edebiliriz
        # Şimdilik basitçe len() kullanıyoruz veya mock
        employee_stats = {
            "totalEmployees": len(all_users),
            "onLeave": 0, # İzin repo'dan çekilebilir
            "pendingDocuments": 0,
            "onboarding": 0
        }
    else:
        # Çalışan ise sadece kendi izin taleplerini görür
        leave_requests = leave_repo.get_by_user(db, user_id=current_user.id, limit=5)

    return DashboardData(
        userInfo=current_user,
        leaveBalance=leave_balance,
        pendingTasks=tasks,
        performance=performance,
        announcements=announcements,
        leaveRequests=leave_requests,
        employees=employees,
        employeeStats=employee_stats
    )
