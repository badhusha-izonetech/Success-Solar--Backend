from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import date, datetime

class ExpenseBase(BaseModel):
    employee_id: int
    project_id: Optional[int] = None
    expense_category: str
    date: date
    amount: float
    description: Optional[str] = None
    location: Optional[str] = None
    bill_or_receipt: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    expense_category: Optional[str] = None
    date: Optional[date] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    location: Optional[str] = None
    bill_or_receipt: Optional[str] = None

class ExpenseResponse(ExpenseBase):
    id: int
    expense_id: str
    approval_status: str
    rejection_reason: Optional[str] = None
    approved_by: Optional[int] = None
    processed_by: Optional[int] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class ExpenseProcessRequest(BaseModel):
    action: str # APPROVE, REJECT
    rejection_reason: Optional[str] = None

class ExpenseReimbursementRequest(BaseModel):
    pass
