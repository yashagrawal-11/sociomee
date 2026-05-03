"""
youtube_upload.py — SocioMee YouTube Auto-Upload + AI SEO + Thumbnail Analyzer
===============================================================================
Features:
  - POST /auto            → async upload with AI SEO from keyword
  - GET  /job/{id}        → poll upload progress
  - POST /seo             → generate viral SEO from keyword only (no upload)
  - POST /thumbnail       → compare 2 thumbnails, give CTR advice
"""

from __future__ import annotations

import base64
import io
import json
import logging
import os
import re
import threading
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

log = logging.getLogger("youtube_upload")

router = APIRouter(prefix="/youtube/upload", tags=["youtube-upload"])

UPLOAD_QUOTA: Dict[str, int] = {
    "free":            0,
    "pro_monthly":     4,
    "pro_annual":      4,
    "premium_monthly": 15,
    "premium_annual":  15,
}

QUOTA_FILE = Path(__file__).parent / "data" / "upload_quota.json"
QUOTA_FILE.parent.mkdir(exist_ok=True)
_lock      = threading.Lock()
_jobs: Dict[str, dict] = {}
_jobs_lock = threading.Lock()


# ══════════════════════════════════════════════════════════════════════
# JOB STORE
# ══════════════════════════════════════════════════════════════════════

def _new_job(user_id: str) -> str:
    job_id = str(uuid.uuid4())
    with _jobs_lock:
        _jobs[job_id] = {
            "job_id": job_id, "user_id": user_id,
            "status": "queued", "progress": 0,
            "message": "Queued…", "result": None,
            "error": None, "created_at": datetime.now(timezone.utc).isoformat(),
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
# QUOTA
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
    nxt = datetime(now.year + (1 if now.month == 12 else 0),
                   1 if now.month == 12 else now.month + 1,
                   1, tzinfo=timezone.utc)
    return nxt.isoformat()


def _get_quota_record(user_id: str, plan: str) -> dict:
    with _lock:
        data = _load_quota()
        now  = datetime.now(timezone.utc)
        if user_id not in data:
            data[user_id] = {"plan": plan, "used": 0, "reset_date": _next_reset()}
            _save_quota(data)
        else:
            rec      = data[user_id]
            reset_dt = datetime.fromisoformat(rec.get("reset_date", now.isoformat()))
            if now >= reset_dt:
                rec.update({"used": 0, "reset_date": _next_reset(), "plan": plan})
                data[user_id] = rec
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
        "plan": plan, "used": used, "limit": limit,
        "remaining": max(0, limit - used),
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


def _is_premium(plan: str) -> bool:
    return "premium" in plan


# ══════════════════════════════════════════════════════════════════════
# BEST TIME
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
        "utc_iso": best.astimezone(timezone.utc).isoformat(),
        "ist_label": label,
        "weekday": best.strftime("%A"),
    }


# ══════════════════════════════════════════════════════════════════════
# GEMINI AI — SEO + THUMBNAIL
# ══════════════════════════════════════════════════════════════════════

def _gemini_text(prompt: str, max_tokens: int = 2048) -> str:
    """Call Gemini 1.5 Flash for text generation."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GOOGLE_AI_API_KEY", "")
        if not api_key:
            raise ValueError("GOOGLE_AI_API_KEY not set")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")
        resp  = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": max_tokens, "temperature": 0.8}
        )
        return resp.text.strip()
    except Exception as e:
        log.warning("Gemini text failed: %s", e)
        return ""


def _gemini_vision(prompt: str, images: List[bytes]) -> str:
    """Call Gemini 1.5 Flash with image(s) for vision tasks."""
    try:
        import google.generativeai as genai
        api_key = os.getenv("GOOGLE_AI_API_KEY", "")
        if not api_key:
            raise ValueError("GOOGLE_AI_API_KEY not set")
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel("gemini-1.5-flash")

        parts = []
        for img_bytes in images:
            parts.append({"mime_type": "image/jpeg", "data": img_bytes})
        parts.append(prompt)

        resp = model.generate_content(parts)
        return resp.text.strip()
    except Exception as e:
        log.warning("Gemini vision failed: %s", e)
        return ""


def _parse_json(raw: str) -> dict:
    """Safely extract JSON from Gemini response."""
    try:
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    return {}


# ══════════════════════════════════════════════════════════════════════
# AI SEO GENERATION
# ══════════════════════════════════════════════════════════════════════

def generate_viral_seo(keyword: str, video_type: str = "video", language: str = "Hindi/English", is_premium: bool = False) -> dict:
    """Generate full viral YouTube SEO from a single keyword using Gemini."""

    extra = ""
    if is_premium:
        extra = """
  "hook": "exact first 15 seconds script to hook viewers instantly",
  "thumbnail_idea": "specific thumbnail concept: background color, text overlay, emotion/expression",
  "best_title_alternatives": ["alt title 1", "alt title 2", "alt title 3"],
  "upload_tip": "one specific tip to maximize this video's reach","""

    prompt = f"""You are India's #1 YouTube SEO expert who has helped 500+ Indian creators go viral.

A creator wants to make a YouTube {video_type} about: "{keyword}"
Target audience: Indian viewers
Language: {language} (Hinglish mix works great)

Generate VIRAL-OPTIMIZED YouTube SEO metadata. Think like MrBeast meets Indian YouTube.

Rules:
- Title must create CURIOSITY or SHOCK — use numbers, power words, emotional triggers
- Description must have keywords naturally, timestamps, and strong CTA
- Tags must mix Hindi/English keywords Indians actually search
- Use trending Indian YouTube patterns

Return ONLY valid JSON, no markdown, no explanation:
{{
  "title": "viral title under 60 chars with emotional hook",
  "description": "200 word description with keywords, [00:00 Intro] [00:30 Main] timestamps, subscribe CTA at end",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13","tag14","tag15","tag16","tag17","tag18","tag19","tag20"],
  "category": "Education",
  "hashtags": ["#hashtag1","#hashtag2","#hashtag3","#hashtag4","#hashtag5"],
  "seo_score": 92,
  "why_viral": "one sentence explaining why this will trend"{extra}
}}"""

    raw    = _gemini_text(prompt, max_tokens=2000)
    result = _parse_json(raw)

    if not result.get("title"):
        # Fallback if Gemini fails
        result = {
            "title":       f"{keyword} | Must Watch 2025",
            "description": f"{keyword}\n\nWatch this video about {keyword}. Like, share and subscribe!\n\n[00:00 Intro]\n[00:30 Main Content]\n\n#shorts #india #youtube",
            "tags":        [keyword, "india", "youtube", "viral", "trending", "2025"],
            "category":    "People & Blogs",
            "hashtags":    [f"#{keyword.replace(' ','')}", "#india", "#youtube", "#trending", "#viral"],
            "seo_score":   60,
            "why_viral":   "Trending topic for Indian audience",
        }

    return result


# ══════════════════════════════════════════════════════════════════════
# THUMBNAIL ANALYZER
# ══════════════════════════════════════════════════════════════════════

def analyze_thumbnails(thumb1_bytes: bytes, thumb2_bytes: Optional[bytes] = None) -> dict:
    """Analyze 1 or 2 thumbnails and give CTR optimization advice."""

    if thumb2_bytes:
        prompt = """You are a YouTube thumbnail expert who analyzes CTR optimization.
I'm showing you 2 YouTube thumbnails (Thumbnail A and Thumbnail B).

Analyze both deeply and return ONLY valid JSON:
{
  "winner": "A or B",
  "winner_reason": "one clear sentence why this wins",
  "thumbnail_a": {
    "ctr_score": 75,
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "color_analysis": "brief color grading feedback",
    "text_analysis": "feedback on text overlay if any",
    "face_emotion": "feedback on face/expression if visible",
    "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"]
  },
  "thumbnail_b": {
    "ctr_score": 82,
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "weaknesses": ["weakness 1", "weakness 2"],
    "color_analysis": "brief color grading feedback",
    "text_analysis": "feedback on text overlay if any",
    "face_emotion": "feedback on face/expression if visible",
    "improvements": ["specific improvement 1", "specific improvement 2", "specific improvement 3"]
  },
  "general_tips": ["CTR tip 1 for Indian YouTube", "CTR tip 2", "CTR tip 3"]
}"""
        raw = _gemini_vision(prompt, [thumb1_bytes, thumb2_bytes])
    else:
        prompt = """You are a YouTube thumbnail expert who analyzes CTR optimization.
Analyze this YouTube thumbnail deeply.

Return ONLY valid JSON:
{
  "ctr_score": 75,
  "grade": "B+",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "weaknesses": ["weakness 1", "weakness 2"],
  "color_analysis": "detailed color grading feedback — what works, what to change",
  "text_analysis": "feedback on text overlay — size, font, placement, readability",
  "face_emotion": "feedback on face/expression — does it create curiosity?",
  "background": "feedback on background — too busy, too plain, good contrast?",
  "improvements": ["very specific improvement 1", "very specific improvement 2", "very specific improvement 3", "specific improvement 4"],
  "viral_potential": "low/medium/high",
  "overall": "2 sentence summary of this thumbnail's CTR potential for Indian YouTube audience"
}"""
        raw = _gemini_vision(prompt, [thumb1_bytes])

    result = _parse_json(raw)
    if not result:
        result = {"error": "Could not analyze thumbnail. Please try again.", "ctr_score": 0}

    return result


# ══════════════════════════════════════════════════════════════════════
# CATEGORY MAP
# ══════════════════════════════════════════════════════════════════════

CATEGORY_MAP = {
    "film & animation": "1", "music": "10", "pets & animals": "15",
    "sports": "17", "travel": "19", "gaming": "20",
    "people & blogs": "22", "comedy": "23", "entertainment": "24",
    "news & politics": "25", "howto & style": "26", "education": "27",
    "science & technology": "28",
}


def _get_category_id(name: str) -> str:
    n = name.lower()
    for k, v in CATEGORY_MAP.items():
        if k in n:
            return v
    return "22"


# ══════════════════════════════════════════════════════════════════════
# UPLOAD WORKER
# ══════════════════════════════════════════════════════════════════════

def _upload_worker(
    job_id: str, user_id: str, plan: str,
    video_bytes: bytes, keyword: str, video_type: str,
    language: str, privacy: str, schedule_utc: Optional[str],
    is_short: bool, best_time_info: Optional[dict],
):
    try:
        _update_job(job_id, status="uploading", progress=10, message="Generating AI SEO…")

        # Generate SEO with Gemini
        seo         = generate_viral_seo(keyword, video_type, language, _is_premium(plan))
        title       = seo.get("title", keyword)[:100]
        description = seo.get("description", keyword)[:5000]
        tags        = seo.get("tags", [keyword])[:30]
        category_id = _get_category_id(seo.get("category", "People & Blogs"))

        _update_job(job_id, progress=35, message="Connecting to YouTube…")

        import youtube_connect as ytc
        from googleapiclient.http import MediaIoBaseUpload

        creds   = ytc._get_credentials(user_id)
        youtube = ytc._build_youtube_client(creds)

        _update_job(job_id, progress=50, message="Uploading to YouTube…")

        if is_short:
            if "#Shorts" not in title:
                title = (title[:52] + " #Shorts") if len(title) > 52 else (title + " #Shorts")
            description = "#Shorts\n\n" + description

        body = {
            "snippet": {
                "title": title, "description": description,
                "tags": tags, "categoryId": category_id,
            },
            "status": {
                "privacyStatus": "private" if schedule_utc else privacy,
                "selfDeclaredMadeForKids": False,
            },
        }
        if schedule_utc:
            body["status"]["publishAt"] = schedule_utc

        media    = MediaIoBaseUpload(io.BytesIO(video_bytes), mimetype="video/*", chunksize=-1, resumable=False)
        request  = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
        response = request.execute()

        _update_job(job_id, progress=90, message="Finalising…")

        vid_id    = response["id"]
        url       = f"https://youtube.com/shorts/{vid_id}" if is_short else f"https://youtube.com/watch?v={vid_id}"

        _use_upload_quota(user_id, plan)
        new_quota = get_upload_status(user_id, plan)

        _update_job(job_id, status="done", progress=100, message="Upload complete! 🎉",
                    result={
                        "success": True, "video_id": vid_id, "video_url": url,
                        "title": title, "scheduled": schedule_utc,
                        "best_time": best_time_info, "quota": new_quota,
                        "plan": plan, "seo": seo,
                    })
        log.info("Upload done — job=%s video=%s", job_id, vid_id)

    except Exception as e:
        log.error("Upload worker failed — job=%s error=%s", job_id, e)
        _update_job(job_id, status="error", progress=0, message="Upload failed", error=str(e))


# ══════════════════════════════════════════════════════════════════════
# ROUTES
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
    job = get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job


@router.post("/seo")
async def generate_seo_only(
    user_id:    str = Form(...),
    keyword:    str = Form(...),
    video_type: str = Form(default="video"),
    language:   str = Form(default="Hindi/English"),
):
    """Generate viral SEO from keyword only — no upload needed."""
    plan = _get_user_plan(user_id)
    if not _is_pro_or_above(plan):
        raise HTTPException(403, "SEO generation requires Pro or Premium plan")
    seo = generate_viral_seo(keyword, video_type, language, _is_premium(plan))
    return {"seo": seo, "plan": plan}


@router.post("/thumbnail")
async def analyze_thumbnail(
    user_id:    str                    = Form(...),
    thumbnail1: UploadFile             = File(...),
    thumbnail2: Optional[UploadFile]   = File(default=None),
):
    """Analyze 1 or 2 thumbnails for CTR optimization."""
    plan = _get_user_plan(user_id)
    if not _is_pro_or_above(plan):
        raise HTTPException(403, "Thumbnail analysis requires Pro or Premium plan")

    thumb1_bytes = await thumbnail1.read()
    thumb2_bytes = (await thumbnail2.read()) if thumbnail2 else None

    result = analyze_thumbnails(thumb1_bytes, thumb2_bytes)
    return {"analysis": result, "plan": plan, "mode": "compare" if thumb2_bytes else "single"}


@router.post("/auto")
async def auto_upload(
    user_id:       str        = Form(...),
    keyword:       str        = Form(...),
    video_type:    str        = Form(default="video"),
    schedule_type: str        = Form(default="now"),
    custom_time:   str        = Form(default=""),
    privacy:       str        = Form(default="public"),
    language:      str        = Form(default="Hindi/English"),
    video:         UploadFile = File(...),
):
    """Upload video with AI-generated viral SEO. Returns job_id instantly."""
    plan = _get_user_plan(user_id)
    if not _is_pro_or_above(plan):
        raise HTTPException(403, detail={"error": "upgrade_required", "message": "Auto-upload requires Pro (₹499/mo) or Premium (₹2999/mo)"})

    quota = get_upload_status(user_id, plan)
    if not quota["can_upload"]:
        raise HTTPException(429, detail={"error": "quota_exceeded", "message": f"Monthly upload limit reached ({quota['limit']}/month). Resets {quota['reset_date'][:10]}", "remaining": 0, "reset_date": quota["reset_date"]})

    video_bytes = await video.read()
    if len(video_bytes) > 256 * 1024 * 1024:
        raise HTTPException(413, "Video too large. Max 256 MB.")

    is_short = video_type.lower() == "short"

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
            raise HTTPException(400, "Invalid custom_time format")

    job_id = _new_job(user_id)
    threading.Thread(
        target=_upload_worker,
        kwargs=dict(
            job_id=job_id, user_id=user_id, plan=plan,
            video_bytes=video_bytes, keyword=keyword,
            video_type=video_type, language=language,
            privacy=privacy, schedule_utc=schedule_utc,
            is_short=is_short, best_time_info=best_time_info,
        ),
        daemon=True,
    ).start()

    return {"job_id": job_id, "status": "queued", "message": "Upload started! AI SEO being generated…", "quota": quota, "plan": plan}