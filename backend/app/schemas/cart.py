from pydantic import BaseModel
from typing import List


class CartItemResponse(BaseModel):
    cart_item_id: int
    product_id: int
    name: str
    price: int
    quantity: int

    class Config:
        orm_mode = True


class CartResponse(BaseModel):
    cart_id: int | None
    total_price: int
    items: List[CartItemResponse]

    class Config:
        orm_mode = True

class AddCartItemRequest(BaseModel):
    product_id: int
    quantity: int = 1

class UpdateCartItemQuantityRequest(BaseModel):
    quantity: int

class ScanCartItemRequest(BaseModel):
    product_id: int
    quantity: int

class CreateCartFromScanRequest(BaseModel):
    items: List[ScanCartItemRequest]