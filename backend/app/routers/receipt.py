from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.schemas.receipt import ReceiptCreate, ReceiptResponse
from app.services.receipt_service import create_receipt_from_cart
from app.models.user import User



router = APIRouter(
    prefix="/receipts",
    tags=["Receipts"]
)


@router.post(
    "",
    response_model=ReceiptResponse,
    status_code=status.HTTP_201_CREATED
)
def create_receipt(
    payload: ReceiptCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    장바구니 기반 영수증 생성 (결제)
    """

    try:
        receipt = create_receipt_from_cart(
            db=db,
            user_id=current_user.user_id,
            payment_method=payload.payment_method
        )
        return receipt

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

    except Exception as e:
        print(e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="영수증 생성 중 오류가 발생했습니다."
        )