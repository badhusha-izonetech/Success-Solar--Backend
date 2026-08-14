from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.payment import Payment
from app.models.project import Project
from app.schema.payment import PaymentRejectRequest

class PaymentService:
    @staticmethod
    def verify_payment(db: Session, payment_id: int, employee_id: int):
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        if payment.status == "VERIFIED":
            raise HTTPException(status_code=409, detail="Payment is already verified")
            
        # Optional: Add checks for proofs if required by payment type
        
        payment.status = "VERIFIED"
        payment.verified_by = employee_id
        payment.verified_at = func.now()
        
        # If it's a 50% Advance Payment, we activate the project
        if payment.payment_type == "ADVANCE_50":
            if payment.project_id:
                project = db.query(Project).filter(Project.id == payment.project_id).first()
                if project:
                    project.stage = "ACTIVATED"
                    project.financial_status = "ADVANCE_PAID"
            else:
                # Assuming Project gets created if it doesn't exist
                pass
                
        # If it's a Final Payment
        if payment.payment_type == "FINAL_PAYMENT":
            if payment.project_id:
                project = db.query(Project).filter(Project.id == payment.project_id).first()
                if project:
                    project.financial_status = "FULLY_PAID"
        
        try:
            db.commit()
            db.refresh(payment)
        except Exception as e:
            db.rollback()
            raise HTTPException(status_code=500, detail="Database transaction failed")
            
        return payment

    @staticmethod
    def reject_payment(db: Session, payment_id: int, employee_id: int, request: PaymentRejectRequest):
        payment = db.query(Payment).filter(Payment.id == payment_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Payment not found")
            
        if payment.status == "VERIFIED":
            raise HTTPException(status_code=409, detail="Cannot reject a verified payment")
            
        if not request.rejection_reason:
            raise HTTPException(status_code=422, detail="Rejection reason is required")
            
        payment.status = "REJECTED"
        payment.rejection_reason = request.rejection_reason
        payment.verified_by = employee_id
        payment.verified_at = func.now()
        
        db.commit()
        db.refresh(payment)
        return payment

from sqlalchemy.sql import func
