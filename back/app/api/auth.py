from fastapi import APIRouter, Request, Depends, HTTPException, status
from fastapi.responses import RedirectResponse, JSONResponse
from sqlalchemy.orm import Session
from app.services.auth import (
    get_authorization_url,
    authenticate_with_code,
    get_logout_url
)
from app.dependencies import get_current_user, require_auth
from app.database import get_db
from app.models.user import User

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.get("/login")
async def login(state: str = None):
    """
    Redirect to WorkOS AuthKit for authentication.
    
    This endpoint initiates the authentication flow by redirecting
    the user to WorkOS's hosted authentication page.
    """
    authorization_url = get_authorization_url(state=state)
    print(f"Redirecting to: {authorization_url}")
    return RedirectResponse(url=authorization_url)


@router.get("/callback")
async def callback(
    code: str,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Handle OAuth callback from WorkOS.
    
    This endpoint:
    1. Exchanges the authorization code for user data and session
    2. Creates or updates the user in the database
    3. Sets the encrypted session cookie
    4. Redirects to the frontend dashboard
    """
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No authorization code provided"
        )
    
    try:
        # Exchange code for user session
        auth_data = await authenticate_with_code(code)
        user_data = auth_data["user"]
        sealed_session = auth_data["sealed_session"]
        
        # Create or update user in database
        user = db.query(User).filter(User.id == user_data.id).first()
        
        if user:
            # Update existing user
            user.email = user_data.email
            user.first_name = user_data.first_name
            user.last_name = user_data.last_name
            user.profile_picture_url = user_data.profile_picture_url
            user.email_verified = str(user_data.email_verified)
        else:
            # Create new user
            user = User(
                id=user_data.id,
                email=user_data.email,
                first_name=user_data.first_name,
                last_name=user_data.last_name,
                profile_picture_url=user_data.profile_picture_url,
                email_verified=str(user_data.email_verified)
            )
            db.add(user)
        
        db.commit()
        
        # Create response with redirect to frontend
        response = RedirectResponse(
            url="http://localhost:3000/dashboard",
            status_code=status.HTTP_302_FOUND
        )
        
        # Set secure session cookie
        response.set_cookie(
            key="wos-session",
            value=sealed_session,
            httponly=True,
            secure=False,  # Set to False for localhost development
            samesite="lax",
            max_age=3600 * 24 * 7  # 7 days
        )
        
        return response
        
    except Exception as e:
        print(f"Error in callback: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Authentication failed: {str(e)}"
        )


@router.get("/logout")
async def logout(request: Request):
    """
    Log out the current user.
    
    This endpoint:
    1. Gets the WorkOS logout URL
    2. Clears the session cookie
    3. Redirects to WorkOS logout page (which then redirects to your configured logout redirect)
    """
    session_cookie = request.cookies.get("wos-session")
    
    # Create response redirecting to home page
    response = RedirectResponse(
        url="http://localhost:3000/",
        status_code=status.HTTP_302_FOUND
    )
    
    # Clear the session cookie
    response.delete_cookie(key="wos-session")
    
    if session_cookie:
        try:
            # Get WorkOS logout URL
            logout_url = get_logout_url(session_cookie)
            response = RedirectResponse(
                url=logout_url,
                status_code=status.HTTP_302_FOUND
            )
            response.delete_cookie(key="wos-session")
        except Exception as e:
            print(f"Error getting logout URL: {e}")
    
    return response


@router.get("/me")
async def get_me(user: dict = Depends(require_auth)):
    """
    Get the current authenticated user.
    
    This is a protected endpoint that requires authentication.
    Returns the user's profile information.
    """
    return JSONResponse(content=user)


@router.get("/status")
async def auth_status(user: dict = Depends(get_current_user)):
    """
    Check authentication status.
    
    Returns whether the user is authenticated and their data if they are.
    """
    return JSONResponse(content={
        "authenticated": user is not None,
        "user": user
    })
