from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.expense import Expense
from app.schema.expense import ExpenseProcessRequest
from sqlalchemy.sql import func

class ExpenseService:
    @staticmethod
    def process_expense(db: Session, expense_id: int, processor_id: int, request: ExpenseProcessRequest):
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
            
        if request.action == "APPROVE":
            expense.approval_status = "APPROVED"
            expense.approved_by = processor_id
        elif request.action == "REJECT":
            if not request.rejection_reason:
                raise HTTPException(status_code=422, detail="Rejection reason required")
            expense.approval_status = "REJECTED"
            expense.rejection_reason = request.rejection_reason
            expense.approved_by = processor_id
        else:
            raise HTTPException(status_code=400, detail="Invalid action")
            
        db.commit()
        db.refresh(expense)
        return expense

    @staticmethod
    def reimburse_expense(db: Session, expense_id: int, processor_id: int):
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
            
        if expense.approval_status != "APPROVED":
            raise HTTPException(status_code=409, detail="Only approved expenses can be reimbursed")
            
        expense.approval_status = "REIMBURSED"
        expense.processed_by = processor_id
        
        db.commit()
        db.refresh(expense)
        return expense
        
    @staticmethod
    def salary_adjustment(db: Session, expense_id: int, processor_id: int):
        expense = db.query(Expense).filter(Expense.id == expense_id).first()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
            
        if expense.approval_status != "APPROVED":
            raise HTTPException(status_code=409, detail="Only approved expenses can be added to salary")
            
        expense.approval_status = "ADDED_TO_SALARY"
        expense.processed_by = processor_id
        
        db.commit()
        db.refresh(expense)
        return expense
