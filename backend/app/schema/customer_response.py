from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CustomerResponseBase(BaseModel):
    response: Optional[str] = None
    remarks: Optional[str] = None

class CustomerResponseCreate(CustomerResponseBase):
    lead_id: int
    customer_id: int

class CustomerResponseUpdate(CustomerResponseBase):
    pass

class CustomerResponseResponse(CustomerResponseBase):
    id: int
    lead_id: int
    customer_id: int
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
