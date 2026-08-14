from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.site_visit import SiteVisit
from app.models.lead import Lead
from app.models.employee import Employee
from app.schema.site_visit import SiteVisitCreate, SiteVisitUpdate

def create_site_visit(db: Session, visit: SiteVisitCreate, current_employee: Employee) -> SiteVisit:
    lead = db.query(Lead).filter(Lead.id == visit.lead_id).first()
    if not lead:
        raise HTTPException(status_code=404, detail="Lead not found")
        
    db_visit = SiteVisit(
        lead_id=visit.lead_id,
        customer_id=visit.customer_id,
        visit_date=visit.visit_date,
        visit_time=visit.visit_time,
        site_address=visit.site_address,
        location=visit.location,
        remarks=visit.remarks,
        requested_by_id=current_employee.id,
        status="Requested"
    )
    db.add(db_visit)
    db.commit()
    db.refresh(db_visit)
    return db_visit

def get_site_visit(db: Session, visit_id: int) -> SiteVisit:
    visit = db.query(SiteVisit).filter(SiteVisit.id == visit_id).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Site visit not found")
    return visit

def get_my_requests(db: Session, current_employee: Employee, skip: int = 0, limit: int = 100) -> list[SiteVisit]:
    return db.query(SiteVisit).filter(SiteVisit.requested_by_id == current_employee.id).offset(skip).limit(limit).all()

def update_site_visit(db: Session, visit_id: int, visit_update: SiteVisitUpdate, current_employee: Employee) -> SiteVisit:
    db_visit = get_site_visit(db, visit_id)
    
    update_data = visit_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_visit, key, value)
        
    db.commit()
    db.refresh(db_visit)
    return db_visit
