"""
reminder_routes.py - CRUD API for SocioMee Reminders.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional
import reminders_manager as rm
from middleware import get_current_user

router = APIRouter(prefix="/reminders", tags=["reminders"])


class CreateReminderRequest(BaseModel):
    task: str = Field(..., min_length=1, max_length=300)
    due_at: int  # unix timestamp


@router.post("/create")
def create_reminder(payload: CreateReminderRequest, user: dict = Depends(get_current_user)):
    return rm.create_reminder(user["user_id"], payload.task, payload.due_at)


@router.get("/list")
def list_reminders(status: Optional[str] = None, user: dict = Depends(get_current_user)):
    return rm.list_reminders(user["user_id"], status=status)


@router.post("/{reminder_id}/complete")
def complete_reminder(reminder_id: str, user: dict = Depends(get_current_user)):
    ok = rm.update_status(user["user_id"], reminder_id, "completed")
    if not ok:
        raise HTTPException(404, "Reminder not found")
    return {"status": "completed"}


@router.delete("/{reminder_id}")
def delete_reminder(reminder_id: str, user: dict = Depends(get_current_user)):
    ok = rm.update_status(user["user_id"], reminder_id, "dismissed")
    if not ok:
        raise HTTPException(404, "Reminder not found")
    return {"status": "dismissed"}
