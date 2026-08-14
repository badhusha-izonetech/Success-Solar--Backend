from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class LeadBase(BaseModel):
    customer_id: int
    source_id: int
    product_interested_in: Optional[str] = None
    remarks: Optional[str] = None

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    assigned_employee_id: Optional[int] = None
    status: Optional[str] = None
    call_status: Optional[str] = None
    follow_up_date: Optional[date] = None
    remarks: Optional[str] = None

class LeadResponse(LeadBase):
    id: int
    lead_id: str
    assigned_employee_id: Optional[int]
    status: str
    call_status: str
    follow_up_date: Optional[date]
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)
