"""
Seed script — populates the database with:
  - 7 departments (with teams)
  - 11 employees (one per designation) using SEED_DEFAULT_PASSWORD from .env
  - Sample leads, quotations, projects, stock items

Run: python seed.py
Idempotent: skips records that already exist (by username / name / code).
"""

from __future__ import annotations

import asyncio
import json
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from dotenv import load_dotenv  # type: ignore
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

from app.core.config import settings
from app.core.database import AsyncSessionLocal, create_schema_if_not_exists, engine
from app.core.security import hash_password
from sqlalchemy import select, text

DEPARTMENTS = [
    {"name": "CEO",       "teams": ["Leadership", "Strategy"]},
    {"name": "Marketing", "teams": ["Telecalling", "Direct Marketing", "Lead Management"]},
    {"name": "Site Visit","teams": ["Site Assessment", "Customer Visit"]},
    {"name": "Accounts",  "teams": ["Billing", "Collections", "Verification"]},
    {"name": "Project",   "teams": ["Project Management", "Documentation", "Field Execution"]},
    {"name": "Warehouse", "teams": ["Inventory", "Dispatch", "Quality Check"]},
    {"name": "Transport", "teams": ["Logistics", "Driver Coordination"]},
]

EMPLOYEES = [
    {
        "employee_code": "SSC-001",
        "name": "karthik",
        "mobile": "9876543210",
        "email": "rajesh@ssc.com",
        "joining_date": "2022-01-01",
        "department": "CEO",
        "designation": "CEO",
        "username": "karthik.ceo",
    },
    {
        "employee_code": "SSC-002",
        "name": "Priya Sharma",
        "mobile": "9876543211",
        "email": "priya@ssc.com",
        "joining_date": "2022-03-01",
        "department": "Marketing",
        "designation": "Telecaller",
        "username": "priya.tele",
    },
    {
        "employee_code": "SSC-003",
        "name": "Arun Selvan",
        "mobile": "9876543212",
        "email": "arun@ssc.com",
        "joining_date": "2022-04-01",
        "department": "Marketing",
        "designation": "Direct Marketing Executive",
        "username": "arun.dme",
    },
    {
        "employee_code": "SSC-004",
        "name": "Kavya Rajan",
        "mobile": "9876543213",
        "email": "kavya@ssc.com",
        "joining_date": "2022-05-01",
        "department": "Site Visit",
        "designation": "Site Visitor",
        "username": "kavya.site",
    },
    {
        "employee_code": "SSC-005",
        "name": "Dinesh Babu",
        "mobile": "9876543214",
        "email": "dinesh@ssc.com",
        "joining_date": "2022-06-01",
        "department": "Accounts",
        "designation": "Accountant",
        "username": "dinesh.acct",
    },
    {
        "employee_code": "SSC-006",
        "name": "Meena Sundaram",
        "mobile": "9876543215",
        "email": "meena@ssc.com",
        "joining_date": "2022-07-01",
        "department": "Project",
        "designation": "Project Head",
        "username": "meena.pm",
    },
    {
        "employee_code": "SSC-007",
        "name": "Suresh Patel",
        "mobile": "9876543216",
        "email": "suresh@ssc.com",
        "joining_date": "2022-08-01",
        "department": "Project",
        "designation": "Field Technician",
        "username": "suresh.tech",
    },
    {
        "employee_code": "SSC-008",
        "name": "Lakshmi Nair",
        "mobile": "9876543217",
        "email": "lakshmi@ssc.com",
        "joining_date": "2022-09-01",
        "department": "Project",
        "designation": "Document Follow-up Executive",
        "username": "lakshmi.doc",
    },
    {
        "employee_code": "SSC-009",
        "name": "Venkat Krishnan",
        "mobile": "9876543218",
        "email": "venkat@ssc.com",
        "joining_date": "2022-10-01",
        "department": "Warehouse",
        "designation": "Warehouse Maintenance",
        "username": "venkat.wh",
    },
    {
        "employee_code": "SSC-010",
        "name": "Ravi Murugan",
        "mobile": "9876543219",
        "email": "ravi@ssc.com",
        "joining_date": "2022-11-01",
        "department": "Transport",
        "designation": "Driver",
        "username": "ravi.driver",
    },
    {
        "employee_code": "SSC-011",
        "name": "Anand Subramanian",
        "mobile": "9876543220",
        "email": "anand@ssc.com",
        "joining_date": "2022-12-01",
        "department": "Accounts",
        "designation": "Partner / Payment Receiver",
        "username": "anand.partner",
    },
]

STOCK_ITEMS = [
    {"product_name": "Solar Panel 400W", "category": "Panels", "brand": "Waaree", "unit": "pcs", "current_quantity": 50, "minimum_level": 10, "cost_per_unit": 8500},
    {"product_name": "Inverter 5kW", "category": "Inverters", "brand": "Sungrow", "unit": "pcs", "current_quantity": 15, "minimum_level": 3, "cost_per_unit": 35000},
    {"product_name": "Mounting Structure", "category": "Structure", "brand": "Generic", "unit": "set", "current_quantity": 30, "minimum_level": 5, "cost_per_unit": 4500},
    {"product_name": "DC Cable 4mm²", "category": "Cables", "brand": "Polycab", "unit": "mtr", "current_quantity": 500, "minimum_level": 100, "cost_per_unit": 45},
    {"product_name": "MC4 Connector", "category": "Connectors", "brand": "Staubli", "unit": "pairs", "current_quantity": 200, "minimum_level": 50, "cost_per_unit": 80},
]


async def seed():
    await create_schema_if_not_exists()

    async with AsyncSessionLocal() as db:
        # ── Departments ───────────────────────────────────────────────────────
        from app.models.department import Department
        for dept_data in DEPARTMENTS:
            existing = (await db.execute(
                select(Department).where(Department.name == dept_data["name"])
            )).scalar_one_or_none()
            if not existing:
                db.add(Department(
                    name=dept_data["name"],
                    teams_json=json.dumps(dept_data["teams"]),
                ))
        await db.commit()
        print(f"OK - {len(DEPARTMENTS)} departments seeded")

        # ── Employees ─────────────────────────────────────────────────────────
        from app.models.employee import Employee
        seeded_emp = 0
        for emp_data in EMPLOYEES:
            existing = (await db.execute(
                select(Employee).where(Employee.username == emp_data["username"])
            )).scalar_one_or_none()
            if not existing:
                db.add(Employee(
                    **emp_data,
                    hashed_password=hash_password(settings.SEED_DEFAULT_PASSWORD),
                    employment_status="Active",
                    avatar_color="#3B82F6",
                ))
                seeded_emp += 1
        await db.commit()
        print(f"OK - {seeded_emp} employees seeded (all designations)")

        # ── Stock items ───────────────────────────────────────────────────────
        from app.models.stock_item import StockItem
        from decimal import Decimal
        seeded_stock = 0
        for item_data in STOCK_ITEMS:
            existing = (await db.execute(
                select(StockItem).where(StockItem.product_name == item_data["product_name"])
            )).scalar_one_or_none()
            if not existing:
                db.add(StockItem(
                    product_name=item_data["product_name"],
                    category=item_data["category"],
                    brand=item_data["brand"],
                    unit=item_data["unit"],
                    current_quantity=Decimal(str(item_data["current_quantity"])),
                    reserved_quantity=Decimal("0"),
                    minimum_level=Decimal(str(item_data["minimum_level"])),
                    cost_per_unit=Decimal(str(item_data["cost_per_unit"])),
                ))
                seeded_stock += 1
        await db.commit()
        print(f"OK - {seeded_stock} stock items seeded")

        print("\nOK Seed complete!")
        print(f"   Default password for all employees: {settings.SEED_DEFAULT_PASSWORD}")
        print("   Usernames: rajesh.ceo (CEO) | priya.tele (Telecaller) | arun.dme (Direct Marketing)")


if __name__ == "__main__":
    asyncio.run(seed())
