from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from core.config import settings
from core.security import create_access_token
from dependencies import get_db
from repositories.user_repo import user_repo
from schemas import Token, LoginResponse

router = APIRouter(
    prefix="",
    tags=["authentication"]
)

@router.post("/login", response_model=LoginResponse)
def login_access_token(db: Session = Depends(get_db), form_data: OAuth2PasswordRequestForm = Depends()):
    user = user_repo.authenticate(db, username=form_data.username, password=form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Hatalı kullanıcı adı veya şifre",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Kullanıcı aktif değil")
        
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        subject=user.username, expires_delta=access_token_expires
    )
    
    return {
        "success": True,
        "message": "Giriş başarılı",
        "token": access_token,
        "user_id": user.id,
        "user_role": user.type
    }
