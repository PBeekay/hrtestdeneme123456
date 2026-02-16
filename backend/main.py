from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from routers import auth, users, tasks, leaves, dashboard, assets
from db import engine, Base

# Tablolar mevcut değilse oluştur (isteğe bağlı, çoğunlukla geliştirme ortamı için)
# Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Ayarları
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Yönlendiriciler (Routers)
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(users.router, prefix=settings.API_V1_STR)
app.include_router(tasks.router, prefix=settings.API_V1_STR)
app.include_router(leaves.router, prefix=settings.API_V1_STR)
app.include_router(dashboard.router, prefix=settings.API_V1_STR)
app.include_router(assets.router, prefix=settings.API_V1_STR)

@app.get("/")
def root():
    return {"message": "İK Yönetim Paneli API V2 (SQLAlchemy Refactor)"}

@app.get("/health")
def health():
    return {"status": "sağlıklı"}
