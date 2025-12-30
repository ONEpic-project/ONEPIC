from sqlalchemy import Column, BigInteger, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base


class ReceiptItem(Base):
    __tablename__ = "receipt_items"

    receipt_item_id = Column(
        BigInteger,
        primary_key=True
    )

    receipt_id = Column(
        BigInteger,
        ForeignKey("receipts.receipt_id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("product.product_id"),
        nullable=False
    )

    product_name = Column(String(100), nullable=False)
    price = Column(Integer, nullable=False)
    quantity = Column(Integer, nullable=False)

    # 관계
    receipt = relationship("Receipt", back_populates="items")
    product = relationship("Product")
