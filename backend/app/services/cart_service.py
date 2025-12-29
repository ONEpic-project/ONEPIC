from sqlalchemy.orm import Session
from app.models.cart import Cart


# 장바구니 총액 계산
def calculate_cart_total(cart: Cart) -> int:
    total = 0
    for item in cart.items:
        total += item.product.price * item.quantity
    return total

# 사용자 ID로 장바구니 조회
def get_cart_by_user_id(db: Session, user_id: int) -> Cart | None:
    return (
        db.query(Cart)
        .filter(Cart.user_id == user_id)
        .first()
    )