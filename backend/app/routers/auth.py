# app/routers/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.schemas.user import UserCreate, UserLogin
from app.models.user import User
from app.core.security import create_access_token
from app.schemas.user import FindIdRequest, FindPasswordRequest


router = APIRouter(prefix="/auth", tags=["Auth"])

# 회원가입 ================================================
@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(user: UserCreate, db: Session = Depends(get_db)):
    # 로그인 아이디 중복 체크
    exists = (
        db.query(User)
        .filter(User.login_id == user.login_id)
        .first()
    )
    if exists:
        raise HTTPException(
            status_code=400, 
            detail="이미 존재하는 아이디입니다."
        )

    new_user = User(
        login_id=user.login_id,
        password=user.password,   # 나중에 해시
        username=user.username,
        phone=user.phone,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 토큰 생성
    access_token = create_access_token(
        data={"sub": str(new_user.user_id)}
    )

    return {
        "message": "회원가입 성공",
        "user": {
            "user_id": new_user.user_id,
            "login_id": new_user.login_id,
            "username": new_user.username,
        }
    }


# 로그인 ================================================
@router.post("/login")
def login(user: UserLogin, db: Session = Depends(get_db)):
    # 1. 아이디/비번 검증
    db_user = (
        db.query(User)
        .filter(User.login_id == user.login_id)
        .first()
    )

    if not db_user or db_user.password != user.password:
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호 오류")

    # 2. 토큰 생성
    access_token = create_access_token(
        data={"sub": str(db_user.user_id)}
    )

    # 3. 토큰 포함해서 응답
    return {
        "message": "로그인 성공",
        "access_token": access_token,
        "user_id": db_user.user_id,
        "username": db_user.username
    }


# 회원 탈퇴 ================================================
@router.delete("/me", tags=["Auth"])
def delete_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """
    현재 로그인한 사용자 계정을 삭제합니다.
    Authorization 헤더에 Bearer 토큰이 필요합니다.
    """
    db.delete(current_user)
    db.commit()
    return {"message": "회원탈퇴 완료"}


#  아이디 찾기 ================================================
from app.schemas.user import FindIdRequest

@router.post("/find-id")
def find_id(data: FindIdRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(
            User.username == data.username,
            User.phone == data.phone
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="일치하는 회원 정보가 없습니다."
        )

    return {
        "login_id": user.login_id
    }


#  비밀번호 찾기 ================================================
import random
import string

@router.post("/find-password")
def find_password(data: FindPasswordRequest, db: Session = Depends(get_db)):
    user = (
        db.query(User)
        .filter(
            User.login_id == data.login_id,
            User.phone == data.phone
        )
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="일치하는 회원 정보가 없습니다."
        )

    # 임시 비밀번호 생성
    temp_password = ''.join(
        random.choices(string.ascii_letters + string.digits, k=8)
    )

    user.password = temp_password
    db.commit()

    return {
        "message": "임시 비밀번호가 발급되었습니다. 로그인 후 반드시 비밀번호를 변경해주세요.",
        "temp_password": temp_password
    }
