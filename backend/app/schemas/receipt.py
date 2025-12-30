from pydantic import BaseModel, Field
from typing import List
from datetime import datetime


# ===== Request =====

class ReceiptCreate(BaseModel):
    payment_method: str = Field(..., max_length=30)



# ===== Response =====

class ReceiptItemResponse(BaseModel):
    product_id: int
    product_name: str
    price: int
    quantity: int

    class Config:
        orm_mode = True


class ReceiptResponse(BaseModel):
    receipt_id: int
    total_amount: int
    payment_method: str
    created_at: datetime
    items: List[ReceiptItemResponse]

    class Config:
        orm_mode = True