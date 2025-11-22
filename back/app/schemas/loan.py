from pydantic import BaseModel
from typing import Optional
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
