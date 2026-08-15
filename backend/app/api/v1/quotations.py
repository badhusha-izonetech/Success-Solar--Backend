"""
Quotations router — create, revise, status update, document generation.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import Permission, require_permissions
from app.core.security import get_current_user
from app.schemas.quotation import QuotationCreate, QuotationRead, QuotationRevise, QuotationStatusUpdate
from app.services import quotation_service
from app.utils.pagination import PagedResponse, PaginationParams

router = APIRouter(prefix="/quotations", tags=["Quotations"])


@router.get("", response_model=PagedResponse[QuotationRead])
async def list_quotations(
    lead_id: Optional[str] = Query(None),
    params: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.QUOTATIONS_READ)),
):
    items, total = await quotation_service.list_quotations(db, current_user, lead_id, params.offset, params.limit)
    return PagedResponse.create([QuotationRead.model_validate(q) for q in items], total, params)


@router.post("", response_model=QuotationRead, status_code=201)
async def create_quotation(
    payload: QuotationCreate,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.QUOTATIONS_WRITE)),
):
    q = await quotation_service.create_quotation(db, payload, current_user)
    return QuotationRead.model_validate(q)


@router.get("/{quotation_id}", response_model=QuotationRead)
async def get_quotation(
    quotation_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permissions(Permission.QUOTATIONS_READ)),
):
    q = await quotation_service.get_quotation(db, quotation_id)
    return QuotationRead.model_validate(q)


@router.post("/{quotation_id}/revise", response_model=QuotationRead, status_code=201)
async def revise_quotation(
    quotation_id: str,
    payload: QuotationRevise,
    db: AsyncSession = Depends(get_db),
    current_user=Depends(require_permissions(Permission.QUOTATIONS_REVISE)),
):
    q = await quotation_service.revise_quotation(db, quotation_id, payload, current_user)
    return QuotationRead.model_validate(q)


@router.get("/{quotation_id}/document", summary="Download quotation as PDF")
async def download_document(
    quotation_id: str,
    db: AsyncSession = Depends(get_db),
    _=Depends(require_permissions(Permission.QUOTATIONS_READ)),
):
    from app.utils.pdf_generator import generate_quotation_pdf
    q = await quotation_service.get_quotation(db, quotation_id)
    pdf_bytes = generate_quotation_pdf(q)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{q.quotation_number}.pdf"'},
    )
