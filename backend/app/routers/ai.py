from fastapi import APIRouter, UploadFile, File, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.services.ai_service import analyze_image
from app.core.dependencies import get_db
from app.models.product import Product

router = APIRouter(tags=["AI"])

# 🔑 AI class_id → product_id 매핑
CLASS_TO_PRODUCT_ID = {
    0: 39,
    1: 38,
}

# 🔤 AI 클래스 라벨 매핑
CLASS_LABEL_MAP = {
    0: "마스크",
    1: "안경",
}

@router.post(
    "/analyze",
    summary="AI 상품 이미지 분석",
    description="상품 이미지를 업로드하면 YOLO 모델로 객체를 탐지하고, 매핑된 상품 정보를 반환합니다."
)
async def analyze(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # 1️⃣ 이미지 bytes
    image_bytes = await file.read()

    # 2️⃣ AI 분석
    result = analyze_image(image_bytes)

    matched_products = []

    # 3️⃣ AI 결과 → product 매핑
    print("===== AI DETECTION RESULT =====")
    for d in result["detections"]:
        class_id = d["class_id"]
        confidence = d["confidence"]
        
        label = CLASS_LABEL_MAP.get(class_id, "알 수 없음")

        product_id = CLASS_TO_PRODUCT_ID.get(class_id)
        if product_id is None:
            print(f"[SKIP] class_id {class_id} 매핑 없음")
            continue

        product = (
            db.query(Product)
            .filter(Product.product_id == product_id)
            .first()
        )


        if not product:
            print(f"[WARN] product_id {product_id} DB에 없음")
            continue

        print(
            f"[AI MATCH] class_id={class_id} ({label}) → "
            f"product_id={product.product_id} | {product.name}"
        )


        matched_products.append({
            "product_id": product.product_id,
            "name": product.name,
            "price": product.price,
            "label": label,
            "confidence": confidence,
            "bbox": d["bbox"],
        })

    # 4️⃣ 최종 응답
    return JSONResponse(
        content={
            "num_detections": result["num_detections"],
            "matched_products": matched_products,
            "image_base64": result["image_base64"],
        }
    )
