from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "mysql+pymysql://userID:123456@192.168.2.31:3306/onepic?charset=utf8mb4"

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,  # MySQL 연결 끊김 방지
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()