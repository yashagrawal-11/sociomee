"""
youtube_upload.py — SocioMee YouTube Auto-Upload (Async Job System)
====================================================================
Flow:
  POST /auto      → validates, reads video, starts background thread → returns job_id instantly
  GET  /job/{id}  → frontend polls this every 3s → returns status/progress/result

This means ANY video size works — browser never times out.
"""

from __future__ import annotations

import io
import json
import logging
import threading
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

log = logging.getLogger("youtube_upload")

router = APIRouter(prefix="/youtube/upload", tags=["youtube-upload"])

# ── Upload quota per plan per month ───────────────────────────────────
UPLOAD_QUOTA: Dict[str, int] = {
    "free":            0,
    "pro_monthly":     4,
    "pro_annual":      4,
    "premium_monthly": 15,
    "premium_annual":  15,
}

QUOTA_FILE = Path(__file__).parent / "data" / "upload_quota.json"
QUOTA_FILE.parent.mkdir(exist_ok=True)
_lock = threading.Lock()

# ── In-memory job store ───────────────────────────────────────────────
_jobs: Dict[str, dict] = {}
_jobs_lock = threading.Lock()


# ══════════════════════════════════════════════════════════════════════
# JOB HELPERS
# ══════════════════════════════════════════════════════════════════════

def _new_job(user_id: str) -> str:
    job_id = str(uuid.uuid4())
    with _jobs_lock:
        _jobs[job_id] = {
            "job_id":     job_id,
            "user_id":    user_id,
            "status":     "queued",
            "progress":   0,
            "message":    "Queued…",
            "result":     None,
            "error":      None,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
    return job_id


def _update_job(job_id: str, **kwargs):
    with _jobs_lock:
        if job_id in _jobs:
            _jobs[job_id].update(kwargs)


def get_job(job_id: str) -> Optional[dict]:
    with _jobs_lock:
        return _jobs.get(job_id)


# ══════════════════════════════════════════════════════════════════════
# QUOTA MANAGEMENT
# ══════════════════════════════════════════════════════════════════════

def _load_quota() -> dict:
    if QUOTA_FILE.exists():
        try:
            return json.loads(QUOTA_FILE.read_text())
        except Exception:
            pass
    return {}


def _save_quota(data: dict):
    QUOTA_FILE.write_text(json.dumps(data, indent=2))


def _next_reset() -> str:
    now = datetime.now(timezone.utc)
    if now.month == 12:
        nxt = datetime(now.year + 1, 1, 1, tzinfo=timezone.utc)
    else:
        nxt = datetime(now.year, now.month + 1, 1, tzinfo=timezone.utc)
    return nxt.isoformat()


def _get_quota_record(user_id: str, plan: str) -> dict:
    with _lock:
        data = _load_quota()
        now  = datetime.now(timezone.utc)
        if user_id not in data:
            data[user_id] = {"plan": plan, "used": 0, "reset_date": _next_reset()}
            _save_quota(data)
        else:
            rec = data[user_id]
            reset_dt = datetime.fromisoformat(rec.get("reset_date", now.isoformat()))
            if now >= reset_dt:
                rec["used"]       = 0
                rec["reset_date"] = _next_reset()
                rec["plan"]       = plan
                data[user_id]     = rec
                _save_quota(data)
        return data[user_id]


def _use_upload_quota(user_id: str, plan: str) -> bool:
    with _lock:
        data  = _load_quota()
        rec   = _get_quota_record(user_id, plan)
        limit = UPLOAD_QUOTA.get(plan, 0)
        if limit == 0 or rec["used"] >= limit:
            return False
        rec["used"] += 1
        data[user_id] = rec
        _save_quota(data)
        return True


def get_upload_status(user_id: str, plan: str) -> dict:
    rec   = _get_quota_record(user_id, plan)
    limit = UPLOAD_QUOTA.get(plan, 0)
    used  = rec["used"]
    return {
        "plan":       plan,
        "used":       used,
        "limit":      limit,
        "remaining":  max(0, limit - used),
        "reset_date": rec["reset_date"],
        "can_upload": used < limit and limit > 0,
    }


# ══════════════════════════════════════════════════════════════════════
# PLAN HELPERS
# ══════════════════════════════════════════════════════════════════════

def _get_user_plan(user_id: str) -> str:
    try:
        import credits_manager as cm
        return cm.get_credit_status(user_id).get("plan", "free")
    except Exception:
        return "free"


def _is_pro_or_above(plan: str) -> bool:
    return plan != "free"


# ══════════════════════════════════════════════════════════════════════
# BEST TIME CALCULATOR
# ══════════════════════════════════════════════════════════════════════

BEST_TIMES_IST = {
    0: ("19:00", "Monday 7:00 PM IST"),
    1: ("20:00", "Tuesday 8:00 PM IST"),
    2: ("19:00", "Wednesday 7:00 PM IST"),
    3: ("20:00", "Thursday 8:00 PM IST"),
    4: ("18:00", "Friday 6:00 PM IST"),
    5: ("11:00", "Saturday 11:00 AM IST"),
    6: ("11:00", "Sunday 11:00 AM IST"),
}


def get_best_upload_time() -> dict:
    IST = timezone(timedelta(hours=5, minutes=30))
    now = datetime.now(IST)
    wd  = now.weekday()
    time_str, label = BEST_TIMES_IST[wd]
    h, m = map(int, time_str.split(":"))
    best = now.replace(hour=h, minute=m, second=0, microsecond=0)
    if best <= now:
        best += timedelta(days=1)
        wd = best.weekday()
        time_str, label = BEST_TIMES_IST[wd]
        h, m = map(int, time_str.split(":"))
        best = best.replace(hour=h, minute=m, second=0, microsecond=0)
    return {
        "utc_iso":   best.astimezone(timezone.utc).isoformat(),
        "ist_label": label,
        "weekday":   best.strftime("%A"),
    }


# ══════════════════════════════════════════════════════════════════════
# UPLOAD WORKER — runs in background thread
# ══════════════════════════════════════════════════════════════════════

def _upload_worker(
    job_id:         str,
    user_id:        str,
    plan:           str,
    video_bytes:    bytes,
    title:          str,
    description:    str,
    tags:           list,
    category_id:    str,
    privacy:        str,
    schedule_utc:   Optional[str],
    is_short:       bool,
    best_time_info: Optional[dict],
):
    try:
        _update_job(job_id, status="uploading", progress=10, message="Connecting to YouTube…")

        import youtube_connect as ytc
        from googleapiclient.http import MediaIoBaseUpload

        creds   = ytc._get_credentials(user_id)
        youtube = ytc._build_youtube_client(creds)

        _update_job(job_id, progress=25, message="Preparing video…")

        if is_short:
            if "#Shorts" not in title:
                title = (title[:52] + " #Shorts") if len(title) > 52 else (title + " #Shorts")
            description = "#Shorts\n\n" + description

        body = {
            "snippet": {
                "title":       title[:100],
                "description": description[:5000],
                "tags":        tags[:30],
                "categoryId":  category_id,
            },
            "status": {
                "privacyStatus":           "private" if schedule_utc else privacy,
                "selfDeclaredMadeForKids": False,
            },
        }
        if schedule_utc:
            body["status"]["publishAt"] = schedule_utc

        _update_job(job_id, progress=40, message="Uploading to YouTube…")

        media   = MediaIoBaseUpload(
            io.BytesIO(video_bytes),
            mimetype="video/*",
            chunksize=-1,
            resumable=False,
        )
        request  = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
        response = request.execute()

        vid_id = response["id"]
        url    = f"https://youtube.com/shorts/{vid_id}" if is_short else f"https://youtube.com/watch?v={vid_id}"

        _update_job(job_id, progress=90, message="Finalising…")

        _use_upload_quota(user_id, plan)
        new_quota = get_upload_status(user_id, plan)

        result = {
            "success":   True,
            "video_id":  vid_id,
            "video_url": url,
            "title":     title,
            "scheduled": schedule_utc,
            "best_time": best_time_info,
            "quota":     new_quota,
            "plan":      plan,
        }

        _update_job(job_id, status="done", progress=100, message="Upload complete!", result=result)
        log.info("Upload done — job=%s video=%s", job_id, vid_id)

    except Exception as e:
        log.error("Upload worker failed — job=%s error=%s", job_id, e)
        _update_job(job_id, status="error", progress=0, message="Upload failed", error=str(e))


# ══════════════════════════════════════════════════════════════════════
# API ROUTES
# ══════════════════════════════════════════════════════════════════════

@router.get("/quota")
async def upload_quota_status(user_id: str):
    plan = _get_user_plan(user_id)
    return get_upload_status(user_id, plan)


@router.get("/best-time")
async def best_time():
    return get_best_upload_time()


@router.get("/job/{job_id}")
async def get_job_status(job_id: str):
    """Frontend polls this every 3 seconds."""
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.post("/auto")
async def auto_upload(
    user_id:       str        = Form(...),
    topic:         str        = Form(...),
    video_type:    str        = Form(default="video"),
    schedule_type: str        = Form(default="now"),
    custom_time:   str        = Form(default=""),
    privacy:       str        = Form(default="public"),
    language:      str        = Form(default="Hindi/English"),
    video:         UploadFile = File(...),
):
    """
    Reads video, validates, starts background upload, returns job_id INSTANTLY.
    """
    # 1. Plan check
    plan = _get_user_plan(user_id)
    if not _is_pro_or_above(plan):
        raise HTTPException(403, detail={
            "error":   "upgrade_required",
            "message": "Auto-upload requires Pro (₹499/mo) or Premium (₹2999/mo)",
        })

    # 2. Quota check
    quota = get_upload_status(user_id, plan)
    if not quota["can_upload"]:
        raise HTTPException(429, detail={
            "error":      "quota_exceeded",
            "message":    f"Monthly upload limit reached ({quota['limit']}/month). Resets {quota['reset_date'][:10]}",
            "remaining":  0,
            "reset_date": quota["reset_date"],
        })

    # 3. Read video
    video_bytes = await video.read()
    if len(video_bytes) > 256 * 1024 * 1024:
        raise HTTPException(413, "Video too large. Max 256 MB.")

    is_short    = video_type.lower() == "short"
    title       = topic[:100]
    description = f"{topic}\n\nPosted via SocioMee — AI Content Platform for Indian Creators\nsociomee.in"
    tags        = [w for w in topic.split() if len(w) > 2][:10]
    category_id = "22"

    # 4. Schedule
    schedule_utc   = None
    best_time_info = None
    if schedule_type == "best":
        best_time_info = get_best_upload_time()
        schedule_utc   = best_time_info["utc_iso"]
    elif schedule_type == "custom" and custom_time:
        try:
            dt = datetime.fromisoformat(custom_time)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
            schedule_utc = dt.astimezone(timezone.utc).isoformat()
        except Exception:
            raise HTTPException(400, "Invalid custom_time. Use ISO format e.g. 2026-04-28T20:00:00")

    # 5. Create job + fire background thread
    job_id = _new_job(user_id)
    threading.Thread(
        target=_upload_worker,
        kwargs=dict(
            job_id=job_id, user_id=user_id, plan=plan,
            video_bytes=video_bytes, title=title, description=description,
            tags=tags, category_id=category_id, privacy=privacy,
            schedule_utc=schedule_utc, is_short=is_short,
            best_time_info=best_time_info,
        ),
        daemon=True,
    ).start()

    # 6. Return instantly
    return {"job_id": job_id, "status": "queued", "message": "Upload started!", "quota": quota, "plan": plan}