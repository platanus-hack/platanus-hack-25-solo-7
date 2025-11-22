# Platanus Hack Backend

FastAPI backend with PostgreSQL, SQLAlchemy, and WorkOS AuthKit authentication.

## Prerequisites

- Python 3.9+
- PostgreSQL database
- WorkOS account with AuthKit enabled

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:

- `WORKOS_API_KEY` - Get from [WorkOS Dashboard](https://dashboard.workos.com)
- `WORKOS_CLIENT_ID` - Get from WorkOS Dashboard
- `WORKOS_COOKIE_PASSWORD` - Generate with: `openssl rand -base64 24`
- `DATABASE_URL` - PostgreSQL connection string

### 3. WorkOS Dashboard Configuration

In your [WorkOS Dashboard](https://dashboard.workos.com):

1. **Activate AuthKit** in the Overview section
2. **Configure Redirect URIs**:
   - Add `http://localhost:8000/callback`
   - Set as default redirect URI
3. **Configure Login Endpoint**:
   - Set to `http://localhost:8000/auth/login`
4. **Configure Logout Redirect**:
   - Set to `http://localhost:3000/` (your frontend URL)

### 4. Set Up Database

Make sure your PostgreSQL database is running. The application will automatically create tables on startup.

### 5. Run the Server

```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

### Authentication

- `GET /auth/login` - Redirect to WorkOS AuthKit for authentication
- `GET /auth/callback` - OAuth callback endpoint (handles WorkOS redirect)
- `GET /auth/logout` - Log out and clear session
- `GET /auth/me` - Get current authenticated user (protected)
- `GET /auth/status` - Check authentication status

### Health Check

- `GET /` - Basic health check
- `GET /health` - Detailed health check

## API Documentation

Once the server is running, visit:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Authentication Flow

1. Frontend redirects user to `/auth/login`
2. Backend redirects to WorkOS AuthKit
3. User authenticates with WorkOS
4. WorkOS redirects back to `/auth/callback` with authorization code
5. Backend exchanges code for user session
6. Backend sets encrypted session cookie (`wos-session`)
7. Backend redirects to frontend dashboard
8. Frontend makes authenticated requests with cookie

## Protected Routes

To protect a route, use the `require_auth` dependency:

```python
from fastapi import Depends
from app.dependencies import require_auth

@router.get("/protected")
async def protected_route(user: dict = Depends(require_auth)):
    return {"user": user}
```

## Development

The server runs with auto-reload enabled. Any changes to Python files will automatically restart the server.

## Project Structure

```
back/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration settings
│   ├── database.py          # Database connection
│   ├── dependencies.py      # Auth dependencies
│   ├── api/
│   │   ├── __init__.py
│   │   └── auth.py          # Auth endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── user.py          # User model
│   └── services/
│       ├── __init__.py
│       └── auth.py          # WorkOS client
├── requirements.txt
├── .env
├── .env.example
└── README.md
```
