# 요청 받기 / 응답 반환만 할 수 있도록 구현

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session

from app.services.ai_service import analyze_image
from app.deps import get_db


router = APIRouter(tags=["AI"])


@router.post("/detect")
async def detect(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    ai_result = analyze_image(await file.read(), db)

    # 그대로 감싸서 반환
    return {
        "result": ai_result
    }
