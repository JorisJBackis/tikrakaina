"""Database models and configuration for the backend."""

from sqlalchemy import create_engine, Column, String, Integer, DateTime, Enum, JSON, UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.sql import func
from datetime import datetime, timedelta, timezone
import enum
import os
from supabase import create_client, Client
from dotenv import load_dotenv
import uuid
from typing import Optional, Dict, Any

load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://tzftzmqntxnijkfvvtfz.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", os.getenv("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6ZnR6bXFudHhuaWprZnZ2dGZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2ODc1MjYsImV4cCI6MjA3MzI2MzUyNn0.DmB62peSn1NHB_5lQPgy2cYyqqIMNOUmXaHz0ccxv4Q"))

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Database URL for SQLAlchemy (if using direct PostgreSQL connection)
# Note: psql uses postgres://, but SQLAlchemy needs postgresql://
DATABASE_URL = os.getenv("DATABASE_URL", f"postgresql://postgres:{os.getenv('SUPABASE_DB_PASSWORD', '')}@db.tzftzmqntxnijkfvvtfz.supabase.co:6543/postgres")

# Create SQLAlchemy engine (convert postgres:// to postgresql:// if needed)
if "SUPABASE_DB_PASSWORD" in os.environ:
    db_url = DATABASE_URL.replace("postgres://", "postgresql://")
    engine = create_engine(db_url)
else:
    engine = None
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None
Base = declarative_base()

class PaymentStatus(enum.Enum):
    """Payment attempt status enum."""
    INIT = "INIT"
    REDIRECTED = "REDIRECTED"
    PAID = "PAID"
    CANCELLED = "CANCELLED"
    FAILED = "FAILED"

class PaymentAttempt(Base):
    """Model for tracking SumUp payment attempts."""
    __tablename__ = "payment_attempts"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    ref = Column(String, unique=True, nullable=False, index=True)  # checkout_reference we send to SumUp
    amount_cents = Column(Integer, nullable=False, default=100)  # 100 = €1
    currency = Column(String, nullable=False, default="EUR")
    status = Column(Enum(PaymentStatus), nullable=False, default=PaymentStatus.INIT)
    sumup_checkout_id = Column(String, nullable=True)  # if created via API
    sumup_transaction_code = Column(String, nullable=True, index=True)  # e.g. XUEAYFL90...
    sumup_raw = Column(JSON, nullable=True)  # last payload from SumUp for auditing
    credits_purchased = Column(Integer, nullable=False, default=1)  # Number of credits for this payment
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def to_dict(self):
        """Convert to dictionary for JSON response."""
        return {
            "id": self.id,
            "ref": self.ref,
            "amountCents": self.amount_cents,
            "currency": self.currency,
            "status": self.status.value if self.status else None,
            "sumupCheckoutId": self.sumup_checkout_id,
            "transactionCode": self.sumup_transaction_code,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "updatedAt": self.updated_at.isoformat() if self.updated_at else None,
        }

# Create tables if using SQLAlchemy directly
if engine:
    Base.metadata.create_all(bind=engine)

# Helper functions for Supabase operations
async def create_payment_attempt(ref: str, amount_cents: int = 100, currency: str = "EUR", credits_purchased: int = 1, user_id: str = None):
    """Create a new payment attempt in Supabase."""
    data = {
        "ref": ref,
        "amount_cents": amount_cents,
        "currency": currency,
        "status": PaymentStatus.INIT.value,
        "credits_purchased": credits_purchased,
        "user_id": user_id,
        "created_at": datetime.utcnow().isoformat(),
        "updated_at": datetime.utcnow().isoformat(),
    }

    result = supabase.table("payment_attempts").insert(data).execute()
    return result.data[0] if result.data else None

async def add_credits_to_user(user_id: str, credits_to_add: int):
    """Add credits to a user's account after successful payment."""
    if not user_id:
        return False

    try:
        # Check if user has credits record
        result = supabase.table("user_credits").select("*").eq("user_id", user_id).execute()

        if result.data and len(result.data) > 0:
            # Update existing record
            current_credits = result.data[0].get("credits", 0)
            total_purchased = result.data[0].get("total_purchased", 0)

            supabase.table("user_credits").update({
                "credits": current_credits + credits_to_add,
                "total_purchased": total_purchased + credits_to_add,
                "updated_at": datetime.utcnow().isoformat()
            }).eq("user_id", user_id).execute()
        else:
            # Create new record
            supabase.table("user_credits").insert({
                "user_id": user_id,
                "credits": credits_to_add,
                "total_purchased": credits_to_add,
                "updated_at": datetime.utcnow().isoformat()
            }).execute()

        return True
    except Exception as e:
        print(f"Error adding credits to user {user_id}: {e}")
        return False

async def add_credits_for_payment_atomic(ref: str) -> int:
    """Atomically add credits for a payment using database-level locking.
    Returns credits added (0 if already processed), or -1 on error."""
    try:
        result = supabase.rpc('add_credits_for_payment', {'payment_ref': ref}).execute()
        return result.data if isinstance(result.data, int) else 0
    except Exception as e:
        print(f"Error in atomic credit addition for payment {ref}: {e}")
        return -1

async def get_payment_attempt(ref: str):
    """Get a payment attempt by reference."""
    result = supabase.table("payment_attempts").select("*").eq("ref", ref).execute()
    return result.data[0] if result.data else None

async def update_payment_attempt(ref: str, updates: dict):
    """Update a payment attempt."""
    updates["updated_at"] = datetime.utcnow().isoformat()
    result = supabase.table("payment_attempts").update(updates).eq("ref", ref).execute()
    return result.data[0] if result.data else None

async def list_payment_attempts(limit: int = 10):
    """List recent payment attempts."""
    result = supabase.table("payment_attempts").select("*").order("created_at", desc=True).limit(limit).execute()
    # Transform snake_case to camelCase for frontend
    transformed_data = []
    for item in result.data:
        transformed_data.append({
            "ref": item.get("ref"),
            "amountCents": item.get("amount_cents", 100),
            "currency": item.get("currency", "EUR"),
            "status": item.get("status", "INIT"),
            "transactionCode": item.get("sumup_transaction_code"),
            "createdAt": item.get("created_at"),
            "updatedAt": item.get("updated_at")
        })
    return transformed_data

# Dependency for FastAPI routes
def get_db():
    """Get database session."""
    if SessionLocal:
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    else:
        # If no direct DB connection, return None (use Supabase client directly)
        yield None

# ============================================================================
# TOKEN MANAGEMENT FUNCTIONS
# ============================================================================

def get_sumup_token(mode: str = "test") -> Optional[Dict[str, Any]]:
    """Get SumUp token from database."""
    result = supabase.table("sumup_tokens").select("*").eq("mode", mode).execute()
    if result.data and len(result.data) > 0:
        return result.data[0]
    return None

def save_sumup_token(
    mode: str,
    access_token: str,
    refresh_token: Optional[str] = None,
    expires_in: Optional[int] = None
) -> Dict[str, Any]:
    """Save or update SumUp token in database."""
    # Calculate expiry time (if expires_in provided)
    expires_at = None
    if expires_in:
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat()

    token_data = {
        "mode": mode,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "expires_at": expires_at,
        "updated_at": datetime.now(timezone.utc).isoformat()
    }

    # Check if token exists
    existing = get_sumup_token(mode)

    if existing:
        # Update existing token
        result = supabase.table("sumup_tokens").update(token_data).eq("mode", mode).execute()
    else:
        # Insert new token
        result = supabase.table("sumup_tokens").insert(token_data).execute()

    if result.data and len(result.data) > 0:
        return result.data[0]
    raise Exception(f"Failed to save token: {result}")

def is_token_expired(token: Dict[str, Any]) -> bool:
    """Check if token is expired."""
    if not token.get("expires_at"):
        # If no expiry set, assume it's valid for 15 minutes from last update
        updated_at = datetime.fromisoformat(token["updated_at"].replace("Z", "+00:00"))
        return datetime.now(timezone.utc) > updated_at + timedelta(minutes=15)

    expires_at = datetime.fromisoformat(token["expires_at"].replace("Z", "+00:00"))
    # Consider expired if less than 1 minute remaining
    return datetime.now(timezone.utc) > expires_at - timedelta(minutes=1)