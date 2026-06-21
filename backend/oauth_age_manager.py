"""
oauth_age_manager.py - Tracks which OAuth (Google/GitHub) user_ids have
confirmed they are 18+. OAuth logins have no persistent user record by
default, so this is the one thing we do persist for age-gate purposes.
"""
import json
from pathlib import Path

DATA_FILE = Path(__file__).resolve().parent / "oauth_age_confirmed.json"


def _load() -> dict:
    if not DATA_FILE.exists():
        return {}
    try:
        raw = DATA_FILE.read_text(encoding="utf-8").strip()
        return json.loads(raw) if raw else {}
    except Exception:
        return {}


def _save(data: dict) -> None:
    DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")


def is_age_confirmed(user_id: str) -> bool:
    return bool(_load().get(user_id, False))


def confirm_age(user_id: str) -> None:
    data = _load()
    data[user_id] = True
    _save(data)
