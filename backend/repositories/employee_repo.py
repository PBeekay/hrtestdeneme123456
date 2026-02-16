from typing import Optional, List
from sqlalchemy.orm import Session
from repositories.base import BaseRepository
from models import Employee, User
from schemas import EmployeeCreate, EmployeeResponse
from core.security import get_password_hash

class EmployeeRepository(BaseRepository[Employee, EmployeeCreate, EmployeeCreate]):
    def create_employee(self, db: Session, obj_in: EmployeeCreate) -> Employee:
        # Temel Kullanıcı Oluşturma
        db_user = Employee(
            email=obj_in.email,
            username=obj_in.username,
            full_name=obj_in.full_name,
            password_hash=get_password_hash(obj_in.password),
            type="employee",
            department=obj_in.department,
            phone=obj_in.phone,
            location=obj_in.location,
            manager_id=obj_in.manager_id,
            start_date=obj_in.start_date,
            is_active=True if obj_in.is_active is None else obj_in.is_active
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

employee_repo = EmployeeRepository(Employee)
