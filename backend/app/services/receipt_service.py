from sqlalchemy.orm import Session

from app.models.cart import Cart
from app.models.cart_item import CartItem
from app.models.receipt import Receipt
from app.models.receipt_items import ReceiptItem


def create_receipt_from_cart(
    db: Session,
    user_id: int,
    payment_method: str
) -> Receipt:
    """
    cart + cart_items를 기반으로
    receipts / receipt_items 생성
    """

    try:
        # 1. 유저의 cart 조회
        cart = db.query(Cart).filter(Cart.user_id == user_id).first()
        if not cart:
            raise ValueError("장바구니가 존재하지 않습니다.")

        cart_items = (
            db.query(CartItem)
            .filter(CartItem.cart_id == cart.cart_id)
            .all()
        )

        if not cart_items:
            raise ValueError("장바구니에 상품이 없습니다.")

        # 2. 총 금액 계산
        total_amount = sum(
            item.product.price * item.quantity for item in cart_items
        )

        # 3. receipt 생성
        receipt = Receipt(
            user_id=user_id,
            total_amount=total_amount,
            payment_method=payment_method
        )
        db.add(receipt)
        db.flush()  # receipt_items에서 FK로 써야 하므로 receipt_id 확보

        # 4. receipt_items 생성
        receipt_items = []
        for item in cart_items:
            receipt_item = ReceiptItem(
                receipt_id=receipt.receipt_id,
                product_id=item.product_id,
                product_name=item.product.name,  # 스냅샷
                price = item.product.price,
                quantity=item.quantity
            )
            receipt_items.append(receipt_item)

        db.add_all(receipt_items)

        # 5. cart_items 삭제 (cart 비우기)
        for item in cart_items:
            db.delete(item)

        db.commit()
        db.refresh(receipt)

        return receipt

    except Exception as e:
        db.rollback()
        raise e
