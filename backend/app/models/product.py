from sqlalchemy import Column, Integer, String, Text, DateTime
from app.database import Base

class Product(Base):
    __tablename__ = "product"
    __table_args__ = {"schema": "onepic"}

    product_id = Column(Integer, primary_key=True, autoincrement=True)

    name = Column(String(200), nullable=False)

    brand_id = Column(Integer, nullable=True)
    category_id = Column(Integer, nullable=False)

    barcode = Column(String(50), unique=True, nullable=True)

    price = Column(Integer, nullable=True)

    image_url = Column(String(255), nullable=True)

    description = Column(Text, nullable=True)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default="CURRENT_TIMESTAMP",
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default="CURRENT_TIMESTAMP",
    )
