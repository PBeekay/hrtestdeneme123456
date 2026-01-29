from fastapi import APIRouter, Request, HTTPException, Depends
from typing import Optional
from datetime import datetime, timedelta
from slowapi import Limiter
from slowapi.util import get_remote_address

from auth import create_access_token
from logger import logger, log_auth_attempt
from dependencies import user_repo, session_repo, limiter, audit_repo
from schemas import LoginRequest, LoginResponse, LogoutRequest

router = APIRouter(tags=["Authentication"])

@router.post("/api/login", response_model=LoginResponse)
@limiter.limit("5/minute")  # Max 5 login attempts per minute per IP
def login(request: Request, credentials: LoginRequest):
    """
    HR Manager login endpoint with database authentication
    Credentials are stored in database with bcrypt hashing
    """
    client_ip = get_remote_address(request)
    
    # Log login attempt
    logger.info(f"[AUTH] Login attempt | Username: {credentials.username} | IP: {client_ip}")
    
    # Authenticate user against database
    user = user_repo.authenticate(credentials.username, credentials.password)
    
    if user:
        # Determine application role for authorization checks
        # Prefer the explicit user_role column; fall back to 'employee'
        app_role = user.get('user_role', 'employee')

        # Generate JWT token with expiration (30 minutes)
        token_data = {
            "sub": user['username'],
            "user_id": user['id'],
            "role": app_role
        }
        token = create_access_token(token_data)
        
        # Also store session in database for tracking (optional)
        expires_at = datetime.now() + timedelta(minutes=30)
        session_repo.create(user['id'], token, expires_at)
        
        # Log successful login
        log_auth_attempt(credentials.username, True, client_ip)
        logger.info(f"[OK] Login successful | User: {user['username']} | Role: {user.get('user_role')} | IP: {client_ip}")
        
        # AUDIT LOG
        audit_repo.log_action(
            user_id=user['id'], 
            username=user['username'], 
            action="LOGIN", 
            entity="session", 
            ip_address=client_ip
        )
        
        return {
            "success": True,
            "message": "Giriş başarılı!",
            "token": token,
            "user_id": user['id'],
            "user_role": user.get('user_role', 'employee')
        }
    else:
        # Log failed login
        log_auth_attempt(credentials.username, False, client_ip)
        logger.warning(f"[ERROR] Login failed | Username: {credentials.username} | IP: {client_ip}")

        # AUDIT LOG (Login Failed)
        audit_repo.log_action(
            user_id=None, 
            username=credentials.username, 
            action="LOGIN_FAILED", 
            ip_address=client_ip
        )
        raise HTTPException(
            status_code=401,
            detail="Kullanıcı adı veya şifre hatalı!"
        )

@router.post("/api/logout")
def logout(logout_req: LogoutRequest):
    """
    Logout endpoint - invalidate session token
    """
    session_repo.delete(logout_req.token)
    return {
        "success": True,
        "message": "Çıkış başarılı"
    }
