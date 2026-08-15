"""
Customer service — derived existing-customer view.
"""

from __future__ import annotations

from typing import List

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import NotFoundError
from app.models.customer import Customer
from app.models.project import Project
from app.schemas.customer import CustomerCreate, CustomerUpdate, ExistingCustomerView


async def list_customers(db: AsyncSession, offset: int = 0, limit: int = 100):
    q = select(Customer).where(Customer.is_deleted == False)
    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    result = await db.execute(q.offset(offset).limit(limit))
    return result.scalars().all(), total


async def get_existing_customers(db: AsyncSession) -> List[ExistingCustomerView]:
    """
    Returns customers who have at least one Project at currentStage='Completed'.
    Shape matches ExistingCustomer interface in frontend (marketing screen).
    """
    result = await db.execute(
        select(Customer, Project).join(
            Project, Project.customer_id == Customer.id
        ).where(
            Customer.is_deleted == False,
            Project.current_stage == "Completed",
            Project.is_deleted == False,
        ).order_by(Project.updated_at.desc())
    )
    rows = result.all()

    seen = set()
    items = []
    for customer, project in rows:
        if customer.id in seen:
            continue
        seen.add(customer.id)
        items.append(ExistingCustomerView(
            customer_id=customer.id,
            customer_name=customer.name,
            mobile=customer.mobile,
            area=customer.area,
            site=project.site,
            completed_project_id=project.id,
            completed_project_code=project.project_code,
            completed_on=str(project.updated_at.date()) if project.updated_at else None,
            total_value=project.project_value,
            capacity_kw=project.capacity_kw,
        ))
    return items


async def update_customer(db: AsyncSession, customer_id: str, payload: CustomerUpdate) -> Customer:
    result = await db.execute(
        select(Customer).where(Customer.id == customer_id, Customer.is_deleted == False)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise NotFoundError("Customer")
    for key, val in payload.model_dump(exclude_none=True).items():
        setattr(customer, key, val)
    db.add(customer)
    return customer
