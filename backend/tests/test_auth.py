"""
Auth tests — login success/failure, token refresh, RBAC validation.
"""

import pytest


@pytest.mark.asyncio
async def test_login_success(client):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "test.ceo", "password": "TestPass@123"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    assert "employee" in data
    assert data["portal"] == "CEO"


@pytest.mark.asyncio
async def test_login_wrong_password(client):
    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "test.ceo", "password": "wrong"},
    )
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_inactive_account(client, test_session_factory):
    from app.models.employee import Employee
    from app.core.security import hash_password

    async with test_session_factory() as session:
        emp = Employee(
            employee_code="TEST-SUSP",
            name="Suspended User",
            mobile="2222222222",
            joining_date="2024-01-01",
            department="Marketing",
            designation="Telecaller",
            username="test.suspended",
            hashed_password=hash_password("TestPass@123"),
            employment_status="Suspended",
        )
        session.add(emp)
        await session.commit()

    resp = await client.post(
        "/api/v1/auth/login",
        json={"username": "test.suspended", "password": "TestPass@123"},
    )
    assert resp.status_code == 403


@pytest.mark.asyncio
async def test_me_endpoint(client, ceo_token):
    resp = await client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {ceo_token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["employee"]["designation"] == "CEO"


@pytest.mark.asyncio
async def test_unauthorized_without_token(client):
    resp = await client.get("/api/v1/employees")
    assert resp.status_code in (401, 403)
