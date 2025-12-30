from sqlalchemy import Column, BigInteger, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.database.database import Base


class Receipt(Base):
    __tablename__ = "receipts"

    receipt_id = Column(
        BigInteger,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("user.user_id"),
        nullable=False
    )

    total_amount = Column(Integer, nullable=False)
    payment_method = Column(String(30), nullable=False)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    # 관계

    user = relationship("User", back_populates="receipts")
    items = relationship(
        "ReceiptItem",
        back_populates="receipt",
        cascade="all, delete-orphan"
    )