from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Overtime(Base):
    __tablename__ = "overtimes"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True)
    
    ot_date = Column(Date, nullable=False)
    normal_working_hours = Column(Float, default=10.0) # 9 AM to 7 PM
    ot_hours = Column(Float, nullable=False)
    ot_amount = Column(Float, default=0.0)
    
    approval_status = Column(String, default="PENDING") # PENDING, APPROVED, REJECTED
    approved_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    employee = relationship("Employee", foreign_keys=[employee_id])
    project = relationship("Project")
    approver = relationship("Employee", foreign_keys=[approved_by])


class Salary(Base):
    __tablename__ = "salaries"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    salary_month = Column(String, nullable=False, index=True) # e.g., '2026-08'
    
    basic_salary = Column(Float, default=0.0)
    allowances = Column(Float, default=0.0)
    approved_ot = Column(Float, default=0.0)
    approved_reimbursements = Column(Float, default=0.0)
    
    pf_employee = Column(Float, default=0.0)
    esi_employee = Column(Float, default=0.0)
    advance = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    
    net_salary = Column(Float, default=0.0)
    
    status = Column(String, default="DRAFT", index=True) # DRAFT, CALCULATED, APPROVED, PROCESSED, CANCELLED
    
    processed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    processed_at = Column(DateTime(timezone=True), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    employee = relationship("Employee", foreign_keys=[employee_id])
    processor = relationship("Employee", foreign_keys=[processed_by])
