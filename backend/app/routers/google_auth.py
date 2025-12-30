from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import requests
from pydantic import BaseModel
from typing import Optional

from app.core.dependencies import get_db
from app.models.user import User
from app.core.security import create_access_token

router = APIRouter(prefix="/auth/google", tags=["Auth"])

# Google Credentials
GOOGLE_CLIENT_ID = "663143166468-soaciatlmv3tdbut721uiktlt5urrjd2.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET = "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"
GOOGLE_REDIRECT_URI = "http://localhost:8081/oauth/callback/google"

class GoogleLoginRequest(BaseModel):
    code: str

@router.post("")
def google_login(payload: GoogleLoginRequest, db: Session = Depends(get_db)):
    """
    Google Auth Code -> Google Token -> User Info -> JWT Token
    """
    code = payload.code

    # 1. Exchange Code for Token
    token_url = "https://oauth2.googleapis.com/token"
    data = {
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": GOOGLE_REDIRECT_URI
    }
    
    token_resp = requests.post(token_url, data=data)
    token_json = token_resp.json()
    
    if "access_token" not in token_json:
        print("Google Token Error:", token_json)
        error_desc = token_json.get("error_description", str(token_json))
        raise HTTPException(status_code=400, detail=f"구글 토큰 발급 실패: {error_desc}")
        
    access_token = token_json["access_token"]
    
    # 2. Get User Info
    user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    
    user_resp = requests.get(user_info_url, headers=headers)
    user_json = user_resp.json()
    print("DEBUG GOOGLE JSON:", user_json)
    
    # Google JSON spec: {id, email, verified_email, name, given_name, family_name, picture, locale}
    if "id" not in user_json:
        raise HTTPException(status_code=400, detail="구글 사용자 정보 조회 실패")
        
    google_id = user_json["id"]
    email = user_json.get("email")
    name = user_json.get("name", f"User_{google_id}")
    
    # 3. Find or Create User
    user = db.query(User).filter(User.sns_id == google_id, User.sns_type == "google").first()
    
    if user:
        # Sync info if changed
        if name and user.username != name:
            user.username = name
            db.commit()
            db.refresh(user)
            
    if not user:
        # New User
        new_login_id = f"google_{google_id}"
        
        user = User(
            login_id=new_login_id,
            username=name,
            sns_type="google",
            sns_id=google_id,
            password=None,
            phone=None # Google usually doesn't give phone unless scoped heavily
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    # 4. Issue JWT
    app_token = create_access_token(
        data={"sub": str(user.user_id)}
    )
    
    return {
        "message": "구글 로그인 성공",
        "access_token": app_token,
        "user_id": user.user_id,
        "username": user.username
    }
