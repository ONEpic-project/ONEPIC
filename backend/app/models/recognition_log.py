from sqlalchemy import Column, Integer, DECIMAL, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.database.database import Base
from datetime import datetime

class RecognitionLog(Base):
    __tablename__ = "recognition_log"

    log_id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("product.product_id"))
    confidence = Column(DECIMAL(5, 2))
    created_at = Column(DateTime, default=datetime.utcnow)

    # ✅ 여기 추가
    product = relationship("Product")
