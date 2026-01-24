from fastapi import APIRouter, Depends, HTTPException, Body
from typing import List, Optional

from dependencies import (
    get_current_user,
    leave_repo
)
from logger import logger, log_error
from schemas import LeaveRequestCreate

router = APIRouter(tags=["Leave Management"])

@router.post("/api/leave-requests")
def create_leave_req(
    leave_request: LeaveRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new leave request (Employee)
    Secured: Can only be created by the currently logged in user
    """
    user_role = current_user.get('role', 'employee')
    user_id = current_user.get('user_id')
    
    logger.info(f"📝 New leave request | User ID: {user_id} | Type: {leave_request.leaveType}")
    
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


@router.get("/api/leave-requests")
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

    if requester_role == 'admin' and not user_id:
        requests = leave_repo.get_all_requests(status)
    else:
        # Security check: Employees can only view their own requests
        if requester_role != 'admin' and target_user_id != requester_id:
             raise HTTPException(status_code=403, detail="Başkasının izinlerini görüntüleme yetkiniz yok")
        
        requests = leave_repo.get_requests(target_user_id, status)

    return {"leaveRequests": requests}


@router.put("/api/leave-requests/{request_id}/approve")
def approve_leave(request_id: int, admin_id: int, approved: bool, reason: Optional[str] = None):
    """
    Approve or reject leave request (Admin only)
    """
    # Note: Ideally we should verify if the caller is admin using Depends(require_admin)
    # But for now keeping logic same as main.py where it seems to rely on whoever calls it?
    # Wait, main.py didn't have Depends for this endpoint? 
    # Checking lines 463 in main.py... it takes admin_id as param. This is insecure but keeping refactor 1:1 first.
    
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
