from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.database import Base
from app.models.category import Category
from app.models.brand import Brand

class Product(Base):
    __tablename__ = "product"

    product_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)

    brand_id = Column(Integer, ForeignKey("brand.brand_id"), nullable=True)
    category_id = Column(Integer, ForeignKey("category.category_id"), nullable=False)

    barcode = Column(String(50))
    price = Column(Integer)
    image_url = Column(String(255))
    description = Column(Text)
    created_at = Column(DateTime)
    updated_at = Column(DateTime)

    # 🔑 관계
    brand = relationship("Brand", backref="products")
    category = relationship("Category", backref="products")