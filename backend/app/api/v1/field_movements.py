"""
Field movements router — CEO all, self-only endpoints.
"""

from fastapi import APIRouter, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permissions
from app.core.security import get_current_user
from app.schemas.field_movement import (
    FieldMovementRead,
    FieldMovementStart,
    FieldMovementUpdate,
    NoteCreate,
    NoteRead,
    PhotoRead,
)
from app.services import field_movement_service
from app.utils.pagination import PagedResponse, PaginationParams

router = APIRouter(prefix="/field-movements", tags=["Field Movements"])

_read = require_permissions(Permission.FIELD_MOVEMENTS_READ, Permission.FIELD_MOVEMENTS_READ_OWN)
_write = require_permissions(Permission.FIELD_MOVEMENTS_WRITE)


def _read_any_or_own():
    from app.core.permissions import get_permissions
    from fastapi import HTTPException, status
    async def dep(current_user=Depends(get_current_user)):
        perms = get_permissions(current_user.designation)
        if Permission.FIELD_MOVEMENTS_READ not in perms and Permission.FIELD_MOVEMENTS_READ_OWN not in perms:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)
        return current_user
    return dep


@router.get("", response_model=PagedResponse[FieldMovementRead])
async def list_all(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.FIELD_MOVEMENTS_READ)),
):
    items, total = await field_movement_service.list_field_movements(db, offset=params.offset, limit=params.limit)
    return PagedResponse.create([FieldMovementRead.model_validate(i) for i in items], total, params)


@router.get("/mine", response_model=PagedResponse[FieldMovementRead])
async def list_mine(
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(_read_any_or_own()),
):
    items, total = await field_movement_service.list_field_movements(
        db, employee_id=current_user.id, offset=params.offset, limit=params.limit
    )
    return PagedResponse.create([FieldMovementRead.model_validate(i) for i in items], total, params)


@router.post("/start", response_model=FieldMovementRead, status_code=201)
async def start(
    payload: FieldMovementStart,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.FIELD_MOVEMENTS_WRITE)),
):
    fm = await field_movement_service.start_field_movement(db, payload, current_user)
    return FieldMovementRead.model_validate(fm)


@router.patch("/{fm_id}", response_model=FieldMovementRead)
async def update(
    fm_id: str,
    payload: FieldMovementUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.FIELD_MOVEMENTS_WRITE)),
):
    fm = await field_movement_service.update_field_movement(db, fm_id, payload, current_user)
    return FieldMovementRead.model_validate(fm)


@router.post("/{fm_id}/photo", response_model=PhotoRead, status_code=201)
async def upload_photo(
    fm_id: str,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.FIELD_MOVEMENTS_WRITE)),
):
    photo = await field_movement_service.add_photo(db, fm_id, file, current_user)
    return PhotoRead.model_validate(photo)


@router.post("/{fm_id}/notes", response_model=NoteRead, status_code=201)
async def add_note(
    fm_id: str,
    payload: NoteCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.FIELD_MOVEMENTS_WRITE)),
):
    note = await field_movement_service.add_note(db, fm_id, payload, current_user)
    return NoteRead.model_validate(note)
