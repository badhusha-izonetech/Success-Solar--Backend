from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class RequirementBase(BaseModel):
    product: Optional[str] = None
    requirement_description: Optional[str] = None
    expected_capacity: Optional[str] = None
    location: Optional[str] = None
    preferred_visit_date: Optional[date] = None
    additional_requirements: Optional[str] = None
    remarks: Optional[str] = None

class RequirementCreate(RequirementBase):
    lead_id: int
    customer_id: int

class RequirementUpdate(RequirementBase):
    pass

class RequirementResponse(RequirementBase):
    id: int
    lead_id: int
    customer_id: int
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)
