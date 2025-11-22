from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from app.models.profile import UserProfile
from app.schemas.profile import UserProfileCreate, UserProfileResponse
from app.dependencies import get_current_user, require_auth

router = APIRouter()

@router.post("/me/profile", response_model=UserProfileResponse)
def create_or_update_profile(
    profile_data: UserProfileCreate,
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    # Check if profile exists
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user["id"]).first()
    
    if profile:
        # Update existing profile
        for key, value in profile_data.dict(exclude_unset=True).items():
            setattr(profile, key, value)
    else:
        # Create new profile
        profile = UserProfile(**profile_data.dict(), user_id=current_user["id"])
        db.add(profile)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.get("/me/profile", response_model=UserProfileResponse)
def get_profile(
    current_user: User = Depends(require_auth),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user["id"]).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile
