"""
telegram_scheduler.py — SocioMee Telegram Post Scheduler
Supports: text, images, videos, GIFs, scheduled posts
"""
from __future__ import annotations
import json, logging, os, threading, uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional

import requests
from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.responses import JSONResponse

log = logging.getLogger("telegram_scheduler")
router = APIRouter(prefix="/telegram/scheduler", tags=["telegram-scheduler"])

DATA_DIR   = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
MEDIA_DIR  = DATA_DIR / "tg_media"
MEDIA_DIR.mkdir(exist_ok=True)
JOBS_FILE  = DATA_DIR / "tg_scheduler_jobs.json"
_jlock     = threading.Lock()

BASE_TG = "https://api.telegram.org"

def _token() -> str:
    return os.getenv("TELEGRAM_BOT_TOKEN", "")

def _ljobs() -> Dict:
    try: return json.loads(JOBS_FILE.read_text()) if JOBS_FILE.exists() else {}
    except: return {}

def _sjobs(d: Dict):
    JOBS_FILE.write_text(json.dumps(d, indent=2))

def _gjob(jid: str) -> Optional[Dict]:
    with _jlock: return _ljobs().get(jid)

def _ujob(jid: str, **kw):
    with _jlock:
        d = _ljobs()
        if jid in d:
            d[jid].update(kw)
            _sjobs(d)

def _new_job(data: Dict) -> str:
    jid = str(uuid.uuid4())
    with _jlock:
        d = _ljobs()
        d[jid] = {"job_id": jid, "created_at": datetime.now(timezone.utc).isoformat(), **data}
        _sjobs(d)
    return jid

# ── Telegram API helpers ──────────────────────────────────────────────

def _send_text(chat_id: str, text: str) -> Dict:
    if len(text) > 4096: text = text[:4090] + "\n…"
    r = requests.post(f"{BASE_TG}/bot{_token()}/sendMessage",
        json={"chat_id": chat_id, "text": text, "parse_mode": "HTML", "disable_web_page_preview": False},
        timeout=20)
    data = r.json()
    if not data.get("ok"): raise ValueError(f"Telegram: {data.get('description','Unknown')}")
    return data

def _send_photo(chat_id: str, photo_bytes: bytes, caption: str = "") -> Dict:
    if len(caption) > 1024: caption = caption[:1020] + "…"
    r = requests.post(f"{BASE_TG}/bot{_token()}/sendPhoto",
        data={"chat_id": chat_id, "caption": caption, "parse_mode": "HTML"},
        files={"photo": ("photo.jpg", photo_bytes, "image/jpeg")},
        timeout=30)
    data = r.json()
    if not data.get("ok"): raise ValueError(f"Telegram: {data.get('description','Unknown')}")
    return data

def _send_video(chat_id: str, video_bytes: bytes, caption: str = "", filename: str = "video.mp4") -> Dict:
    if len(caption) > 1024: caption = caption[:1020] + "…"
    mime = "video/mp4"
    r = requests.post(f"{BASE_TG}/bot{_token()}/sendVideo",
        data={"chat_id": chat_id, "caption": caption, "parse_mode": "HTML", "supports_streaming": True},
        files={"video": (filename, video_bytes, mime)},
        timeout=120)
    data = r.json()
    if not data.get("ok"): raise ValueError(f"Telegram: {data.get('description','Unknown')}")
    return data

def _send_animation(chat_id: str, gif_bytes: bytes, caption: str = "") -> Dict:
    if len(caption) > 1024: caption = caption[:1020] + "…"
    r = requests.post(f"{BASE_TG}/bot{_token()}/sendAnimation",
        data={"chat_id": chat_id, "caption": caption, "parse_mode": "HTML"},
        files={"animation": ("animation.gif", gif_bytes, "image/gif")},
        timeout=60)
    data = r.json()
    if not data.get("ok"): raise ValueError(f"Telegram: {data.get('description','Unknown')}")
    return data

def _send_document(chat_id: str, doc_bytes: bytes, filename: str, caption: str = "") -> Dict:
    if len(caption) > 1024: caption = caption[:1020] + "…"
    r = requests.post(f"{BASE_TG}/bot{_token()}/sendDocument",
        data={"chat_id": chat_id, "caption": caption, "parse_mode": "HTML"},
        files={"document": (filename, doc_bytes, "application/octet-stream")},
        timeout=60)
    data = r.json()
    if not data.get("ok"): raise ValueError(f"Telegram: {data.get('description','Unknown')}")
    return data

def _get_targets(user_id: str) -> List[str]:
    """Get all chat_ids to send to (personal + channel if verified)."""
    import telegram_connect as tc
    targets = []
    conn = tc.get_connection(user_id)
    if conn:
        chat_id = conn.get("chat_id") or conn.get("telegram_chat_id")
        if chat_id: targets.append(str(chat_id))
        if conn.get("channel_verified") and conn.get("channel"):
            targets.append(conn["channel"])
    return targets

# ── Send now worker ───────────────────────────────────────────────────

def _send_worker(jid: str, user_id: str, text: str, media_type: str,
                 media_path: Optional[str], caption: str, targets: List[str]):
    try:
        _ujob(jid, status="sending")
        results = []

        for target in targets:
            try:
                if media_type == "none" or not media_path:
                    _send_text(target, text)
                    results.append({"target": target, "ok": True, "type": "text"})
                else:
                    p = Path(media_path)
                    if not p.exists():
                        results.append({"target": target, "ok": False, "error": "Media file not found"})
                        continue
                    media_bytes = p.read_bytes()
                    cap = caption or text[:1024]

                    if media_type == "photo":
                        _send_photo(target, media_bytes, cap)
                    elif media_type == "video":
                        _send_video(target, media_bytes, cap, p.name)
                    elif media_type == "gif":
                        _send_animation(target, media_bytes, cap)
                    else:
                        _send_document(target, media_bytes, p.name, cap)

                    # Send full text separately if longer than caption
                    if text and len(text) > len(cap):
                        _send_text(target, text)

                    results.append({"target": target, "ok": True, "type": media_type})
            except Exception as e:
                results.append({"target": target, "ok": False, "error": str(e)})

        success = any(r["ok"] for r in results)
        _ujob(jid, status="done" if success else "error",
              results=results, sent_at=datetime.now(timezone.utc).isoformat())

        # Cleanup media file
        if media_path and Path(media_path).exists():
            try: Path(media_path).unlink()
            except: pass

    except Exception as e:
        log.error("Send worker failed job=%s: %s", jid, e)
        _ujob(jid, status="error", error=str(e))

# ── Scheduler ─────────────────────────────────────────────────────────

_scheduler = None
_sched_lock = threading.Lock()

def _get_scheduler():
    global _scheduler
    with _sched_lock:
        if _scheduler is None:
            from apscheduler.schedulers.background import BackgroundScheduler
            _scheduler = BackgroundScheduler(timezone="UTC")
            _scheduler.start()
            log.info("APScheduler started")
    return _scheduler

def _schedule_send(jid: str, run_at: datetime, user_id: str, text: str,
                   media_type: str, media_path: Optional[str], caption: str, targets: List[str]):
    def job():
        _send_worker(jid, user_id, text, media_type, media_path, caption, targets)
        # Remove job from scheduler after running
        try: _get_scheduler().remove_job(jid)
        except: pass

    _ujob(jid, status="scheduled", scheduled_at=run_at.isoformat())
    _get_scheduler().add_job(job, "date", run_date=run_at, id=jid, replace_existing=True)
    log.info("Scheduled job=%s at %s", jid, run_at.isoformat())

def _cancel_scheduled(jid: str):
    try: _get_scheduler().remove_job(jid)
    except: pass

# ── Restore scheduled jobs on startup ────────────────────────────────

def restore_scheduled_jobs():
    """Re-schedule any pending jobs after server restart."""
    try:
        jobs = _ljobs()
        now  = datetime.now(timezone.utc)
        restored = 0
        for jid, job in jobs.items():
            if job.get("status") != "scheduled": continue
            scheduled_at = job.get("scheduled_at")
            if not scheduled_at: continue
            run_at = datetime.fromisoformat(scheduled_at)
            if run_at <= now:
                # Overdue — send immediately
                threading.Thread(target=_send_worker, daemon=True, kwargs=dict(
                    jid=jid, user_id=job["user_id"], text=job.get("text",""),
                    media_type=job.get("media_type","none"), media_path=job.get("media_path"),
                    caption=job.get("caption",""), targets=job.get("targets",[])
                )).start()
            else:
                _schedule_send(jid, run_at, job["user_id"], job.get("text",""),
                               job.get("media_type","none"), job.get("media_path"),
                               job.get("caption",""), job.get("targets",[]))
            restored += 1
        if restored: log.info("Restored %d scheduled Telegram jobs", restored)
    except Exception as e:
        log.warning("restore_scheduled_jobs failed: %s", e)

# ── Routes ────────────────────────────────────────────────────────────

@router.get("/jobs")
async def list_jobs(user_id: str):
    """List all scheduler jobs for a user."""
    with _jlock:
        all_jobs = _ljobs()
    jobs = [j for j in all_jobs.values() if j.get("user_id") == user_id]
    jobs.sort(key=lambda x: x.get("created_at",""), reverse=True)
    return {"jobs": jobs[:50], "total": len(jobs)}

@router.get("/job/{job_id}")
async def get_job(job_id: str):
    j = _gjob(job_id)
    if not j: raise HTTPException(404, "Job not found")
    return j

@router.delete("/job/{job_id}")
async def cancel_job(job_id: str, user_id: str):
    j = _gjob(job_id)
    if not j: raise HTTPException(404, "Job not found")
    if j.get("user_id") != user_id: raise HTTPException(403, "Forbidden")
    _cancel_scheduled(job_id)
    _ujob(job_id, status="cancelled")
    return {"success": True}

@router.post("/send")
async def schedule_send(
    user_id:       str          = Form(...),
    text:          str          = Form(default=""),
    caption:       str          = Form(default=""),
    schedule_type: str          = Form(default="now"),   # now | custom
    scheduled_at:  str          = Form(default=""),      # ISO datetime IST
    media:         Optional[UploadFile] = File(default=None),
):
    """Schedule or immediately send a post with optional media."""
    if not text.strip() and not media:
        raise HTTPException(400, "Provide text or media")

    targets = _get_targets(user_id)
    if not targets:
        raise HTTPException(400, "Telegram not connected. Connect first.")

    # Save media file
    media_type = "none"
    media_path = None
    media_filename = ""

    if media and media.filename:
        media_bytes = await media.read()
        if len(media_bytes) > 50 * 1024 * 1024:
            raise HTTPException(413, "Media too large. Max 50 MB.")

        fn  = media.filename.lower()
        ext = fn.rsplit(".", 1)[-1] if "." in fn else ""
        media_filename = media.filename

        if ext in ("jpg", "jpeg", "png", "webp"):
            media_type = "photo"
        elif ext in ("mp4", "mov", "avi", "mkv"):
            media_type = "video"
        elif ext in ("gif"):
            media_type = "gif"
        else:
            media_type = "document"

        safe_name = f"{uuid.uuid4().hex[:8]}_{media.filename}"
        media_path = str(MEDIA_DIR / safe_name)
        Path(media_path).write_bytes(media_bytes)

    # Determine run time
    IST = timezone(timedelta(hours=5, minutes=30))
    now_utc = datetime.now(timezone.utc)

    if schedule_type == "now" or not scheduled_at.strip():
        run_at = None
    else:
        try:
            dt = datetime.fromisoformat(scheduled_at)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=IST)
            run_at = dt.astimezone(timezone.utc)
            if run_at <= now_utc:
                raise HTTPException(400, "Scheduled time must be in the future")
        except ValueError:
            raise HTTPException(400, "Invalid datetime format")

    # Create job
    jid = _new_job({
        "user_id":       user_id,
        "text":          text,
        "caption":       caption or text[:200],
        "media_type":    media_type,
        "media_path":    media_path,
        "media_filename": media_filename,
        "targets":       targets,
        "schedule_type": schedule_type,
        "status":        "queued",
    })

    if run_at is None:
        # Send immediately in background
        threading.Thread(target=_send_worker, daemon=True, kwargs=dict(
            jid=jid, user_id=user_id, text=text,
            media_type=media_type, media_path=media_path,
            caption=caption or text[:200], targets=targets
        )).start()
        return {"job_id": jid, "status": "sending", "message": "Sending now…", "targets": targets}
    else:
        _schedule_send(jid, run_at, user_id, text, media_type, media_path, caption or text[:200], targets)
        ist_str = run_at.astimezone(IST).strftime("%d %b %Y at %I:%M %p IST")
        return {"job_id": jid, "status": "scheduled", "message": f"Scheduled for {ist_str}", "scheduled_at": run_at.isoformat(), "targets": targets}