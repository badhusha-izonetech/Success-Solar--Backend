"""
Stock tests — availableQuantity invariant, reserve/issue flow.
"""

import pytest


@pytest.mark.asyncio
async def test_stock_available_quantity_derived(client, ceo_token):
    # Create stock item
    resp = await client.post(
        "/api/v1/stock",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={
            "product_name": "Test Panel",
            "unit": "pcs",
            "current_quantity": "20",
            "minimum_level": "5",
            "cost_per_unit": "9000",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["available_quantity"] == "20.000"
    assert data["reserved_quantity"] == "0.000"


@pytest.mark.asyncio
async def test_stock_in_increases_available(client, ceo_token):
    create_resp = await client.post(
        "/api/v1/stock",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={"product_name": "Inverter Test", "unit": "pcs", "current_quantity": "5", "minimum_level": "2", "cost_per_unit": "30000"},
    )
    item_id = create_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/stock/{item_id}/stock-in",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={"quantity": "10"},
    )
    assert resp.status_code == 200
    assert float(resp.json()["current_quantity"]) == 15.0


@pytest.mark.asyncio
async def test_cannot_reserve_more_than_available(client, ceo_token):
    create_resp = await client.post(
        "/api/v1/stock",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={"product_name": "Limited Item", "unit": "pcs", "current_quantity": "2", "minimum_level": "1", "cost_per_unit": "100"},
    )
    item_id = create_resp.json()["id"]

    resp = await client.post(
        f"/api/v1/stock/{item_id}/reserve",
        headers={"Authorization": f"Bearer {ceo_token}"},
        json={"project_id": "fake-project-id", "quantity": "5"},
    )
    assert resp.status_code == 400
