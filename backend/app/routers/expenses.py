from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schema.expense import ExpenseResponse, ExpenseProcessRequest, ExpenseReimbursementRequest
from app.services.expense_service import ExpenseService
from app.services.auth_service import get_current_employee, check_role
from app.models.employee import Employee
from app.models.expense import Expense

router = APIRouter(prefix="/api/account/expenses", tags=["Expenses"])

@router.get("", response_model=List[ExpenseResponse])
def get_expenses(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return db.query(Expense).all()

@router.get("/pending", response_model=List[ExpenseResponse])
def get_pending_expenses(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return db.query(Expense).filter(Expense.approval_status == "PENDING").all()

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense_by_id(
    expense_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return db.query(Expense).filter(Expense.id == expense_id).first()

@router.post("/{expense_id}/process", response_model=ExpenseResponse)
def process_expense(
    expense_id: int,
    request: ExpenseProcessRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return ExpenseService.process_expense(db, expense_id, current_employee.id, request)

@router.post("/{expense_id}/reimburse", response_model=ExpenseResponse)
def reimburse_expense(
    expense_id: int,
    request: ExpenseReimbursementRequest,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return ExpenseService.reimburse_expense(db, expense_id, current_employee.id)

@router.post("/{expense_id}/salary-adjustment", response_model=ExpenseResponse)
def salary_adjustment(
    expense_id: int,
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    return ExpenseService.salary_adjustment(db, expense_id, current_employee.id)
