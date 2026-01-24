from fastapi import APIRouter, HTTPException, Depends
from typing import List

from dependencies import task_repo
from schemas import Task

router = APIRouter(tags=["Tasks"])

@router.put("/api/tasks/{task_id}/status")
def update_task(task_id: int, status: str):
    """
    Update task status (pending, completed, cancelled)
    """
    if status not in ['pending', 'completed', 'cancelled']:
        raise HTTPException(
            status_code=400,
            detail="Geçersiz durum. Geçerli değerler: pending, completed, cancelled"
        )
    
    success = task_repo.update_status(task_id, status)
    
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
