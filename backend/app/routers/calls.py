from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schema.call import CallCreate, CallResponse, CallStatusUpdate
from app.services import call_service
from app.services.auth_service import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/api/calls", tags=["calls"])

@router.post("", response_model=CallResponse)
def create_call(
    call: CallCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return call_service.create_call(db, call, current_employee)

@router.get("", response_model=List[CallResponse])
def get_calls(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return call_service.get_calls(db, skip, limit)

@router.get("/my-calls", response_model=List[CallResponse])
def get_my_calls(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, le=1000),
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return call_service.get_my_calls(db, current_employee, skip, limit)

@router.get("/{call_id}", response_model=CallResponse)
def get_call(
    call_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return call_service.get_call(db, call_id)

@router.patch("/{call_id}/status", response_model=CallResponse)
def update_call_status(
    call_id: int,
    status_update: CallStatusUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    if not current_employee.role or "Telecalling" not in current_employee.role.name:
        raise HTTPException(status_code=403, detail="Telecalling permission required")
        
    return call_service.update_call_status(db, call_id, status_update, current_employee)
