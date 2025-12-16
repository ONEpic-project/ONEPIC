from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.database import Base

class Category(Base):
    __tablename__ = "category"
    
    category_id = Column(Integer, primary_key=True)
    name = Column(String(100))
