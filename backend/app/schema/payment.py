from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from datetime import date, datetime

class PaymentProofBase(BaseModel):
    file_reference: str
    proof_type: Optional[str] = None
    remarks: Optional[str] = None

class PaymentProofResponse(PaymentProofBase):
    id: int
    payment_id: int
    uploaded_by: int
    uploaded_at: datetime
    model_config = ConfigDict(from_attributes=True)

class PaymentBase(BaseModel):
    project_id: Optional[int] = None
    customer_id: int
    partner_id: Optional[int] = None
    payment_type: str
    required_amount: float
    paid_amount: float
    payment_date: date
    payment_method: str
    transaction_reference: str
    remarks: Optional[str] = None

class PaymentCreate(PaymentBase):
    pass

class PaymentUpdate(BaseModel):
    paid_amount: Optional[float] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None
    status: Optional[str] = None

class PaymentResponse(PaymentBase):
    id: int
    payment_id: str
    status: str
    verified_by: Optional[int] = None
    verified_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    proofs: List[PaymentProofResponse] = []
    
    model_config = ConfigDict(from_attributes=True)

class PaymentVerificationRequest(BaseModel):
    pass

class PaymentRejectRequest(BaseModel):
    rejection_reason: str

class PendingPaymentQueueItem(BaseModel):
    payment_id: str
    project_id: Optional[str] = None
    customer_name: Optional[str] = None
    partner_name: Optional[str] = None
    payment_type: str
    required_amount: float
    paid_amount: float
    payment_date: date
    payment_method: str
    transaction_reference: str
    proof_available: bool
    status: str
    created_at: datetime
    required_action: str
