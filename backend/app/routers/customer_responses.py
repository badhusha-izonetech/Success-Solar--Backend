from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schema.customer_response import CustomerResponseCreate, CustomerResponseResponse, CustomerResponseUpdate
from app.services import customer_response_service
from app.services.auth_service import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/api/customer-responses", tags=["customer-responses"])

@router.post("", response_model=CustomerResponseResponse)
def create_customer_response(
    resp: CustomerResponseCreate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return customer_response_service.create_customer_response(db, resp, current_employee)

@router.get("/{lead_id}", response_model=List[CustomerResponseResponse])
def get_customer_responses(
    lead_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return customer_response_service.get_responses_for_lead(db, lead_id)

@router.patch("/{response_id}", response_model=CustomerResponseResponse)
def update_customer_response(
    response_id: int,
    resp_update: CustomerResponseUpdate,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return customer_response_service.update_customer_response(db, response_id, resp_update, current_employee)
