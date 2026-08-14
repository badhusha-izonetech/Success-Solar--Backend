from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, time, datetime

class CallBase(BaseModel):
    lead_id: int
    customer_id: int
    call_date: date
    call_time: time
    call_status: str
    duration: Optional[int] = None
    remarks: Optional[str] = None

class CallCreate(CallBase):
    pass

class CallUpdate(BaseModel):
    call_status: Optional[str] = None
    duration: Optional[int] = None
    remarks: Optional[str] = None

class CallStatusUpdate(BaseModel):
    call_status: str
    duration: Optional[int] = None
    remarks: Optional[str] = None

class CallResponse(CallBase):
    id: int
    employee_id: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    model_config = ConfigDict(from_attributes=True)
