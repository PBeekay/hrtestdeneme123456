from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional

from dependencies import (
    get_current_user,
    asset_repo
)
from logger import logger, log_error
from schemas import AssetAssignmentCreate, AssetAssignmentUpdate

router = APIRouter(tags=["Asset Management"])

@router.get("/api/assets/categories")
def get_categories(current_user: dict = Depends(get_current_user)):
    """
    Tüm zimmet kategorilerini döndürür
    """
    logger.info(f"📦 Asset categories request | User: {current_user.get('sub')}")
    categories = asset_repo.get_categories()
    return {"categories": categories}


@router.get("/api/assets/my")
def get_my_assets(current_user: dict = Depends(get_current_user), status: Optional[str] = None):
    """
    Giriş yapmış kullanıcının zimmetli eşyalarını döndürür
    """
    user_id = current_user.get('user_id')
    username = current_user.get('sub')
    
    logger.info(f"📦 My assets request | User: {username} | Status filter: {status}")
    
    try:
        assets = asset_repo.get_by_employee(user_id, status)
        stats = asset_repo.get_statistics(user_id)
        
        return {
            "assets": assets,
            "statistics": stats
        }
    except Exception as e:
        log_error(e, f"Get my assets for user {username}")
        raise HTTPException(status_code=500, detail="Eşyalar yüklenirken hata oluştu")


@router.get("/api/assets/all")
def get_all_asset_assignments(
    current_user: dict = Depends(get_current_user), 
    status: Optional[str] = None
):
    """
    Tüm zimmet kayıtlarını döndürür (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset access attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 All assets request | Admin: {username} | Status filter: {status}")
    
    try:
        assets = asset_repo.get_all(status)
        stats = asset_repo.get_statistics()
        
        return {
            "assets": assets,
            "statistics": stats
        }
    except Exception as e:
        log_error(e, f"Get all assets by admin {username}")
        raise HTTPException(status_code=500, detail="Eşyalar yüklenirken hata oluştu")


@router.post("/api/assets")
def create_asset(
    assignment: AssetAssignmentCreate,
    current_user: dict = Depends(get_current_user)
):
    """
    Yeni zimmet kaydı oluşturur (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset creation attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Creating asset | Admin: {username} | Asset: {assignment.asset_name}")
    
    try:
        asset_id = asset_repo.create_assignment(assignment.dict())
        
        if asset_id:
            logger.info(f"✅ Asset created | ID: {asset_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Zimmet kaydı oluşturuldu",
                "asset_id": asset_id
            }
        else:
            raise HTTPException(status_code=500, detail="Zimmet kaydı oluşturulamadı")
    except Exception as e:
        log_error(e, f"Create asset by admin {username}")
        raise HTTPException(status_code=500, detail="Zimmet kaydı oluşturulurken hata oluştu")


@router.put("/api/assets/{asset_id}")
def update_asset(
    asset_id: int,
    update_data: AssetAssignmentUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Mevcut bir zimmet kaydını günceller (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset update attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Updating asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = asset_repo.update_assignment(asset_id, update_data.dict(exclude_unset=True))
        
        if success:
            logger.info(f"✅ Asset updated | ID: {asset_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Zimmet kaydı güncellendi"
            }
        else:
            raise HTTPException(status_code=404, detail="Zimmet kaydı bulunamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Update asset {asset_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Zimmet kaydı güncellenirken hata oluştu")


@router.post("/api/assets/{asset_id}/return")
def return_asset_endpoint(
    asset_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Zimmetli bir eşyayı iade edildi olarak işaretler (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset return attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Returning asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = asset_repo.return_asset(asset_id)
        
        if success:
            logger.info(f"✅ Asset returned | ID: {asset_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Eşya iade edildi olarak işaretlendi"
            }
        else:
            raise HTTPException(status_code=404, detail="Zimmet kaydı bulunamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Return asset {asset_id} by admin {username}")
        raise HTTPException(status_code=500, detail="İade işlemi sırasında hata oluştu")


@router.delete("/api/assets/{asset_id}")
def delete_asset(
    asset_id: int,
    current_user: dict = Depends(get_current_user)
):
    """
    Bir zimmet kaydını siler (Sadece admin)
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized asset deletion attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    logger.info(f"📦 Deleting asset | ID: {asset_id} | Admin: {username}")
    
    try:
        success = asset_repo.delete_assignment(asset_id)
        
        if success:
            logger.info(f"✅ Asset deleted | ID: {asset_id} | Admin: {username}")
            return {
                "success": True,
                "message": "Zimmet kaydı silindi"
            }
        else:
            raise HTTPException(status_code=404, detail="Zimmet kaydı bulunamadı")
    except HTTPException:
        raise
    except Exception as e:
        log_error(e, f"Delete asset {asset_id} by admin {username}")
        raise HTTPException(status_code=500, detail="Silme işlemi sırasında hata oluştu")
