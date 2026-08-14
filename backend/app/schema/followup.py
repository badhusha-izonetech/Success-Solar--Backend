from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, time, datetime

class FollowUpBase(BaseModel):
    lead_id: int
    customer_id: int
    follow_up_date: date
    follow_up_time: time
    purpose: Optional[str] = None
    notes: Optional[str] = None

class FollowUpCreate(FollowUpBase):
    pass

class FollowUpUpdate(BaseModel):
    follow_up_date: Optional[date] = None
    follow_up_time: Optional[time] = None
    purpose: Optional[str] = None
    notes: Optional[str] = None
    status: Optional[str] = None

class FollowUpResponse(FollowUpBase):
    id: int
    employee_id: int
    status: str
    completed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
