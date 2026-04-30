"""
youtube_upload.py — SocioMee YouTube Auto-Upload (No-SEO Fast Version)
=======================================================================
Plans:
  - Free          : upload blocked
  - Pro           : 4 uploads/month reset monthly
  - Premium       : 15 uploads/month reset monthly

SEO generation removed temporarily — upload works first, SEO added later.
Upload quota tracked in data/upload_quota.json
"""

from __future__ import annotations

import json
import logging
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

log = logging.getLogger("youtube_upload")

router = APIRouter(prefix="/youtube/upload", tags=["youtube-upload"])

# ── Upload quota per plan per month ───────────────────────────────────
UPLOAD_QUOTA: Dict[str, int] = {
    "free":              0,
    "pro_monthly":       4,
    "pro_annual":        4,
    "premium_monthly":   15,
    "premium_annual":    15,
}

QUOTA_FILE = Path(__file__).parent / "data" / "upload_quota.json"
QUOTA_FILE.parent.mkdir(exist_ok=True)
_lock = threading.Lock()


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
# CATEGORY MAP
# ══════════════════════════════════════════════════════════════════════

CATEGORY_MAP = {
    "film & animation": "1",   "music": "10",        "pets & animals": "15",
    "sports": "17",            "travel": "19",        "gaming": "20",
    "people & blogs": "22",    "comedy": "23",        "entertainment": "24",
    "news & politics": "25",   "howto & style": "26", "education": "27",
    "science & technology": "28",
}


def _get_category_id(name: str) -> str:
    n = name.lower()
    for k, v in CATEGORY_MAP.items():
        if k in n:
            return v
    return "22"


# ══════════════════════════════════════════════════════════════════════
# YOUTUBE UPLOAD  — simple, no chunking, no resumable
# ══════════════════════════════════════════════════════════════════════

def _upload_to_youtube(
    user_id:      str,
    video_bytes:  bytes,
    title:        str,
    description:  str,
    tags:         list,
    category_id:  str,
    privacy:      str,
    schedule_utc: Optional[str],
    is_short:     bool,
) -> dict:
    try:
        import io
        import youtube_connect as ytc
        from googleapiclient.http import MediaIoBaseUpload

        creds   = ytc._get_credentials(user_id)
        youtube = ytc._build_youtube_client(creds)

        # Shorts formatting
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
                "privacyStatus":          "private" if schedule_utc else privacy,
                "selfDeclaredMadeForKids": False,
            },
        }
        if schedule_utc:
            body["status"]["publishAt"] = schedule_utc

        # ── KEY FIX: chunksize=-1 (single request), resumable=False ──
        media = MediaIoBaseUpload(
            io.BytesIO(video_bytes),
            mimetype="video/*",
            chunksize=-1,
            resumable=False,
        )

        request  = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
        response = request.execute()   # single blocking call, no chunked loop

        vid_id = response["id"]
        url    = f"https://youtube.com/shorts/{vid_id}" if is_short else f"https://youtube.com/watch?v={vid_id}"
        return {
            "success":   True,
            "video_id":  vid_id,
            "video_url": url,
            "title":     title,
            "scheduled": schedule_utc,
        }

    except Exception as e:
        log.error("YouTube upload failed: %s", e)
        raise HTTPException(500, f"Upload failed: {str(e)}")


# ══════════════════════════════════════════════════════════════════════
# API ROUTES
# ══════════════════════════════════════════════════════════════════════

@router.get("/quota")
async def upload_quota_status(user_id: str):
    """Get upload quota for user."""
    plan = _get_user_plan(user_id)
    return get_upload_status(user_id, plan)


@router.get("/best-time")
async def best_time():
    """Get next best upload time slot."""
    return get_best_upload_time()


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
    Auto-upload to YouTube.
    Steps: plan check → quota check → read video → upload → deduct quota
    SEO generation skipped for now (will be added back once upload is stable).
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

    is_short = video_type.lower() == "short"

    # 4. Basic title/description from topic (no AI, instant)
    title       = topic[:100]
    description = f"{topic}\n\nPosted via SocioMee — AI Content Platform for Indian Creators\nsociomee.in"
    tags        = [w for w in topic.split() if len(w) > 2][:10]
    category_id = "22"  # People & Blogs default

    # 5. Schedule
    schedule_utc   = None
    best_time_info = None
    if schedule_type == "best":
        best_time_info = get_best_upload_time()
        schedule_utc   = best_time_info["utc_iso"]
    elif schedule_type == "custom" and custom_time:
        try:
            from datetime import datetime
            dt = datetime.fromisoformat(custom_time)
            if dt.tzinfo is None:
                dt = dt.replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
            schedule_utc = dt.astimezone(timezone.utc).isoformat()
        except Exception:
            raise HTTPException(400, "Invalid custom_time. Use ISO format e.g. 2026-04-28T20:00:00")

    # 6. Upload
    result = _upload_to_youtube(
        user_id, video_bytes, title, description,
        tags, category_id, privacy, schedule_utc, is_short
    )

    # 7. Deduct quota
    _use_upload_quota(user_id, plan)
    new_quota = get_upload_status(user_id, plan)

    return {
        **result,
        "seo":       None,
        "best_time": best_time_info,
        "quota":     new_quota,
        "plan":      plan,
    }