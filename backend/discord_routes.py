"""
discord_routes.py — SocioMee Discord Webhook Integration
"""
from __future__ import annotations
import json, logging, os, requests
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

log = logging.getLogger("discord_routes")
router = APIRouter(prefix="/discord", tags=["discord"])

DATA_FILE = Path(__file__).parent / "discord_accounts.json"

def _load():
    try: return json.loads(DATA_FILE.read_text()) if DATA_FILE.exists() else {}
    except: return {}

def _save(d):
    DATA_FILE.write_text(json.dumps(d, indent=2))

class WebhookPayload(BaseModel):
    user_id: str
    webhook_url: str
    server_name: str = ""
    channel_name: str = ""

class SendPayload(BaseModel):
    user_id: str
    content: str
    username: str = "SocioMee"
    embed_title: str = ""
    embed_color: int = 7419530  # purple

class SchedulePayload(BaseModel):
    user_id: str
    content: str
    scheduled_at: str = ""  # ISO string, empty = send now
    username: str = "SocioMee"

@router.post("/connect")
def discord_connect(payload: WebhookPayload):
    """Save a Discord webhook URL for a user."""
    # Validate webhook by sending a test ping
    try:
        r = requests.get(payload.webhook_url, timeout=10)
        if r.status_code != 200:
            raise HTTPException(400, "Invalid webhook URL. Please check and try again.")
        wh_data = r.json()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, f"Could not validate webhook: {e}")

    data = _load()
    data[payload.user_id] = {
        "webhook_url":   payload.webhook_url,
        "server_name":   payload.server_name or wh_data.get("guild_id", "Your Server"),
        "channel_name":  payload.channel_name or wh_data.get("name", "general"),
        "webhook_name":  wh_data.get("name", "SocioMee"),
        "connected_at":  datetime.now(timezone.utc).isoformat(),
    }
    _save(data)
    return {"ok": True, "channel_name": data[payload.user_id]["channel_name"]}

@router.get("/status")
def discord_status(user_id: str = Query(...)):
    data = _load()
    rec = data.get(user_id)
    if not rec:
        return {"connected": False}
    return {"connected": True, **rec}

@router.post("/disconnect")
def discord_disconnect(user_id: str = Query(...)):
    data = _load()
    data.pop(user_id, None)
    _save(data)
    return {"ok": True}

@router.post("/send")
def discord_send(payload: SendPayload):
    """Send a message immediately via Discord webhook."""
    data = _load()
    rec = data.get(payload.user_id)
    if not rec:
        raise HTTPException(400, "Discord not connected")
    
    webhook_url = rec["webhook_url"]
    body = {
        "username": payload.username,
        "content": payload.content,
    }
    if payload.embed_title:
        body["embeds"] = [{
            "title": payload.embed_title,
            "color": payload.embed_color,
        }]

    try:
        r = requests.post(webhook_url, json=body, timeout=15)
        if r.status_code not in (200, 204):
            raise HTTPException(500, f"Discord API error: {r.status_code} {r.text}")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to send: {e}")

    return {"ok": True, "status": "sent"}

@router.post("/send-content")
def discord_send_content(user_id: str = Query(...), content: str = Query(...), title: str = Query(default="")):
    """Send generated content to Discord."""
    return discord_send(SendPayload(
        user_id=user_id,
        content=content,
        embed_title=title,
    ))


# ── Multi-webhook support ─────────────────────────────────────────────
DISCORD_LIMITS = {
    "free":             1,
    "pro_monthly":      2,
    "pro_annual":       2,
    "premium_monthly":  5,
    "premium_annual":   5,
}

def _get_limit(user_id: str) -> int:
    try:
        from credits_manager import get_credit_status
        plan = get_credit_status(user_id).get("plan", "free")
        return DISCORD_LIMITS.get(plan, 1)
    except:
        return 1

def _get_webhooks(user_id: str) -> list:
    data = _load()
    if user_id not in data:
        return []
    record = data[user_id]
    # Migrate old single webhook format
    if "webhook_url" in record and "webhooks" not in record:
        record["webhooks"] = [{
            "webhook_url": record["webhook_url"],
            "channel_name": record.get("channel_name", ""),
            "server_name": record.get("server_name", ""),
            "webhook_name": record.get("webhook_name", ""),
            "connected_at": record.get("connected_at", "")
        }]
        data[user_id] = record
        _save(data)
    return record.get("webhooks", [])

@router.get("/webhooks")
def get_webhooks(user_id: str = Query(...)):
    try:
        webhooks = _get_webhooks(user_id)
        limit = _get_limit(user_id)
        # Strip sensitive webhook URLs from response
        safe = [{"channel_name": w.get("channel_name",""), "server_name": w.get("server_name",""), "webhook_name": w.get("webhook_name",""), "connected_at": w.get("connected_at","")} for w in webhooks]
        return {"webhooks": safe, "limit": limit, "total": len(webhooks)}
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/add-webhook")
def add_webhook(payload: WebhookPayload):
    try:
        data = _load()
        user_id = payload.user_id
        limit = _get_limit(user_id)
        webhooks = _get_webhooks(user_id)
        if len(webhooks) >= limit:
            raise HTTPException(400, f"Webhook limit reached ({limit}). Upgrade your plan.")
        # Validate webhook
        test = requests.post(payload.webhook_url, json={"content": "✅ SocioMee Discord Connected!"}, timeout=10)
        if test.status_code not in (200, 204):
            raise HTTPException(400, "Invalid webhook URL")
        webhooks.append({
            "webhook_url": payload.webhook_url,
            "channel_name": payload.channel_name,
            "server_name": payload.server_name,
            "webhook_name": payload.channel_name or "Discord Channel",
            "connected_at": datetime.now(timezone.utc).isoformat()
        })
        if user_id not in data:
            data[user_id] = {}
        data[user_id]["webhooks"] = webhooks
        _save(data)
        return {"success": True, "total": len(webhooks), "limit": limit}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(400, str(e))

@router.post("/remove-webhook")
def remove_webhook(user_id: str = Query(...), channel_name: str = Query(...)):
    try:
        data = _load()
        webhooks = _get_webhooks(user_id)
        data[user_id]["webhooks"] = [w for w in webhooks if w.get("channel_name") != channel_name]
        _save(data)
        return {"success": True}
    except Exception as e:
        raise HTTPException(400, str(e))
