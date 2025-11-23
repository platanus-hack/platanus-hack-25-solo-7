from fastapi import Request, HTTPException, status
from typing import Optional
from app.services.auth import load_sealed_session


from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User
from fastapi import Depends

async def get_current_user(request: Request, db: Session = Depends(get_db)) -> Optional[dict]:
    """
    Dependency to get the current authenticated user.
    Ensures user exists in local database.
    """
    session_cookie = request.cookies.get("wos-session")
    
    if not session_cookie:
        return None
    
    try:
        session = load_sealed_session(session_cookie)
        auth_response = session.authenticate()
        
        user_data = None
        
        if auth_response.authenticated:
            user_data = auth_response.user
        elif auth_response.reason != "no_session_cookie_provided":
            # Try refresh
            try:
                refresh_response = session.refresh()
                if refresh_response.authenticated:
                    user_data = refresh_response.user
            except Exception:
                pass
        
        if user_data:
            # Sync with local DB
            db_user = db.query(User).filter(User.id == user_data.id).first()
            if not db_user:
                print(f"Syncing user {user_data.id} to local DB")
                new_user = User(
                    id=user_data.id,
                    email=user_data.email,
                    first_name=user_data.first_name,
                    last_name=user_data.last_name,
                    profile_picture_url=user_data.profile_picture_url,
                    email_verified=str(user_data.email_verified)
                )
                db.add(new_user)
                db.commit()
            
            return {
                "id": user_data.id,
                "email": user_data.email,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
                "profile_picture_url": user_data.profile_picture_url,
                "email_verified": user_data.email_verified
            }
            
        return None
        
    except Exception as e:
        print(f"Error authenticating user: {e}")
        return None


async def require_auth(request: Request) -> dict:
    """
    Dependency that requires authentication.
    
    Args:
        request: FastAPI request object
        
    Returns:
        User dict
        
    Raises:
        HTTPException: If user is not authenticated
    """
    user = await get_current_user(request)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required"
        )
    
    return user
