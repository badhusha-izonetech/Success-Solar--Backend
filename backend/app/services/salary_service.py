from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.salary import Salary
from app.models.employee import Employee
from sqlalchemy.sql import func

class SalaryService:
    @staticmethod
    def calculate_salary(db: Session, employee_id: int, salary_month: str):
        employee = db.query(Employee).filter(Employee.id == employee_id).first()
        if not employee:
            raise HTTPException(status_code=404, detail="Employee not found")
            
        # Example calculation (In reality, we'd fetch actual OT, Advances, PF configurations)
        basic = 50000.0
        allowances = 5000.0
        approved_ot = 2000.0
        approved_reimbursements = 1000.0
        
        pf_employee = 1800.0
        esi_employee = 375.0
        advance = 0.0
        other_deductions = 0.0
        
        net_salary = (basic + allowances + approved_ot + approved_reimbursements) - (pf_employee + esi_employee + advance + other_deductions)
        
        # Save or update draft
        salary = db.query(Salary).filter(Salary.employee_id == employee_id, Salary.salary_month == salary_month).first()
        if not salary:
            salary = Salary(
                employee_id=employee_id,
                salary_month=salary_month
            )
            db.add(salary)
            
        salary.basic_salary = basic
        salary.allowances = allowances
        salary.approved_ot = approved_ot
        salary.approved_reimbursements = approved_reimbursements
        salary.pf_employee = pf_employee
        salary.esi_employee = esi_employee
        salary.advance = advance
        salary.other_deductions = other_deductions
        salary.net_salary = net_salary
        salary.status = "CALCULATED"
        
        db.commit()
        db.refresh(salary)
        
        return salary

    @staticmethod
    def process_salary(db: Session, salary_id: int, processor_id: int):
        salary = db.query(Salary).filter(Salary.id == salary_id).first()
        if not salary:
            raise HTTPException(status_code=404, detail="Salary not found")
            
        if salary.status == "PROCESSED":
            raise HTTPException(status_code=409, detail="Salary already processed")
            
        salary.status = "PROCESSED"
        salary.processed_by = processor_id
        salary.processed_at = func.now()
        
        db.commit()
        db.refresh(salary)
        return salary
