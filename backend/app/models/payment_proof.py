from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class PaymentProof(Base):
    __tablename__ = "payment_proofs"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(Integer, ForeignKey("payments.id"), nullable=False)
    
    file_reference = Column(String, nullable=False)
    proof_type = Column(String)
    remarks = Column(String)
    
    uploaded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    uploaded_at = Column(DateTime(timezone=True), server_default=func.now())
    
    payment = relationship("Payment", back_populates="proofs")
    uploader = relationship("User")
