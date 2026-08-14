from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class LeadFollowup(Base):
    __tablename__ = "lead_followups"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    follow_up_date = Column(Date, nullable=False)
    follow_up_time = Column(Time, nullable=False)
    purpose = Column(String)
    notes = Column(String)
    status = Column(String, default="Scheduled")
    completed_at = Column(DateTime(timezone=True))
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    lead = relationship("Lead", back_populates="followups")
    customer = relationship("Customer")
    employee = relationship("Employee")
