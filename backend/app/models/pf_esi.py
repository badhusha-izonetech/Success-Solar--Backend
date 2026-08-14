from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class PfEsi(Base):
    __tablename__ = "pf_esi_records"
    
    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False, index=True)
    salary_month = Column(String, nullable=False, index=True) # e.g., '2026-08'
    
    pf_applicable = Column(Boolean, default=False)
    pf_employee_contribution = Column(Float, default=0.0)
    pf_employer_contribution = Column(Float, default=0.0)
    
    esi_applicable = Column(Boolean, default=False)
    esi_employee_contribution = Column(Float, default=0.0)
    esi_employer_contribution = Column(Float, default=0.0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    employee = relationship("Employee")
