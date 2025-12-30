from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_db, get_current_user
from app.schemas.receipt import ReceiptCreate, ReceiptResponse
from app.services.receipt_service import (
    create_receipt_from_cart,
    get_receipts_by_user,
    get_receipt_detail
)
from app.models.user import User



router = APIRouter(
    prefix="/receipts",
    tags=["Receipts"]
)


@router.get("/me")
def get_my_receipts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    내 영수증 목록 조회
    """
    return get_receipts_by_user(db, current_user.user_id)


@router.get("/{receipt_id}")
def get_receipt(
    receipt_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    영수증 상세 조회
    """
    receipt = get_receipt_detail(db, receipt_id, current_user.user_id)
    if not receipt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="영수증을 찾을 수 없습니다."
        )
    return receipt


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