from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.database import get_db
from app.schema.lead import LeadCreate, LeadResponse, LeadUpdate
from app.services import lead_service
from app.services.auth_service import get_current_employee
from app.models.employee import Employee
from app.models.lead import Lead

router = APIRouter(prefix="/api/leads", tags=["leads"])

@router.post("", response_model=LeadResponse)
def create_lead(
    lead: LeadCreate, 
    db: Session = Depends(get_db), 
    current_employee: Employee = Depends(get_current_employee)
):
    return lead_service.create_lead(db, lead, current_employee)

@router.get("", response_model=List[LeadResponse])
def get_leads(
    status: Optional[str] = None,
    call_status: Optional[str] = None,
    source_id: Optional[int] = None,
    assigned_employee_id: Optional[int] = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    query = db.query(Lead)
    if status:
        query = query.filter(Lead.status == status)
    if call_status:
        query = query.filter(Lead.call_status == call_status)
    if source_id:
        query = query.filter(Lead.source_id == source_id)
    if assigned_employee_id:
        query = query.filter(Lead.assigned_employee_id == assigned_employee_id)
        
    return query.offset(skip).limit(limit).all()

@router.get("/my-leads", response_model=List[LeadResponse])
def get_my_leads(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return lead_service.get_my_leads(db, current_employee, skip, limit)

@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(
    lead_id: int, 
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return lead_service.get_lead(db, lead_id)

@router.patch("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int, 
    lead_update: LeadUpdate, 
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return lead_service.update_lead(db, lead_id, lead_update, current_employee)
