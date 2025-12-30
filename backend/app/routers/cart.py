from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.schemas.cart import (
    CartResponse,
    AddCartItemRequest,
    UpdateCartItemQuantityRequest,
    CreateCartFromScanRequest,
)
from app.services.cart_service import (
    get_cart_by_user_id,
    calculate_cart_total,
    add_cart_item,
    update_cart_item_quantity,
    delete_cart_item,
    create_cart_from_scan,
    deactivate_cart_for_user,
)

router = APIRouter(prefix="/cart", tags=["Cart"])


# 내 장바구니 조회
@router.get("/me", response_model=CartResponse)
def get_my_cart(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    cart = get_cart_by_user_id(db, current_user.user_id)

    if not cart:
        return {
            "cart_id": None,
            "total_price": 0,
            "items": [],
        }

    return {
        "cart_id": cart.cart_id,
        "total_price": calculate_cart_total(cart),
        "items": [
            {
                "cart_item_id": item.cart_item_id,
                "product_id": item.product.product_id,
                "name": item.product.name,
                "price": item.product.price,
                "quantity": item.quantity,
            }
            for item in cart.items
        ],
    }


# 상품 추가
# Cart Page 전용: 이미 생성된 Cart에 상품 추가
@router.post("/items", status_code=status.HTTP_201_CREATED)
def add_item_to_cart(
    payload: AddCartItemRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        add_cart_item(
            db=db,
            user_id=current_user.user_id,
            product_id=payload.product_id,
            quantity=payload.quantity,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="상품을 장바구니에 추가할 수 없습니다.",
        )

    return {"message": "장바구니에 추가되었습니다."}


# 장바구니 상품 수량 변경 (0이면 삭제)
@router.patch("/items/{cart_item_id}")
def update_quantity(
    cart_item_id: int,
    payload: UpdateCartItemQuantityRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    item = update_cart_item_quantity(
        db=db,
        cart_item_id=cart_item_id,
        user_id=current_user.user_id,
        quantity=payload.quantity,
    )

    if item is None and payload.quantity > 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="장바구니 상품을 찾을 수 없습니다.",
        )

    return {"message": "수량 변경 완료"}



# 장바구니 상품 삭제
@router.delete("/items/{cart_item_id}")
def remove_item(
    cart_item_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    ok = delete_cart_item(
        db=db,
        cart_item_id=cart_item_id,
        user_id=current_user.user_id,
    )

    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="장바구니 상품을 찾을 수 없습니다.",
        )

    return {"message": "삭제 완료"}



@router.post("/preview")
def preview_cart(
    payload: CreateCartFromScanRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return create_cart_from_scan(db, current_user.user_id, payload.items)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/scan/sync")
def sync_scanned_cart(
    payload: CreateCartFromScanRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    스캔 화면에서 '구매하기' 버튼 클릭 시 호출.
    로컬에 저장된 장바구니 항목들을 DB에 덮어씁니다 (기존 Active Cart 교체).
    """
    create_cart_from_scan(db, current_user.user_id, payload.items)
    return {"message": "장바구니가 동기화되었습니다."}


@router.post("/checkout")
def checkout_cart(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    """
    최종 결제 완료 시 호출.
    현재 Active 상태인 Cart를 status=False로 변경합니다.
    """
    cart = deactivate_cart_for_user(db, current_user.user_id)
    if not cart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="진행 중인 장바구니가 없습니다.",
        )
    return {"message": "장바구니가 비활성화되었습니다."}
