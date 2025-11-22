from pydantic import BaseModel
from typing import Optional

class UserProfileBase(BaseModel):
    dob_day: Optional[str] = None
    dob_month: Optional[str] = None
    dob_year: Optional[str] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    city: Optional[str] = None
    
    work_situation: Optional[str] = None
    employer: Optional[str] = None
    seniority_years: Optional[str] = None
    seniority_months: Optional[str] = None
    monthly_income: Optional[str] = None
    
    has_debts: Optional[str] = None
    total_debts: Optional[str] = None
    has_credit_card: Optional[str] = None
    housing_type: Optional[str] = None
    
    education_level: Optional[str] = None
    profession: Optional[str] = None
    
    document_type: Optional[str] = None
    document_number: Optional[str] = None
    
    score: Optional[int] = None
    score_category: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfileResponse(UserProfileBase):
    id: int
    user_id: str

    class Config:
        from_attributes = True
