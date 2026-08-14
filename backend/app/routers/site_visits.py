from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schema.site_visit import SiteVisitCreate, SiteVisitResponse, SiteVisitUpdate
from app.services import site_visit_service
from app.services.auth_service import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/api/site-visits", tags=["site-visits"])

@router.post("", response_model=SiteVisitResponse)
def create_site_visit(
    visit: SiteVisitCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return site_visit_service.create_site_visit(db, visit, current_employee)

@router.get("/my-requests", response_model=List[SiteVisitResponse])
def get_my_requests(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return site_visit_service.get_my_requests(db, current_employee, skip, limit)

@router.get("/{site_visit_id}", response_model=SiteVisitResponse)
def get_site_visit(
    site_visit_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return site_visit_service.get_site_visit(db, site_visit_id)

@router.patch("/{site_visit_id}", response_model=SiteVisitResponse)
def update_site_visit(
    site_visit_id: int,
    visit_update: SiteVisitUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return site_visit_service.update_site_visit(db, site_visit_id, visit_update, current_employee)
