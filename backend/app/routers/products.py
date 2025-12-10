from fastapi import APIRouter

router = APIRouter()

@router.get("/test")
def product_test():
    return {"message": "Product router OK"}
