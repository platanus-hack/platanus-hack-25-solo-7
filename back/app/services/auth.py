from workos import WorkOSClient
from app.config import settings

# Initialize WorkOS client
workos_client = WorkOSClient(
    api_key=settings.workos_api_key,
    client_id=settings.workos_client_id
)


def get_authorization_url(state: str = None) -> str:
    """
    Generate WorkOS authorization URL for AuthKit.
    
    Args:
        state: Optional state parameter to preserve application state
        
    Returns:
        Authorization URL to redirect user to
    """
    return workos_client.user_management.get_authorization_url(
        provider="authkit",
        redirect_uri=settings.workos_redirect_uri,
        state=state
    )


async def authenticate_with_code(code: str) -> dict:
    """
    Exchange authorization code for user session.
    
    Args:
        code: Authorization code from WorkOS callback
        
    Returns:
        Dictionary with user data and sealed session
    """
    auth_response = workos_client.user_management.authenticate_with_code(
        code=code,
        session={
            "seal_session": True,
            "cookie_password": settings.workos_cookie_password
        }
    )
    
    return {
        "user": auth_response.user,
        "sealed_session": auth_response.sealed_session,
        "access_token": auth_response.access_token,
        "refresh_token": auth_response.refresh_token
    }


def load_sealed_session(session_data: str):
    """
    Load and decrypt a sealed session.
    
    Args:
        session_data: Encrypted session cookie value
        
    Returns:
        Session object from WorkOS
    """
    return workos_client.user_management.load_sealed_session(
        sealed_session=session_data,
        cookie_password=settings.workos_cookie_password
    )


def get_logout_url(session_data: str) -> str:
    """
    Get the WorkOS logout URL for a session.
    
    Args:
        session_data: Encrypted session cookie value
        
    Returns:
        Logout URL to redirect user to
    """
    session = load_sealed_session(session_data)
    return session.get_logout_url()
