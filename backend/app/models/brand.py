from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base

class Brand(Base):
    __tablename__ = "brand"

    brand_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    country = Column(String(50), nullable=False)
    manufacturer = Column(String(100), nullable=False)