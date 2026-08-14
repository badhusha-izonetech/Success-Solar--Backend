from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schema.dashboard import TelecallerDashboardResponse
from app.services import dashboard_service
from app.services.auth_service import get_current_employee
from app.models.employee import Employee

router = APIRouter(prefix="/api/telecaller", tags=["dashboard"])

@router.get("/dashboard", response_model=TelecallerDashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_employee: Employee = Depends(get_current_employee)
):
    return dashboard_service.get_telecaller_dashboard(db, current_employee)
