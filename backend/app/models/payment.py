from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Date
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, index=True)
    payment_id = Column(String, unique=True, index=True, nullable=False)
    
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False, index=True)
    partner_id = Column(Integer, ForeignKey("partners.id"), nullable=True)
    
    payment_type = Column(String, nullable=False, index=True) # ADVANCE_50, FINAL_PAYMENT
    required_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, nullable=False)
    
    payment_date = Column(Date, nullable=False, index=True)
    payment_method = Column(String, nullable=False)
    transaction_reference = Column(String, nullable=False, index=True)
    remarks = Column(String)
    
    status = Column(String, default="PENDING", index=True) # PENDING, PROOF_UPLOADED, UNDER_VERIFICATION, VERIFIED, REJECTED
    
    verified_by = Column(Integer, ForeignKey("employees.id"), nullable=True)
    verified_at = Column(DateTime(timezone=True), nullable=True)
    rejection_reason = Column(String)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    project = relationship("Project")
    customer = relationship("Customer")
    partner = relationship("Partner")
    verifier = relationship("Employee", foreign_keys=[verified_by])
    proofs = relationship("PaymentProof", back_populates="payment")
