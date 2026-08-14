from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.customer_requirement import CustomerRequirement
from app.models.employee import Employee
from app.schema.requirement import RequirementCreate, RequirementUpdate

def create_requirement(db: Session, req: RequirementCreate, current_employee: Employee) -> CustomerRequirement:
    db_req = CustomerRequirement(
        lead_id=req.lead_id,
        customer_id=req.customer_id,
        product=req.product,
        requirement_description=req.requirement_description,
        expected_capacity=req.expected_capacity,
        location=req.location,
        preferred_visit_date=req.preferred_visit_date,
        additional_requirements=req.additional_requirements,
        remarks=req.remarks,
        created_by_id=current_employee.id
    )
    db.add(db_req)
    db.commit()
    db.refresh(db_req)
    return db_req

def get_requirements_for_lead(db: Session, lead_id: int) -> list[CustomerRequirement]:
    return db.query(CustomerRequirement).filter(CustomerRequirement.lead_id == lead_id).all()

def update_requirement(db: Session, req_id: int, req_update: RequirementUpdate, current_employee: Employee) -> CustomerRequirement:
    db_req = db.query(CustomerRequirement).filter(CustomerRequirement.id == req_id).first()
    if not db_req:
        raise HTTPException(status_code=404, detail="Requirement not found")
        
    update_data = req_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_req, key, value)
        
    db.commit()
    db.refresh(db_req)
    return db_req
