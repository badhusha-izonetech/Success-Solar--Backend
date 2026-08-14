from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import datetime, date

class SalaryBase(BaseModel):
    employee_id: int
    salary_month: str
    basic_salary: float
    allowances: Optional[float] = 0.0

class SalaryCreate(SalaryBase):
    pass

class SalaryResponse(SalaryBase):
    id: int
    approved_ot: float
    approved_reimbursements: float
    pf_employee: float
    esi_employee: float
    advance: float
    other_deductions: float
    net_salary: float
    status: str
    processed_by: Optional[int] = None
    processed_at: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    model_config = ConfigDict(from_attributes=True)

class SalaryCalculationResponse(BaseModel):
    basic_salary: float
    allowances: float
    approved_ot: float
    approved_reimbursements: float
    pf_employee: float
    esi_employee: float
    other_deductions: float
    net_salary: float
