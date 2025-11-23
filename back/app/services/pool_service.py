from sqlalchemy.orm import Session
from datetime import datetime
from app.models.loan_pool import LoanPool, PoolStatus
from app.models.loan_request import LoanRequest, LoanStatus
from app.models.pool_bid import PoolBid

def process_expired_pools(db: Session):
    """
    Check for expired pools and process them.
    If a pool has bids, accept the best one.
    If not, close the pool.
    """
    now = datetime.now()
    
    # Find open pools that have expired
    expired_pools = db.query(LoanPool).filter(
        LoanPool.status == PoolStatus.OPEN,
        LoanPool.expires_at < now
    ).all()
    
    results = []
    
    for pool in expired_pools:
        print(f"Processing expired pool {pool.id}...")
        
        # Get all bids for this pool
        bids = db.query(PoolBid).filter(PoolBid.pool_id == pool.id).all()
        
        if bids:
            # Find the best bid (lowest interest rate)
            # In case of tie, pick the earliest one (by ID or created_at)
            best_bid = min(bids, key=lambda b: (b.interest_rate, b.created_at))
            
            print(f"  Found winning bid: {best_bid.interest_rate*100}% by lender {best_bid.lender_id}")
            
            # Update pool
            pool.status = PoolStatus.FUNDED
            pool.winning_bid_id = best_bid.id
            
            # Update all loans in the pool
            loans = db.query(LoanRequest).filter(LoanRequest.pool_id == pool.id).all()
            for loan in loans:
                loan.status = LoanStatus.FUNDED
                loan.interest_rate = best_bid.interest_rate
                # Note: In a real app, we might want to record who funded it specifically for the loan
                # But for now, the pool association is enough
            
            results.append(f"Pool {pool.id} funded at {best_bid.interest_rate*100}%")
            
        else:
            # No bids, close the pool? Or leave it open?
            # For now, let's close it to avoid stuck pools
            print(f"  No bids found. Closing pool {pool.id}.")
            pool.status = PoolStatus.CLOSED
            results.append(f"Pool {pool.id} closed (no bids)")
            
    if expired_pools:
        db.commit()
        
    return results
