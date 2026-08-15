"""
Customer schemas.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Optional

from pydantic import BaseModel


class CustomerBase(BaseModel):
    name: str
    mobile: str
    alternate_mobile: Optional[str] = None
    email: Optional[str] = None
    customer_type: str
    address: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None


class CustomerCreate(CustomerBase):
    source_lead_id: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    alternate_mobile: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    area: Optional[str] = None
    city: Optional[str] = None


class CustomerRead(CustomerBase):
    id: str
    source_lead_id: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExistingCustomerView(BaseModel):
    """
    Shape for GET /customers/existing — matches ExistingCustomer interface in frontend.
    Derived from customers with >=1 project at currentStage = 'Completed'.
    """
    customer_id: str
    customer_name: str
    mobile: str
    area: Optional[str] = None
    site: Optional[str] = None
    completed_project_id: str
    completed_project_code: str
    completed_on: Optional[str] = None
    total_value: Decimal
    capacity_kw: Optional[Decimal] = None

    model_config = {"from_attributes": True}
