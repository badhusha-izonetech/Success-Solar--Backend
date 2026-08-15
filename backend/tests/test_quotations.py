"""
Quotation tests — server-side total computation, revision chain.
"""

import pytest
from decimal import Decimal


SAMPLE_QUOTATION = {
    "customer_name": "Test Customer",
    "date": "2026-08-15",
    "advance_percentage": "50",
    "other_charges": "0",
    "line_items": [
        {
            "product": "Solar Panel 400W",
            "quantity": "10",
            "unit": "pcs",
            "unit_price": "8500",
            "discount": "5",
            "gst_percent": "18",
            "labour_charge": "2000",
        }
    ],
}


@pytest.mark.asyncio
async def test_create_quotation_computes_totals(client, ceo_token):
    resp = await client.post(
        "/api/v1/quotations",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json=SAMPLE_QUOTATION,
    )
    assert resp.status_code == 201
    data = resp.json()

    # Verify server-computed totals
    # lineBase = 10 * 8500 = 85000
    # lineDiscount = 85000 * 5% = 4250
    # lineTax = (85000 - 4250) * 18% = 14535
    # labour = 2000
    # subtotal = 85000, discountTotal = 4250, taxTotal = 14535, labourTotal = 2000
    # grand = 85000 - 4250 + 14535 + 2000 = 99285
    assert Decimal(data["subtotal"]) == Decimal("85000.00")
    assert Decimal(data["discount_total"]) == Decimal("4250.00")
    assert Decimal(data["grand_total"]) == Decimal("99285")
    assert Decimal(data["advance_amount"]) == Decimal("49643")  # round(99285 * 50/100)


@pytest.mark.asyncio
async def test_quotation_revision_chain(client, ceo_token):
    # Create original
    create_resp = await client.post(
        "/api/v1/quotations",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json=SAMPLE_QUOTATION,
    )
    original_id = create_resp.json()["id"]
    original_number = create_resp.json()["quotation_number"]

    # Revise
    revise_resp = await client.post(
        f"/api/v1/quotations/{original_id}/revise",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={
            "revision_reason": "Price adjustment",
            "line_items": SAMPLE_QUOTATION["line_items"],
        },
    )
    assert revise_resp.status_code == 201
    new_q = revise_resp.json()

    # Same quotation number, incremented revision
    assert new_q["quotation_number"] == original_number
    assert new_q["revision_number"] == 1
    assert new_q["previous_quotation_id"] == original_id
    assert new_q["status"] == "Draft"

    # Original must now be Expired
    orig_resp = await client.get(
        f"/api/v1/quotations/{original_id}",
        headers={"Authorization": f"Bearer {ceo_token}"},
    )
    assert orig_resp.json()["status"] == "Expired"


@pytest.mark.asyncio
async def test_cannot_revise_expired_quotation(client, ceo_token):
    create_resp = await client.post(
        "/api/v1/quotations",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json=SAMPLE_QUOTATION,
    )
    qid = create_resp.json()["id"]

    # First revision — makes original Expired
    await client.post(
        f"/api/v1/quotations/{qid}/revise",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={"revision_reason": "Test", "line_items": SAMPLE_QUOTATION["line_items"]},
    )

    # Try to revise the now-Expired original again — must fail
    resp = await client.post(
        f"/api/v1/quotations/{qid}/revise",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={"revision_reason": "Again", "line_items": SAMPLE_QUOTATION["line_items"]},
    )
    assert resp.status_code == 400
