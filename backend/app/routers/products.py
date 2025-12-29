from fastapi import APIRouter, Depends
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.product import Product

router = APIRouter()

def get_product_by_id(db: Session, product_id: int):
    return db.query(Product).filter(Product.product_id == product_id).first()

# 실제 DB 연동 API (추가)
@router.get("/")
def get_products(
    category_id: int | None = None,
    db: Session = Depends(get_db)
):
    query = db.query(Product)
    if category_id is not None:
        query = query.filter(Product.category_id == category_id)
    return query.all()

