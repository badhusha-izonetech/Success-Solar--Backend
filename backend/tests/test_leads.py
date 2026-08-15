"""
Lead tests — scoping, status transitions, business rules.
"""

import pytest


@pytest.mark.asyncio
async def test_create_lead_as_ceo(client, ceo_token):
    resp = await client.post(
        "/api/v1/leads",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={
            "customer_name": "Test Customer",
            "mobile": "9000000001",
            "customer_type": "Residential",
            "lead_source": "Referral",
            "priority": "High",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["customer_name"] == "Test Customer"
    assert data["status"] == "New"


@pytest.mark.asyncio
async def test_telecaller_sees_own_leads_only(client, telecaller_token, ceo_token):
    # CEO creates a lead NOT assigned to telecaller
    await client.post(
        "/api/v1/leads",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={
            "customer_name": "CEO Lead",
            "mobile": "9000000002",
            "customer_type": "Commercial",
            "lead_source": "Walk-in",
        },
    )

    # Telecaller should NOT see CEO's lead (scoped to own only)
    resp = await client.get(
        "/api/v1/leads",
        headers={"Authorization": f"Bearer {telecaller_token}"},
    )
    assert resp.status_code == 200
    data = resp.json()
    names = [l["customer_name"] for l in data["items"]]
    assert "CEO Lead" not in names


@pytest.mark.asyncio
async def test_lost_status_requires_reason(client, ceo_token):
    # Create a lead
    create_resp = await client.post(
        "/api/v1/leads",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={
            "customer_name": "Lost Test",
            "mobile": "9000000003",
            "customer_type": "Residential",
            "lead_source": "Cold Call",
        },
    )
    lead_id = create_resp.json()["id"]

    # Try marking as Lost without reason — should fail
    resp = await client.patch(
        f"/api/v1/leads/{lead_id}/status",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={"status": "Lost"},
    )
    assert resp.status_code == 400


@pytest.mark.asyncio
async def test_lost_status_with_reason_succeeds(client, ceo_token):
    create_resp = await client.post(
        "/api/v1/leads",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={
            "customer_name": "Lost OK",
            "mobile": "9000000004",
            "customer_type": "Residential",
            "lead_source": "Cold Call",
        },
    )
    lead_id = create_resp.json()["id"]

    resp = await client.patch(
        f"/api/v1/leads/{lead_id}/status",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={
            "status": "Lost",
            "lost_reason": "Price Too High",
            "lost_reason_detail": "Customer found cheaper alternative",
        },
    )
    assert resp.status_code == 200
    assert resp.json()["status"] == "Lost"
