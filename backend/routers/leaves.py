from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db, get_current_active_user, get_current_superuser
from repositories.leave_repo import leave_repo
from schemas import LeaveRequestCreate, LeaveRequestResponse, LeaveRequestUpdate
from models import User

router = APIRouter(
    prefix="/leave-requests",
    tags=["leaves"]
)

@router.get("/", response_model=List[LeaveRequestResponse])
def read_leaves(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if current_user.type == 'employee':
        return leave_repo.get_by_user(db, user_id=current_user.id, skip=skip, limit=limit)
    else:
        # Yönetici Görüntüleme
        return leave_repo.get_multi(db, skip=skip, limit=limit)

@router.post("/", response_model=LeaveRequestResponse)
def create_leave(
    leave_in: LeaveRequestCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Veri Hazırlama
    leave_data = leave_in.model_dump()
    leave_data['user_id'] = current_user.id
    
    # Kayıt Oluşturma
    from models import LeaveRequest
    db_obj = LeaveRequest(**leave_data)
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj

@router.put("/{leave_id}", response_model=LeaveRequestResponse)
def update_leave_status(
    leave_id: int,
    leave_in: LeaveRequestUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    leave = leave_repo.get(db, id=leave_id)
    if not leave:
        raise HTTPException(status_code=404, detail="İzin talebi bulunamadı")
        
    leave = leave_repo.update(db, db_obj=leave, obj_in=leave_in)
    return leave
