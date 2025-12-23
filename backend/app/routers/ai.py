# 요청 받기 / 응답 반환

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.services.ai_service import analyze_image
from app.core.dependencies import get_db
from app.services.product_service import get_product_size
from app.schemas.user import UserLogin


router = APIRouter(tags=["AI"])


@router.post("/detect")
async def detect(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ai_result = analyze_image(await file.read(), db)

    # 탐지 실패
    if ai_result["num_detections"] == 0:
        return {
            "result": {
                "product_id": None,
                "product_name": None,
                "brand_name": None,
                "price": None,
                "size": None,
                "confidence": 0,
                "ocr_text": None,
            }
        }

    # 탐지 성공 (top-1)
    first = ai_result["detections"][0]

    # size 조회
    size_value = None
    if first.get("product_id"):
        size_value = get_product_size(db, first["product_id"])

    return {
        "result": {
            "product_id": first["product_id"],
            "product_name": first["product_name"],
            "brand_name": first["brand_name"],
            "price": first["price"],
            "size": first["size"],
            "confidence": first["confidence"],
            "ocr_text": first["ocr_text"],
        }
    }
