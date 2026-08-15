"""
Quotation schemas — server-computed totals, revision chain.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import List, Optional

from pydantic import BaseModel


class LineItemCreate(BaseModel):
    product: str
    description: Optional[str] = None
    quantity: Decimal
    unit: str
    unit_price: Decimal
    discount: Decimal = Decimal("0")
    gst_percent: Decimal = Decimal("0")
    labour_charge: Decimal = Decimal("0")
    sort_order: int = 0


class LineItemRead(LineItemCreate):
    id: str
    line_base: Decimal
    line_discount_amount: Decimal
    line_tax_amount: Decimal
    line_total: Decimal

    model_config = {"from_attributes": True}


class QuotationCreate(BaseModel):
    customer_name: str
    site: Optional[str] = None
    date: str
    valid_until: Optional[str] = None
    project_type: Optional[str] = None
    advance_percentage: Decimal = Decimal("50")
    other_charges: Decimal = Decimal("0")
    payment_terms: Optional[str] = None
    installation_terms: Optional[str] = None
    warranty_terms: Optional[str] = None
    notes: Optional[str] = None
    lead_id: Optional[str] = None
    line_items: List[LineItemCreate]


class QuotationRevise(BaseModel):
    revision_reason: str
    line_items: List[LineItemCreate]
    advance_percentage: Optional[Decimal] = None
    other_charges: Optional[Decimal] = None
    notes: Optional[str] = None


class QuotationStatusUpdate(BaseModel):
    status: str


class QuotationRead(BaseModel):
    id: str
    quotation_number: str
    revision_number: int
    previous_quotation_id: Optional[str] = None
    revision_reason: Optional[str] = None
    customer_name: str
    site: Optional[str] = None
    date: str
    valid_until: Optional[str] = None
    prepared_by: str
    prepared_by_id: Optional[str] = None
    project_type: Optional[str] = None
    status: str
    subtotal: Decimal
    discount_total: Decimal
    tax_total: Decimal
    labour_total: Decimal
    other_charges: Decimal
    grand_total: Decimal
    advance_percentage: Decimal
    advance_amount: Decimal
    balance_amount: Decimal
    payment_terms: Optional[str] = None
    installation_terms: Optional[str] = None
    warranty_terms: Optional[str] = None
    notes: Optional[str] = None
    lead_id: Optional[str] = None
    created_by_ceo: bool = False
    line_items: List[LineItemRead] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
