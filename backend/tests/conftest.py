"""
Pytest configuration — async test client and database setup.
"""

import asyncio
import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from app.core.config import settings
from app.core.database import Base, get_db
from app.core.security import hash_password
from app.main import app

# Use an in-process SQLite for tests (or set TEST_DATABASE_URL env to a PG test DB)
TEST_DATABASE_URL = (
    settings.DATABASE_URL.replace("postgresql+asyncpg", "sqlite+aiosqlite").replace(
        f"@localhost:5432/{settings.POSTGRES_DB}", ""
    )
    if "postgresql" in settings.DATABASE_URL
    else settings.DATABASE_URL
)
# Fallback to SQLite if PG not available in CI
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def test_engine():
    engine = create_async_engine(TEST_DATABASE_URL, echo=False)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest_asyncio.fixture(scope="session")
async def test_session_factory(test_engine):
    return async_sessionmaker(bind=test_engine, expire_on_commit=False)


@pytest_asyncio.fixture
async def db(test_session_factory):
    async with test_session_factory() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture(scope="session")
async def client(test_session_factory):
    async def override_get_db():
        async with test_session_factory() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c

    app.dependency_overrides.clear()


@pytest_asyncio.fixture(scope="session")
async def ceo_token(client, test_session_factory):
    """Seed a CEO employee and return a valid access token."""
    from app.models.employee import Employee

    async with test_session_factory() as session:
        emp = Employee(
            employee_code="TEST-001",
            name="Test CEO",
            mobile="0000000000",
            email="ceo@test.com",
            joining_date="2024-01-01",
            department="CEO",
            designation="CEO",
            username="test.ceo",
            hashed_password=hash_password("TestPass@123"),
            employment_status="Active",
        )
        session.add(emp)
        await session.commit()

    resp = await client.post("/api/v1/auth/login", json={"username": "test.ceo", "password": "TestPass@123"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest_asyncio.fixture(scope="session")
async def telecaller_token(client, test_session_factory):
    from app.models.employee import Employee

    async with test_session_factory() as session:
        emp = Employee(
            employee_code="TEST-002",
            name="Test Telecaller",
            mobile="1111111111",
            joining_date="2024-01-01",
            department="Marketing",
            designation="Telecaller",
            username="test.tele",
            hashed_password=hash_password("TestPass@123"),
            employment_status="Active",
        )
        session.add(emp)
        await session.commit()

    resp = await client.post("/api/v1/auth/login", json={"username": "test.tele", "password": "TestPass@123"})
    return resp.json()["access_token"]
