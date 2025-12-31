from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.product import Product


def calculate_cart_total(cart: Cart) -> int:
    total = 0
    for item in cart.items:
        total += item.product.price * item.quantity
    return total


def purge_inactive_carts(db: Session) -> None:
    cutoff = datetime.utcnow() - timedelta(days=7)
    db.query(Cart).filter(
        Cart.status == "CHECKED_OUT",
        Cart.updated_at < cutoff,
    ).delete(synchronize_session=False)
    db.commit()


def get_cart_by_user_id(db: Session, user_id: int) -> Cart | None:
    purge_inactive_carts(db)
    return (
        db.query(Cart)
        .filter(
            Cart.user_id == user_id,
            Cart.status == "ACTIVE",
        )
        .first()
    )


def get_or_create_cart(db: Session, user_id: int) -> Cart:
    cart = get_cart_by_user_id(db, user_id)

    if not cart:
        cart = Cart(user_id=user_id, status="ACTIVE")
        db.add(cart)
        db.commit()
        db.refresh(cart)

    return cart


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
            Cart.user_id == user_id,
            Cart.status == "ACTIVE",
        )
        .first()
    )


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


def deactivate_cart_for_user(db: Session, user_id: int) -> Cart | None:
    cart = get_cart_by_user_id(db, user_id)
    if not cart:
        return None

    cart.status = "CHECKED_OUT"
    db.commit()
    db.refresh(cart)
    return cart


def create_cart_from_scan(
    db: Session,
    user_id: int,
    items: list,
) -> Cart | None:
    existing = (
        db.query(Cart)
        .filter(
            Cart.user_id == user_id,
            Cart.user_id == user_id,
            Cart.status == "ACTIVE",
        )
        .first()
    )
    if existing:
        db.delete(existing)
        db.commit()

    if not items:
        # 빈 리스트가 들어오면 장바구니를 생성하지 않음 (삭제된 상태 유지)
        return None

    cart = Cart(user_id=user_id, status="ACTIVE")
    db.add(cart)
    db.commit()
    db.refresh(cart)

    for item in items:
        product = db.query(Product).filter(
            Product.product_id == item.product_id
        ).first()

        if not product:
            raise ValueError("Product not found.")

        cart_item = CartItem(
            cart_id=cart.cart_id,
            product_id=product.product_id,
            quantity=item.quantity,
        )
        db.add(cart_item)

    db.commit()
    db.refresh(cart)
    return cart
