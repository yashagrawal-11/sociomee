"""
history_routes.py — SocioMee Content History
Saves and retrieves past content generations per user.
"""
import json, os
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException
from middleware import get_current_user
from datetime import datetime, timezone

router = APIRouter(prefix="/history", tags=["history"])

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

def _history_file(user_id: str) -> Path:
    safe = "".join(c for c in user_id if c.isalnum() or c in "-_")
    return DATA_DIR / f"history_{safe}.json"

def save_generation(user_id: str, topic: str, platform: str,
                    best_title: str, script_preview: str,
                    seo_hashtags: list, word_count: int, language: str):
    """Called after every successful generation to save to history."""
    if not user_id or not topic:
        return
    path = _history_file(user_id)
    try:
        history = json.loads(path.read_text()) if path.exists() else []
    except Exception:
        history = []

    entry = {
        "id":           f"{int(datetime.now(timezone.utc).timestamp()*1000)}",
        "topic":        topic[:120],
        "platform":     platform,
        "best_title":   best_title[:150] if best_title else topic[:150],
        "preview":      script_preview[:300] if script_preview else "",
        "hashtags":     seo_hashtags[:5] if seo_hashtags else [],
        "word_count":   word_count,
        "language":     language,
        "created_at":   datetime.now(timezone.utc).isoformat(),
    }

    history.insert(0, entry)
    history = history[:50]  # keep last 50 only
    path.write_text(json.dumps(history, indent=2))

@router.get("/{user_id}")
def get_history(user_id: str, user: dict = Depends(get_current_user)):
    # SECURITY: verify the requester is actually viewing their own history (IDOR fix —
    # this endpoint previously had zero auth, meaning anyone could view any user's
    # entire generation history just by knowing their user_id).
    if user.get("user_id", "") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    path = _history_file(user_id)
    if not path.exists():
        return []
    try:
        return json.loads(path.read_text())
    except Exception:
        return []

@router.delete("/{user_id}/{item_id}")
def delete_history_item(user_id: str, item_id: str, user: dict = Depends(get_current_user)):
    if user.get("user_id", "") != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    path = _history_file(user_id)
    if not path.exists():
        return {"success": True}
    try:
        history = json.loads(path.read_text())
        history = [h for h in history if h.get("id") != item_id]
        path.write_text(json.dumps(history, indent=2))
        return {"success": True, "count": len(history)}
    except Exception as e:
        return {"success": False, "error": str(e)}
