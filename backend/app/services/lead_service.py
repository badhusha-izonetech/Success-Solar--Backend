"""
Lead service — scoped list for Telecallers, status transitions, existing-customer flow.
"""

from __future__ import annotations

from typing import List, Optional

from fastapi import HTTPException, status
from sqlalchemy import select, func, or_, and_
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.core.permissions import is_telecaller_scoped
from app.models.employee import Employee
from app.models.lead import Lead
from app.schemas.lead import (
    ExistingCustomerLeadCreate,
    LeadCreate,
    LeadReassign,
    LeadStatusUpdate,
    LeadUpdate,
)
from app.utils.date_utils import today_str

FOLLOW_UP_STATUSES = {
    "Follow-up", "Site Visit Required", "Site Visit Scheduled",
    "Interested", "Contacted",
}


async def _get_lead(db: AsyncSession, lead_id: str) -> Lead:
    result = await db.execute(
        select(Lead).options(selectinload(Lead.call_logs)).where(
            Lead.id == lead_id, Lead.is_deleted == False
        )
    )
    lead = result.scalar_one_or_none()
    if not lead:
        raise NotFoundError("Lead")
    return lead


async def create_lead(
    db: AsyncSession, payload: LeadCreate, current_user: Employee
) -> Lead:
    lead = Lead(
        **payload.model_dump(),
        created_by_id=current_user.id,
        first_contact_date=payload.first_contact_date or today_str(),
    )
    if not lead.assigned_employee_id:
        lead.assigned_employee_id = current_user.id
    db.add(lead)
    await db.flush()
    return lead


async def list_leads(
    db: AsyncSession,
    current_user: Employee,
    status_filter: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[List[Lead], int]:
    q = select(Lead).where(Lead.is_deleted == False)

    if is_telecaller_scoped(current_user.designation):
        q = q.where(Lead.assigned_employee_id == current_user.id)

    if status_filter:
        q = q.where(Lead.status == status_filter)

    total_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(total_q)).scalar_one()
    result = await db.execute(q.order_by(Lead.created_at.desc()).offset(offset).limit(limit))
    return result.scalars().all(), total


async def list_follow_ups(
    db: AsyncSession,
    current_user: Employee,
    offset: int = 0,
    limit: int = 100,
) -> tuple[List[Lead], int]:
    """Follow-ups = leads in follow-up statuses (not a separate table)."""
    q = select(Lead).options(selectinload(Lead.call_logs)).where(
        Lead.is_deleted == False,
        Lead.status.in_(FOLLOW_UP_STATUSES),
    )
    if is_telecaller_scoped(current_user.designation):
        q = q.where(Lead.assigned_employee_id == current_user.id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    result = await db.execute(q.order_by(Lead.created_at.desc()).offset(offset).limit(limit))
    return result.scalars().all(), total


async def update_lead_status(
    db: AsyncSession, lead_id: str, payload: LeadStatusUpdate, current_user: Employee
) -> Lead:
    lead = await _get_lead(db, lead_id)

    # Enforce Telecaller scope
    if is_telecaller_scoped(current_user.designation):
        if lead.assigned_employee_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not your lead")

    if payload.status == "Lost":
        if not payload.lost_reason or not payload.lost_reason_detail:
            raise BusinessRuleError("lost_reason and lost_reason_detail are required when marking a lead as Lost")
        lead.lost_reason = payload.lost_reason
        lead.lost_reason_detail = payload.lost_reason_detail

    lead.status = payload.status
    if payload.remarks:
        lead.remarks = payload.remarks
    db.add(lead)
    return lead


async def reassign_lead(
    db: AsyncSession, lead_id: str, payload: LeadReassign
) -> Lead:
    lead = await _get_lead(db, lead_id)
    lead.assigned_employee_id = payload.assigned_employee_id
    db.add(lead)
    return lead


async def create_existing_customer_lead(
    db: AsyncSession, payload: ExistingCustomerLeadCreate, current_user: Employee
) -> Lead:
    """
    New enquiry from an existing customer — never mutates the prior project.
    Creates a new Lead with customerOrigin='Existing Customer'.
    """
    from app.models.customer import Customer
    customer_res = await db.execute(
        select(Customer).where(Customer.id == payload.customer_id, Customer.is_deleted == False)
    )
    customer = customer_res.scalar_one_or_none()
    if not customer:
        raise NotFoundError("Customer")

    lead = Lead(
        customer_name=customer.name,
        mobile=customer.mobile,
        alternate_mobile=customer.alternate_mobile,
        email=customer.email,
        customer_type=customer.customer_type,
        address=customer.address,
        area=customer.area,
        city=customer.city,
        lead_source=payload.lead_source,
        product_interested=payload.product_interested,
        requirement_description=payload.requirement_description,
        approximate_requirement=payload.approximate_requirement,
        priority=payload.priority,
        assigned_employee_id=payload.assigned_employee_id or current_user.id,
        created_by_id=current_user.id,
        customer_origin="Existing Customer",
        prior_project_id=payload.prior_project_id,
        customer_id=customer.id,
        first_contact_date=today_str(),
        status="New",
    )
    db.add(lead)
    await db.flush()
    return lead
