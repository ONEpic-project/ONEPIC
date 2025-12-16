# 요청 받기 / 응답 반환

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.services.ai_service import analyze_image
from app.core.dependencies import get_db

router = APIRouter(tags=["AI"])


@router.post(
    "/analyze",
    summary="AI 상품 이미지 분석",
    description="상품 이미지를 업로드하면 YOLOv8 모델로 객체를 탐지하고 상품 정보를 반환합니다."
)
async def analyze(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    image_bytes = await file.read()

    # 서비스 레이어에 전부 위임
    result = analyze_image(image_bytes, db)

    return result