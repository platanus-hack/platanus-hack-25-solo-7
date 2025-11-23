from sqlalchemy import Column, Integer, String, Float, Enum, DateTime, ForeignKey, Boolean, DateTime, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base
import enum

class LoanStatus(str, enum.Enum):
    PENDING = "pending"
    FUNDED = "funded"
    REJECTED = "rejected"
    PAID = "paid"

class LoanRequest(Base):
    __tablename__ = "loan_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), index=True)
    
    amount = Column(Float, nullable=False)
    term_months = Column(Integer, nullable=False)
    interest_rate = Column(Float, nullable=False) # Annual interest rate (e.g. 0.15 for 15%)
    
    status = Column(String, default=LoanStatus.PENDING)
    
    # Snapshot of profile data at time of request (optional but good for history)
    credit_score = Column(Integer, nullable=True)
    purpose = Column(String, nullable=False, default="Propósito no especificado")
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="loan_requests")
    # bids = relationship("LoanBid", back_populates="loan")  # Commented out due to circular import
    
    pool_id = Column(Integer, nullable=True)  # FK to loan_pools.id
    wants_pool = Column(Boolean, default=False)
