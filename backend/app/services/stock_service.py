"""
Stock service — stock-in, reserve, issue, return.
availableQuantity invariant enforced on every mutating operation.
"""

from __future__ import annotations

from decimal import Decimal
from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.employee import Employee
from app.models.stock_item import StockItem, StockReservation, StockTransaction
from app.schemas.stock_item import (
    StockInRequest,
    StockIssueRequest,
    StockItemCreate,
    StockReserveRequest,
    StockReturnRequest,
)


async def _get_item(db: AsyncSession, item_id: str) -> StockItem:
    result = await db.execute(select(StockItem).where(StockItem.id == item_id, StockItem.is_active == True))
    item = result.scalar_one_or_none()
    if not item:
        raise NotFoundError("StockItem")
    return item


async def create_stock_item(db: AsyncSession, payload: StockItemCreate) -> StockItem:
    item = StockItem(**payload.model_dump())
    db.add(item)
    await db.flush()
    return item


async def stock_in(
    db: AsyncSession, item_id: str, payload: StockInRequest, current_user: Employee
) -> StockItem:
    item = await _get_item(db, item_id)
    item.current_quantity += Decimal(str(payload.quantity))
    db.add(item)

    txn = StockTransaction(
        stock_item_id=item.id,
        transaction_type="Stock In",
        quantity=payload.quantity,
        reference=payload.reference,
        notes=payload.notes,
        performed_by_id=current_user.id,
    )
    db.add(txn)
    await db.flush()
    return item


async def reserve_stock(
    db: AsyncSession, item_id: str, payload: StockReserveRequest, current_user: Employee
) -> StockReservation:
    item = await _get_item(db, item_id)
    qty = Decimal(str(payload.quantity))

    if item.available_quantity < qty:
        raise BusinessRuleError(
            f"Insufficient stock. Available: {item.available_quantity}, Requested: {qty}"
        )

    item.reserved_quantity += qty
    db.add(item)

    reservation = StockReservation(
        stock_item_id=item.id,
        project_id=payload.project_id,
        quantity=qty,
        status="Reserved",
        reserved_by_id=current_user.id,
        notes=payload.notes,
    )
    db.add(reservation)

    txn = StockTransaction(
        stock_item_id=item.id,
        transaction_type="Stock Out",
        quantity=qty,
        project_id=payload.project_id,
        notes=f"Reserved for project {payload.project_id}",
        performed_by_id=current_user.id,
    )
    db.add(txn)
    await db.flush()
    return reservation


async def issue_stock(
    db: AsyncSession, item_id: str, payload: StockIssueRequest, current_user: Employee
) -> StockItem:
    item = await _get_item(db, item_id)

    res_result = await db.execute(
        select(StockReservation).where(
            StockReservation.id == payload.reservation_id,
            StockReservation.stock_item_id == item_id,
            StockReservation.status == "Reserved",
        )
    )
    reservation = res_result.scalar_one_or_none()
    if not reservation:
        raise NotFoundError("Reservation")

    qty = Decimal(str(payload.quantity))
    if qty > reservation.quantity:
        raise BusinessRuleError(f"Cannot issue more than reserved quantity ({reservation.quantity})")

    reservation.status = "Issued"
    item.current_quantity -= qty
    item.reserved_quantity -= reservation.quantity
    db.add(reservation)
    db.add(item)

    txn = StockTransaction(
        stock_item_id=item.id,
        transaction_type="Issue",
        quantity=qty,
        project_id=reservation.project_id,
        notes=payload.notes,
        performed_by_id=current_user.id,
    )
    db.add(txn)
    await db.flush()
    return item


async def return_stock(
    db: AsyncSession, item_id: str, payload: StockReturnRequest, current_user: Employee
) -> StockItem:
    item = await _get_item(db, item_id)
    qty = Decimal(str(payload.quantity))

    item.current_quantity += qty
    db.add(item)

    txn = StockTransaction(
        stock_item_id=item.id,
        transaction_type="Return",
        quantity=qty,
        project_id=payload.project_id,
        notes=payload.notes,
        performed_by_id=current_user.id,
    )
    db.add(txn)
    await db.flush()
    return item


async def list_stock(
    db: AsyncSession,
    category: Optional[str] = None,
    low_stock_only: bool = False,
    offset: int = 0,
    limit: int = 100,
) -> tuple[List[StockItem], int]:
    q = select(StockItem).where(StockItem.is_active == True)
    if category:
        q = q.where(StockItem.category == category)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    result = await db.execute(q.offset(offset).limit(limit))
    items = result.scalars().all()

    if low_stock_only:
        items = [i for i in items if i.available_quantity <= i.minimum_level]

    return items, total
