from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.customer_response import CustomerResponse
from app.models.employee import Employee
from app.schema.customer_response import CustomerResponseCreate, CustomerResponseUpdate

def create_customer_response(db: Session, resp: CustomerResponseCreate, current_employee: Employee) -> CustomerResponse:
    db_resp = CustomerResponse(
        lead_id=resp.lead_id,
        customer_id=resp.customer_id,
        response=resp.response,
        remarks=resp.remarks,
        created_by_id=current_employee.id
    )
    db.add(db_resp)
    db.commit()
    db.refresh(db_resp)
    return db_resp

def get_responses_for_lead(db: Session, lead_id: int) -> list[CustomerResponse]:
    return db.query(CustomerResponse).filter(CustomerResponse.lead_id == lead_id).all()

def update_customer_response(db: Session, resp_id: int, resp_update: CustomerResponseUpdate, current_employee: Employee) -> CustomerResponse:
    db_resp = db.query(CustomerResponse).filter(CustomerResponse.id == resp_id).first()
    if not db_resp:
        raise HTTPException(status_code=404, detail="Response not found")
        
    update_data = resp_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_resp, key, value)
        
    db.commit()
    db.refresh(db_resp)
    return db_resp
