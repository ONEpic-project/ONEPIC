from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def ai_test():
    return {"message": "AI router OK"}
