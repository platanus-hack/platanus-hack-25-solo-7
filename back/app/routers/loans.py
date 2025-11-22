from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models.loan_request import LoanRequest, LoanStatus
from app.models.profile import UserProfile
from app.schemas.loan import LoanRequestCreate, LoanRequestResponse
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
        
    new_loan = LoanRequest(
        user_id=user_id,
        amount=loan.amount,
        term_months=loan.term_months,
        interest_rate=interest_rate,
        status=LoanStatus.PENDING,
        credit_score=score
    )
    
    db.add(new_loan)
    db.commit()
    db.refresh(new_loan)
    
    return new_loan

@router.get("/", response_model=List[LoanRequestResponse])
async def get_loan_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
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
