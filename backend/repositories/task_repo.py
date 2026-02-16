from typing import List
from sqlalchemy.orm import Session
from repositories.base import BaseRepository
from models import Task
from schemas import TaskCreate, TaskUpdate


class TaskRepository(BaseRepository[Task, TaskCreate, TaskUpdate]):
    def get_multi_by_owner(self, db: Session, user_id: int, skip: int = 0, limit: int = 100) -> List[Task]:
        return db.query(self.model).filter(Task.user_id == user_id).offset(skip).limit(limit).all()


task_repo = TaskRepository(Task)
