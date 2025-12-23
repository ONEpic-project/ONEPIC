from fastapi import FastAPI
from app.database import engine, Base
from app.routers import products, ai
from app.routers import health
from app.routers import auth

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 개발 단계에서는 *
    allow_credentials=True,
    allow_methods=["*"],  # OPTIONS, POST, GET 전부 허용
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(health.router)
app.include_router(ai.router, prefix="/api/ai")     # 필수로 존재해야 함
app.include_router(products.router, prefix="/api/products")
app.include_router(auth.router)

@app.get("/")
def root():
    return {"message": "ONEPIC Backend Running!"}


# 가상환경 접속
# source fastapi_env/bin/activate

# 실행 명령어
# uvicorn app.main:app --host 0.0.0.0 --port 8000

# 자동 생성된 Swagger UI
# http://localhost:8000/docs