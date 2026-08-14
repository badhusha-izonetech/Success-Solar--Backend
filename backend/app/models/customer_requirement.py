from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class CustomerRequirement(Base):
    __tablename__ = "customer_requirements"
    
    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(Integer, ForeignKey("leads.id"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    
    product = Column(String)
    requirement_description = Column(String)
    expected_capacity = Column(String)
    location = Column(String)
    preferred_visit_date = Column(Date)
    additional_requirements = Column(String)
    remarks = Column(String)
    
    created_by_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    lead = relationship("Lead", back_populates="requirements")
    customer = relationship("Customer")
    created_by = relationship("Employee")
