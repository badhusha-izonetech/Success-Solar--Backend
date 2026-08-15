"""
Main v1 router — aggregates all resource routers under /api/v1.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.employees import router as employees_router
from app.api.v1.departments import router as departments_router
from app.api.v1.customers import router as customers_router
from app.api.v1.leads import router as leads_router
from app.api.v1.call_logs import router as call_logs_router
from app.api.v1.field_movements import router as field_movements_router
from app.api.v1.quotations import router as quotations_router
from app.api.v1.projects import router as projects_router
from app.api.v1.payments import router as payments_router
from app.api.v1.stock import router as stock_router
from app.api.v1.approvals import (
    router_approvals,
    router_leave,
    router_performance,
    router_notifications,
    router_activity,
    router_dashboard,
    router_reports,
    router_follow_ups,
)

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth_router)
api_router.include_router(employees_router)
api_router.include_router(departments_router)
api_router.include_router(customers_router)
api_router.include_router(leads_router)
api_router.include_router(call_logs_router)
api_router.include_router(field_movements_router)
api_router.include_router(quotations_router)
api_router.include_router(projects_router)
api_router.include_router(payments_router)
api_router.include_router(stock_router)
api_router.include_router(router_approvals)
api_router.include_router(router_leave)
api_router.include_router(router_performance)
api_router.include_router(router_notifications)
api_router.include_router(router_activity)
api_router.include_router(router_dashboard)
api_router.include_router(router_reports)
api_router.include_router(router_follow_ups)
