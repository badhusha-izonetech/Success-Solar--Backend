"""
Employees router — CEO only.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permissions
from app.schemas.employee import EmployeeCreate, EmployeeRead, EmployeeUpdate
from app.services import employee_service
from app.utils.pagination import PagedResponse, PaginationParams

router = APIRouter(prefix="/employees", tags=["Employees"])

_auth = require_permissions(Permission.EMPLOYEES_READ)
_write = require_permissions(Permission.EMPLOYEES_WRITE)


@router.get("", response_model=PagedResponse[EmployeeRead])
async def list_employees(
    department: Optional[str] = Query(None),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(_auth),
):
    items, total = await employee_service.list_employees(db, department, params.offset, params.limit)
    return PagedResponse.create([EmployeeRead.model_validate(e) for e in items], total, params)


@router.post("", response_model=EmployeeRead, status_code=201)
async def create_employee(
    payload: EmployeeCreate,
    db: AsyncSession = Depends(get_db),
    _=Depends(_write),
):
    emp = await employee_service.create_employee(db, payload)
    return EmployeeRead.model_validate(emp)


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(_auth),
):
    emp = await employee_service.get_employee(db, employee_id)
    return EmployeeRead.model_validate(emp)


@router.patch("/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: str,
    payload: EmployeeUpdate,
    db: AsyncSession = Depends(get_db),
    _=Depends(_write),
):
    emp = await employee_service.update_employee(db, employee_id, payload)
    return EmployeeRead.model_validate(emp)


@router.delete("/{employee_id}", status_code=204)
async def delete_employee(
    employee_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(_write),
):
    await employee_service.delete_employee(db, employee_id)
