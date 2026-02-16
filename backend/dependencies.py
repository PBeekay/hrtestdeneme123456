from typing import Generator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from db import SessionLocal
from core.config import settings
from core import security
from models import User

# OAuth2 şeması
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def get_db() -> Generator:
    """
    Veritabanı Oturumu
    """
    try:
        db = SessionLocal()
        yield db
    finally:
        db.close()

def get_current_user(
    db: Session = Depends(get_db), 
    token: str = Depends(oauth2_scheme)
) -> User:
    """
    Mevcut Kullanıcı Doğrulama
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Kimlik bilgileri doğrulanamadı",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
        
    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Aktif Kullanıcı Kontrolü
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

def get_current_superuser(current_user: User = Depends(get_current_user)) -> User:
    """
    Süper Kullanıcı Kontrolü
    """
    # 'Manager' veya belirli yönetici bayrağı kontrolleri varsayılıyor.
    # Şimdilik, 'is_superuser' alanı varsa polimorfik kimlik veya belirli alan kontrol edilebilir.
    # Modellere göre, Yöneticilerin admin_level'ı var.
    if current_user.type != "manager" and current_user.type != "admin": # Rollerine göre ayarlayın
         raise HTTPException(
            status_code=400, detail="Kullanıcının yeterli yetkisi yok"
        )
    return current_user
