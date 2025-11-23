import os
import certifi
from fastapi import FastAPI

# Fix for macOS SSL certificate issue
os.environ["SSL_CERT_FILE"] = certifi.where()

from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.database import init_db
from app.config import settings

# Create FastAPI application
app = FastAPI(
    title="Platanus Hack Backend",
    description="Backend API with WorkOS AuthKit authentication",
    version="1.0.0"
)

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.auth import router as auth_router
from app.api.users import router as users_router
from app.routers import loans, pools, lender

app.include_router(auth_router)
app.include_router(users_router, prefix="/users", tags=["users"])
app.include_router(loans.router, prefix="/loans", tags=["loans"])
app.include_router(pools.router)
app.include_router(lender.router)


import asyncio
from app.database import init_db, SessionLocal
from app.services.pool_service import process_expired_pools

async def check_expired_pools_loop():
    """Background task to check for expired pools periodically."""
    while True:
        try:
            # Create a new DB session
            db = SessionLocal()
            try:
                results = process_expired_pools(db)
                if results:
                    print(f"Background task processed pools: {results}")
            finally:
                db.close()
        except Exception as e:
            print(f"Error in background pool check: {e}")
        
        # Wait for 60 seconds before next check
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup_event():
    """Initialize database on application startup."""
    print("🚀 Starting application...")
    print(f"📊 Initializing database...")
    init_db()
    print("✅ Database initialized")
    
    # Start background task
    asyncio.create_task(check_expired_pools_loop())
    print("⏰ Background pool expiration task started")


@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "ok",
        "message": "Platanus Hack Backend API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health():
    """Detailed health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "auth": "workos-authkit"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
