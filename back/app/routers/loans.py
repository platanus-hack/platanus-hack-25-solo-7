from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.loan_request import LoanRequest, LoanStatus
from app.models.loan_bid import LoanBid
from app.models.profile import UserProfile
from app.schemas.loan import LoanRequestCreate, LoanRequestResponse, LoanRequestDetail, UserProfileSimple, LoanBidCreate, LoanBidResponse
from app.api.auth import get_current_user

router = APIRouter()

@router.post("/", response_model=LoanRequestResponse)
async def create_loan_request(
    loan: LoanRequestCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_id = current_user["id"]
    
    # Get user profile to determine interest rate
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    
    if not profile:
        raise HTTPException(status_code=400, detail="Complete su perfil antes de solicitar un préstamo")
        
    # Simple interest rate logic based on score
    # Base rate 15%, discount for good score
    score = profile.score or 500
    base_rate = 0.25 # 25%
    
    if score >= 700:
        interest_rate = 0.12 # 12%
    elif score >= 600:
        interest_rate = 0.18 # 18%
    else:
        interest_rate = 0.25 # 25%
     # Create loan request
    new_loan = LoanRequest(
        user_id=user_id,
        amount=loan.amount,
        term_months=loan.term_months,
        interest_rate=interest_rate,
        status=LoanStatus.PENDING, # Ensure status is set
        credit_score=profile.score,
        wants_pool=loan.wants_pool,
        purpose=loan.purpose
    )
    
    # Handle Pool Logic
    if loan.wants_pool:
        from app.models.loan_pool import LoanPool, PoolStatus
        
        # Find an open pool with less than 5 members
        # This is a simplified logic. In production, we'd need better locking/concurrency handling.
        open_pools = db.query(LoanPool).filter(LoanPool.status == PoolStatus.OPEN).all()
        target_pool = None
        
        for pool in open_pools:
            if len(pool.loans) < 5:
                target_pool = pool
                break
        
        if not target_pool:
            # Create new pool
            target_pool = LoanPool(status=PoolStatus.OPEN)
            db.add(target_pool)
            db.commit()
            db.refresh(target_pool)
            
        new_loan.pool_id = target_pool.id

    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    
    return new_loan

@router.get("/", response_model=List[LoanRequestResponse])
async def get_loan_requests(
    db: Session = Depends(get_db)
):
    # For now, return all loans so lenders can see them
    # In a real app, we might filter by user or have a separate endpoint for lenders
    return db.query(LoanRequest).filter(LoanRequest.status == LoanStatus.PENDING).all()

@router.get("/my", response_model=List[LoanRequestResponse])
async def get_my_loan_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return db.query(LoanRequest).filter(LoanRequest.user_id == current_user["id"]).all()

@router.get("/{loan_id}", response_model=LoanRequestDetail)
async def get_loan_detail(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    loan = db.query(LoanRequest).filter(LoanRequest.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    # Fetch borrower profile
    profile = db.query(UserProfile).filter(UserProfile.user_id == loan.user_id).first()
    
    # Get user info for name
    from app.models.user import User
    user = db.query(User).filter(User.id == loan.user_id).first()
    
    # Construct response
    response = LoanRequestDetail.from_orm(loan)
    
    if profile:
        borrower_data = UserProfileSimple.from_orm(profile)
        if user:
            borrower_data.first_name = user.first_name
            borrower_data.last_name = user.last_name
        response.borrower = borrower_data
        
    # Calculate best bid
    bids = db.query(LoanBid).filter(LoanBid.loan_id == loan_id).all()
    if bids:
        response.best_bid = min([bid.interest_rate for bid in bids])
    else:
        response.best_bid = loan.interest_rate
    response.bids = bids
        
    return response

@router.post("/{loan_id}/bid", response_model=LoanBidResponse)
async def place_bid(
    loan_id: int,
    bid: LoanBidCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    loan = db.query(LoanRequest).filter(LoanRequest.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    if loan.user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="No puedes pujar en tu propia solicitud")
        
    if loan.status != LoanStatus.PENDING:
        raise HTTPException(status_code=400, detail="Esta solicitud ya no está disponible")
        
    # Check if bid is better than current best
    current_best = loan.interest_rate
    existing_bids = db.query(LoanBid).filter(LoanBid.loan_id == loan_id).all()
    if existing_bids:
        current_best = min([b.interest_rate for b in existing_bids])
        
    if bid.interest_rate >= current_best:
        raise HTTPException(status_code=400, detail=f"Tu oferta debe ser menor a la mejor tasa actual ({current_best*100}%)")
        
    new_bid = LoanBid(
        loan_id=loan_id,
        lender_id=current_user["id"],
        interest_rate=bid.interest_rate
    )
    
    db.add(new_bid)
    db.commit()
    db.refresh(new_bid)
    
    return new_bid

@router.post("/{loan_id}/accept-bid/{bid_id}", response_model=LoanRequestResponse)
async def accept_bid(
    loan_id: int,
    bid_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    loan = db.query(LoanRequest).filter(LoanRequest.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    # Only the borrower can accept bids
    if loan.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="Solo el solicitante puede aceptar ofertas")
    
    if loan.status != LoanStatus.PENDING:
        raise HTTPException(status_code=400, detail="Esta solicitud ya no está disponible")
    
    # Verify bid exists and belongs to this loan
    bid = db.query(LoanBid).filter(LoanBid.id == bid_id, LoanBid.loan_id == loan_id).first()
    if not bid:
        raise HTTPException(status_code=404, detail="Oferta no encontrada")
    
    # Accept the bid - update loan status and interest rate
    loan.status = LoanStatus.FUNDED
    loan.interest_rate = bid.interest_rate
    
    db.commit()
    db.refresh(loan)
    
    return loan

@router.post("/{loan_id}/close", response_model=LoanRequestResponse)
async def close_loan_request(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    loan = db.query(LoanRequest).filter(LoanRequest.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    
    if loan.user_id != current_user["id"]:
        raise HTTPException(status_code=403, detail="No tienes permiso para cerrar esta solicitud")
    
    if loan.status != LoanStatus.PENDING:
        raise HTTPException(status_code=400, detail="Solo se pueden cerrar solicitudes pendientes")
    
    loan.status = LoanStatus.REJECTED  # Or create a CLOSED status if preferred
    
    db.commit()
    db.refresh(loan)
    
    return loan

@router.post("/{loan_id}/invest", response_model=LoanRequestResponse)
async def invest_in_loan(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    loan = db.query(LoanRequest).filter(LoanRequest.id == loan_id).first()
    if not loan:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
        
    if loan.user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="No puedes invertir en tu propia solicitud")
        
    if loan.status != LoanStatus.PENDING:
        raise HTTPException(status_code=400, detail="Esta solicitud ya no está disponible")
        
    loan.status = LoanStatus.FUNDED
    db.commit()
    db.refresh(loan)
    
    return loan
