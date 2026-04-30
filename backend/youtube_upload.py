"""
youtube_upload.py — SocioMee YouTube Auto-Upload with AI SEO
============================================================
Plans:
  - Free          : upload blocked
  - Pro           : 4 uploads/month reset monthly, full SEO (Gemma)
  - Premium       : 15 uploads/month reset monthly, perfect SEO + research (Gemma + DeepSeek)

Upload quota tracked in data/upload_quota.json (separate from credits)
"""

from __future__ import annotations

import json
import logging
import os
import re
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

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


def _is_premium(plan: str) -> bool:
    return "premium" in plan


def _is_pro_or_above(plan: str) -> bool:
    return plan != "free"


# ══════════════════════════════════════════════════════════════════════
# AI SEO GENERATION
# ══════════════════════════════════════════════════════════════════════

def _gemma_generate(prompt: str, max_tokens: int = 2048) -> str:
    try:
        import google.generativeai as genai
        genai.configure(api_key=os.getenv("GOOGLE_AI_API_KEY", ""))
        model = genai.GenerativeModel("gemma-3-27b-it")
        resp  = model.generate_content(
            prompt,
            generation_config={"max_output_tokens": max_tokens, "temperature": 0.7}
        )
        return resp.text.strip()
    except Exception as e:
        log.warning("Gemma failed: %s", e)
        return ""


def _deepseek_generate(prompt: str, max_tokens: int = 800) -> str:
    api_key = os.getenv("DEEPSEEK_API_KEY", "")
    if not api_key:
        return ""
    try:
        import requests
        resp = requests.post(
            "https://api.deepseek.com/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
            json={
                "model":      "deepseek-chat",
                "messages":   [{"role": "user", "content": prompt}],
                "max_tokens": max_tokens,
            },
            timeout=30,
        )
        return resp.json()["choices"][0]["message"]["content"].strip()
    except Exception as e:
        log.warning("DeepSeek failed: %s", e)
        return ""


def _parse_seo_json(raw: str, topic: str, video_type: str) -> dict:
    try:
        match = re.search(r'\{[\s\S]*\}', raw)
        if match:
            return json.loads(match.group())
    except Exception:
        pass
    # Fallback
    return {
        "title":       f"{topic} | {video_type.title()} 2025",
        "description": f"Watch this {video_type} about {topic}. Like, share and subscribe!\n\n#{topic.replace(' ','')} #india #youtube",
        "tags":        [topic, "india", "youtube", "viral", "trending", video_type],
        "category":    "People & Blogs",
        "hashtags":    [f"#{topic.replace(' ','')}", "#india", "#youtube", "#trending", "#viral"],
    }


def generate_seo_pro(topic: str, video_type: str, language: str = "Hindi/English") -> dict:
    """Pro: Full SEO — title + description + 20 tags via Gemma."""
    prompt = f"""You are a YouTube SEO expert for Indian creators.
Generate optimized SEO metadata for a YouTube {video_type} about: "{topic}"
Target language: {language} (Hinglish mix is great for Indian audience)

Return ONLY valid JSON, no markdown:
{{
  "title": "engaging title under 60 chars with power words",
  "description": "150-200 word description with keywords naturally placed, timestamps placeholder [00:00 Intro], subscribe CTA at end",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13","tag14","tag15","tag16","tag17","tag18","tag19","tag20"],
  "category": "one of: Education, Entertainment, People & Blogs, Science & Technology, Gaming, Howto & Style, News & Politics, Music, Sports",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5"]
}}"""
    raw = _gemma_generate(prompt, max_tokens=1500)
    return _parse_seo_json(raw, topic, video_type)


def generate_seo_premium(topic: str, video_type: str, language: str = "Hindi/English") -> dict:
    """Premium: Perfect SEO — competitor research + hooks + 30 tags via Gemma + DeepSeek."""
    # Step 1: Research with DeepSeek
    research = _deepseek_generate(
        f"""Research YouTube topic "{topic}" for Indian audience 2025-2026.
List:
1. Top 5 competitor YouTube video titles on this exact topic
2. Top 10 keywords Indians search for this topic
3. Best hook strategy (first 15 seconds) to maximize watch time
4. Unique angle no other creator has covered yet
Keep under 250 words. Be specific.""",
        max_tokens=400,
    )

    # Step 2: Perfect SEO with research context
    prompt = f"""You are India's top YouTube SEO strategist.

COMPETITOR RESEARCH:
{research or "No research available - use your expertise"}

Generate PERFECT viral SEO for a YouTube {video_type} about: "{topic}"
Language: {language}

Return ONLY valid JSON, no markdown:
{{
  "title": "viral-optimized title under 60 chars",
  "description": "250-300 word description with research-backed keywords, storytelling hook, timestamps [00:00 Intro], strong subscribe CTA",
  "tags": ["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10","tag11","tag12","tag13","tag14","tag15","tag16","tag17","tag18","tag19","tag20","tag21","tag22","tag23","tag24","tag25","tag26","tag27","tag28","tag29","tag30"],
  "category": "one of: Education, Entertainment, People & Blogs, Science & Technology, Gaming, Howto & Style",
  "hashtags": ["#tag1","#tag2","#tag3","#tag4","#tag5","#tag6","#tag7"],
  "hook": "exact first 15 seconds script to maximize retention",
  "thumbnail_idea": "specific thumbnail concept: background color, text overlay, expression/pose",
  "best_title_alternatives": ["alt title 1","alt title 2","alt title 3"]
}}"""

    raw    = _gemma_generate(prompt, max_tokens=2500)
    result = _parse_seo_json(raw, topic, video_type)
    result["research_used"] = bool(research)
    return result


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
# YOUTUBE UPLOAD
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
        from googleapiclient.http import MediaIoUpload

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

        media   = MediaIoUpload(io.BytesIO(video_bytes), mimetype="video/*", chunksize=10*1024*1024, resumable=True)
        request = youtube.videos().insert(part="snippet,status", body=body, media_body=media)
        response = None
        while response is None:
            _, response = request.next_chunk()

        vid_id = response["id"]
        url    = f"https://youtube.com/shorts/{vid_id}" if is_short else f"https://youtube.com/watch?v={vid_id}"
        return {"success": True, "video_id": vid_id, "video_url": url, "title": title, "scheduled": schedule_utc}

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


@router.get("/seo-preview")
async def seo_preview(user_id: str, topic: str, video_type: str = "video"):
    """Generate AI SEO without uploading — free preview for Pro/Premium."""
    plan = _get_user_plan(user_id)
    if not _is_pro_or_above(plan):
        raise HTTPException(403, "SEO generation requires Pro or Premium plan")
    seo = generate_seo_premium(topic, video_type) if _is_premium(plan) else generate_seo_pro(topic, video_type)
    return {"plan": plan, "seo": seo}


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
    Auto-upload with AI SEO.
    Steps: plan check → quota check → read video → generate SEO → upload → deduct quota
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

    # 4. Generate AI SEO
    seo = generate_seo_premium(topic, video_type, language) if _is_premium(plan) else generate_seo_pro(topic, video_type, language)
    title       = seo.get("title", topic)
    description = seo.get("description", "")
    tags        = seo.get("tags", [topic])
    category_id = _get_category_id(seo.get("category", "People & Blogs"))

    # 5. Schedule
    schedule_utc = None
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

    # 6. Upload
    result = _upload_to_youtube(user_id, video_bytes, title, description, tags, category_id, privacy, schedule_utc, is_short)

    # 7. Deduct quota
    _use_upload_quota(user_id, plan)
    new_quota = get_upload_status(user_id, plan)

    return {**result, "seo": seo, "best_time": best_time_info, "quota": new_quota, "plan": plan}