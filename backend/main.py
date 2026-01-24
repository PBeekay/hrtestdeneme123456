from fastapi import FastAPI
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
    general
)

# Initialize App
app = FastAPI(title="HR Dashboard API", version="2.2.0")

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

# Configure Uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Services Lifecycle
@app.on_event("startup")
async def startup_event():
    logger.info("=" * 60)
    logger.info("🚀 HR Dashboard API Starting...")
    logger.info("=" * 60)
    
    # Test Database Connection
    logger.info("📊 Testing database connection...")
    conn = db_manager.get_connection()
    if conn:
        conn.close()
        logger.info("✅ Database connection pool initialized")
    else:
        logger.error("❌ Database connection failed")
        
    logger.info("🔒 JWT authentication enabled (30 min expiration)")
    logger.info("🚦 Rate limiting active (5 login attempts/minute)")
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
