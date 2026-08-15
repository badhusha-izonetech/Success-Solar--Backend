"""
Stock router — list, stock-in, reserve, issue, return.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permissions
from app.core.security import get_current_user
from app.schemas.stock_item import (
    StockInRequest,
    StockIssueRequest,
    StockItemCreate,
    StockItemRead,
    StockReserveRequest,
    StockReturnRequest,
)
from app.services import stock_service
from app.utils.pagination import PagedResponse, PaginationParams

router = APIRouter(prefix="/stock", tags=["Stock"])


@router.get("", response_model=PagedResponse[StockItemRead])
async def list_stock(
    category: Optional[str] = Query(None),
    low_stock: bool = Query(False),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permissions(Permission.STOCK_READ)),
):
    items, total = await stock_service.list_stock(db, category, low_stock, params.offset, params.limit)
    return PagedResponse.create(
        [StockItemRead.from_orm_with_derived(i) for i in items], total, params
    )


@router.post("", response_model=StockItemRead, status_code=201)
async def create_item(
    payload: StockItemCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permissions(Permission.STOCK_WRITE)),
):
    item = await stock_service.create_stock_item(db, payload)
    return StockItemRead.from_orm_with_derived(item)


@router.post("/{item_id}/stock-in", response_model=StockItemRead)
async def stock_in(
    item_id: str,
    payload: StockInRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.STOCK_WRITE)),
):
    item = await stock_service.stock_in(db, item_id, payload, current_user)
    return StockItemRead.from_orm_with_derived(item)


@router.post("/{item_id}/reserve")
async def reserve(
    item_id: str,
    payload: StockReserveRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.STOCK_MANAGE)),
):
    reservation = await stock_service.reserve_stock(db, item_id, payload, current_user)
    return {"id": reservation.id, "status": reservation.status, "quantity": str(reservation.quantity)}


@router.post("/{item_id}/issue", response_model=StockItemRead)
async def issue(
    item_id: str,
    payload: StockIssueRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.STOCK_MANAGE)),
):
    item = await stock_service.issue_stock(db, item_id, payload, current_user)
    return StockItemRead.from_orm_with_derived(item)


@router.post("/{item_id}/return", response_model=StockItemRead)
async def return_stock(
    item_id: str,
    payload: StockReturnRequest,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.STOCK_MANAGE)),
):
    item = await stock_service.return_stock(db, item_id, payload, current_user)
    return StockItemRead.from_orm_with_derived(item)
