"""
Role-Based Access Control.

Defines permissions for all 11 designations and provides FastAPI
dependency factories to enforce them on route handlers.
"""

from __future__ import annotations

from enum import Enum
from functools import lru_cache
from typing import Callable, Set

from fastapi import Depends, HTTPException, status

from app.core.security import get_current_user


# ── Designation enum (mirrors frontend) ───────────────────────────────────────
class Designation(str, Enum):
    CEO = "CEO"
    TELECALLER = "Telecaller"
    DIRECT_MARKETING = "Direct Marketing Executive"
    SITE_VISITOR = "Site Visitor"
    ACCOUNTANT = "Accountant"
    PROJECT_HEAD = "Project Head"
    FIELD_TECHNICIAN = "Field Technician"
    DOC_FOLLOWUP = "Document Follow-up Executive"
    WAREHOUSE = "Warehouse Maintenance"
    DRIVER = "Driver"
    PARTNER = "Partner / Payment Receiver"


# ── Permission strings ────────────────────────────────────────────────────────
class Permission(str, Enum):
    # Employees / Departments
    EMPLOYEES_READ = "employees:read"
    EMPLOYEES_WRITE = "employees:write"
    DEPARTMENTS_READ = "departments:read"

    # Leads / Call Logs / Follow-ups
    LEADS_READ = "leads:read"
    LEADS_READ_OWN = "leads:read_own"      # Telecaller scoping
    LEADS_WRITE = "leads:write"
    LEADS_REASSIGN = "leads:reassign"
    CALL_LOGS_READ = "call_logs:read"
    CALL_LOGS_WRITE = "call_logs:write"

    # Customers
    CUSTOMERS_READ = "customers:read"
    CUSTOMERS_WRITE = "customers:write"

    # Quotations
    QUOTATIONS_READ = "quotations:read"
    QUOTATIONS_WRITE = "quotations:write"
    QUOTATIONS_REVISE = "quotations:revise"

    # Projects
    PROJECTS_READ = "projects:read"
    PROJECTS_WRITE = "projects:write"
    PROJECTS_STAGE = "projects:stage"
    PROJECTS_ASSIGN = "projects:assign"

    # Payments
    PAYMENTS_READ = "payments:read"
    PAYMENTS_WRITE = "payments:write"
    PAYMENTS_VERIFY = "payments:verify"
    PAYMENTS_PROOF = "payments:proof"

    # Stock
    STOCK_READ = "stock:read"
    STOCK_WRITE = "stock:write"
    STOCK_MANAGE = "stock:manage"          # reserve/issue/return

    # Field movements
    FIELD_MOVEMENTS_READ = "field_movements:read"
    FIELD_MOVEMENTS_READ_OWN = "field_movements:read_own"
    FIELD_MOVEMENTS_WRITE = "field_movements:write"

    # Leave / Approvals / Performance / Notifications / Activity
    LEAVE_READ = "leave:read"
    LEAVE_WRITE = "leave:write"
    LEAVE_APPROVE = "leave:approve"
    APPROVALS_READ = "approvals:read"
    APPROVALS_WRITE = "approvals:write"
    PERFORMANCE_READ = "performance:read"
    NOTIFICATIONS_READ = "notifications:read"
    ACTIVITY_READ = "activity:read"

    # Dashboards & Reports
    DASHBOARD_CEO = "dashboard:ceo"
    DASHBOARD_MARKETING = "dashboard:marketing"
    REPORTS_READ = "reports:read"


# ── Role → Permission matrix ──────────────────────────────────────────────────
ROLE_PERMISSIONS: dict[str, Set[Permission]] = {
    Designation.CEO: set(Permission),  # CEO gets everything

    Designation.TELECALLER: {
        Permission.LEADS_READ_OWN,
        Permission.LEADS_WRITE,
        Permission.CALL_LOGS_READ,
        Permission.CALL_LOGS_WRITE,
        Permission.QUOTATIONS_READ,
        Permission.QUOTATIONS_WRITE,
        Permission.CUSTOMERS_READ,
        Permission.NOTIFICATIONS_READ,
        Permission.DASHBOARD_MARKETING,
    },

    Designation.DIRECT_MARKETING: {
        Permission.LEADS_READ,
        Permission.LEADS_WRITE,
        Permission.CALL_LOGS_READ,
        Permission.CALL_LOGS_WRITE,
        Permission.QUOTATIONS_READ,
        Permission.QUOTATIONS_WRITE,
        Permission.QUOTATIONS_REVISE,
        Permission.CUSTOMERS_READ,
        Permission.FIELD_MOVEMENTS_READ_OWN,
        Permission.FIELD_MOVEMENTS_WRITE,
        Permission.NOTIFICATIONS_READ,
        Permission.DASHBOARD_MARKETING,
    },

    Designation.SITE_VISITOR: {
        Permission.FIELD_MOVEMENTS_READ_OWN,
        Permission.FIELD_MOVEMENTS_WRITE,
        Permission.PROJECTS_READ,
        Permission.NOTIFICATIONS_READ,
    },

    Designation.ACCOUNTANT: {
        Permission.PAYMENTS_READ,
        Permission.PAYMENTS_WRITE,
        Permission.PAYMENTS_VERIFY,
        Permission.PAYMENTS_PROOF,
        Permission.PROJECTS_READ,
        Permission.REPORTS_READ,
        Permission.NOTIFICATIONS_READ,
        Permission.ACTIVITY_READ,
    },

    Designation.PROJECT_HEAD: {
        Permission.PROJECTS_READ,
        Permission.PROJECTS_WRITE,
        Permission.PROJECTS_STAGE,
        Permission.PROJECTS_ASSIGN,
        Permission.QUOTATIONS_READ,
        Permission.PAYMENTS_READ,
        Permission.STOCK_READ,
        Permission.NOTIFICATIONS_READ,
        Permission.ACTIVITY_READ,
    },

    Designation.FIELD_TECHNICIAN: {
        Permission.FIELD_MOVEMENTS_READ_OWN,
        Permission.FIELD_MOVEMENTS_WRITE,
        Permission.PROJECTS_READ,
        Permission.NOTIFICATIONS_READ,
    },

    Designation.DOC_FOLLOWUP: {
        Permission.PROJECTS_READ,
        Permission.PROJECTS_WRITE,
        Permission.FIELD_MOVEMENTS_READ_OWN,
        Permission.FIELD_MOVEMENTS_WRITE,
        Permission.NOTIFICATIONS_READ,
    },

    Designation.WAREHOUSE: {
        Permission.STOCK_READ,
        Permission.STOCK_WRITE,
        Permission.STOCK_MANAGE,
        Permission.PROJECTS_READ,
        Permission.NOTIFICATIONS_READ,
    },

    Designation.DRIVER: {
        Permission.FIELD_MOVEMENTS_READ_OWN,
        Permission.FIELD_MOVEMENTS_WRITE,
        Permission.PROJECTS_READ,
        Permission.NOTIFICATIONS_READ,
    },

    Designation.PARTNER: {
        Permission.PAYMENTS_WRITE,
        Permission.PAYMENTS_PROOF,
        Permission.PROJECTS_READ,
        Permission.NOTIFICATIONS_READ,
    },
}


def get_permissions(designation: str) -> Set[Permission]:
    return ROLE_PERMISSIONS.get(designation, set())


# ── FastAPI dependency factories ──────────────────────────────────────────────

def require_permissions(*perms: Permission) -> Callable:
    """
    Returns a FastAPI dependency that checks the current user has ALL
    of the listed permissions.
    """
    async def dependency(current_user=Depends(get_current_user)):
        user_perms = get_permissions(current_user.designation)
        missing = [p for p in perms if p not in user_perms]
        if missing:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied. Required: {', '.join(missing)}",
            )
        return current_user
    return dependency


def require_any_permission(*perms: Permission) -> Callable:
    """Returns a dependency that checks the current user has ANY of the listed permissions."""
    async def dependency(current_user=Depends(get_current_user)):
        user_perms = get_permissions(current_user.designation)
        if not any(p in user_perms for p in perms):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Permission denied.",
            )
        return current_user
    return dependency


# ── Lead scoping helper ───────────────────────────────────────────────────────

def is_telecaller_scoped(designation: str) -> bool:
    """True when the employee must only see their own leads (Telecaller rule)."""
    return designation == Designation.TELECALLER


def portal_for(designation: str) -> str | None:
    """Mirrors the frontend portalFor() function in AuthContext.tsx."""
    mapping = {
        Designation.CEO: "CEO",
        Designation.TELECALLER: "Telecalling",
        Designation.DIRECT_MARKETING: "Direct Marketing",
    }
    return mapping.get(designation)
