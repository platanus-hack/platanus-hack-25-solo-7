from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class PoolBidBase(BaseModel):
    interest_rate: float

class PoolBidCreate(PoolBidBase):
    pass

class PoolBidResponse(PoolBidBase):
    id: int
    lender_id: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class PoolDetailResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    expires_at: Optional[datetime] = None
    member_count: int
    total_amount: float
    avg_interest_rate: float
    avg_credit_score: float
    bids: List[PoolBidResponse] = []
    best_bid: Optional[float] = None
    loans: List[dict] = []  # Simplified loan data
    
    class Config:
        from_attributes = True
