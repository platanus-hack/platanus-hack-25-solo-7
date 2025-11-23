from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class PoolStatus(str, enum.Enum):
    OPEN = "open"
    FUNDED = "funded"
    CLOSED = "closed"

class LoanPool(Base):
    __tablename__ = "loan_pools"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(Enum(PoolStatus), default=PoolStatus.OPEN)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)  # When bidding ends
    winning_bid_id = Column(Integer, nullable=True)  # FK to pool_bids.id
    
    # Relationships will be queried manually to avoid circular dependencies
