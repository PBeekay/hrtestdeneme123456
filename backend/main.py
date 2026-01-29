from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.openapi.docs import get_swagger_ui_html, get_redoc_html
import secrets
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from datetime import datetime

from logger import logger
from dependencies import limiter, db_manager
from routers import (
    auth,
    dashboard,
    tasks,
    leaves,
    assets,
    general,
    users
)

# Initialize App
app = FastAPI(
    title="HR Dashboard API",
    version="2.3.0",
    docs_url=None,  # Disable default docs
    redoc_url=None  # Disable default redoc
)
security = HTTPBasic()

def check_docs_auth(credentials: HTTPBasicCredentials = Depends(security)):
    """
    Check username/password for docs access.
    Default: admin / hrpass123 (CHANGE THIS IN PROD)
    """
    correct_username = secrets.compare_digest(credentials.username, "admin")
    correct_password = secrets.compare_digest(credentials.password, "hrpass123")
    if not (correct_username and correct_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Basic"},
        )
    return credentials.username

@app.get("/docs", include_in_schema=False)
async def get_swagger_documentation(username: str = Depends(check_docs_auth)):
    return get_swagger_ui_html(openapi_url="/openapi.json", title="docs")

@app.get("/redoc", include_in_schema=False)
async def get_redoc_documentation(username: str = Depends(check_docs_auth)):
    return get_redoc_html(openapi_url="/openapi.json", title="redoc")

# Initialize Rate Limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Include Routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(tasks.router)
app.include_router(leaves.router)
app.include_router(assets.router)
app.include_router(general.router)
app.include_router(users.router)

# Configure Uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
origins = [
    "http://localhost:3000",
    "https://eskidc.com",
    "https://www.eskidc.com",
    "https://api.eskidc.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services Lifecycle
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("[START] HR Dashboard API Starting...")
    logger.info("=" * 60)
    
    # Test Database Connection
    logger.info("[INFO] Testing database connection...")
    conn = db_manager.get_connection()
    if conn:
        conn.close()
        logger.info("[OK] Database connection pool initialized")
    else:
        logger.error("[ERROR] Database connection failed")
        
    logger.info("[SEC] JWT authentication enabled (30 min expiration)")
    logger.info("[INFO] Rate limiting active (5 login attempts/minute)")
    logger.info("=" * 60)

# Base Endpoints
@app.get("/")
def read_root():
    return {
        "message": "HR Dashboard API is running",
        "version": "2.2.0 (Refactored)",
        "database": "MariaDB Connected"
    }

@app.get("/health")
def health_check():
    """
    Health check endpoint for monitoring
    """
    try:
        conn = db_manager.get_connection()
        db_status = "healthy" if conn else "unhealthy"
        if conn:
            conn.close()
        
        return {
            "status": "healthy" if db_status == "healthy" else "degraded",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "api": "healthy",
                "database": db_status
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "unhealthy",
            "error": str(e)
        }
