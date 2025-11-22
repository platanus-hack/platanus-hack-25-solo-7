from fastapi import Request, HTTPException, status
from typing import Optional
from app.services.auth import load_sealed_session


async def get_current_user(request: Request) -> Optional[dict]:
    """
    Dependency to get the current authenticated user.
    
    Args:
        request: FastAPI request object
        
    Returns:
        User dict or None if not authenticated
        
    Raises:
        HTTPException: If session is invalid or expired
    """
    session_cookie = request.cookies.get("wos-session")
    
    if session_cookie:
        print(f"Session cookie received: {session_cookie[:10]}...")
    else:
        print("No session cookie found")
    
    if not session_cookie:
        print("No session cookie found")
        return None
    
    try:
        session = load_sealed_session(session_cookie)
        auth_response = session.authenticate()
        
        if auth_response.authenticated:
            print(f"User authenticated: {auth_response.user.email}")
            return {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "first_name": auth_response.user.first_name,
                "last_name": auth_response.user.last_name,
                "profile_picture_url": auth_response.user.profile_picture_url,
                "email_verified": auth_response.user.email_verified
            }
        
        print(f"Authentication failed: {auth_response.reason}")
        
        # Try to refresh the session
        if auth_response.reason != "no_session_cookie_provided":
            try:
                refresh_response = session.refresh()
                if refresh_response.authenticated:
                    print("Session refreshed successfully")
                    # Note: In a real scenario, you'd need to update the cookie
                    # This is handled in the middleware/endpoint level
                    return {
                        "id": refresh_response.user.id,
                        "email": refresh_response.user.email,
                        "first_name": refresh_response.user.first_name,
                        "last_name": refresh_response.user.last_name,
                        "profile_picture_url": refresh_response.user.profile_picture_url,
                        "email_verified": refresh_response.user.email_verified
                    }
            except Exception as e:
                print(f"Error refreshing session: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Session expired. Please log in again."
                )
        
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
