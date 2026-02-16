from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db, get_current_active_user, get_current_superuser
from repositories.user_repo import user_repo
from repositories.employee_repo import employee_repo
from schemas import UserCreate, UserResponse, UserUpdate, EmployeeCreate, EmployeeResponse
from models import User

router = APIRouter(
    prefix="",
    tags=["users"]
)

@router.get("/", response_model=List[UserResponse])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    users = user_repo.get_multi(db, skip=skip, limit=limit)
    return users

@router.post("/", response_model=UserResponse)
def create_user(
    user_in: UserCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    user = user_repo.get_by_email(db, email=user_in.email)
    if user:
        raise HTTPException(status_code=400, detail="E-posta adresi zaten kayıtlı")
    user = user_repo.create(db, obj_in=user_in)
    return user

@router.post("/employee", response_model=EmployeeResponse)
def create_employee_endpoint(
    employee_in: EmployeeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_superuser)
):
    user = user_repo.get_by_email(db, email=employee_in.email)
    if user:
        raise HTTPException(status_code=400, detail="E-posta adresi zaten kayıtlı")
    
    employee = employee_repo.create_employee(db, obj_in=employee_in)
    return employee

@router.get("/me", response_model=UserResponse)
def read_user_me(
    current_user: User = Depends(get_current_active_user)
):
    return current_user
