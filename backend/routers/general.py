from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from pathlib import Path
from datetime import datetime
from dependencies import get_current_user
from logger import logger

router = APIRouter(tags=["General"])

UPLOAD_DIR = Path("uploads")

@router.post("/api/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Doküman dosyası yükler (Sadece admin).
    Desteklenen formatlar: PDF, DOC, DOCX, JPG, PNG
    """
    user_role = current_user.get('role')
    username = current_user.get('sub')
    
    if user_role != 'admin':
        logger.warning(f"❌ Unauthorized file upload attempt | User: {username}")
        raise HTTPException(status_code=403, detail="Bu işlem için yönetici yetkisi gerekli")
    
    # Dosya tipini doğrula
    allowed_extensions = {'.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'}
    file_extension = Path(file.filename).suffix.lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Desteklenmeyen dosya formatı. İzin verilen: {', '.join(allowed_extensions)}"
        )
    
    # Dosya boyutunu doğrula (maksimum 10MB)
    max_size = 10 * 1024 * 1024  # 10MB
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Seek back to start
    
    if file_size > max_size:
        raise HTTPException(status_code=400, detail="Dosya boyutu maksimum 10MB olabilir")
    
    try:
        # Benzersiz bir dosya adı üret
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = UPLOAD_DIR / safe_filename
        
        with open(file_path, "wb") as buffer:
            # Read in chunks to avoid memory issues
            while content := await file.read(1024 * 1024):  # 1MB chunks
                buffer.write(content)
                
        logger.info(f"✅ File uploaded | User: {username} | File: {safe_filename}")
        
        return {
            "success": True,
            "message": "Dosya başarıyla yüklendi",
            "filename": safe_filename,
            "url": f"/uploads/{safe_filename}"
        }
            
    except Exception as e:
        logger.error(f"❌ File upload error: {e}")
        raise HTTPException(status_code=500, detail="Dosya yükleme sırasında hata oluştu")
