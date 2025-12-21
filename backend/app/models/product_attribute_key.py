from sqlalchemy import Column, Integer, String
from app.database.database import Base

class ProductAttributeKey(Base):
    __tablename__ = "product_attribute_key"

    attribute_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50))
