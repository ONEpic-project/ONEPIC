from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import requests
from pydantic import BaseModel

from app.core.dependencies import get_db
from app.models.user import User
from app.models.sns_user import SNSUser
from app.core.security import create_access_token

router = APIRouter(prefix="/auth/kakao", tags=["Auth"])

# 카카오 REST API 키 (나중에 .env로 빼야 함)
KAKAO_CLIENT_ID = "14d4155ec774b7dfda7d393aa289f385"
KAKAO_REDIRECT_URI = "http://localhost:8081/oauth/callback/kakao"

class KakaoLoginRequest(BaseModel):
    code: str

@router.post("")
def kakao_login(payload: KakaoLoginRequest, db: Session = Depends(get_db)):
    """
    프론트에서 받은 인가 코드(code)로 카카오 토큰을 발급받고,
    사용자 정보를 가져와서 로그인/회원가입 처리 후 
    우리 서비스의 JWT 토큰을 반환합니다.
    """
    code = payload.code

    # 1. 인가 코드로 카카오 토큰 발급
    token_url = "https://kauth.kakao.com/oauth/token"
    data = {
        "grant_type": "authorization_code",
        "client_id": KAKAO_CLIENT_ID,
        "redirect_uri": KAKAO_REDIRECT_URI,
        "code": code,
    }
    
    token_resp = requests.post(token_url, data=data)
    token_json = token_resp.json()
    
    if "access_token" not in token_json:
        # 에러 처리
        print("Kakao Token Error:", token_json)
        raise HTTPException(status_code=400, detail="카카오 로그인 실패 (토큰 발급 오류)")
    
    kakao_access_token = token_json["access_token"]
    
    # 2. 카카오 토큰으로 사용자 정보 조회
    user_info_url = "https://kapi.kakao.com/v2/user/me"
    headers = {
        "Authorization": f"Bearer {kakao_access_token}",
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
    }
    
    user_resp = requests.get(user_info_url, headers=headers)
    user_json = user_resp.json()
    
    if "id" not in user_json:
        raise HTTPException(status_code=400, detail="카카오 사용자 정보 조회 실패")
        
    kakao_id = str(user_json["id"])
    kakao_account = user_json.get("kakao_account", {})
    profile = kakao_account.get("profile", {})
    nickname = profile.get("nickname", f"User_{kakao_id}")
    
    # 3. DB에서 유저 찾기 (SNSUser 테이블 조회)
    sns_user = db.query(SNSUser).filter(SNSUser.sns_id == kakao_id, SNSUser.sns_type == "kakao").first()
    
    if sns_user:
        # 이미 연동된 계정이면 해당 유저 정보 가져오기
        user = sns_user.user
    else:
        # 3-1. 없으면 신규 회원가입 (User + SNSUser 생성)
        # login_id는 kakao_{id} 형태로 생성 (중복 방지)
        new_login_id = f"kakao_{kakao_id}"
        
        # User 생성
        user = User(
            login_id=new_login_id,
            username=nickname,
            password=None, # 비밀번호 없음
            phone=None     # 카카오에서 안 넘어오면 None
        )
        db.add(user)
        db.flush() # user_id 생성을 위해 flush
        
        # SNSUser 생성
        new_sns_user = SNSUser(
            user_id=user.user_id,
            sns_type="kakao",
            sns_id=kakao_id
        )
        db.add(new_sns_user)
        db.commit()
        db.refresh(user)
    
    # 4. 우리 서비스 JWT 토큰 발급
    access_token = create_access_token(
        data={"sub": str(user.user_id)}
    )
    
    return {
        "message": "카카오 로그인 성공",
        "access_token": access_token,
        "user_id": user.user_id,
        "username": user.username
    }
