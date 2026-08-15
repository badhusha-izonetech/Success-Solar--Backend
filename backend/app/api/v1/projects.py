"""
Projects router — create, stage transition, assign.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permissions
from app.core.security import get_current_user
from app.schemas.project import ProjectAssign, ProjectCreate, ProjectRead, ProjectStageUpdate, ProjectUpdate
from app.services import project_service
from app.utils.pagination import PagedResponse, PaginationParams

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("", response_model=PagedResponse[ProjectRead])
async def list_projects(
    stage: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permissions(Permission.PROJECTS_READ)),
):
    items, total = await project_service.list_projects(db, stage, status, params.offset, params.limit)
    return PagedResponse.create([ProjectRead.model_validate(p) for p in items], total, params)


@router.post("", response_model=ProjectRead, status_code=201)
async def create_project(
    payload: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.PROJECTS_WRITE)),
):
    p = await project_service.create_project(db, payload, current_user)
    return ProjectRead.model_validate(p)


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(
    project_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permissions(Permission.PROJECTS_READ)),
):
    p = await project_service._get_project(db, project_id)
    return ProjectRead.model_validate(p)


@router.patch("/{project_id}/stage", response_model=ProjectRead)
async def advance_stage(
    project_id: str,
    payload: ProjectStageUpdate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.PROJECTS_STAGE)),
):
    p = await project_service.advance_stage(db, project_id, payload, current_user)
    return ProjectRead.model_validate(p)


@router.patch("/{project_id}/assign", response_model=ProjectRead)
async def assign_project(
    project_id: str,
    payload: ProjectAssign,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permissions(Permission.PROJECTS_ASSIGN)),
):
    p = await project_service.assign_project(db, project_id, payload)
    return ProjectRead.model_validate(p)
