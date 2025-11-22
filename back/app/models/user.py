from sqlalchemy import Column, String, DateTime, JSON
from sqlalchemy.sql import func
from app.database import Base


class User(Base):
    """User model for storing WorkOS authenticated users."""
    
    __tablename__ = "users"
    
    # WorkOS user ID as primary key
    id = Column(String, primary_key=True, index=True)
    
    # User information
    email = Column(String, unique=True, index=True, nullable=False)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    
    # WorkOS metadata
    profile_picture_url = Column(String, nullable=True)
    email_verified = Column(String, nullable=True)  # Boolean stored as string from WorkOS
    
    # Additional metadata from WorkOS
    user_metadata = Column(JSON, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    def __repr__(self):
        return f"<User {self.email}>"
