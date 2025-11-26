from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timedelta
import secrets
from database import (
    authenticate_user,
    get_user_dashboard_data,
    create_session,
    validate_session,
    delete_session,
    update_task_status,
    test_connection
)

app = FastAPI(title="HR Dashboard API")

# Configure CORS for React dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Test database connection on startup
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*50)
    print("🚀 FastAPI sunucusu başlatılıyor...")
    print("="*50)
    test_connection()
    print("="*50 + "\n")


class UserInfo(BaseModel):
    name: str
    role: str
    department: str
    email: str
    avatar: str


class LeaveBalance(BaseModel):
    annual: int
    sick: int
    personal: int


class Task(BaseModel):
    id: int
    title: str
    priority: str
    dueDate: str


class PerformanceMetric(BaseModel):
    label: str
    value: int
    maxValue: int


class Announcement(BaseModel):
    id: int
    title: str
    date: str
    category: str


class DashboardData(BaseModel):
    userInfo: UserInfo
    leaveBalance: LeaveBalance
    pendingTasks: List[Task]
    performance: List[PerformanceMetric]
    announcements: List[Announcement]


class LoginRequest(BaseModel):
    username: str
    password: str


class LoginResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    user_id: Optional[int] = None


class LogoutRequest(BaseModel):
    token: str


@app.get("/")
def read_root():
    return {
        "message": "HR Dashboard API is running",
        "version": "2.0",
        "database": "MariaDB Connected"
    }


@app.post("/api/login", response_model=LoginResponse)
def login(credentials: LoginRequest):
    """
    HR Manager login endpoint with database authentication
    Credentials are stored in database with bcrypt hashing
    """
    # Authenticate user against database
    user = authenticate_user(credentials.username, credentials.password)
    
    if user:
        # Generate secure token
        token = secrets.token_urlsafe(32)
        expires_at = datetime.now() + timedelta(days=7)
        
        # Store session in database
        create_session(user['id'], token, expires_at)
        
        return {
            "success": True,
            "message": "Giriş başarılı!",
            "token": token,
            "user_id": user['id']
        }
    else:
        raise HTTPException(
            status_code=401,
            detail="Kullanıcı adı veya şifre hatalı!"
        )


@app.post("/api/logout")
def logout(logout_req: LogoutRequest):
    """
    Logout endpoint - invalidate session token
    """
    delete_session(logout_req.token)
    return {
        "success": True,
        "message": "Çıkış başarılı"
    }


@app.get("/api/dashboard")
def get_dashboard_data(user_id: int = 1):
    """
    Returns dashboard data from database for authenticated user
    """
    dashboard_data = get_user_dashboard_data(user_id)
    
    if dashboard_data:
        return dashboard_data
    else:
        raise HTTPException(
            status_code=404,
            detail="Kullanıcı verileri bulunamadı"
        )


@app.put("/api/tasks/{task_id}/status")
def update_task(task_id: int, status: str):
    """
    Update task status (pending, completed, cancelled)
    """
    if status not in ['pending', 'completed', 'cancelled']:
        raise HTTPException(
            status_code=400,
            detail="Geçersiz durum. Geçerli değerler: pending, completed, cancelled"
        )
    
    success = update_task_status(task_id, status)
    
    if success:
        return {
            "success": True,
            "message": f"Görev durumu '{status}' olarak güncellendi"
        }
    else:
        raise HTTPException(
            status_code=404,
            detail="Görev bulunamadı"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

