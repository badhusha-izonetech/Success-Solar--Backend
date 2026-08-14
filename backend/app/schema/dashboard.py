from pydantic import BaseModel
from typing import List, Optional
from datetime import date, time
from app.schema.lead import LeadResponse
from app.schema.call import CallResponse
from app.schema.followup import FollowUpResponse
from app.schema.site_visit import SiteVisitResponse

class DashboardSummary(BaseModel):
    total_leads: int = 0
    new_leads: int = 0
    called_leads: int = 0
    interested_leads: int = 0
    callback_leads: int = 0
    not_interested_leads: int = 0
    site_visit_required: int = 0
    site_visits_scheduled: int = 0
    converted_leads: int = 0
    lost_leads: int = 0
    today_calls: int = 0
    today_followups: int = 0
    overdue_followups: int = 0

class TodayTask(BaseModel):
    customer_name: str
    lead_id: str
    task_type: str
    current_status: str
    due_date: date
    due_time: Optional[time] = None
    required_action: str

class TelecallerDashboardResponse(BaseModel):
    summary: DashboardSummary
    today_tasks: List[TodayTask]
    recent_leads: List[LeadResponse]
    recent_calls: List[CallResponse]
    upcoming_followups: List[FollowUpResponse]
    site_visits: List[SiteVisitResponse]
