from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Expense(Base):
    __tablename__ = "expenses"
    
    id = Column(Integer, primary_key=True, index=True)
    expense_id = Column(String, unique=True, index=True, nullable=False)
    
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    vehicle_id = Column(Integer, nullable=True) # Optional link to a Vehicle model if created later
    
    expense_category = Column(String, nullable=False)
    date = Column(Date, nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String)
    location = Column(String)
    bill_or_receipt = Column(String)
    
    approval_status = Column(String, default="PENDING", index=True) # PENDING, APPROVED, REJECTED, REIMBURSED, ADDED_TO_SALARY
    rejection_reason = Column(String)
    
    approved_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    processed_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    employee = relationship("Employee", foreign_keys=[employee_id])
    project = relationship("Project")
    approver = relationship("Employee", foreign_keys=[approved_by])
    processor = relationship("Employee", foreign_keys=[processed_by])
