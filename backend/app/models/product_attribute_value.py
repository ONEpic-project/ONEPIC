from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.database import Base

class ProductAttributeValue(Base):
    __tablename__ = "product_attribute_value"

    product_id = Column(Integer, ForeignKey("product.product_id"), primary_key=True)
    attribute_id = Column(Integer, ForeignKey("product_attribute_key.attribute_id"), primary_key=True)
    value = Column(String(50))
