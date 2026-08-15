"""
Payment service — submit, proof upload, verify/reject (Accountant-only), project stage gate.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from fastapi import HTTPException, UploadFile, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.employee import Employee
from app.models.payment import Payment, PaymentProof
from app.schemas.payment import PaymentCreate, PaymentReject, PaymentVerify
from app.utils.file_upload import save_payment_proof


async def _get_payment(db: AsyncSession, payment_id: str) -> Payment:
    result = await db.execute(
        select(Payment).options(selectinload(Payment.proofs)).where(Payment.id == payment_id)
    )
    p = result.scalar_one_or_none()
    if not p:
        raise NotFoundError("Payment")
    return p


async def create_payment(
    db: AsyncSession, payload: PaymentCreate, current_user: Employee
) -> Payment:
    payment = Payment(
        **payload.model_dump(),
        submitted_by=current_user.name,
        submitted_by_id=current_user.id,
        state="Pending",
    )
    db.add(payment)
    await db.flush()
    return payment


async def upload_proof(
    db: AsyncSession, payment_id: str, file: UploadFile, current_user: Employee
) -> PaymentProof:
    payment = await _get_payment(db, payment_id)
    file_url = await save_payment_proof(file)

    proof = PaymentProof(
        payment_id=payment.id,
        file_url=file_url,
        uploaded_by_id=current_user.id,
    )
    db.add(proof)
    payment.state = "Proof Uploaded"
    db.add(payment)
    await db.flush()
    return proof


async def verify_payment(
    db: AsyncSession, payment_id: str, payload: PaymentVerify, current_user: Employee
) -> Payment:
    if current_user.designation not in ("Accountant", "CEO"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accountant access required")

    payment = await _get_payment(db, payment_id)
    payment.actual_amount = payload.actual_amount
    payment.payment_mode = payload.payment_mode
    payment.transaction_reference = payload.transaction_reference
    payment.remarks = payload.remarks
    payment.state = "Verified"
    payment.verified_by = current_user.name
    payment.verified_by_id = current_user.id
    payment.verified_at = datetime.now(timezone.utc)
    db.add(payment)

    # Update project advance_received
    from app.models.project import Project
    project_res = await db.execute(select(Project).where(Project.id == payment.project_id))
    project = project_res.scalar_one_or_none()
    if project:
        project.advance_received = (project.advance_received or Decimal("0")) + payload.actual_amount
        project.balance_amount = project.project_value - project.advance_received
        db.add(project)

    await db.flush()
    return payment


async def reject_payment(
    db: AsyncSession, payment_id: str, payload: PaymentReject, current_user: Employee
) -> Payment:
    if current_user.designation not in ("Accountant", "CEO"):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accountant access required")

    if not payload.remarks:
        raise BusinessRuleError("Remarks are required when rejecting a payment")

    payment = await _get_payment(db, payment_id)
    payment.state = "Rejected"
    payment.remarks = payload.remarks
    payment.verified_by = current_user.name
    payment.verified_by_id = current_user.id
    payment.verified_at = datetime.now(timezone.utc)
    db.add(payment)
    await db.flush()
    return payment


async def list_payments(
    db: AsyncSession,
    state_filter: Optional[str] = None,
    project_id: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[List[Payment], int]:
    q = select(Payment).options(selectinload(Payment.proofs))
    if state_filter:
        q = q.where(Payment.state == state_filter)
    if project_id:
        q = q.where(Payment.project_id == project_id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    result = await db.execute(q.order_by(Payment.created_at.desc()).offset(offset).limit(limit))
    return result.scalars().all(), total
