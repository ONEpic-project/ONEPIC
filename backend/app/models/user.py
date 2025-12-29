# app/models/user.py

from sqlalchemy import Column, Integer, String, DateTime, func
from sqlalchemy.orm import relationship

from app.database.database import Base


class User(Base):
    __tablename__ = "user"

    user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    login_id = Column(String(50), nullable=False, unique=True, index=True)
    password = Column(String(255), nullable=False)
    username = Column(String(50), nullable=False)
    phone = Column(String(20), nullable=False, unique=True)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    # 1:1 Cart
    cart = relationship(
        "Cart",
        back_populates="user",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # 1:N Receipts
    receipts = relationship(
        "Receipt",
        back_populates="user",
        cascade="all, delete-orphan"
    )
