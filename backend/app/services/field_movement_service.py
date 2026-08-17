"""
Remaining services: FieldMovement, Customer, Leave, Approval, Dashboard, and stubs.
"""

from __future__ import annotations

from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from fastapi import UploadFile
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.employee import Employee
from app.models.field_movement import (
    FieldMovement,
    FieldMovementNote,
    FieldMovementPhoto,
    FieldMovementRoutePoint,
)
from app.schemas.field_movement import FieldMovementStart, FieldMovementUpdate, NoteCreate
from app.utils.file_upload import save_field_visit_photo


# ── FieldMovement ─────────────────────────────────────────────────────────────

async def start_field_movement(
    db: AsyncSession, payload: FieldMovementStart, current_user: Employee
) -> FieldMovement:
    # Enforce: only one active visit per employee
    active = await db.execute(
        select(FieldMovement).where(
            FieldMovement.employee_id == current_user.id,
            FieldMovement.status.in_(["Checked In", "On Field"]),
        )
    )
    if active.scalar_one_or_none():
        raise BusinessRuleError("You already have an active field visit. Check out first.")

    fm = FieldMovement(
        employee_id=current_user.id,
        employee_name=current_user.name,
        role=current_user.designation,
        status="Checked In",
        current_location=payload.current_location,
        destination=payload.destination,
        lead_id=payload.lead_id,
        purpose=payload.purpose,
    )
    db.add(fm)
    await db.flush()
    return fm


async def update_field_movement(
    db: AsyncSession, fm_id: str, payload: FieldMovementUpdate, current_user: Employee
) -> FieldMovement:
    result = await db.execute(
        select(FieldMovement).options(
            selectinload(FieldMovement.route_points),
            selectinload(FieldMovement.photos),
            selectinload(FieldMovement.notes),
        ).where(FieldMovement.id == fm_id)
    )
    fm = result.scalar_one_or_none()
    if not fm:
        raise NotFoundError("FieldMovement")

    if payload.current_location:
        fm.current_location = payload.current_location
        # Append route point
        rp = FieldMovementRoutePoint(
            field_movement_id=fm.id,
            location=payload.current_location,
        )
        db.add(rp)

    if payload.status:
        fm.status = payload.status
        if payload.status == "Checked Out":
            fm.end_time = datetime.now(timezone.utc).replace(tzinfo=None)

    if payload.destination:
        fm.destination = payload.destination

    fm.last_update = datetime.now(timezone.utc).replace(tzinfo=None)
    db.add(fm)
    await db.flush()
    return fm


async def add_photo(
    db: AsyncSession, fm_id: str, file: UploadFile, current_user: Employee
) -> FieldMovementPhoto:
    file_url = await save_field_visit_photo(file)
    photo = FieldMovementPhoto(
        field_movement_id=fm_id,
        file_url=file_url,
        uploaded_by_id=current_user.id,
    )
    db.add(photo)
    await db.flush()
    return photo


async def add_note(
    db: AsyncSession, fm_id: str, payload: NoteCreate, current_user: Employee
) -> FieldMovementNote:
    note = FieldMovementNote(
        field_movement_id=fm_id,
        note=payload.note,
        created_by_id=current_user.id,
    )
    db.add(note)
    await db.flush()
    return note


async def list_field_movements(
    db: AsyncSession, employee_id: Optional[str] = None, offset: int = 0, limit: int = 100
) -> tuple[List[FieldMovement], int]:
    q = select(FieldMovement).options(
        selectinload(FieldMovement.route_points),
        selectinload(FieldMovement.photos),
        selectinload(FieldMovement.notes),
    )
    if employee_id:
        q = q.where(FieldMovement.employee_id == employee_id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    result = await db.execute(q.order_by(FieldMovement.start_time.desc()).offset(offset).limit(limit))
    return result.scalars().all(), total
