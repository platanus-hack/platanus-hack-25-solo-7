from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id"), unique=True, index=True)
    
    # Step 1: Basic Info
    dob_day = Column(String, nullable=True)
    dob_month = Column(String, nullable=True)
    dob_year = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)
    
    # Step 2: Work Info
    work_situation = Column(String, nullable=True)
    employer = Column(String, nullable=True)
    seniority_years = Column(String, nullable=True)
    seniority_months = Column(String, nullable=True)
    monthly_income = Column(String, nullable=True)
    
    # Step 3: Finances
    has_debts = Column(String, nullable=True)
    total_debts = Column(String, nullable=True)
    has_credit_card = Column(String, nullable=True)
    housing_type = Column(String, nullable=True)
    
    # Step 4: Additional Profile
    education_level = Column(String, nullable=True)
    profession = Column(String, nullable=True)
    
    # Step 5: Verification (Metadata)
    document_type = Column(String, nullable=True)
    document_number = Column(String, nullable=True)
    
    # Score Results
    score = Column(Integer, nullable=True)
    score_category = Column(String, nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    user = relationship("User", backref="profile")
