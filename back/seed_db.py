"""
Script to seed the database with sample loan pools and requests.
"""
from app.database import SessionLocal, Base, engine
from datetime import datetime, timedelta

# Import all models to ensure they're registered
from app.models import user, profile, loan_request, loan_bid, loan_pool

# Now import the classes
from app.models.user import User
from app.models.profile import UserProfile
from app.models.loan_request import LoanRequest, LoanStatus
from app.models.loan_pool import LoanPool, PoolStatus

db = SessionLocal()

try:
    # Create sample users
    users = []
    for i in range(10):
        user = User(
            id=f"user_{i+1}",
            email=f"user{i+1}@example.com",
            first_name=f"Usuario{i+1}",
            last_name=f"Apellido{i+1}"
        )
        db.add(user)
        users.append(user)
    
    db.commit()
    print(f"Created {len(users)} users")

    # Create profiles for users
    for i, user in enumerate(users):
        profile = UserProfile(
            user_id=user.id,
            work_situation="Empleado",
            employer=f"Empresa {i+1}",
            seniority_years="3",
            seniority_months="6",
            monthly_income=str(1500000 + (i * 200000)),
            profession=f"Profesión {i+1}",
            score=650 + (i * 15),
            score_category="Bueno" if 650 + (i * 15) >= 700 else "Regular"
        )
        db.add(profile)
    
    db.commit()
    print(f"Created {len(users)} profiles")



    # Create loan requests and assign to pools
    # Create individual loan request
    print("Creating individual loan request...")
    loan1 = LoanRequest(
        user_id=users[0].id,
        amount=5000000,
        term_months=24,
        interest_rate=0.15,
        status=LoanStatus.PENDING,
        credit_score=750,
        purpose="Renovación de cocina y baño"
    )
    db.add(loan1)
    
    # Create pools with loans
    print("Creating pools...")
    pool_purposes = [
        "Consolidación de deuda", "Capital de trabajo", "Compra de vehículo", 
        "Gastos médicos", "Educación", "Viaje familiar", "Reparaciones del hogar",
        "Inversión en negocio", "Compra de equipos", "Evento familiar"
    ]
    
    for i in range(3):
        # Set expiration to 24 hours from now
        expires_at = datetime.now() + timedelta(hours=24)
        pool = LoanPool(status=PoolStatus.OPEN, expires_at=expires_at)
        db.add(pool)
        db.commit()
        db.refresh(pool)
        
        # Add 3 loans to each pool
        for j in range(3):
            user_idx = (i * 3 + j + 1) % len(users)
            loan = LoanRequest(
                user_id=users[user_idx].id,
                amount=2000000 * (j + 1),
                term_months=12 * (j + 1),
                interest_rate=0.12 + (j * 0.02),
                status=LoanStatus.PENDING,
                credit_score=600 + (j * 50),
                pool_id=pool.id,
                wants_pool=True,
                purpose=pool_purposes[i * 3 + j]
            )
            db.add(loan)
            
    db.commit()
    print(f"Created {len(users)} loan requests")
    print(f"Pool 1: 3 loans")
    print(f"Pool 2: 3 loans")
    print(f"Pool 3: 3 loans")
    print(f"Individual loans: 1")
    
    print("\n✅ Database seeded successfully!")

except Exception as e:
    print(f"❌ Error seeding database: {e}")
    db.rollback()
finally:
    db.close()
