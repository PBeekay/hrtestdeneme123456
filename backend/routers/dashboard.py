from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional

from dependencies import (
    get_current_user,
    dashboard_repo,
    schedule_repo,
    user_repo
)
from logger import logger, log_error
from schemas import DashboardData, WidgetConfig

router = APIRouter(tags=["Dashboard"])

@router.get("/api/dashboard")
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


@router.get("/api/widgets")
def get_widgets(user_id: int):
    """
    Kullanıcının widget yapılandırmasını döndürür
    """
    widgets = dashboard_repo.get_widgets(user_id)
    return {"widgets": widgets}


@router.put("/api/widgets")
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


@router.get("/api/work-schedule")
def get_work_sched(user_id: int, days: int = 7):
    """
    Çalışanın belirtilen gün sayısı için çalışma takvimini döndürür
    """
    schedule = schedule_repo.get_schedule(user_id, days)
    return {"workSchedule": schedule}
