from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schema.requirement import RequirementCreate, RequirementResponse, RequirementUpdate
from app.services import requirement_service
from app.services.auth_service import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/api/requirements", tags=["requirements"])

@router.post("", response_model=RequirementResponse)
def create_requirement(
    req: RequirementCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return requirement_service.create_requirement(db, req, current_employee)

@router.get("/{lead_id}", response_model=List[RequirementResponse])
def get_requirements(
    lead_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return requirement_service.get_requirements_for_lead(db, lead_id)

@router.put("/{requirement_id}", response_model=RequirementResponse)
def update_requirement(
    requirement_id: int,
    req_update: RequirementUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return requirement_service.update_requirement(db, requirement_id, req_update, current_employee)
