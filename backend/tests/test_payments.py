"""
Payment tests — verify/reject, Accountant-only gate.
"""

import pytest


@pytest.mark.asyncio
async def test_telecaller_cannot_verify_payment(client, telecaller_token):
    """Telecallers must not be able to access payment verify endpoint."""
    resp = await client.patch(
        "/api/v1/payments/fake-id/verify",
        headers={"Authorization": f"Bearer {telecaller_token}"},
        json={"actual_amount": "50000", "payment_mode": "UPI"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_rejection_requires_remarks(client, ceo_token, test_session_factory):
    """Payment rejection without remarks should be rejected."""
    from app.models.payment import Payment
    from decimal import Decimal

    async with test_session_factory() as session:
        payment = Payment(
            project_id="test-proj-id",
            customer_name="Test Customer",
            expected_amount=Decimal("50000"),
            payment_type="Advance (50%)",
            state="Proof Uploaded",
            submitted_by="Test User",
        )
        session.add(payment)
        await session.commit()
        payment_id = payment.id

    resp = await client.patch(
        f"/api/v1/payments/{payment_id}/reject",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={},  # No remarks
    )
    assert resp.status_code in (400, 422)
