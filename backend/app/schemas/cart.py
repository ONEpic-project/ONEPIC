from pydantic import BaseModel
from typing import List

class CartItemResponse(BaseModel):
    cart_item_id: int
    product_id: int
    name: str
    price: int
    quantity: int

    class Config:
        from_attributes = True   # SQLAlchemy ORM 대응


class CartResponse(BaseModel):
    cart_id: int
    total_price: int
    items: List[CartItemResponse]

    class Config:
        from_attributes = True
