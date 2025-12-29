from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db
from app.models.receipt import Receipt
from app.schemas.receipt import ReceiptCreate

router = APIRouter(
    prefix="/receipts",
    tags=["Receipts"]
)


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_receipt(
    receipt_data: ReceiptCreate,
    db: Session = Depends(get_db)
):
    try:
        # 1. 총 금액 계산
        total_amount = sum(
            item.price * item.quantity
            for item in receipt_data.items
        )

        # 2. Receipt 생성
        receipt = Receipt(
            user_id=receipt_data.user_id,
            total_amount=total_amount,
            payment_method=receipt_data.payment_method
        )
        db.add(receipt)
        db.flush()  # receipt_id 확보

        # 3. ReceiptItem 생성
        for item in receipt_data.items:
            receipt_item = ReceiptItem(
                receipt_id=receipt.receipt_id,
                product_id=item.product_id,
                product_name=item.product_name,
                price=item.price,
                quantity=item.quantity
            )
            db.add(receipt_item)

        # 4. 커밋
        db.commit()
        db.refresh(receipt)

        return {
            "receipt_id": receipt.receipt_id,
            "total_amount": total_amount,
            "message": "결제 완료"
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"결제 처리 중 오류 발생: {str(e)}"
        )

# 영수증 조회
@router.get("/{receipt_id}", response_model=ReceiptResponse)
def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db)
):
    receipt = (
        db.query(Receipt)
        .filter(Receipt.receipt_id == receipt_id)
        .first()
    )

    if not receipt:
        raise HTTPException(
            status_code=404,
            detail="영수증을 찾을 수 없습니다."
        )

    return {
        "receipt_id": receipt.receipt_id,
        "payment_method": receipt.payment_method,
        "total_amount": receipt.total_amount,
        "created_at": receipt.created_at,
        "items": [
            {
                "product_id": item.product_id,
                "product_name": item.product_name,
                "price": item.price,
                "quantity": item.quantity
            }
            for item in receipt.items
        ]
    }
