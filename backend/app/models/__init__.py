"""
Models package — import all models here so Alembic autogenerate sees them.
"""

from app.models._mixins import UUIDMixin, TimestampMixin, SoftDeleteMixin  # noqa: F401
from app.models.employee import Employee  # noqa: F401
from app.models.department import Department  # noqa: F401
from app.models.customer import Customer  # noqa: F401
from app.models.lead import Lead  # noqa: F401
from app.models.call_log import CallLogEntry  # noqa: F401
from app.models.field_movement import (  # noqa: F401
    FieldMovement,
    FieldMovementRoutePoint,
    FieldMovementPhoto,
    FieldMovementNote,
)
from app.models.quotation import Quotation, QuotationLineItem  # noqa: F401
from app.models.project import Project, ProjectStageHistory  # noqa: F401
from app.models.payment import Payment, PaymentProof  # noqa: F401
from app.models.stock_item import StockItem, StockTransaction, StockReservation  # noqa: F401
from app.models.notification import Notification  # noqa: F401
from app.models.leave_request import LeaveRequest  # noqa: F401
from app.models.performance_record import PerformanceRecord  # noqa: F401
from app.models.approval import Approval  # noqa: F401
from app.models.activity_log import ActivityLog  # noqa: F401

__all__ = [
    "Employee", "Department", "Customer", "Lead", "CallLogEntry",
    "FieldMovement", "FieldMovementRoutePoint", "FieldMovementPhoto", "FieldMovementNote",
    "Quotation", "QuotationLineItem",
    "Project", "ProjectStageHistory",
    "Payment", "PaymentProof",
    "StockItem", "StockTransaction", "StockReservation",
    "Notification", "LeaveRequest", "PerformanceRecord",
    "Approval", "ActivityLog",
]
