from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Lead(Base):
    __tablename__ = "leads"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(String, unique=True, index=True, nullable=False)
    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    source_id = Column(Integer, ForeignKey("lead_sources.id"), nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    product_interested_in = Column(String)
    status = Column(String, default="NEW", index=True)
    call_status = Column(String, default="NEW", index=True)
    
    follow_up_date = Column(Date)
    remarks = Column(String)
    
    created_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    customer = relationship("Customer", back_populates="leads")
    source = relationship("LeadSource")
    assigned_employee = relationship("Employee", foreign_keys=[assigned_employee_id])
    created_by = relationship("Employee", foreign_keys=[created_by_id])
    
    calls = relationship("Call", back_populates="lead")
    followups = relationship("LeadFollowup", back_populates="lead")
    requirements = relationship("CustomerRequirement", back_populates="lead")
    responses = relationship("CustomerResponse", back_populates="lead")
    site_visits = relationship("SiteVisit", back_populates="lead")
