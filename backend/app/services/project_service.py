"""
Project service — stage-gated transitions, assignment, code generation.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.employee import Employee
from app.models.project import Project, ProjectStageHistory
from app.schemas.project import ProjectAssign, ProjectCreate, ProjectStageUpdate, ProjectUpdate
from app.utils.project_code import generate_project_code

STAGE_ORDER = [
    "Site Visit", "Quotation", "Advance Payment",
    "Project Execution", "Installation", "Final Connection", "Completed",
]


async def _get_project(db: AsyncSession, project_id: str) -> Project:
    result = await db.execute(
        select(Project).options(selectinload(Project.stage_history), selectinload(Project.payments)).where(
            Project.id == project_id, Project.is_deleted == False
        )
    )
    p = result.scalar_one_or_none()
    if not p:
        raise NotFoundError("Project")
    return p


async def create_project(
    db: AsyncSession, payload: ProjectCreate, current_user: Employee
) -> Project:
    code = await generate_project_code(db)
    balance = payload.project_value - payload.advance_received

    project = Project(
        project_code=code,
        customer_id=payload.customer_id,
        customer_name=payload.customer_name,
        customer_mobile=payload.customer_mobile,
        site=payload.site,
        area=payload.area,
        quotation_id=payload.quotation_id,
        project_value=payload.project_value,
        advance_received=payload.advance_received,
        balance_amount=balance,
        capacity_kw=payload.capacity_kw,
        assigned_technician_id=payload.assigned_technician_id,
        assigned_doc_employee_id=payload.assigned_doc_employee_id,
        next_action=payload.next_action,
        due_date=payload.due_date,
        priority=payload.priority,
        current_stage="Site Visit",
        status="On Track",
    )
    db.add(project)
    await db.flush()

    # Record initial stage
    history = ProjectStageHistory(
        project_id=project.id,
        stage="Site Visit",
        changed_by_id=current_user.id,
        note="Project created",
    )
    db.add(history)
    await db.flush()
    return project


async def advance_stage(
    db: AsyncSession, project_id: str, payload: ProjectStageUpdate, current_user: Employee
) -> Project:
    project = await _get_project(db, project_id)

    current_idx = STAGE_ORDER.index(project.current_stage) if project.current_stage in STAGE_ORDER else -1
    target_idx = STAGE_ORDER.index(payload.stage) if payload.stage in STAGE_ORDER else -1

    if target_idx <= current_idx:
        raise BusinessRuleError(f"Cannot move project backwards to stage '{payload.stage}'")

    # Gate: Advance Payment stage requires verified payment
    if payload.stage == "Project Execution":
        verified_payments = [
            p for p in project.payments if p.state == "Verified"
        ]
        verified_total = sum(Decimal(str(p.actual_amount or 0)) for p in verified_payments)
        required_advance = project.project_value * Decimal("0.5")
        if verified_total < required_advance:
            raise BusinessRuleError(
                f"Advance payment not verified. Need ≥50% (₹{required_advance:,.2f}), "
                f"verified so far: ₹{verified_total:,.2f}"
            )

    project.current_stage = payload.stage
    if payload.stage == "Completed":
        project.status = "Completed"
    db.add(project)

    history = ProjectStageHistory(
        project_id=project.id,
        stage=payload.stage,
        changed_by_id=current_user.id,
        note=payload.note,
    )
    db.add(history)
    await db.flush()
    return project


async def assign_project(
    db: AsyncSession, project_id: str, payload: ProjectAssign
) -> Project:
    project = await _get_project(db, project_id)
    if payload.assigned_technician_id is not None:
        project.assigned_technician_id = payload.assigned_technician_id
    if payload.assigned_doc_employee_id is not None:
        project.assigned_doc_employee_id = payload.assigned_doc_employee_id
    db.add(project)
    return project


async def list_projects(
    db: AsyncSession,
    stage_filter: Optional[str] = None,
    status_filter: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[List[Project], int]:
    q = select(Project).options(
        selectinload(Project.stage_history), selectinload(Project.payments)
    ).where(Project.is_deleted == False)

    if stage_filter:
        q = q.where(Project.current_stage == stage_filter)
    if status_filter:
        q = q.where(Project.status == status_filter)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    result = await db.execute(q.order_by(Project.created_at.desc()).offset(offset).limit(limit))
    return result.scalars().all(), total
