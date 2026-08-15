"""
FieldMovement schemas.
"""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class FieldMovementStart(BaseModel):
    destination: Optional[str] = None
    current_location: Optional[str] = None
    lead_id: Optional[str] = None
    purpose: Optional[str] = None


class FieldMovementUpdate(BaseModel):
    current_location: Optional[str] = None
    status: Optional[str] = None
    destination: Optional[str] = None


class RoutePointRead(BaseModel):
    id: str
    time: datetime
    location: str

    model_config = {"from_attributes": True}


class PhotoRead(BaseModel):
    id: str
    file_url: str
    uploaded_at: datetime

    model_config = {"from_attributes": True}


class NoteCreate(BaseModel):
    note: str


class NoteRead(BaseModel):
    id: str
    note: str
    created_at: datetime

    model_config = {"from_attributes": True}


class FieldMovementRead(BaseModel):
    id: str
    employee_id: str
    employee_name: str
    role: str
    status: str
    current_location: Optional[str] = None
    destination: Optional[str] = None
    start_time: datetime
    last_update: datetime
    end_time: Optional[datetime] = None
    lead_id: Optional[str] = None
    purpose: Optional[str] = None
    route_points: List[RoutePointRead] = []
    photos: List[PhotoRead] = []
    notes: List[NoteRead] = []
    created_at: datetime

    model_config = {"from_attributes": True}
