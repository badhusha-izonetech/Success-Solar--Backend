from sqlalchemy.orm import Session
from fastapi import HTTPException
import uuid
from app.models.lead import Lead
from app.models.employee import Employee
from app.schema.lead import LeadCreate, LeadUpdate

def generate_lead_id() -> str:
    return f"LEAD-{uuid.uuid4().hex[:8].upper()}"

def create_lead(db: Session, lead: LeadCreate, current_employee: Employee) -> Lead:
    db_lead = Lead(
        lead_id=generate_lead_id(),
        customer_id=lead.customer_id,
        source_id=lead.source_id,
        product_interested_in=lead.product_interested_in,
        remarks=lead.remarks,
        created_by_id=current_employee.id,
        status="NEW",
        call_status="NEW"
    )
    db.add(db_lead)
    db.commit()
    db.refresh(db_lead)
    return db_lead

def get_lead(db: Session, lead_id: int) -> Lead:
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
    return lead

def get_my_leads(db: Session, current_employee: Employee, skip: int = 0, limit: int = 100) -> list[Lead]:
    return db.query(Lead).filter(Lead.assigned_employee_id == current_employee.id).offset(skip).limit(limit).all()

def update_lead(db: Session, lead_id: int, lead_update: LeadUpdate, current_employee: Employee) -> Lead:
    db_lead = get_lead(db, lead_id)
    
    update_data = lead_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_lead, key, value)
        
    db.commit()
    db.refresh(db_lead)
    return db_lead
