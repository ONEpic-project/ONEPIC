from fastapi import FastAPI
from app.routers import ai, products

app = FastAPI()

# 라우터 등록
app.include_router(ai.router, prefix="/api/ai")
app.include_router(products.router, prefix="/api/products")

@app.get("/")
def root():
    return {"message": "ONEPIC Backend Running!"}

# 실행 명령어
# uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


# 자동 생성된 Swagger UI
# http://localhost:8000/docs