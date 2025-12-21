from sqlalchemy import Column, Integer, String, ForeignKey
from app.database.database import Base

class ProductAttributeValue(Base):
    __tablename__ = "product_attribute_value"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.product_id"))
    attribute_id = Column(Integer, ForeignKey("product_attribute_key.attribute_id"))
    value = Column(String(50))
