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
