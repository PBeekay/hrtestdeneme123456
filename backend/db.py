import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session, declarative_base

load_dotenv()

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_NAME = os.getenv("DB_NAME")

# Bağlantı dizesini oluştur
# mysql+pymysql://user:password@host:port/dbname?charset=utf8mb4
SQLALCHEMY_DATABASE_URL = f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?charset=utf8mb4"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_recycle=3600,
    pool_size=10,
    max_overflow=20,
    echo=False  # SQL Loglama
)

# RETURNING desteği olmayan sunucular için
engine.dialect.insert_returning = False
engine.dialect.update_returning = False
engine.dialect.delete_returning = False
engine.dialect.insert_executemany_returning = False

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Thread güvenliği için kapsamlı oturum
db_session = scoped_session(SessionLocal)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
