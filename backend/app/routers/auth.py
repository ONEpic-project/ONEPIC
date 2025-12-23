# app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.schemas.user import UserCreate, UserLogin
from app.models.user import User

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# 회원가입 ================================================
@router.post("/signup")
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # 로그인 아이디 중복 체크
    exists = (
        db.query(User)
        .filter(User.login_id == user.login_id)
        .first()
    )
    if exists:
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다.")

    new_user = User(
        login_id=user.login_id,
        password=user.password,   # 나중에 해시
        username=user.username,
        phone=user.phone,
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
