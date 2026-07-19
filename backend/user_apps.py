"""
user_apps.py — SocioMee App Store
Tracks which SocioMee apps (Notes, Cloud, Share, Pixel, PDF, Calendar,
Reminders, News) each user has added to their sidebar. Mirrors the same
file-locking JSON pattern used by credits_manager.py.
"""
import json
import threading
from pathlib import Path
from typing import Any, Dict, List

DATA_FILE = Path(__file__).resolve().parent / "user_apps_data.json"
_lock = threading.Lock()

ALL_APPS = [
    {"id": "notes",     "label": "SocioMee Notes",     "desc": "Save scripts, ideas, and drafts in one place.",         "icon": "notes"},
    {"id": "vault",     "label": "SocioMee Cloud",     "desc": "Store and organise your content files.",               "icon": "cloud"},
    {"id": "share",     "label": "SocioMee Share",     "desc": "Send files instantly with a 6-digit code.",            "icon": "share"},
    {"id": "pixel",     "label": "SocioMee Pixel",     "desc": "Analyse thumbnails and visuals for click appeal.",     "icon": "pixel"},
    {"id": "pdf",       "label": "SocioMee PDF",       "desc": "Convert and manage PDF documents.",                    "icon": "pdf"},
    {"id": "calendar",  "label": "SocioMee Calendar",  "desc": "Plan your posting schedule across platforms.",         "icon": "calendar"},
    {"id": "news",      "label": "SocioMee News",      "desc": "AI-curated creator news and trending updates.",       "icon": "news"},
    {"id": "screenrecorder", "label": "Screen Recorder", "desc": "Record your screen in HD for tutorials, demos, and gameplay.", "icon": "recorder"},
    {"id": "convert",       "label": "SocioMee Convert",  "desc": "Convert images to SVG vectors, PDFs, GIFs and more.",          "icon": "convert"},
]

DEFAULT_APPS: List[str] = []


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


def get_user_apps(user_id: str) -> List[str]:
    with _lock:
        data = _load()
        return data.get(user_id, list(DEFAULT_APPS))


def add_app(user_id: str, app_id: str) -> List[str]:
    valid_ids = {a["id"] for a in ALL_APPS}
    if app_id not in valid_ids:
        raise ValueError(f"Unknown app_id: {app_id}")
    with _lock:
        data = _load()
        current = data.get(user_id, list(DEFAULT_APPS))
        if app_id not in current:
            current.append(app_id)
        data[user_id] = current
        _save(data)
        return current


def remove_app(user_id: str, app_id: str) -> List[str]:
    with _lock:
        data = _load()
        current = data.get(user_id, list(DEFAULT_APPS))
        current = [a for a in current if a != app_id]
        data[user_id] = current
        _save(data)
        return current
