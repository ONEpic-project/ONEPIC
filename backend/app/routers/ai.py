# 요청 받기 / 응답 반환

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.services.ai_service import analyze_image
from app.core.dependencies import get_db
from app.services.product_service import get_product_size


router = APIRouter(tags=["AI"])


@router.post("/detect")
async def detect(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ai_result = analyze_image(await file.read(), db)

    # 탐지 결과가 하나라도 있을 때
    if ai_result["num_detections"] > 0:
        first = ai_result["detections"][0]

        # size 조회
        size_value = None
        if first.get("product_id"):
            size_value = get_product_size(db, first["product_id"])

        return {
            "result": {
                "label": first["product_name"],
                "size": size_value,
                "price": first["price"],
                "brand_name": first["brand_name"],
                "confidence": first["class_confidence"],
                "image_base64": ai_result["image_base64"],
            }
        }

    # 탐지 실패
    return {
        "result": {
            "label": None,
            "image_base64": ai_result["image_base64"],
        }
    }
