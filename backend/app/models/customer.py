from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Customer(Base):
    __tablename__ = "customers"
    
    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    mobile_number = Column(String, index=True, nullable=False)
    alternative_number = Column(String)
    email = Column(String, index=True)
    location = Column(String)
    address = Column(String)
    
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    leads = relationship("Lead", back_populates="customer")
