"""
Quotation service — number generation, server-side totals, revision chain.
"""

from __future__ import annotations

from typing import List, Optional

from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import BusinessRuleError, NotFoundError
from app.models.employee import Employee
from app.models.quotation import Quotation, QuotationLineItem
from app.schemas.quotation import QuotationCreate, QuotationRevise
from app.utils.quotation_number import generate_quotation_number
from app.utils.quotation_totals import LineItemInput, compute_quotation_totals
from decimal import Decimal


def _map_line_inputs(items) -> List[LineItemInput]:
    return [
        LineItemInput(
            quantity=Decimal(str(item.quantity)),
            unit_price=Decimal(str(item.unit_price)),
            discount=Decimal(str(item.discount)),
            gst_percent=Decimal(str(item.gst_percent)),
            labour_charge=Decimal(str(item.labour_charge)),
        )
        for item in items
    ]


async def create_quotation(
    db: AsyncSession, payload: QuotationCreate, current_user: Employee
) -> Quotation:
    number = await generate_quotation_number(db)
    totals = compute_quotation_totals(
        _map_line_inputs(payload.line_items),
        Decimal(str(payload.advance_percentage)),
        Decimal(str(payload.other_charges)),
    )

    quotation = Quotation(
        quotation_number=number,
        revision_number=0,
        customer_name=payload.customer_name,
        site=payload.site,
        date=payload.date,
        valid_until=payload.valid_until,
        prepared_by=current_user.name,
        prepared_by_id=current_user.id,
        project_type=payload.project_type,
        advance_percentage=payload.advance_percentage,
        other_charges=payload.other_charges,
        payment_terms=payload.payment_terms,
        installation_terms=payload.installation_terms,
        warranty_terms=payload.warranty_terms,
        notes=payload.notes,
        lead_id=payload.lead_id,
        created_by_ceo=(current_user.designation == "CEO"),
        subtotal=totals.subtotal,
        discount_total=totals.discount_total,
        tax_total=totals.tax_total,
        labour_total=totals.labour_total,
        grand_total=totals.grand_total,
        advance_amount=totals.advance_amount,
        balance_amount=totals.balance_amount,
        status="Draft",
    )
    db.add(quotation)
    await db.flush()

    for idx, (item_schema, line_result) in enumerate(
        zip(payload.line_items, totals.line_results)
    ):
        line = QuotationLineItem(
            quotation_id=quotation.id,
            sort_order=item_schema.sort_order or idx,
            product=item_schema.product,
            description=item_schema.description,
            quantity=item_schema.quantity,
            unit=item_schema.unit,
            unit_price=item_schema.unit_price,
            discount=item_schema.discount,
            gst_percent=item_schema.gst_percent,
            labour_charge=item_schema.labour_charge,
            line_base=line_result.line_base,
            line_discount_amount=line_result.line_discount_amount,
            line_tax_amount=line_result.line_tax_amount,
            line_total=line_result.line_total,
        )
        db.add(line)

    await db.flush()
    return quotation


async def revise_quotation(
    db: AsyncSession, quotation_id: str, payload: QuotationRevise, current_user: Employee
) -> Quotation:
    """
    Append-only revision: never edits or deletes the original.
    Original → Expired, new row → Draft with same quotationNumber, revisionNumber+1.
    """
    result = await db.execute(
        select(Quotation).options(selectinload(Quotation.line_items)).where(
            Quotation.id == quotation_id, Quotation.is_deleted == False
        )
    )
    original = result.scalar_one_or_none()
    if not original:
        raise NotFoundError("Quotation")

    if original.status in ("Expired", "Customer Approved"):
        raise BusinessRuleError(
            f"Cannot revise a quotation with status '{original.status}'"
        )

    advance_pct = Decimal(str(payload.advance_percentage)) if payload.advance_percentage else original.advance_percentage
    other_charges = Decimal(str(payload.other_charges)) if payload.other_charges else original.other_charges

    totals = compute_quotation_totals(
        _map_line_inputs(payload.line_items),
        advance_pct,
        other_charges,
    )

    # Flip original to Expired
    original.status = "Expired"
    db.add(original)

    new_quotation = Quotation(
        quotation_number=original.quotation_number,
        revision_number=original.revision_number + 1,
        previous_quotation_id=original.id,
        revision_reason=payload.revision_reason,
        customer_name=original.customer_name,
        site=original.site,
        date=original.date,
        valid_until=original.valid_until,
        prepared_by=current_user.name,
        prepared_by_id=current_user.id,
        project_type=original.project_type,
        advance_percentage=advance_pct,
        other_charges=other_charges,
        payment_terms=original.payment_terms,
        installation_terms=original.installation_terms,
        warranty_terms=original.warranty_terms,
        notes=payload.notes or original.notes,
        lead_id=original.lead_id,
        created_by_ceo=original.created_by_ceo,
        subtotal=totals.subtotal,
        discount_total=totals.discount_total,
        tax_total=totals.tax_total,
        labour_total=totals.labour_total,
        grand_total=totals.grand_total,
        advance_amount=totals.advance_amount,
        balance_amount=totals.balance_amount,
        status="Draft",
    )
    db.add(new_quotation)
    await db.flush()

    for idx, (item_schema, line_result) in enumerate(
        zip(payload.line_items, totals.line_results)
    ):
        line = QuotationLineItem(
            quotation_id=new_quotation.id,
            sort_order=item_schema.sort_order or idx,
            product=item_schema.product,
            description=item_schema.description,
            quantity=item_schema.quantity,
            unit=item_schema.unit,
            unit_price=item_schema.unit_price,
            discount=item_schema.discount,
            gst_percent=item_schema.gst_percent,
            labour_charge=item_schema.labour_charge,
            line_base=line_result.line_base,
            line_discount_amount=line_result.line_discount_amount,
            line_tax_amount=line_result.line_tax_amount,
            line_total=line_result.line_total,
        )
        db.add(line)

    await db.flush()
    return new_quotation


async def list_quotations(
    db: AsyncSession,
    current_user: Employee,
    lead_id: Optional[str] = None,
    offset: int = 0,
    limit: int = 100,
) -> tuple[List[Quotation], int]:
    q = select(Quotation).options(selectinload(Quotation.line_items)).where(
        Quotation.is_deleted == False
    )
    if lead_id:
        q = q.where(Quotation.lead_id == lead_id)

    total = (await db.execute(select(func.count()).select_from(q.subquery()))).scalar_one()
    result = await db.execute(q.order_by(Quotation.created_at.desc()).offset(offset).limit(limit))
    return result.scalars().all(), total


async def get_quotation(db: AsyncSession, quotation_id: str) -> Quotation:
    result = await db.execute(
        select(Quotation).options(selectinload(Quotation.line_items)).where(
            Quotation.id == quotation_id, Quotation.is_deleted == False
        )
    )
    q = result.scalar_one_or_none()
    if not q:
        raise NotFoundError("Quotation")
    return q
