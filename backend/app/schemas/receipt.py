from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


# ===== Request =====

class ReceiptItemCreate(BaseModel):
    product_id: int
    product_name: str
    price: int
    quantity: int


class ReceiptCreate(BaseModel):
    user_id: int
    items: List[ReceiptItemCreate] = Field(..., min_items=1)


# ===== Response =====

class ReceiptItemResponse(BaseModel):
    product_id: int
    product_name: str
    price: int
    quantity: int

    class Config:
        from_attributes = True


class ReceiptResponse(BaseModel):
    receipt_id: int
    payment_method: str
    total_amount: int
    created_at: datetime
    items: List[ReceiptItemResponse]

    class Config:
        from_attributes = True
