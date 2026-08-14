from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schema.salary import SalaryResponse, SalaryCalculationResponse
from app.services.salary_service import SalaryService
from app.services.auth_service import get_current_employee, check_role
from app.models.employee import Employee
from app.models.salary import Salary

router = APIRouter(prefix="/api/account/salaries", tags=["Salaries"])

@router.get("/{employee_id}/calculate/{salary_month}", response_model=SalaryResponse)
def calculate_salary(
    employee_id: int,
    salary_month: str,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return SalaryService.calculate_salary(db, employee_id, salary_month)

@router.post("/{salary_id}/process", response_model=SalaryResponse)
def process_salary(
    salary_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return SalaryService.process_salary(db, salary_id, current_employee.id)
