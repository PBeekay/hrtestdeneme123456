from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import desc
from repositories.base import BaseRepository
from models import LeaveRequest
from schemas import LeaveRequestCreate, LeaveRequestUpdate


class LeaveRepository(
    BaseRepository[LeaveRequest, LeaveRequestCreate, LeaveRequestUpdate]
):
    def get_by_user(
        self,
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 100,
    ) -> List[LeaveRequest]:
        return db.query(self.model)\
            .filter(LeaveRequest.user_id == user_id)\
            .order_by(desc(LeaveRequest.created_at))\
            .offset(skip).limit(limit).all()

    def get_pending(self, db: Session) -> List[LeaveRequest]:
        return db.query(self.model)\
            .filter(LeaveRequest.status == 'pending').all()


leave_repo = LeaveRepository(LeaveRequest)
