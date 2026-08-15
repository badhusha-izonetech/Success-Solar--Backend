"""
Project schemas.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class ProjectCreate(BaseModel):
    customer_id: Optional[str] = None
    customer_name: str
    customer_mobile: Optional[str] = None
    site: Optional[str] = None
    area: Optional[str] = None
    quotation_id: Optional[str] = None
    project_value: Decimal
    advance_received: Decimal = Decimal("0")
    capacity_kw: Optional[Decimal] = None
    assigned_technician_id: Optional[str] = None
    assigned_doc_employee_id: Optional[str] = None
    next_action: Optional[str] = None
    due_date: Optional[str] = None
    priority: str = "Medium"


class ProjectUpdate(BaseModel):
    customer_name: Optional[str] = None
    site: Optional[str] = None
    area: Optional[str] = None
    next_action: Optional[str] = None
    due_date: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    eb_status: Optional[str] = None
    installation_status: Optional[str] = None


class ProjectStageUpdate(BaseModel):
    stage: str
    note: Optional[str] = None


class ProjectAssign(BaseModel):
    assigned_technician_id: Optional[str] = None
    assigned_doc_employee_id: Optional[str] = None


class StageHistoryRead(BaseModel):
    id: str
    stage: str
    changed_at: datetime
    changed_by_id: Optional[str] = None
    note: Optional[str] = None

    model_config = {"from_attributes": True}


class ProjectRead(BaseModel):
    id: str
    project_code: str
    customer_id: Optional[str] = None
    customer_name: str
    customer_mobile: Optional[str] = None
    site: Optional[str] = None
    area: Optional[str] = None
    quotation_id: Optional[str] = None
    project_value: Decimal
    advance_received: Decimal
    balance_amount: Decimal
    capacity_kw: Optional[Decimal] = None
    assigned_technician_id: Optional[str] = None
    assigned_doc_employee_id: Optional[str] = None
    current_stage: str
    status: str
    warehouse_status: str
    eb_status: str
    installation_status: str
    next_action: Optional[str] = None
    due_date: Optional[str] = None
    priority: str
    stage_history: List[StageHistoryRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
