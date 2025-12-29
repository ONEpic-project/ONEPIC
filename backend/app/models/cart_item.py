from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import text
from app.database.database import Base


class CartItem(Base):
    __tablename__ = "cart_item"

    cart_item_id = Column(Integer, primary_key=True, index=True)

    cart_id = Column(
        Integer,
        ForeignKey("cart.cart_id"),
        nullable=False
    )

    product_id = Column(
        Integer,
        ForeignKey("product.product_id"),
        nullable=False
    )

    quantity = Column(
        Integer,
        nullable=False,
        server_default=text("1")
    )

    # 관계
    cart = relationship(
        "Cart",
        back_populates="items"
    )

    product = relationship(
        "Product"
    )
