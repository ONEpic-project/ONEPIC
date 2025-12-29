# 시스템 상태 체크 파일

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.deps import get_db

router = APIRouter(prefix="/health", tags=["Health"])

@router.get("/db")
def db_health(db: Session = Depends(get_db)):
    return {"status": "ok"}
