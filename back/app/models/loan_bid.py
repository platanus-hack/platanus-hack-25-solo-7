from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class LoanBid(Base):
    __tablename__ = "loan_bids"

    id = Column(Integer, primary_key=True, index=True)
    loan_id = Column(Integer, ForeignKey("loan_requests.id"), index=True)
    lender_id = Column(String, ForeignKey("users.id"), index=True)
    
    interest_rate = Column(Float, nullable=False) # The bid rate
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    loan = relationship("LoanRequest")  # Removed back_populates
    lender = relationship("User", backref="bids")
