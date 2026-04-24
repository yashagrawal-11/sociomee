"""
credits_manager.py

Simple file-based credit system.
- Each user gets 30 free credits per day.
- Credits reset automatically at midnight (UTC).
- Storage: credits_data.json in the same folder as this file.
"""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

# ── Config ────────────────────────────────────────────────────────────
DAILY_LIMIT   = 30
DATA_FILE     = Path(__file__).resolve().parent / "credits_data.json"


# ── Storage helpers ───────────────────────────────────────────────────
def _load() -> Dict[str, Any]:
    if not DATA_FILE.exists():
        return {}
    try:
        raw = DATA_FILE.read_text(encoding="utf-8").strip()
        return json.loads(raw) if raw else {}
    except Exception:
        return {}


def _save(data: Dict[str, Any]) -> None:
    try:
        DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        pass


def _today() -> str:
    """Return today's date string in UTC (YYYY-MM-DD)."""
    return datetime.now(timezone.utc).strftime("%Y-%m-%d")


# ── Public API ────────────────────────────────────────────────────────
def get_user_credits(user_id: str) -> int:
    """
    Return how many credits the user has left today.
    Resets to DAILY_LIMIT if a new day has started.
    """
    data   = _load()
    today  = _today()
    record = data.get(user_id, {})

    # New day or new user → full credits
    if record.get("date") != today:
        return DAILY_LIMIT

    used = record.get("used", 0)
    return max(0, DAILY_LIMIT - used)


def use_credit(user_id: str) -> bool:
    """
    Attempt to consume one credit for the user.
    Returns True if the credit was consumed successfully.
    Returns False if the daily limit is already reached.
    """
    data   = _load()
    today  = _today()
    record = data.get(user_id, {})

    # Reset if new day
    if record.get("date") != today:
        record = {"date": today, "used": 0}

    used = record.get("used", 0)

    if used >= DAILY_LIMIT:
        return False  # limit reached

    record["used"] = used + 1
    data[user_id]  = record
    _save(data)
    return True


def reset_user_credits(user_id: str) -> None:
    """Manually reset a user's credits (admin use)."""
    data = _load()
    data[user_id] = {"date": _today(), "used": 0}
    _save(data)


def get_all_usage() -> Dict[str, Any]:
    """Return full usage data (admin/debug use)."""
    return _load()