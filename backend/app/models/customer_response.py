from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class CustomerResponse(Base):
    __tablename__ = "customer_responses"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    response = Column(String)
    remarks = Column(String)
    
    created_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    lead = relationship("Lead", back_populates="responses")
    customer = relationship("Customer")
    created_by = relationship("Employee")
