from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date, Time
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Call(Base):
    __tablename__ = "calls"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    call_date = Column(Date, nullable=False)
    call_time = Column(Time, nullable=False)
    call_status = Column(String, nullable=False)
    duration = Column(Integer)
    remarks = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    lead = relationship("Lead", back_populates="calls")
    customer = relationship("Customer")
    employee = relationship("Employee")
