from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, String, text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base


class Cart(Base):
    __tablename__ = "cart"

    cart_id = Column(Integer, primary_key=True, index=True)

    user_id = Column(
        Integer,
        ForeignKey("user.user_id"),
        nullable=False
    )

    status = Column(
        String(20),
        nullable=False,
        server_default=text("'ACTIVE'")
    )

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        server_onupdate=func.now()
    )

    # 관계
    user = relationship(
        "User",
        back_populates="cart"
    )

    items = relationship(
        "CartItem",
        back_populates="cart",
        cascade="all, delete-orphan"
    )
