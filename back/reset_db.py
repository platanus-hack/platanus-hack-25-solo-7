"""
Script to drop and recreate all database tables.
Run this when you've added new columns to models.
"""
from app.database import Base, engine
from app.models import user, profile, loan_request, loan_bid, loan_pool, pool_bid
from sqlalchemy import text

print("Dropping all tables with CASCADE...")
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))
    conn.commit()

print("Creating all tables...")
Base.metadata.create_all(bind=engine)

print("Done! All tables have been recreated.")
