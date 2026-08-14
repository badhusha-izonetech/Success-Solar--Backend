from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.routers import auth, leads, calls, followups, requirements
from app.routers import customer_responses, site_visits, telecaller_dashboard
from app.routers import account, payments, salaries, expenses

app = FastAPI(
    title=settings.APP_NAME,
    description="Telecalling Employee Dashboard Backend",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(leads.router)
app.include_router(calls.router)
app.include_router(followups.router)
app.include_router(requirements.router)
app.include_router(customer_responses.router)
app.include_router(site_visits.router)
app.include_router(telecaller_dashboard.router)
app.include_router(account.router)
app.include_router(payments.router)
app.include_router(salaries.router)
app.include_router(expenses.router)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}

@app.get("/", tags=["root"])
def read_root():
    return {"message": f"Welcome to {settings.APP_NAME}"}
