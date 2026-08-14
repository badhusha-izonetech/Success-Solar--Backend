from pydantic import BaseModel
from typing import List
from app.schema.payment import PendingPaymentQueueItem

class DashboardSummary(BaseModel):
    total_payments: int
    pending_payments: int
    proof_uploaded: int
    under_verification: int
    verified_payments: int
    rejected_payments: int
    advance_50_pending: int
    final_payment_pending: int
    total_collected: float
    total_outstanding: float

class DashboardRecentActivity(BaseModel):
    action: str
    description: str
    timestamp: str

class DashboardTodayTask(BaseModel):
    task_id: str
    description: str
    status: str

class AccountDashboardResponse(BaseModel):
    summary: DashboardSummary
    pending_payments: List[PendingPaymentQueueItem]
    recent_payments: List[PendingPaymentQueueItem]
    today_tasks: List[DashboardTodayTask]
    outstanding_amount: float
    recent_activity: List[DashboardRecentActivity]
