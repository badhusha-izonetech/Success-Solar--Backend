from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.call import Call
from app.models.lead import Lead
from app.models.employee import Employee
from app.schema.call import CallCreate, CallStatusUpdate

VALID_CALL_STATUSES = [
    "New", "Called", "Interested", "Call Back", 
    "Not Interested", "Wrong Number", "Site Visit Required", 
    "Site Visit Scheduled", "Converted", "Lost"
]

def create_call(db: Session, call: CallCreate, current_employee: Employee) -> Call:
    lead = db.query(Lead).filter(Lead.id == call.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    if call.call_status not in VALID_CALL_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid call status")
        
    db_call = Call(
        lead_id=call.lead_id,
        customer_id=call.customer_id,
        employee_id=current_employee.id,
        call_date=call.call_date,
        call_time=call.call_time,
        call_status=call.call_status,
        duration=call.duration,
        remarks=call.remarks
    )
    db.add(db_call)
    
    lead.call_status = call.call_status
    if call.call_status in ["Interested", "Site Visit Required", "Site Visit Scheduled", "Converted", "Lost"]:
        lead.status = call.call_status
        
    db.commit()
    db.refresh(db_call)
    return db_call

def get_calls(db: Session, skip: int = 0, limit: int = 100) -> list[Call]:
    return db.query(Call).offset(skip).limit(limit).all()

def get_call(db: Session, call_id: int) -> Call:
    call = db.query(Call).filter(Call.id == call_id).first()
    if not call:
        raise HTTPException(status_code=404, detail="Call not found")
    return call

def get_my_calls(db: Session, current_employee: Employee, skip: int = 0, limit: int = 100) -> list[Call]:
    return db.query(Call).filter(Call.employee_id == current_employee.id).offset(skip).limit(limit).all()

def update_call_status(db: Session, call_id: int, status_update: CallStatusUpdate, current_employee: Employee) -> Call:
    db_call = get_call(db, call_id)
    
    if db_call.employee_id != current_employee.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this call")
        
    if status_update.call_status not in VALID_CALL_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid call status")
        
    db_call.call_status = status_update.call_status
    if status_update.duration is not None:
        db_call.duration = status_update.duration
    if status_update.remarks is not None:
        db_call.remarks = status_update.remarks
        
    lead = db.query(Lead).filter(Lead.id == db_call.lead_id).first()
    if lead:
        lead.call_status = status_update.call_status
        if status_update.call_status in ["Interested", "Site Visit Required", "Site Visit Scheduled", "Converted", "Lost"]:
            lead.status = status_update.call_status
            
    db.commit()
    db.refresh(db_call)
    return db_call
