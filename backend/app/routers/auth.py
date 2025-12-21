# app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.dependencies import get_db
from app.schemas.user import UserCreate
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# 회원가입 ================================================
@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # 아이디 중복 체크
    exists = db.query(User).filter(User.user_id == user.user_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")

    new_user = User(
        name=user.name,
        user_id=user.user_id,
        password=user.password,  # 실무에선 해시!
        contact=user.contact,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {"message": "회원가입 성공"}

# 로그인 ================================================
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = (
        db.query(User)
        .filter(User.login_id == user.login_id)
        .first()
    )

    if not db_user:
        raise HTTPException(status_code=400, detail="아이디가 존재하지 않습니다.")

    if db_user.password != user.password:
        raise HTTPException(status_code=400, detail="비밀번호가 올바르지 않습니다.")

    return {
        "message": "로그인 성공",
        "user_id": db_user.user_id,
        "username": db_user.username,
    }