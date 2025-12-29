# app/schemas/user.py
from pydantic import BaseModel


# 회원가입
class UserCreate(BaseModel):
    login_id: str
    password: str
    username: str
    phone: str

# 로그인
class UserLogin(BaseModel):
    login_id: str
    password: str

# 아이디 찾기
class FindIdRequest(BaseModel):
    username: str
    phone: str

class FindIdResponse(BaseModel):
    login_id: str

# 비밀번호 찾기
class FindPasswordRequest(BaseModel):
    login_id: str
    phone: str
