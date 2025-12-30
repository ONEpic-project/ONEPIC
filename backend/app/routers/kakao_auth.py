from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import requests
from pydantic import BaseModel

from app.core.dependencies import get_db
from app.models.user import User
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
        error_msg = token_json.get("error_description", "Unknown Error")
        error_code = token_json.get("error_code", "")
        raise HTTPException(status_code=400, detail=f"카카오 토큰 발급 실패: {error_code} {error_msg}")
    
    kakao_access_token = token_json["access_token"]
    
    # 2. 카카오 토큰으로 사용자 정보 조회
    user_info_url = "https://kapi.kakao.com/v2/user/me"
    headers = {
        "Authorization": f"Bearer {kakao_access_token}",
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8"
    }
    
    user_resp = requests.get(user_info_url, headers=headers)
    user_json = user_resp.json()
    print("DEBUG KAKAO JSON:", user_json)  # 디버깅용 로그 추가
    
    if "id" not in user_json:
        print("Kakao User Info Error:", user_json)
        raise HTTPException(status_code=400, detail=f"카카오 사용자 정보 조회 실패: {user_json}")
        
    kakao_id = str(user_json["id"])
    kakao_id = str(user_json["id"])
    
    # 닉네임 우선순위: properties > kakao_account > Default
    properties = user_json.get("properties", {})
    kakao_account = user_json.get("kakao_account", {})
    profile = kakao_account.get("profile", {})
    
    nickname = properties.get("nickname")
    if not nickname:
        nickname = profile.get("nickname")
    if not nickname:
        nickname = f"User_{kakao_id}"
    
    # 3. DB에서 유저 찾기 (sns_id로 검색)
    user = db.query(User).filter(User.sns_id == kakao_id, User.sns_type == "kakao").first()
    
    if user:
        # 이미 존재하는 유저라면, 카카오 닉네임 변경 시 최신화 (선택사항 - 사용자가 원함)
        if nickname and nickname != f"User_{kakao_id}" and user.username != nickname:
            user.username = nickname
            db.commit()
            db.refresh(user)

    if not user:
        # 3-1. 없으면 회원가입 (자동)
        # login_id는 kakao_{id} 형태로 생성
        new_login_id = f"kakao_{kakao_id}"
        
        # 이름 중복 방지 로직 (필요 시)
        # 지금은 그냥 nickname 사용
        
        user = User(
            login_id=new_login_id,
            username=nickname,
            sns_type="kakao",
            sns_id=kakao_id,
            password=None, # 비밀번호 없음
            phone=None     # 카카오에서 안 넘어오면 None
        )
        db.add(user)
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
