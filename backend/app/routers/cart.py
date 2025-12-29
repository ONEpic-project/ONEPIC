from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.deps import get_db
from app.schemas.cart import CartResponse
from app.models.cart import Cart
from app.services.cart_service import calculate_cart_total

router = APIRouter(prefix="/cart", tags=["Cart"])


@router.get("/{user_id}", response_model=CartResponse)
def get_cart(user_id: int, db: Session = Depends(get_db)):
    cart = db.query(Cart).filter(Cart.user_id == user_id).first()

    if not cart:
        return {
            "cart_id": None,
            "total_price": 0,
            "items": []
        }

    total_price = calculate_cart_total(cart)

    return {
        "cart_id": cart.cart_id,
        "total_price": total_price,
        "items": [
            {
                "cart_item_id": item.cart_item_id,
                "product_id": item.product.product_id,
                "name": item.product.name,
                "price": item.product.price,
                "quantity": item.quantity,
            }
            for item in cart.items
        ]
    }
