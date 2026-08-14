from sqlalchemy.orm import Session
from sqlalchemy import func
from app.models.payment import Payment

class AccountDashboardService:
    @staticmethod
    def get_dashboard_summary(db: Session):
        total_payments = db.query(Payment).count()
        pending = db.query(Payment).filter(Payment.status == "PENDING").count()
        proof_uploaded = db.query(Payment).filter(Payment.status == "PROOF_UPLOADED").count()
        under_verification = db.query(Payment).filter(Payment.status == "UNDER_VERIFICATION").count()
        verified = db.query(Payment).filter(Payment.status == "VERIFIED").count()
        rejected = db.query(Payment).filter(Payment.status == "REJECTED").count()
        
        advance_50_pending = db.query(Payment).filter(
            Payment.payment_type == "ADVANCE_50",
            Payment.status.in_(["PENDING", "PROOF_UPLOADED"])
        ).count()
        
        final_payment_pending = db.query(Payment).filter(
            Payment.payment_type == "FINAL_PAYMENT",
            Payment.status.in_(["PENDING", "PROOF_UPLOADED"])
        ).count()
        
        total_collected = db.query(func.sum(Payment.paid_amount)).filter(Payment.status == "VERIFIED").scalar() or 0.0
        total_outstanding = db.query(func.sum(Payment.required_amount - Payment.paid_amount)).filter(Payment.status != "VERIFIED").scalar() or 0.0
        
        return {
            "total_payments": total_payments,
            "pending_payments": pending,
            "proof_uploaded": proof_uploaded,
            "under_verification": under_verification,
            "verified_payments": verified,
            "rejected_payments": rejected,
            "advance_50_pending": advance_50_pending,
            "final_payment_pending": final_payment_pending,
            "total_collected": total_collected,
            "total_outstanding": total_outstanding
        }
