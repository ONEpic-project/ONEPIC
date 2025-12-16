from sqlalchemy import Column, Integer, DateTime, ForeignKey
from sqlalchemy.sql import func

from app.database.database import Base


class AIProductMapping(Base):
    __tablename__ = "ai_product_mapping"

    ai_product_mapping_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    class_id = Column(Integer, nullable=False)

    product_id = Column(
        Integer,
        ForeignKey("product.product_id"),
        nullable=False
    )

    is_active = Column(Integer, nullable=False, default=1)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )
