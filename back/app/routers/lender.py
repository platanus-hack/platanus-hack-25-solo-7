from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel

from app.database import get_db
from app.models.loan_request import LoanRequest, LoanStatus
from app.models.loan_pool import LoanPool
from app.models.loan_bid import LoanBid
from app.api.auth import get_current_user

router = APIRouter(
    prefix="/lender",
    tags=["lender"],
)

class LenderStats(BaseModel):
    total_invested: float
    expected_return: float
    active_count: int

class Investment(BaseModel):
    id: int
    type: str  # "Loan" or "Pool"
    amount: float
    status: str
    member_count: int = 0

@router.get("/stats", response_model=LenderStats)
async def get_lender_stats(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # For now, return mock data
    # In production, you'd calculate based on actual investments
    return LenderStats(
        total_invested=0,
        expected_return=0,
        active_count=0
    )

@router.get("/investments", response_model=List[Investment])
async def get_lender_investments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # For now, return empty list
    # In production, you'd fetch actual investments linked to this user
    return []
