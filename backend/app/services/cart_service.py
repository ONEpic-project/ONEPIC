from sqlalchemy.orm import Session
from app.models.cart import Cart
from app.models.cart_item import CartItem


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


# 장바구니 없으면 생성
def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = get_cart_by_user_id(db, user_id)

    if not cart:
        cart = Cart(user_id=user_id)
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart


# 장바구니 상품 추가
def add_cart_item(
    db: Session,
    user_id: int,
    product_id: int,
    quantity: int = 1,
) -> CartItem:
    cart = get_or_create_cart(db, user_id)

    item = (
        db.query(CartItem)
        .filter(
            CartItem.cart_id == cart.cart_id,
            CartItem.product_id == product_id,
        )
        .first()
    )

    if item:
        item.quantity += quantity
    else:
        item = CartItem(
            cart_id=cart.cart_id,
            product_id=product_id,
            quantity=quantity,
        )
        db.add(item)

    db.commit()
    db.refresh(item)
    return item


# (핵심) cart_item + user 소유권 검증 조회
def get_cart_item_by_id_and_user(
    db: Session,
    cart_item_id: int,
    user_id: int,
) -> CartItem | None:
    return (
        db.query(CartItem)
        .join(Cart)
        .filter(
            CartItem.cart_item_id == cart_item_id,
            Cart.user_id == user_id,
        )
        .first()
    )


# 수량 변경 (0 이하면 삭제) + 소유권 검증
def update_cart_item_quantity(
    db: Session,
    cart_item_id: int,
    user_id: int,
    quantity: int,
) -> CartItem | None:
    item = get_cart_item_by_id_and_user(db, cart_item_id, user_id)

    if not item:
        return None

    if quantity <= 0:
        db.delete(item)
        db.commit()
        return None

    item.quantity = quantity
    db.commit()
    db.refresh(item)
    return item


# 장바구니 상품 삭제 + 소유권 검증
def delete_cart_item(
    db: Session,
    cart_item_id: int,
    user_id: int,
) -> bool:
    item = get_cart_item_by_id_and_user(db, cart_item_id, user_id)

    if not item:
        return False

    db.delete(item)
    db.commit()
    return True
