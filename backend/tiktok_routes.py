"""
tiktok_routes.py — SocioMee TikTok API Routes
Add to app.py:
    from tiktok_routes import router as tiktok_router
    app.include_router(tiktok_router)

TikTok OAuth uses the official Content Posting API.
Required .env:
    TIKTOK_CLIENT_KEY    = your_client_key
    TIKTOK_CLIENT_SECRET = your_client_secret
    TIKTOK_REDIRECT_URI  = https://sociomee.in/api/tiktok/callback
"""

from __future__ import annotations
import json, logging, os, random
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional
import httpx
from fastapi import APIRouter, HTTPException, Query, Request
from fastapi.responses import RedirectResponse
from pydantic import BaseModel

log    = logging.getLogger("tiktok_routes")
router = APIRouter(prefix="/tiktok", tags=["tiktok"])

TIKTOK_CLIENT_KEY    = os.getenv("TIKTOK_CLIENT_KEY",    "")
TIKTOK_CLIENT_SECRET = os.getenv("TIKTOK_CLIENT_SECRET", "")
TIKTOK_REDIRECT_URI  = os.getenv("TIKTOK_REDIRECT_URI",  "https://sociomee.in/api/tiktok/callback")
TIKTOK_SCOPE         = "user.info.basic,user.info.stats,video.list,video.publish"

DATA_DIR = Path(__file__).resolve().parent / "data"
DATA_DIR.mkdir(exist_ok=True)
TT_FILE  = DATA_DIR / "tiktok_accounts.json"

# ── Storage ───────────────────────────────────────────────────────────
def _load() -> Dict:
    if not TT_FILE.exists(): return {}
    try:
        raw = TT_FILE.read_text(encoding="utf-8").strip()
        return json.loads(raw) if raw else {}
    except Exception: return {}

def _save(data: Dict):
    TT_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")

def _get(user_id: str) -> Optional[Dict]:
    return _load().get(str(user_id))

def _set(user_id: str, account: Dict):
    data = _load()
    data[str(user_id)] = account
    _save(data)

def _del(user_id: str):
    data = _load()
    data.pop(str(user_id), None)
    _save(data)

# ── Pydantic models ───────────────────────────────────────────────────
class GenerateRequest(BaseModel):
    user_id:   str
    topic:     str
    niche:     str = "lifestyle"
    tone:      str = "default"
    objective: str = "watch_time"
    duration:  int = 30

class ScheduleRequest(BaseModel):
    user_id:      str
    caption:      str
    hashtags:     List[str] = []
    scheduled_at: str = ""   # ISO datetime, empty = post now
    video_url:    str = ""   # URL to video file (optional)

# ── Auth ──────────────────────────────────────────────────────────────
@router.get("/auth-url")
async def get_auth_url(user_id: str = Query(...)):
    if not TIKTOK_CLIENT_KEY:
        raise HTTPException(500, "TIKTOK_CLIENT_KEY not configured")
    import secrets
    state = f"{user_id}:{secrets.token_hex(8)}"
    url = (
        f"https://www.tiktok.com/v2/auth/authorize/"
        f"?client_key={TIKTOK_CLIENT_KEY}"
        f"&scope={TIKTOK_SCOPE}"
        f"&response_type=code"
        f"&redirect_uri={TIKTOK_REDIRECT_URI}"
        f"&state={state}"
    )
    return {"url": url}


@router.get("/callback")
async def tiktok_callback(code: str = Query(...), state: str = Query("")):
    user_id = state.split(":")[0] if ":" in state else state
    if not user_id:
        raise HTTPException(400, "Missing state (user_id)")

    async with httpx.AsyncClient() as client:
        # Exchange code for token
        r = await client.post(
            "https://open.tiktokapis.com/v2/oauth/token/",
            data={
                "client_key":    TIKTOK_CLIENT_KEY,
                "client_secret": TIKTOK_CLIENT_SECRET,
                "code":          code,
                "grant_type":    "authorization_code",
                "redirect_uri":  TIKTOK_REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=20,
        )
        token_data = r.json()

    if "error" in token_data:
        raise HTTPException(400, f"TikTok OAuth error: {token_data.get('error_description', token_data['error'])}")

    access_token  = token_data.get("access_token", "")
    refresh_token = token_data.get("refresh_token", "")
    open_id       = token_data.get("open_id", "")
    expires_in    = token_data.get("expires_in", 86400)

    # Fetch user info
    display_name = ""
    avatar_url   = ""
    followers    = 0
    try:
        async with httpx.AsyncClient() as client:
            ur = await client.get(
                "https://open.tiktokapis.com/v2/user/info/",
                headers={"Authorization": f"Bearer {access_token}"},
                params={"fields": "display_name,avatar_url,follower_count,video_count,like_count"},
                timeout=15,
            )
            ud = ur.json()
            ui = ud.get("data", {}).get("user", {})
            display_name = ui.get("display_name", "")
            avatar_url   = ui.get("avatar_url", "")
            followers    = ui.get("follower_count", 0)
    except Exception as e:
        log.warning("Could not fetch TikTok user info: %s", e)

    _set(user_id, {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "open_id":       open_id,
        "display_name":  display_name,
        "avatar_url":    avatar_url,
        "followers":     followers,
        "connected_at":  datetime.now(timezone.utc).isoformat(),
        "expires_at":    (datetime.now(timezone.utc) + timedelta(seconds=expires_in)).isoformat(),
    })

    return RedirectResponse(url="https://sociomee.in/app?tiktok=connected")


@router.get("/connect-status")
def connect_status(user_id: str = Query(...)):
    acc = _get(user_id)
    if acc:
        return {
            "connected":    True,
            "display_name": acc.get("display_name", ""),
            "avatar_url":   acc.get("avatar_url", ""),
            "followers":    acc.get("followers", 0),
            "connected_at": acc.get("connected_at", ""),
        }
    return {"connected": False}


@router.post("/disconnect")
def disconnect(user_id: str = Query(...)):
    _del(user_id)
    return {"success": True}


# ── Analytics ─────────────────────────────────────────────────────────
@router.get("/analytics")
async def get_analytics(user_id: str = Query(...)):
    acc = _get(user_id)
    if not acc:
        raise HTTPException(404, "TikTok not connected")

    access_token = acc.get("access_token", "")
    followers    = acc.get("followers", 0)

    # Fetch recent videos for analytics
    videos = []
    try:
        async with httpx.AsyncClient() as client:
            vr = await client.post(
                "https://open.tiktokapis.com/v2/video/list/",
                headers={"Authorization": f"Bearer {access_token}"},
                json={
                    "max_count": 20,
                    "fields": ["id","title","create_time","view_count","like_count","comment_count","share_count","play_url","cover_image_url"]
                },
                timeout=20,
            )
            vd = vr.json()
            videos = vd.get("data", {}).get("videos", [])
    except Exception as e:
        log.warning("Could not fetch TikTok videos: %s", e)

    # Calculate aggregate stats
    total_views    = sum(v.get("view_count",    0) for v in videos)
    total_likes    = sum(v.get("like_count",    0) for v in videos)
    total_comments = sum(v.get("comment_count", 0) for v in videos)
    total_shares   = sum(v.get("share_count",   0) for v in videos)
    avg_views      = total_views // len(videos) if videos else 0
    engagement     = round((total_likes + total_comments + total_shares) / max(total_views, 1) * 100, 2)

    # Best posting times for Indian TikTok audience
    best_times = [
        {"day": "Tuesday",   "time": "07:00 PM", "score": 95},
        {"day": "Thursday",  "time": "08:00 PM", "score": 92},
        {"day": "Friday",    "time": "06:30 PM", "score": 90},
        {"day": "Saturday",  "time": "11:00 AM", "score": 88},
        {"day": "Sunday",    "time": "09:00 PM", "score": 85},
    ]

    return {
        "connected":        True,
        "display_name":     acc.get("display_name", ""),
        "avatar_url":       acc.get("avatar_url", ""),
        "followers":        followers,
        "total_videos":     len(videos),
        "total_views":      total_views,
        "total_likes":      total_likes,
        "total_comments":   total_comments,
        "total_shares":     total_shares,
        "avg_views":        avg_views,
        "engagement_rate":  engagement,
        "best_posting_times": best_times,
        "recent_videos":    videos[:10],
        "viral_score":      min(100, int(engagement * 10 + (followers / 10000))),
    }


# ── Content generation ────────────────────────────────────────────────
@router.post("/generate")
def generate_content(payload: GenerateRequest):
    try:
        from tiktok_engine import TikTokEngine
        engine = TikTokEngine()
        pack   = engine.generate(
            topic             = payload.topic,
            niche             = payload.niche,
            tone              = payload.tone,
            objective         = payload.objective,
            duration_seconds  = payload.duration,
        )
        return pack.to_dict()
    except Exception as e:
        raise HTTPException(500, f"TikTok generation failed: {e}")


# ── Schedule / Post ───────────────────────────────────────────────────
@router.post("/schedule")
def schedule_post(payload: ScheduleRequest):
    """Schedule a TikTok post. Stores in local schedule file."""
    acc = _get(payload.user_id)
    if not acc:
        raise HTTPException(404, "TikTok not connected")

    schedule_file = DATA_DIR / "tiktok_schedule.json"
    schedule = []
    if schedule_file.exists():
        try:
            schedule = json.loads(schedule_file.read_text())
        except Exception:
            schedule = []

    entry = {
        "id":           f"tt_{int(datetime.now().timestamp())}",
        "user_id":      payload.user_id,
        "caption":      payload.caption,
        "hashtags":     payload.hashtags,
        "video_url":    payload.video_url,
        "scheduled_at": payload.scheduled_at or datetime.now(timezone.utc).isoformat(),
        "status":       "scheduled",
        "created_at":   datetime.now(timezone.utc).isoformat(),
    }
    schedule.append(entry)
    schedule_file.write_text(json.dumps(schedule, indent=2))

    return {"success": True, "id": entry["id"], "scheduled_at": entry["scheduled_at"]}


@router.get("/schedule")
def get_schedule(user_id: str = Query(...)):
    """Get user's TikTok scheduled posts."""
    schedule_file = DATA_DIR / "tiktok_schedule.json"
    if not schedule_file.exists():
        return {"posts": []}
    try:
        all_posts = json.loads(schedule_file.read_text())
        user_posts = [p for p in all_posts if p.get("user_id") == user_id]
        return {"posts": sorted(user_posts, key=lambda x: x.get("created_at", ""), reverse=True)}
    except Exception:
        return {"posts": []}


@router.delete("/schedule/{post_id}")
def delete_scheduled(post_id: str, user_id: str = Query(...)):
    schedule_file = DATA_DIR / "tiktok_schedule.json"
    if not schedule_file.exists():
        return {"success": True}
    try:
        all_posts = json.loads(schedule_file.read_text())
        all_posts = [p for p in all_posts if not (p.get("id") == post_id and p.get("user_id") == user_id)]
        schedule_file.write_text(json.dumps(all_posts, indent=2))
    except Exception:
        pass
    return {"success": True}


# ── SEO / Hashtags ────────────────────────────────────────────────────
@router.get("/seo-tips")
def seo_tips(topic: str = Query(...), niche: str = Query("lifestyle")):
    """Get TikTok SEO tips for a topic."""
    try:
        from tiktok_engine import TikTokEngine
        engine = TikTokEngine()
        pack   = engine.generate(topic=topic, niche=niche, tone="default", objective="watch_time", duration_seconds=30)
        return {
            "hashtags":          pack.hashtags,
            "caption":           pack.caption,
            "hook":              pack.hook,
            "cover_text":        pack.cover_text,
            "best_posting_time": pack.posting_window,
            "engagement_score":  pack.engagement_prediction.get("viral_score", 0),
            "editing_notes":     pack.editing_notes,
        }
    except Exception as e:
        raise HTTPException(500, f"SEO generation failed: {e}")
