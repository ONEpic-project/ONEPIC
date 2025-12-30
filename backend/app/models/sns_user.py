from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, func
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta

from app.database.database import Base

def kst_now():
    return datetime.utcnow() + timedelta(hours=9)

class SNSUser(Base):
    __tablename__ = "sns_user"

    sns_user_id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # 1:1 관계 - 하나의 SNS 연동 정보는 반드시 하나의 실제 User와 연결됨
    user_id = Column(Integer, ForeignKey("user.user_id"), nullable=False)
    
    sns_type = Column(String(20), nullable=False)  # 'kakao', 'google', etc.
    sns_id = Column(String(100), nullable=False, unique=True) # 각 플랫폼별 고유 ID
    
    connected_at = Column(
        DateTime,
        nullable=False,
        default=kst_now
    )

    # User 모델과 관계 설정 (User 모델에도 back_populates 추가 필요할 수 있음)
    user = relationship("User", backref="sns_info")
