from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import date
from app.models.lead_followup import LeadFollowup
from app.models.employee import Employee
from app.schema.followup import FollowUpCreate, FollowUpUpdate

VALID_STATUSES = ["Scheduled", "Completed", "Cancelled", "Missed"]

def create_followup(db: Session, followup: FollowUpCreate, current_employee: Employee) -> LeadFollowup:
    db_followup = LeadFollowup(
        lead_id=followup.lead_id,
        customer_id=followup.customer_id,
        employee_id=current_employee.id,
        follow_up_date=followup.follow_up_date,
        follow_up_time=followup.follow_up_time,
        purpose=followup.purpose,
        notes=followup.notes
    )
    db.add(db_followup)
    db.commit()
    db.refresh(db_followup)
    return db_followup

def get_followups(db: Session, skip: int = 0, limit: int = 100) -> list[LeadFollowup]:
    return db.query(LeadFollowup).offset(skip).limit(limit).all()

def get_followup(db: Session, followup_id: int) -> LeadFollowup:
    followup = db.query(LeadFollowup).filter(LeadFollowup.id == followup_id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    return followup

def get_today_followups(db: Session, current_employee: Employee) -> list[LeadFollowup]:
    today = date.today()
    return db.query(LeadFollowup).filter(
        LeadFollowup.employee_id == current_employee.id,
        LeadFollowup.follow_up_date == today
    ).all()

def get_my_followups(db: Session, current_employee: Employee, skip: int = 0, limit: int = 100) -> list[LeadFollowup]:
    return db.query(LeadFollowup).filter(LeadFollowup.employee_id == current_employee.id).offset(skip).limit(limit).all()

def get_overdue_followups(db: Session, current_employee: Employee) -> list[LeadFollowup]:
    today = date.today()
    return db.query(LeadFollowup).filter(
        LeadFollowup.employee_id == current_employee.id,
        LeadFollowup.follow_up_date < today,
        LeadFollowup.status == "Scheduled"
    ).all()

def update_followup(db: Session, followup_id: int, followup_update: FollowUpUpdate, current_employee: Employee) -> LeadFollowup:
    db_followup = get_followup(db, followup_id)
    
    if db_followup.employee_id != current_employee.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this follow-up")
        
    update_data = followup_update.model_dump(exclude_unset=True)
    
    if "status" in update_data and update_data["status"] not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    for key, value in update_data.items():
        setattr(db_followup, key, value)
        
    if db_followup.status in ["Completed", "Cancelled", "Missed"] and not db_followup.completed_at:
        from datetime import datetime, timezone
        db_followup.completed_at = datetime.now(timezone.utc)
        
    db.commit()
    db.refresh(db_followup)
    return db_followup
