from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

from app.db.database import get_db
from app.schema.payment import PaymentResponse, PaymentVerificationRequest, PaymentRejectRequest
from app.services.payment_service import PaymentService
from app.services.auth_service import get_current_employee, check_role
from app.models.employee import Employee
from app.models.payment import Payment

router = APIRouter(prefix="/api/account/payments", tags=["Payments"])

@router.get("", response_model=List[PaymentResponse])
def get_payments(
    status: Optional[str] = None,
    payment_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    query = db.query(Payment)
    if status:
        query = query.filter(Payment.status == status)
    if payment_type:
        query = query.filter(Payment.payment_type == payment_type)
        
    return query.all()

@router.get("/pending", response_model=List[PaymentResponse])
def get_pending_payments(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return db.query(Payment).filter(Payment.status.in_(["PENDING", "PROOF_UPLOADED"])).all()

@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment_by_id(
    payment_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return db.query(Payment).filter(Payment.id == payment_id).first()

@router.post("/{payment_id}/verify", response_model=PaymentResponse)
def verify_payment(
    payment_id: int,
    request: PaymentVerificationRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return PaymentService.verify_payment(db, payment_id, current_employee.id)

@router.post("/{payment_id}/reject", response_model=PaymentResponse)
def reject_payment(
    payment_id: int,
    request: PaymentRejectRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return PaymentService.reject_payment(db, payment_id, current_employee.id, request)

@router.patch("/{payment_id}/status", response_model=PaymentResponse)
def update_payment_status(
    payment_id: int,
    status: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if payment:
        payment.status = status
        db.commit()
        db.refresh(payment)
    return payment
