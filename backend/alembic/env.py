"""
Alembic env.py — async-compatible, reads DATABASE_URL from .env,
creates the 'solar' schema, and imports all models for autogenerate.
"""

import asyncio
import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool, text
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

# ── Add project root to path ──────────────────────────────────────────────────
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# ── Load .env ─────────────────────────────────────────────────────────────────
from dotenv import load_dotenv  # type: ignore
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from app.core.config import settings
from app.core.database import Base

# Import all models so Alembic sees them
import app.models  # noqa: F401

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def include_object(object, name, type_, reflected, compare_to):
    """Only manage objects in our schema."""
    if type_ == "table":
        return object.schema == settings.POSTGRES_SCHEMA
    return True


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        include_schemas=True,
        version_table_schema=settings.POSTGRES_SCHEMA,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        include_schemas=True,
        version_table_schema=settings.POSTGRES_SCHEMA,
        include_object=include_object,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        import re
        if not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', settings.POSTGRES_SCHEMA):
            raise ValueError(f"Invalid schema name: {settings.POSTGRES_SCHEMA}")
        # Ensure schema exists
        await connection.execute(text(f"CREATE SCHEMA IF NOT EXISTS {settings.POSTGRES_SCHEMA}"))
        await connection.commit()
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
