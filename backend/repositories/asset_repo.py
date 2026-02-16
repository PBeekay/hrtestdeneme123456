from typing import List, Optional
from sqlalchemy.orm import Session
from repositories.base import BaseRepository
from models import EmployeeAsset, AssetCategory
from schemas import EmployeeAssetCreate, EmployeeAssetUpdate, AssetCategoryCreate, AssetCategoryUpdate

class AssetRepository(BaseRepository[EmployeeAsset, EmployeeAssetCreate, EmployeeAssetUpdate]):
    def get_all_with_details(self, db: Session) -> List[EmployeeAsset]:
        return db.query(EmployeeAsset).all()

    def get_by_employee(self, db: Session, employee_id: int) -> List[EmployeeAsset]:
        return db.query(EmployeeAsset).filter(EmployeeAsset.employee_id == employee_id).all()

class CategoryRepository(BaseRepository[AssetCategory, AssetCategoryCreate, AssetCategoryUpdate]):
    def get_all(self, db: Session) -> List[AssetCategory]:
        return db.query(AssetCategory).all()

asset_repo = AssetRepository(EmployeeAsset)
category_repo = CategoryRepository(AssetCategory)
