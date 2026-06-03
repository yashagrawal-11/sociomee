"""
streak_routes.py — SocioMee Creator Streak Tracking
Tracks: Login streak, Content generation streak, Upload streak
"""
from __future__ import annotations
import json, logging
from datetime import datetime, timezone, date, timedelta
from pathlib import Path
from fastapi import APIRouter, Query

log = logging.getLogger("streak_routes")
router = APIRouter(prefix="/streaks", tags=["streaks"])

STREAK_FILE = Path(__file__).parent / "data" / "streaks.json"

def _load():
    try: return json.loads(STREAK_FILE.read_text()) if STREAK_FILE.exists() else {}
    except: return {}

def _save(d):
    STREAK_FILE.parent.mkdir(exist_ok=True)
    STREAK_FILE.write_text(json.dumps(d, indent=2))

def _today() -> str:
    return date.today().isoformat()

def _update_streak(record: dict, streak_key: str) -> dict:
    """Update a streak. Returns updated record."""
    today = _today()
    yesterday = (date.today() - timedelta(days=1)).isoformat()
    
    last = record.get(f"{streak_key}_last", "")
    current = record.get(f"{streak_key}_current", 0)
    best = record.get(f"{streak_key}_best", 0)
    
    if last == today:
        pass  # already logged today
    elif last == yesterday:
        current += 1  # consecutive day
    else:
        current = 1  # streak broken or new
    
    best = max(best, current)
    record[f"{streak_key}_last"] = today
    record[f"{streak_key}_current"] = current
    record[f"{streak_key}_best"] = best
    return record

@router.post("/login/{user_id}")
def track_login(user_id: str):
    data = _load()
    record = data.get(user_id, {})
    record = _update_streak(record, "login")
    data[user_id] = record
    _save(data)
    return {"ok": True, "login_streak": record.get("login_current", 0)}

@router.post("/content/{user_id}")
def track_content(user_id: str):
    data = _load()
    record = data.get(user_id, {})
    record = _update_streak(record, "content")
    data[user_id] = record
    _save(data)
    return {"ok": True, "content_streak": record.get("content_current", 0)}

@router.post("/upload/{user_id}")
def track_upload(user_id: str):
    data = _load()
    record = data.get(user_id, {})
    record = _update_streak(record, "upload")
    data[user_id] = record
    _save(data)
    return {"ok": True, "upload_streak": record.get("upload_current", 0)}

@router.get("/{user_id}")
def get_streaks(user_id: str):
    data = _load()
    record = data.get(user_id, {})
    today = _today()
    
    def streak_info(key):
        current = record.get(f"{key}_current", 0)
        best = record.get(f"{key}_best", 0)
        last = record.get(f"{key}_last", "")
        # Check if streak is still active (last activity today or yesterday)
        yesterday = (date.today() - timedelta(days=1)).isoformat()
        active = last in (today, yesterday)
        if not active and current > 0:
            current = 0  # streak broken
        return {"current": current, "best": best, "last": last, "active": active}
    
    return {
        "login":   streak_info("login"),
        "content": streak_info("content"),
        "upload":  streak_info("upload"),
    }
