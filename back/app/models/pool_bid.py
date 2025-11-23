from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class PoolBid(Base):
    __tablename__ = "pool_bids"

    id = Column(Integer, primary_key=True, index=True)
    pool_id = Column(Integer, ForeignKey("loan_pools.id"), index=True)
    lender_id = Column(String, ForeignKey("users.id"), index=True)
    
    interest_rate = Column(Float, nullable=False)  # The bid rate for the entire pool
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships queried manually to avoid circular dependencies
    lender = relationship("User", backref="pool_bids")
