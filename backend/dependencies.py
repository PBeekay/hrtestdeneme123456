from fastapi import Header, HTTPException, Depends
from typing import Optional
from slowapi import Limiter
from slowapi.util import get_remote_address
from auth import verify_token
from logger import logger
from repositories import (
    DatabaseManager,
    UserRepository,
    LeaveRepository,
    TaskRepository,
    AssetRepository,
    DashboardRepository,
    AnnouncementRepository,
    SessionRepository,
    WorkScheduleRepository,
    ReminderRepository,
    DocumentRepository,
    AuditLogRepository
)

# Initialize Repositories
db_manager = DatabaseManager()
user_repo = UserRepository()
leave_repo = LeaveRepository()
task_repo = TaskRepository()
asset_repo = AssetRepository()
dashboard_repo = DashboardRepository()
announcement_repo = AnnouncementRepository()
session_repo = SessionRepository()
schedule_repo = WorkScheduleRepository()
reminder_repo = ReminderRepository()
doc_repo = DocumentRepository()
audit_repo = AuditLogRepository()

# Initialize Rate Limiter
limiter = Limiter(key_func=get_remote_address)

# Authentication Dependency
async def get_current_user(authorization: Optional[str] = Header(None, alias="Authorization")):
    """
    Verify JWT token from Authorization header
    Returns user data if valid, raises 401 if invalid/expired
    """
    if not authorization:
        logger.warning("[ERROR] Authorization header missing")
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    # Extract token from "Bearer <token>"
    try:
        parts = authorization.split()
        if len(parts) != 2:
            logger.warning(f"[ERROR] Invalid authorization header format: {authorization[:50]}")
            raise HTTPException(status_code=401, detail="Invalid authorization header format")
        
        scheme, token = parts
        if scheme.lower() != "bearer":
            logger.warning(f"[ERROR] Invalid authentication scheme: {scheme}")
            raise HTTPException(status_code=401, detail="Invalid authentication scheme")
    except ValueError as e:
        logger.warning(f"[ERROR] Error parsing authorization header: {e}")
        raise HTTPException(status_code=401, detail="Invalid authorization header format")
    
    # Debug: Log token format (first/last 10 chars only for security)
    logger.debug(f"[AUTH] Verifying token: {token[:10]}...{token[-10:] if len(token) > 20 else ''}")
    
    # Verify token
    payload = verify_token(token)
    if not payload:
        logger.warning("[ERROR] Token verification failed")
        raise HTTPException(status_code=401, detail="Token expired or invalid")
    
    logger.debug(f"[OK] Token verified for user: {payload.get('sub')}")
    return payload
