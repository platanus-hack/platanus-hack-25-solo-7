from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class LoanStatus(str, Enum):
    PENDING = "pending"
    FUNDED = "funded"
    REJECTED = "rejected"
    PAID = "paid"

class LoanRequestBase(BaseModel):
    amount: float
    term_months: int
    wants_pool: Optional[bool] = False
    purpose: str

class LoanRequestCreate(LoanRequestBase):
    pass

class LoanRequestResponse(LoanRequestBase):
    id: int
    user_id: str
    interest_rate: float
    status: LoanStatus
    credit_score: Optional[int] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserProfileSimple(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    work_situation: Optional[str] = None
    employer: Optional[str] = None
    seniority_years: Optional[str] = None
    seniority_months: Optional[str] = None
    monthly_income: Optional[str] = None
    score: Optional[int] = None
    score_category: Optional[str] = None
    profession: Optional[str] = None
    
    class Config:
        from_attributes = True

class LoanBidBase(BaseModel):
    interest_rate: float

class LoanBidCreate(LoanBidBase):
    pass

class LoanBidResponse(LoanBidBase):
    id: int
    lender_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class LoanRequestDetail(LoanRequestResponse):
    borrower: Optional[UserProfileSimple] = None
    bids: List[LoanBidResponse] = []
    best_bid: Optional[float] = None
