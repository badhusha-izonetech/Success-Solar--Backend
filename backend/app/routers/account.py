from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schema.account_dashboard import AccountDashboardResponse
from app.services.account_dashboard_service import AccountDashboardService
from app.services.auth_service import get_current_employee, check_role
from app.models.employee import Employee

router = APIRouter(prefix="/api/account", tags=["Account Dashboard"])

@router.get("/dashboard", response_model=AccountDashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(check_role("Accountant"))
):
    # Dummy empty lists for pending/recent activities.
    # In a real app, these would come from AccountDashboardService.
    summary = AccountDashboardService.get_dashboard_summary(db)
    
    return {
        "summary": summary,
        "pending_payments": [],
        "recent_payments": [],
        "today_tasks": [],
        "outstanding_amount": summary["total_outstanding"],
        "recent_activity": []
    }
