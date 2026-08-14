from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Partner(Base):
    __tablename__ = "partners"
    
    id = Column(Integer, primary_key=True, index=True)
    partner_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, index=True, nullable=False)
    company_name = Column(String)
    email = Column(String, unique=True, index=True)
    mobile = Column(String, nullable=False)
    
    active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
