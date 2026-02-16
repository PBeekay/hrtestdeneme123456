from typing import Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db import get_db
from models import User
from schemas import EmployeeAssetResponse, AssetCategoryResponse
from repositories.asset_repo import asset_repo, category_repo
from dependencies import get_current_user

router = APIRouter(
    prefix="/assets",
    tags=["assets"],
    responses={404: {"description": "Not found"}},
)

@router.get("/all", response_model=List[EmployeeAssetResponse])
def read_assets(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Tüm demirbaşları listele (List all assets).
    """
    assets = asset_repo.get_all_with_details(db)
    return assets

@router.get("/categories", response_model=List[AssetCategoryResponse])
def read_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Tüm kategorileri listele (List all categories).
    """
    categories = category_repo.get_all(db)
    return categories
