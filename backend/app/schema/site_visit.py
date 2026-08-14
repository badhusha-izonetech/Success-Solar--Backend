from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, time, datetime

class SiteVisitBase(BaseModel):
    visit_date: date
    visit_time: time
    site_address: Optional[str] = None
    location: Optional[str] = None
    remarks: Optional[str] = None

class SiteVisitCreate(SiteVisitBase):
    lead_id: int
    customer_id: int

class SiteVisitUpdate(BaseModel):
    visit_date: Optional[date] = None
    visit_time: Optional[time] = None
    site_address: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None
    remarks: Optional[str] = None
    assigned_employee_id: Optional[int] = None

class SiteVisitResponse(SiteVisitBase):
    id: int
    lead_id: int
    customer_id: int
    requested_by_id: int
    assigned_employee_id: Optional[int] = None
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
