from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schema.followup import FollowUpCreate, FollowUpResponse, FollowUpUpdate
from app.services import followup_service
from app.services.auth_service import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/api/followups", tags=["followups"])

@router.post("", response_model=FollowUpResponse)
def create_followup(
    followup: FollowUpCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return followup_service.create_followup(db, followup, current_employee)

@router.get("", response_model=List[FollowUpResponse])
def get_followups(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return followup_service.get_followups(db, skip, limit)

@router.get("/today", response_model=List[FollowUpResponse])
def get_today_followups(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return followup_service.get_today_followups(db, current_employee)

@router.get("/my-followups", response_model=List[FollowUpResponse])
def get_my_followups(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return followup_service.get_my_followups(db, current_employee, skip, limit)

@router.get("/overdue", response_model=List[FollowUpResponse])
def get_overdue_followups(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return followup_service.get_overdue_followups(db, current_employee)

@router.patch("/{followup_id}", response_model=FollowUpResponse)
def update_followup(
    followup_id: int,
    followup_update: FollowUpUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return followup_service.update_followup(db, followup_id, followup_update, current_employee)
