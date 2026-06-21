"""
discord_routes.py — SocioMee Discord Webhook Integration
"""
from __future__ import annotations
import json, logging, os, requests, threading
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

def _send_discord_now(user_id: str, content: str, username: str, embed_title: str, embed_color: int) -> dict:
    """Actually send to Discord webhook right now. Used by both immediate sends and scheduled jobs firing."""
    data = _load()
    rec = data.get(user_id)
    if not rec:
        raise HTTPException(400, "Discord not connected")
    webhook_url = rec["webhook_url"]
    body = {"username": username, "content": content}
    if embed_title:
        body["embeds"] = [{"title": embed_title, "color": embed_color}]
    r = requests.post(webhook_url, json=body, timeout=15)
    if r.status_code not in (200, 204):
        raise HTTPException(500, f"Discord API error: {r.status_code} {r.text}")
    return {"ok": True, "status": "sent"}


# -- Scheduling (reuses the same APScheduler instance Telegram uses) ----
JOBS_FILE = Path(__file__).parent / "discord_jobs.json"

def _ljobs() -> dict:
    try: return json.loads(JOBS_FILE.read_text()) if JOBS_FILE.exists() else {}
    except: return {}

def _sjobs(d: dict):
    JOBS_FILE.write_text(json.dumps(d, indent=2))

def _ujob(jid: str, **kw):
    d = _ljobs()
    if jid in d:
        d[jid].update(kw)
        _sjobs(d)

def _new_job(data: dict) -> str:
    import uuid
    jid = uuid.uuid4().hex[:12]
    d = _ljobs()
    d[jid] = data
    _sjobs(d)
    return jid

def _discord_job_worker(jid: str, user_id: str, content: str, username: str, embed_title: str, embed_color: int):
    try:
        _ujob(jid, status="sending")
        _send_discord_now(user_id, content, username, embed_title, embed_color)
        _ujob(jid, status="done", sent_at=datetime.now(timezone.utc).isoformat())
    except Exception as e:
        _ujob(jid, status="error", error=str(e))

def _schedule_discord_send(jid: str, run_at: datetime, user_id: str, content: str, username: str, embed_title: str, embed_color: int):
    from telegram_scheduler import _get_scheduler
    def job():
        _discord_job_worker(jid, user_id, content, username, embed_title, embed_color)
        try: _get_scheduler().remove_job(jid)
        except: pass
    _ujob(jid, status="scheduled", scheduled_at=run_at.isoformat())
    _get_scheduler().add_job(job, "date", run_date=run_at, id=jid, replace_existing=True)
    log.info("Scheduled Discord job=%s at %s", jid, run_at.isoformat())

def restore_discord_scheduled_jobs():
    """Re-schedule any pending Discord jobs after server restart."""
    try:
        jobs = _ljobs()
        now = datetime.now(timezone.utc)
        restored = 0
        for jid, job in jobs.items():
            if job.get("status") != "scheduled": continue
            scheduled_at = job.get("scheduled_at")
            if not scheduled_at: continue
            run_at = datetime.fromisoformat(scheduled_at)
            if run_at <= now:
                threading.Thread(target=_discord_job_worker, daemon=True, kwargs=dict(
                    jid=jid, user_id=job["user_id"], content=job.get("content",""),
                    username=job.get("username","SocioMee"), embed_title=job.get("embed_title",""),
                    embed_color=job.get("embed_color",7419530)
                )).start()
            else:
                _schedule_discord_send(jid, run_at, job["user_id"], job.get("content",""),
                                        job.get("username","SocioMee"), job.get("embed_title",""),
                                        job.get("embed_color",7419530))
            restored += 1
        if restored: log.info("Restored %d scheduled Discord jobs", restored)
    except Exception as e:
        log.warning("restore_discord_scheduled_jobs failed: %s", e)


@router.post("/send")
def discord_send(payload: SendPayload):
    """Send immediately, or schedule for later if scheduled_at is a future time."""
    if payload.scheduled_at:
        try:
            sched_dt = datetime.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
            if sched_dt.tzinfo is None:
                sched_dt = sched_dt.replace(tzinfo=timezone.utc)
            if sched_dt > datetime.now(timezone.utc):
                data = _load()
                if not data.get(payload.user_id):
                    raise HTTPException(400, "Discord not connected")
                jid = _new_job({
                    "user_id": payload.user_id, "content": payload.content,
                    "username": payload.username, "embed_title": payload.embed_title,
                    "embed_color": payload.embed_color, "status": "pending",
                })
                _schedule_discord_send(jid, sched_dt, payload.user_id, payload.content,
                                        payload.username, payload.embed_title, payload.embed_color)
                return {"ok": True, "status": "scheduled", "job_id": jid, "scheduled_at": sched_dt.isoformat()}
        except HTTPException:
            raise
        except Exception:
            pass  # unparseable timestamp, fall through to immediate send

    try:
        return _send_discord_now(payload.user_id, payload.content, payload.username,
                                  payload.embed_title, payload.embed_color)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Failed to send: {e}")


@router.get("/scheduled")
def discord_list_scheduled(user_id: str = Query(...)):
    jobs = _ljobs()
    return {"jobs": [{"id": jid, **j} for jid, j in jobs.items() if j.get("user_id") == user_id]}


@router.delete("/scheduled/{job_id}")
def discord_cancel_scheduled(job_id: str):
    from telegram_scheduler import _get_scheduler
    try: _get_scheduler().remove_job(job_id)
    except: pass
    _ujob(job_id, status="cancelled")
    return {"ok": True}

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
