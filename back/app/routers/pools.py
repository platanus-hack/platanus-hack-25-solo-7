from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from datetime import datetime

from app.database import get_db
from app.models.loan_pool import LoanPool, PoolStatus
from app.models.loan_request import LoanRequest, LoanStatus
from app.api.auth import get_current_user
from app.schemas.pool import PoolBidCreate, PoolBidResponse, PoolDetailResponse

router = APIRouter(
    prefix="/pools",
    tags=["pools"],
    responses={404: {"description": "Not found"}},
)

class PoolResponse(BaseModel):
    id: int
    status: str
    created_at: datetime
    member_count: int
    total_amount: float
    avg_interest_rate: float
    avg_credit_score: float
    
    class Config:
        from_attributes = True

@router.get("/test")
async def test_pools():
    return {"message": "Pools endpoint is working"}

@router.get("/", response_model=List[PoolResponse])
async def get_pools(
    db: Session = Depends(get_db)
):
    try:
        pools = db.query(LoanPool).filter(LoanPool.status == PoolStatus.OPEN).all()
        
        response = []
        for pool in pools:
            # Query loans directly instead of using relationship
            loans = db.query(LoanRequest).filter(LoanRequest.pool_id == pool.id).all()
            if not loans:
                continue
                
            total_amount = float(sum([l.amount for l in loans]))
            avg_rate = float(sum([l.interest_rate for l in loans]) / len(loans))
            avg_score = float(sum([l.credit_score for l in loans if l.credit_score]) / len(loans))
            
            response.append(PoolResponse(
                id=pool.id,
                status=pool.status.value,  # Convert enum to string
                created_at=pool.created_at,
                member_count=len(loans),
                total_amount=total_amount,
                avg_interest_rate=avg_rate,
                avg_credit_score=avg_score
            ))
            
        return response
    except Exception as e:
        print(f"Error in get_pools: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{pool_id}", response_model=PoolDetailResponse)
async def get_pool_detail(
    pool_id: int,
    db: Session = Depends(get_db)
):
    from app.models.pool_bid import PoolBid
    from app.schemas.pool import PoolDetailResponse
    
    pool = db.query(LoanPool).filter(LoanPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Bolsa no encontrada")
    
    # Get loans in pool
    loans = db.query(LoanRequest).filter(LoanRequest.pool_id == pool_id).all()
    
    # Get bids for this pool
    bids = db.query(PoolBid).filter(PoolBid.pool_id == pool_id).all()
    
    # Calculate stats
    total_amount = float(sum([l.amount for l in loans])) if loans else 0
    avg_rate = float(sum([l.interest_rate for l in loans]) / len(loans)) if loans else 0
    avg_score = float(sum([l.credit_score for l in loans if l.credit_score]) / len(loans)) if loans else 0
    
    # Get best bid
    best_bid = min([b.interest_rate for b in bids]) if bids else None
    
    # Simplified loan data
    loans_data = [{"id": l.id, "amount": l.amount, "term_months": l.term_months} for l in loans]
    
    return PoolDetailResponse(
        id=pool.id,
        status=pool.status.value,
        created_at=pool.created_at,
        expires_at=pool.expires_at,
        member_count=len(loans),
        total_amount=total_amount,
        avg_interest_rate=avg_rate,
        avg_credit_score=avg_score,
        bids=bids,
        best_bid=best_bid,
        loans=loans_data
    )

@router.post("/{pool_id}/bid", response_model=PoolBidResponse)
async def place_pool_bid(
    pool_id: int,
    bid: PoolBidCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    from app.models.pool_bid import PoolBid
    from app.schemas.pool import PoolBidCreate, PoolBidResponse
    
    pool = db.query(LoanPool).filter(LoanPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Bolsa no encontrada")
    
    if pool.status != PoolStatus.OPEN:
        raise HTTPException(status_code=400, detail="Esta bolsa ya no está disponible")
    
    # Check if any loan in pool belongs to current user
    loans = db.query(LoanRequest).filter(LoanRequest.pool_id == pool_id).all()
    if any(l.user_id == current_user["id"] for l in loans):
        raise HTTPException(status_code=400, detail="No puedes pujar en una bolsa que contiene tu préstamo")
    
    # Get current best bid
    existing_bids = db.query(PoolBid).filter(PoolBid.pool_id == pool_id).all()
    current_best = min([b.interest_rate for b in existing_bids]) if existing_bids else float('inf')
    
    if bid.interest_rate >= current_best:
        raise HTTPException(status_code=400, detail=f"Tu oferta debe ser menor a la mejor tasa actual ({current_best*100}%)")
    
    new_bid = PoolBid(
        pool_id=pool_id,
        lender_id=current_user["id"],
        interest_rate=bid.interest_rate
    )
    
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    
    return new_bid

@router.post("/{pool_id}/invest")
async def invest_in_pool(
    pool_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    pool = db.query(LoanPool).filter(LoanPool.id == pool_id).first()
    if not pool:
        raise HTTPException(status_code=404, detail="Bolsa no encontrada")
        
    if pool.status != PoolStatus.OPEN:
        raise HTTPException(status_code=400, detail="Esta bolsa ya no está disponible")
        
    # Mark pool as funded
    pool.status = PoolStatus.FUNDED
    
    # Mark all loans in pool as funded
    for loan in pool.loans:
        loan.status = LoanStatus.FUNDED
        
    db.commit()
    
    return {"message": "Inversión exitosa en la bolsa"}
