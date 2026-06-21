"""
reminders_manager.py - Task reminders with push notification delivery.
Stores reminders per user, checked periodically by Celery Beat to fire
push notifications via the existing push_routes.send_push().
"""
import json
import time
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

DATA_FILE = Path(__file__).resolve().parent / "reminders_data.json"


def _load() -> Dict[str, Any]:
    if not DATA_FILE.exists():
        return {}
    try:
        raw = DATA_FILE.read_text(encoding="utf-8").strip()
        return json.loads(raw) if raw else {}
    except Exception:
        return {}


def _save(data: Dict[str, Any]) -> None:
    DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def create_reminder(user_id: str, task: str, due_at: int) -> Dict[str, Any]:
    """due_at: unix timestamp for when the reminder should fire."""
    data = _load()
    reminders = data.setdefault(user_id, [])
    reminder = {
        "id": str(uuid.uuid4())[:8],
        "task": task.strip(),
        "due_at": int(due_at),
        "created_at": int(time.time()),
        "status": "pending",
    }
    reminders.append(reminder)
    _save(data)
    return reminder


def list_reminders(user_id: str, status: Optional[str] = None) -> List[Dict[str, Any]]:
    data = _load()
    reminders = data.get(user_id, [])
    if status:
        reminders = [r for r in reminders if r.get("status") == status]
    return sorted(reminders, key=lambda r: r.get("due_at", 0))


def update_status(user_id: str, reminder_id: str, status: str) -> bool:
    data = _load()
    reminders = data.get(user_id, [])
    for r in reminders:
        if r.get("id") == reminder_id:
            r["status"] = status
            _save(data)
            return True
    return False


def get_due_reminders() -> List[Dict[str, Any]]:
    """Returns all pending reminders across all users whose due_at has passed."""
    data = _load()
    now = int(time.time())
    due = []
    for user_id, reminders in data.items():
        for r in reminders:
            if r.get("status") == "pending" and r.get("due_at", 0) <= now:
                due.append({**r, "user_id": user_id})
    return due
