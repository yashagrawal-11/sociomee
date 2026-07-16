"""
discord_routes.py — SocioMee Discord Webhook Integration
"""
from __future__ import annotations
import json, logging, os, requests, threading, httpx
from datetime import datetime, timezone
from pathlib import Path
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from limiter_shared import limiter
from dotenv import load_dotenv

load_dotenv()

DISCORD_CLIENT_ID     = os.getenv("DISCORD_CLIENT_ID", "")
DISCORD_CLIENT_SECRET = os.getenv("DISCORD_CLIENT_SECRET", "")
DISCORD_BOT_TOKEN      = os.getenv("DISCORD_BOT_TOKEN", "")
DISCORD_REDIRECT_URI  = os.getenv("DISCORD_REDIRECT_URI", "https://sociomeeai.com/api/discord/callback")
DISCORD_BOT_PERMISSIONS = "536988672"

log = logging.getLogger("discord_routes")
router = APIRouter(prefix="/discord", tags=["discord"])


# ══════════════════════════════════════════════════════════════════════
# BOT OAUTH CONNECT (full account/server connection, not just webhook)
# ══════════════════════════════════════════════════════════════════════

GUILDS_FILE = Path(__file__).parent / "discord_guilds.json"

def _load_guilds() -> dict:
    try: return json.loads(GUILDS_FILE.read_text()) if GUILDS_FILE.exists() else {}
    except: return {}

def _save_guilds(d: dict):
    GUILDS_FILE.write_text(json.dumps(d, indent=2))


DISCORD_SERVER_LIMITS = {
    "free":             0,
    "pro_monthly":      2,
    "pro_annual":       2,
    "premium_monthly":  4,
    "premium_annual":   4,
}

def _get_server_limit(user_id: str) -> int:
    try:
        from credits_manager import get_credit_status
        plan = get_credit_status(user_id).get("plan", "free")
        return DISCORD_SERVER_LIMITS.get(plan, 0)
    except:
        return 0


@router.get("/oauth-url")
def discord_oauth_url(user_id: str = Query(...)):
    if not DISCORD_CLIENT_ID:
        raise HTTPException(500, "DISCORD_CLIENT_ID not configured")

    limit = _get_server_limit(user_id)
    if limit == 0:
        raise HTTPException(403, "Upgrade to Pro or Premium to connect Discord servers.")

    guilds = _load_guilds()
    current = len(guilds.get(user_id, []))
    if current >= limit:
        raise HTTPException(403, f"Server limit reached ({limit}). Upgrade your plan to connect more servers.")
    url = (
        "https://discord.com/oauth2/authorize"
        f"?client_id={DISCORD_CLIENT_ID}"
        f"&permissions={DISCORD_BOT_PERMISSIONS}"
        "&integration_type=0"
        "&scope=bot+applications.commands"
        f"&redirect_uri={DISCORD_REDIRECT_URI}"
        "&response_type=code"
        f"&state={user_id}"
    )
    return {"url": url}


@router.get("/callback")
async def discord_callback(code: str, guild_id: str = Query(default=""), state: str = Query(default="")):
    user_id = state
    if not user_id:
        raise HTTPException(400, "Missing state (user_id)")

    # Exchange code for user access token (optional, mainly to confirm the flow / get identity)
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://discord.com/api/oauth2/token",
            data={
                "client_id":     DISCORD_CLIENT_ID,
                "client_secret": DISCORD_CLIENT_SECRET,
                "grant_type":    "authorization_code",
                "code":          code,
                "redirect_uri":  DISCORD_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

    if not guild_id:
        return RedirectResponse("https://sociomeeai.com?discord=no_guild_selected")

    limit = _get_server_limit(user_id)
    guilds_check = _load_guilds()
    current = len(guilds_check.get(user_id, []))
    already_connected = any(g.get("guild_id") == guild_id for g in guilds_check.get(user_id, []))
    if not already_connected and current >= limit:
        return RedirectResponse("https://sociomeeai.com?discord=limit_reached")

    # Fetch guild info + channels using the BOT token (bot was just added to this guild)
    async with httpx.AsyncClient() as client:
        g = await client.get(
            f"https://discord.com/api/v10/guilds/{guild_id}",
            headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
        )
        chans = await client.get(
            f"https://discord.com/api/v10/guilds/{guild_id}/channels",
            headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
        )

    guild_json = g.json() if g.status_code == 200 else {}
    guild_name = guild_json.get("name", "Discord Server")
    guild_icon_hash = guild_json.get("icon")
    guild_icon_url = f"https://cdn.discordapp.com/icons/{guild_id}/{guild_icon_hash}.png" if guild_icon_hash else None
    text_channels = []
    if chans.status_code == 200:
        for c in chans.json():
            if c.get("type") == 0:  # 0 = GUILD_TEXT
                text_channels.append({"id": c["id"], "name": c["name"]})

    guilds = _load_guilds()
    user_guilds = guilds.get(user_id, [])
    # Replace if guild already connected, else append
    user_guilds = [g_ for g_ in user_guilds if g_.get("guild_id") != guild_id]
    user_guilds.append({
        "guild_id":     guild_id,
        "guild_name":   guild_name,
        "guild_icon":   guild_icon_url,
        "channels":     text_channels,
        "connected_at": datetime.now(timezone.utc).isoformat(),
    })
    guilds[user_id] = user_guilds
    _save_guilds(guilds)

    return RedirectResponse("https://sociomeeai.com?discord=connected")


@router.get("/guilds")
def discord_list_guilds(user_id: str = Query(...)):
    guilds = _load_guilds()
    return {"guilds": guilds.get(user_id, [])}


@router.post("/refresh-channels")
async def discord_refresh_channels(user_id: str = Query(...), guild_id: str = Query(...)):
    if not DISCORD_BOT_TOKEN:
        raise HTTPException(500, "DISCORD_BOT_TOKEN not configured")
    async with httpx.AsyncClient() as client:
        chans = await client.get(
            f"https://discord.com/api/v10/guilds/{guild_id}/channels",
            headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
        )
    if chans.status_code != 200:
        raise HTTPException(400, f"Failed to fetch channels: {chans.text}")

    text_channels = [{"id": c["id"], "name": c["name"]} for c in chans.json() if c.get("type") == 0]

    guilds = _load_guilds()
    user_guilds = guilds.get(user_id, [])
    for g in user_guilds:
        if g.get("guild_id") == guild_id:
            g["channels"] = text_channels
    guilds[user_id] = user_guilds
    _save_guilds(guilds)
    return {"ok": True, "channels": text_channels}


@router.post("/remove-guild")
def discord_remove_guild(user_id: str = Query(...), guild_id: str = Query(...)):
    guilds = _load_guilds()
    user_guilds = guilds.get(user_id, [])
    guilds[user_id] = [g for g in user_guilds if g.get("guild_id") != guild_id]
    _save_guilds(guilds)
    return {"ok": True}


class BotSendPayload(BaseModel):
    user_id: str
    guild_id: str
    channel_id: str
    content: str
    image_url: str = ""


def _bot_send_sync(guild_id: str, channel_id: str, content: str, image_url: str) -> dict:
    """Synchronous version for use inside scheduled jobs (APScheduler runs sync callables)."""
    body = {"content": content}
    if image_url:
        body["embeds"] = [{"image": {"url": image_url}}]
    r = requests.post(
        f"https://discord.com/api/v10/channels/{channel_id}/messages",
        json=body,
        headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
        timeout=15,
    )
    if r.status_code not in (200, 201):
        raise Exception(f"Discord send failed: {r.text}")
    return r.json()



@router.post("/quick-send")
async def discord_quick_send(user_id: str = Query(...), content: str = Query(...), title: str = Query(default="")):
    """Send content to user's first connected Discord guild/channel. No webhook needed."""
    from credits_manager import use_credit, get_credit_status
    if not use_credit(user_id, cost=1):
        raise HTTPException(402, detail="Not enough credits to send content.")
    guilds = _load_guilds()
    user_guilds = guilds.get(user_id, [])
    if not user_guilds:
        raise HTTPException(400, "Discord not connected")
    guild = user_guilds[0]
    channels = guild.get("channels", [])
    if not channels:
        raise HTTPException(400, "No channels found in Discord server")
    channel_id = channels[0]["id"]
    guild_id = guild["guild_id"]
    full_content = f"**{title}**\n\n{content}" if title else content
    return await discord_bot_send(BotSendPayload(
        user_id=user_id,
        guild_id=guild_id,
        channel_id=channel_id,
        content=full_content[:2000],
    ))

@router.post("/bot-send")
async def discord_bot_send(payload: BotSendPayload):
    if not DISCORD_BOT_TOKEN:
        raise HTTPException(500, "DISCORD_BOT_TOKEN not configured")
    if not payload.content.strip() and not payload.image_url.strip():
        raise HTTPException(400, "content or image_url required")

    body = {"content": payload.content}
    if payload.image_url:
        body["embeds"] = [{"image": {"url": payload.image_url}}]

    async with httpx.AsyncClient() as client:
        r = await client.post(
            f"https://discord.com/api/v10/channels/{payload.channel_id}/messages",
            json=body,
            headers={"Authorization": f"Bot {DISCORD_BOT_TOKEN}"},
        )
    if r.status_code not in (200, 201):
        raise HTTPException(400, f"Discord send failed: {r.text}")
    msg = r.json()
    return {"ok": True, "message_id": msg.get("id", "")}


BOT_JOBS_FILE = Path(__file__).parent / "discord_bot_jobs.json"

def _lbjobs() -> dict:
    try: return json.loads(BOT_JOBS_FILE.read_text()) if BOT_JOBS_FILE.exists() else {}
    except: return {}

def _sbjobs(d: dict):
    BOT_JOBS_FILE.write_text(json.dumps(d, indent=2))

def _ubjob(jid: str, **kw):
    d = _lbjobs()
    if jid in d:
        d[jid].update(kw)
        _sbjobs(d)

def _new_bjob(data: dict) -> str:
    import uuid
    jid = uuid.uuid4().hex[:12]
    d = _lbjobs()
    d[jid] = data
    _sbjobs(d)
    return jid

def _bot_job_worker(jid: str, guild_id: str, channel_id: str, content: str, image_url: str):
    try:
        _ubjob(jid, status="sending")
        _bot_send_sync(guild_id, channel_id, content, image_url)
        _ubjob(jid, status="done", sent_at=datetime.now(timezone.utc).isoformat())
    except Exception as e:
        _ubjob(jid, status="error", error=str(e))

def _schedule_bot_send(jid: str, run_at: datetime, guild_id: str, channel_id: str, content: str, image_url: str):
    from telegram_scheduler import _get_scheduler
    def job():
        _bot_job_worker(jid, guild_id, channel_id, content, image_url)
        try: _get_scheduler().remove_job(jid)
        except: pass
    _ubjob(jid, status="scheduled", scheduled_at=run_at.isoformat())
    _get_scheduler().add_job(job, "date", run_date=run_at, id=jid, replace_existing=True)
    log.info("Scheduled Discord bot job=%s at %s", jid, run_at.isoformat())

def restore_discord_bot_scheduled_jobs():
    """Re-schedule pending bot-send jobs after server restart."""
    try:
        jobs = _lbjobs()
        now = datetime.now(timezone.utc)
        restored = 0
        for jid, job in jobs.items():
            if job.get("status") != "scheduled": continue
            scheduled_at = job.get("scheduled_at")
            if not scheduled_at: continue
            run_at = datetime.fromisoformat(scheduled_at)
            if run_at <= now:
                threading.Thread(target=_bot_job_worker, daemon=True, kwargs=dict(
                    jid=jid, guild_id=job["guild_id"], channel_id=job["channel_id"],
                    content=job.get("content",""), image_url=job.get("image_url","")
                )).start()
            else:
                _schedule_bot_send(jid, run_at, job["guild_id"], job["channel_id"],
                                    job.get("content",""), job.get("image_url",""))
            restored += 1
        if restored: log.info("Restored %d scheduled Discord bot jobs", restored)
    except Exception as e:
        log.warning("restore_discord_bot_scheduled_jobs failed: %s", e)


class BotSchedulePayload(BaseModel):
    user_id: str
    guild_id: str
    channel_id: str
    content: str
    image_url: str = ""
    scheduled_at: str


@router.post("/bot-schedule")
@limiter.limit("10/minute")
def discord_bot_schedule(request: Request, payload: BotSchedulePayload):
    if not payload.content.strip() and not payload.image_url.strip():
        raise HTTPException(400, "content or image_url required")
    try:
        sched_dt = datetime.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
        if sched_dt.tzinfo is None:
            sched_dt = sched_dt.replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(400, "Invalid scheduled_at timestamp")

    if sched_dt <= datetime.now(timezone.utc):
        raise HTTPException(400, "scheduled_at must be in the future")

    jid = _new_bjob({
        "user_id": payload.user_id, "guild_id": payload.guild_id, "channel_id": payload.channel_id,
        "content": payload.content, "image_url": payload.image_url, "status": "pending",
    })
    _schedule_bot_send(jid, sched_dt, payload.guild_id, payload.channel_id, payload.content, payload.image_url)
    return {"ok": True, "status": "scheduled", "job_id": jid, "scheduled_at": sched_dt.isoformat()}


@router.get("/bot-scheduled")
def discord_bot_list_scheduled(user_id: str = Query(...)):
    jobs = _lbjobs()
    return {"jobs": [{"id": jid, **j} for jid, j in jobs.items() if j.get("user_id") == user_id]}


@router.delete("/bot-scheduled/{job_id}")
def discord_bot_cancel_scheduled(job_id: str):
    from telegram_scheduler import _get_scheduler
    try: _get_scheduler().remove_job(job_id)
    except: pass
    _ubjob(job_id, status="cancelled")
    return {"ok": True}

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
    scheduled_at: str = ""  # ISO string, empty = send now

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

    from crypto_utils import encrypt
    data = _load()
    data[payload.user_id] = {
        "webhook_url":   encrypt(payload.webhook_url),
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
    from crypto_utils import decrypt
    webhook_url = decrypt(rec["webhook_url"])
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
    "free":             0,
    "pro_monthly":      2,
    "pro_annual":       2,
    "premium_monthly":  4,
    "premium_annual":   4,
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
