"""
Quotation number generation — SSC-QT-YYYY-NNNN format.
Number is stable across revisions (same quotationNumber, incremented revisionNumber).
"""

from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import select, func, extract
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings


async def generate_quotation_number(db: AsyncSession) -> str:
    """
    Generate the next quotation number for the current year.
    Pattern: SSC-QT-2026-0001
    """
    from app.models.quotation import Quotation

    year = datetime.now(timezone.utc).year
    prefix = f"SSC-QT-{year}-"

    # Count existing quotation numbers (distinct) for this year
    result = await db.execute(
        select(func.count(func.distinct(Quotation.quotation_number))).where(
            Quotation.quotation_number.like(f"{prefix}%")
        )
    )
    count = result.scalar_one() or 0
    next_num = count + 1
    return f"{prefix}{next_num:04d}"
