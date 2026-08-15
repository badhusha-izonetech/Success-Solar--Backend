"""
Payment schemas.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class PaymentCreate(BaseModel):
    project_id: str
    customer_name: str
    quotation_id: Optional[str] = None
    expected_amount: Decimal
    actual_amount: Optional[Decimal] = None
    payment_type: str
    payment_date: Optional[str] = None
    payment_mode: Optional[str] = None
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None


class PaymentVerify(BaseModel):
    actual_amount: Decimal
    payment_mode: str
    transaction_reference: Optional[str] = None
    remarks: Optional[str] = None


class PaymentReject(BaseModel):
    remarks: str  # required on rejection


class ProofRead(BaseModel):
    id: str
    file_url: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class PaymentRead(BaseModel):
    id: str
    project_id: str
    customer_name: str
    quotation_id: Optional[str] = None
    expected_amount: Decimal
    actual_amount: Optional[Decimal] = None
    payment_type: str
    payment_date: Optional[str] = None
    payment_mode: Optional[str] = None
    transaction_reference: Optional[str] = None
    state: str
    submitted_by: Optional[str] = None
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    remarks: Optional[str] = None
    proofs: List[ProofRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
