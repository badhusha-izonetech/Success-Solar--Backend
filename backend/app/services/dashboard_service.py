from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import date
from app.models.employee import Employee
from app.models.lead import Lead
from app.models.call import Call
from app.models.lead_followup import LeadFollowup
from app.models.site_visit import SiteVisit
from app.schema.dashboard import DashboardSummary, TodayTask, TelecallerDashboardResponse

def get_telecaller_dashboard(db: Session, current_employee: Employee) -> TelecallerDashboardResponse:
    today = date.today()
    employee_id = current_employee.id
    
    status_counts = db.query(Lead.status, func.count(Lead.id)).filter(
        Lead.assigned_employee_id == employee_id
    ).group_by(Lead.status).all()
    status_dict = {status: count for status, count in status_counts}
    
    call_status_counts = db.query(Lead.call_status, func.count(Lead.id)).filter(
        Lead.assigned_employee_id == employee_id
    ).group_by(Lead.call_status).all()
    call_status_dict = {status: count for status, count in call_status_counts}
    
    today_calls = db.query(func.count(Call.id)).filter(
        Call.employee_id == employee_id,
        Call.call_date == today
    ).scalar() or 0
    
    today_followups = db.query(func.count(LeadFollowup.id)).filter(
        LeadFollowup.employee_id == employee_id,
        LeadFollowup.follow_up_date == today
    ).scalar() or 0
    
    overdue_followups = db.query(func.count(LeadFollowup.id)).filter(
        LeadFollowup.employee_id == employee_id,
        LeadFollowup.follow_up_date < today,
        LeadFollowup.status == "Scheduled"
    ).scalar() or 0
    
    total_leads = db.query(func.count(Lead.id)).filter(Lead.assigned_employee_id == employee_id).scalar() or 0
    
    summary = DashboardSummary(
        total_leads=total_leads,
        new_leads=status_dict.get("NEW", 0) + call_status_dict.get("New", 0),
        called_leads=call_status_dict.get("Called", 0),
        interested_leads=call_status_dict.get("Interested", 0),
        callback_leads=call_status_dict.get("Call Back", 0),
        not_interested_leads=call_status_dict.get("Not Interested", 0),
        site_visit_required=call_status_dict.get("Site Visit Required", 0),
        site_visits_scheduled=call_status_dict.get("Site Visit Scheduled", 0),
        converted_leads=call_status_dict.get("Converted", 0),
        lost_leads=call_status_dict.get("Lost", 0),
        today_calls=today_calls,
        today_followups=today_followups,
        overdue_followups=overdue_followups
    )
    
    today_tasks = []
    
    overdue = db.query(LeadFollowup).filter(
        LeadFollowup.employee_id == employee_id,
        LeadFollowup.follow_up_date < today,
        LeadFollowup.status == "Scheduled"
    ).all()
    for f in overdue:
        today_tasks.append(TodayTask(
            customer_name=f.customer.name,
            lead_id=f.lead.lead_id,
            task_type="Overdue Follow-up",
            current_status=f.status,
            due_date=f.follow_up_date,
            due_time=f.follow_up_time,
            required_action="Call Customer"
        ))
        
    todays = db.query(LeadFollowup).filter(
        LeadFollowup.employee_id == employee_id,
        LeadFollowup.follow_up_date == today,
        LeadFollowup.status == "Scheduled"
    ).all()
    for f in todays:
        today_tasks.append(TodayTask(
            customer_name=f.customer.name,
            lead_id=f.lead.lead_id,
            task_type="Today Follow-up",
            current_status=f.status,
            due_date=f.follow_up_date,
            due_time=f.follow_up_time,
            required_action="Call Customer"
        ))
    
    return TelecallerDashboardResponse(
        summary=summary,
        today_tasks=today_tasks,
        recent_leads=db.query(Lead).filter(Lead.assigned_employee_id == employee_id).order_by(Lead.created_at.desc()).limit(5).all(),
        recent_calls=db.query(Call).filter(Call.employee_id == employee_id).order_by(Call.created_at.desc()).limit(5).all(),
        upcoming_followups=db.query(LeadFollowup).filter(LeadFollowup.employee_id == employee_id, LeadFollowup.follow_up_date >= today).order_by(LeadFollowup.follow_up_date.asc()).limit(5).all(),
        site_visits=db.query(SiteVisit).filter(SiteVisit.requested_by_id == employee_id).order_by(SiteVisit.visit_date.asc()).limit(5).all()
    )
