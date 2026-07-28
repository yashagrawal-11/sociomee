"""
telegram_routes.py — SocioMee Telegram API Routes (Per-User Connect)
Add to app.py:
    from telegram_routes import router as telegram_router
    app.include_router(telegram_router)
"""

from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import List

log    = logging.getLogger("telegram_routes")
from plan_limits import check_connect_limit
router = APIRouter(prefix="/telegram", tags=["telegram"])


def _tc():
    try:
        import telegram_connect
        return telegram_connect
    except ImportError as e:
        raise HTTPException(503, f"telegram_connect not found: {e}")


class SendContentRequest(BaseModel):
    user_id:     str
    topic:       str
    platform:    str = "youtube"
    script_text: str = ""
    best_title:  str = ""
    hook:        str = ""
    hashtags:    List[str] = []
    description: str = ""

class QuickMessageRequest(BaseModel):
    user_id: str
    text:    str


@router.get("/connect-link")
def get_connect_link(user_id: str = Query(...)):
    from telegram_connector import TelegramConnector
    tc_check = TelegramConnector()
    current = 1 if tc_check.is_connected(user_id) else 0
    chk = check_connect_limit(user_id, current, "Telegram")
    if not chk["allowed"]:
        raise HTTPException(403, chk["reason"])
    tc = _tc()
    try:
        return tc.generate_connect_link(user_id)
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/connect-status")
def connect_status(user_id: str = Query(...)):
    tc = _tc()
    connected = tc.is_connected(user_id)
    if connected:
        conn = tc.get_connection(user_id)
        return {
            "connected":         True,
            "telegram_username": conn.get("telegram_username", ""),
            "full_name":         conn.get("full_name", ""),
            "photo_url":         conn.get("photo_url", ""),
            "connected_at":      conn.get("connected_at", ""),
        }
    return {"connected": False}


@router.post("/disconnect")
def disconnect(user_id: str = Query(...)):
    tc = _tc()
    tc.disconnect(user_id)
    return {"success": True}


@router.post("/send-content")
def send_content(payload: SendContentRequest):
    from credits_manager import use_credit, get_credit_status
    if not use_credit(payload.user_id, cost=1):
        from fastapi import HTTPException
        raise HTTPException(402, detail="Not enough credits to send content.")
    tc = _tc()
    try:
        return tc.send_content_pack(
            user_id     = payload.user_id,
            topic       = payload.topic,
            platform    = payload.platform,
            script_text = payload.script_text,
            best_title  = payload.best_title,
            hook        = payload.hook,
            hashtags    = payload.hashtags,
            description = payload.description,
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/send-quick")
def send_quick(payload: QuickMessageRequest):
    tc = _tc()
    try:
        chat_id = tc.get_chat_id(payload.user_id)
        if not chat_id:
            raise HTTPException(404, "Telegram not connected.")
        result = tc.send_message(chat_id, payload.text)
        return {"success": True, "message_id": result["result"]["message_id"]}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/save-channel")
def save_channel(user_id: str = Query(...), channel: str = Query(...)):
    """Save user's Telegram channel username."""
    tc = _tc()
    try:
        tc.save_channel(user_id, channel)
        return {"success": True, "channel": channel if channel.startswith("@") else "@"+channel}
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/verify-channel")
def verify_channel(user_id: str = Query(...)):
    """Test sending to user's channel — bot must be admin."""
    tc = _tc()
    try:
        return tc.verify_channel(user_id)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/remove-channel")
def remove_channel(user_id: str = Query(...)):
    """Remove user's channel from their Telegram settings."""
    tc = _tc()
    tc.remove_channel(user_id)
    return {"success": True}


@router.get("/status")
def bot_status():
    tc = _tc()
    try:
        tc._assert_env()
        import requests, os
        token = os.getenv("TELEGRAM_BOT_TOKEN", "")
        resp  = requests.get(f"https://api.telegram.org/bot{token}/getMe", timeout=10)
        data  = resp.json()
        if data.get("ok"):
            bot = data["result"]
            return {
                "connected":    True,
                "bot_name":     bot.get("first_name", ""),
                "bot_username": bot.get("username", ""),
            }
        return {"connected": False, "error": data.get("description", "")}
    except Exception as e:
        return {"connected": False, "error": str(e)}

# ── Multi-channel routes ──────────────────────────────────────────────
@router.get("/channels")
def get_channels(user_id: str = Query(...)):
    try:
        tc = _tc()
        channels = tc.get_channels(user_id)
        limit = tc.get_channel_limit(user_id)
        return {"channels": channels, "limit": limit, "total": len(channels)}
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/add-channel")
def add_channel(user_id: str = Query(...), channel: str = Query(...)):
    try:
        tc = _tc()
        return tc.add_channel_multi(user_id, channel)
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/verify-channel-multi")
def verify_channel_multi(user_id: str = Query(...), channel: str = Query(...)):
    try:
        tc = _tc()
        return tc.verify_channel_multi(user_id, channel)
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/remove-channel-multi")
def remove_channel_multi(user_id: str = Query(...), channel: str = Query(...)):
    try:
        tc = _tc()
        tc.remove_channel_multi(user_id, channel)
        return {"success": True}
    except Exception as e:
        raise HTTPException(400, str(e))

# ── Analytics ─────────────────────────────────────────────────────────
@router.get("/analytics")
def telegram_analytics(user_id: str = Query(...)):
    """Return analytics derived from post history + live member count."""
    import requests as _req
    from datetime import datetime, timezone, timedelta
    from collections import defaultdict
    from pathlib import Path
    import json as _json

    def parse_dt(s):
        try:
            dt = datetime.fromisoformat(s)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone.utc)
            return dt
        except Exception:
            return None

    jobs_file = Path(__file__).parent / "data" / "tg_scheduler_jobs.json"
    try:
        jobs = _json.loads(jobs_file.read_text()) if jobs_file.exists() else {}
    except Exception:
        jobs = {}

    tg_file = Path(__file__).parent / "telegram_accounts.json"
    try:
        tg_accounts = _json.loads(tg_file.read_text()) if tg_file.exists() else {}
        tg_acct = tg_accounts.get(user_id, {})
        chat_id = str(tg_acct.get("chat_id", ""))
    except Exception:
        chat_id = ""

    def belongs_to_user(j):
        if j.get("user_id") == user_id: return True
        if chat_id and chat_id in [str(t) for t in (j.get("targets") or [])]: return True
        return False

    user_jobs = [j for j in jobs.values() if belongs_to_user(j)]
    now = datetime.now(timezone.utc)
    sent = [j for j in user_jobs if j.get("status") == "done" and j.get("sent_at") and parse_dt(j["sent_at"])]
    scheduled = [j for j in user_jobs if j.get("status") in ("pending","scheduled")]

    daily = defaultdict(int)
    for j in sent:
        dt = parse_dt(j["sent_at"])
        if dt: daily[dt.strftime("%Y-%m-%d")] += 1

    days_30 = [{"date": (now - timedelta(days=i)).strftime("%Y-%m-%d"), "posts": daily.get((now - timedelta(days=i)).strftime("%Y-%m-%d"), 0)} for i in range(29, -1, -1)]

    media_counts = defaultdict(int)
    for j in sent:
        media_counts[j.get("media_type") or "text"] += 1

    week_start = now - timedelta(days=7)
    last_week_start = now - timedelta(days=14)
    this_week = sum(1 for j in sent if parse_dt(j["sent_at"]) and parse_dt(j["sent_at"]) >= week_start)
    last_week = sum(1 for j in sent if parse_dt(j["sent_at"]) and last_week_start <= parse_dt(j["sent_at"]) < week_start)

    hour_counts = defaultdict(int)
    for j in sent:
        dt = parse_dt(j["sent_at"])
        if dt: hour_counts[dt.hour] += 1
    best_hour = max(hour_counts, key=hour_counts.get) if hour_counts else None

    member_count = None
    try:
        tc = __import__("telegram_connect")
        accounts = tc._load(tc.DATA_FILE)
        acct = accounts.get(user_id, {})
        channel = acct.get("channel")
        token = tc._token()
        if token and channel:
            r = _req.get(f"https://api.telegram.org/bot{token}/getChatMembersCount", params={"chat_id": channel}, timeout=5)
            if r.ok: member_count = r.json().get("result")
    except Exception:
        pass

    weekly_trend = []
    for w in range(7, -1, -1):
        week_end = now - timedelta(days=w*7)
        week_start_dt = week_end - timedelta(days=7)
        count = sum(1 for j in sent if parse_dt(j["sent_at"]) and week_start_dt <= parse_dt(j["sent_at"]) < week_end)
        weekly_trend.append({"week": f"W{8-w}", "posts": count})

    avg_per_day = len(sent) / 30 if sent else 0
    predictions = [{"date": (now + timedelta(days=i)).strftime("%Y-%m-%d"), "predicted": round(avg_per_day*(1+i*0.05), 1)} for i in range(1, 8)]

    return {
        "total_posts": len(sent),
        "scheduled_posts": len(scheduled),
        "this_week": this_week,
        "last_week": last_week,
        "member_count": member_count,
        "daily_posts": days_30,
        "media_breakdown": dict(media_counts),
        "best_hour": best_hour,
        "success_rate": round(len(sent) / max(len(user_jobs), 1) * 100),
        "predictions": predictions,
        "weekly_trend": weekly_trend,
        "avg_per_day": round(avg_per_day, 1),
    }
