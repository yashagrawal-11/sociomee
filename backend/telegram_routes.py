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