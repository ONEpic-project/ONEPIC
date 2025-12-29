from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.schemas.cart import CartResponse
from app.models.cart import Cart
from app.services.cart_service import (
    get_cart_by_user_id,
    calculate_cart_total
)

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

@router.get("/me", response_model=CartResponse)
def get_my_cart(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    cart = get_cart_by_user_id(db, current_user.user_id)

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