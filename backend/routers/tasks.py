from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from dependencies import get_db, get_current_active_user
from repositories.task_repo import task_repo
from schemas import TaskCreate, TaskResponse, TaskUpdate
from models import User

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"]
)

@router.get("/", response_model=List[TaskResponse])
def read_tasks(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    tasks = task_repo.get_multi_by_owner(db, user_id=current_user.id, skip=skip, limit=limit)
    return tasks

@router.post("/", response_model=TaskResponse)
def create_task(
    task_in: TaskCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    # Yetki Kontrolü
    if task_in.user_id != current_user.id and current_user.type != 'manager' and current_user.type != 'admin':
         raise HTTPException(status_code=400, detail="Yetersiz yetki")
         
    return task_repo.create(db, obj_in=task_in)

@router.put("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: int,
    task_in: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    task = task_repo.get(db, id=task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Görev bulunamadı")
    if task.user_id != current_user.id and current_user.type != 'manager':
        raise HTTPException(status_code=400, detail="Yetersiz yetki")
        
    task = task_repo.update(db, db_obj=task, obj_in=task_in)
    return task
