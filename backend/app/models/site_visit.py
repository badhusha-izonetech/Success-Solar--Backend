from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class SiteVisit(Base):
    __tablename__ = "site_visits"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    requested_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    
    visit_date = Column(Date, nullable=False)
    visit_time = Column(Time, nullable=False)
    site_address = Column(String)
    location = Column(String)
    status = Column(String, default="Requested")
    remarks = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    lead = relationship("Lead", back_populates="site_visits")
    customer = relationship("Customer")
    requested_by = relationship("Employee", foreign_keys=[requested_by_id])
    assigned_employee = relationship("Employee", foreign_keys=[assigned_employee_id])
