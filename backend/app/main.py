from fastapi import FastAPI
from fastapi.openapi.utils import get_openapi
from app.database import engine, Base
from app.routers import products, ai, auth, health, cart

from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    swagger_ui_parameters={"persistAuthorization": True}
)

def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    openapi_schema = get_openapi(
        title="ONEPIC API",
        version="1.0.0",
        routes=app.routes,
    )
    openapi_schema["components"]["securitySchemes"] = {
        "Bearer": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    # DELETE /api/auth/me에 보안 적용
    if "/api/auth/me" in openapi_schema.get("paths", {}):
        openapi_schema["paths"]["/api/auth/me"]["delete"]["security"] = [{"Bearer": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

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
app.include_router(auth.router, prefix="/api")
app.include_router(cart.router, prefix="/api")


# 데이터베이스 테이블 생성
app.mount(
    "/static",
    StaticFiles(directory="app/static"),
    name="static"
)

@app.get("/")
def root():
    return {"message": "ONEPIC Backend Running!"}




# 가상환경 접속
# source fastapi_env/bin/activate

# 실행 명령어
# uvicorn app.main:app --host 0.0.0.0 --port 8000

# 자동 생성된 Swagger UI
# http://localhost:8000/docs