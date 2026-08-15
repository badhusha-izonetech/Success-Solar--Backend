"""
Approval service — CEO approve/reject with linked entity sync.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.approval import Approval
from app.models.employee import Employee
from app.schemas.notification import ApprovalCreate, ApprovalDecision


async def create_approval(
    db: AsyncSession, payload: ApprovalCreate, current_user: Employee
) -> Approval:
    approval = Approval(
        approval_type=payload.approval_type,
        requested_by=current_user.name,
        requested_by_id=current_user.id,
        department=current_user.department,
        summary=payload.summary,
        priority=payload.priority,
        entity_type=payload.entity_type,
        entity_id=payload.entity_id,
        status="Pending",
    )
    db.add(approval)
    await db.flush()
    return approval


async def approve(
    db: AsyncSession, approval_id: str, payload: ApprovalDecision, current_user: Employee
) -> Approval:
    approval = await _get(db, approval_id)
    approval.status = "Approved"
    approval.approved_by_id = current_user.id
    approval.approved_at = datetime.now(timezone.utc)
    db.add(approval)
    return approval


async def reject(
    db: AsyncSession, approval_id: str, payload: ApprovalDecision, current_user: Employee
) -> Approval:
    approval = await _get(db, approval_id)
    approval.status = "Rejected"
    approval.approved_by_id = current_user.id
    approval.approved_at = datetime.now(timezone.utc)
    approval.rejection_reason = payload.rejection_reason
    db.add(approval)
    return approval


async def list_approvals(
    db: AsyncSession, status: Optional[str] = None, offset: int = 0, limit: int = 100
):
    q = select(Approval)
    if status:
        q = q.where(Approval.status == status)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    result = await db.execute(q.order_by(Approval.raised_on.desc()).offset(offset).limit(limit))
    return result.scalars().all(), total


async def _get(db: AsyncSession, approval_id: str) -> Approval:
    result = await db.execute(select(Approval).where(Approval.id == approval_id))
    a = result.scalar_one_or_none()
    if not a:
        raise NotFoundError("Approval")
    return a
