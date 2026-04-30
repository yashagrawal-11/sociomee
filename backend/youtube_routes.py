"""
youtube_routes.py — SocioMee YouTube Connect API Routes
=========================================================
All OAuth in this file uses YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET.
The existing Google login (auth_routes.py / GOOGLE_CLIENT_ID) is untouched.

Add to app.py:
    from youtube_routes import router as yt_router
    app.include_router(yt_router)

Required .env vars (separate from login):
    YOUTUBE_CLIENT_ID     = <youtube oauth client id>
    YOUTUBE_CLIENT_SECRET = <youtube oauth client secret>
    YOUTUBE_REDIRECT_URI  = http://localhost:3000/youtube/callback
"""

from __future__ import annotations
from youtube_upload import router as upload_router

import logging
import os

from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

log = logging.getLogger("youtube_routes")

router = APIRouter(prefix="/youtube", tags=["youtube"])



# ── Lazy import guard ─────────────────────────────────────────────────
def _ytc():
    try:
        import youtube_connect
        return youtube_connect
    except ImportError as e:
        raise HTTPException(503, f"youtube_connect module not found: {e}")


def _check_yt_env() -> None:
    """Raise 503 with a clear message if YouTube-specific env vars are missing."""
    missing = []
    if not os.getenv("YOUTUBE_CLIENT_ID"):     missing.append("YOUTUBE_CLIENT_ID")
    if not os.getenv("YOUTUBE_CLIENT_SECRET"): missing.append("YOUTUBE_CLIENT_SECRET")
    if missing:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Missing YouTube OAuth env vars: {', '.join(missing)}. "
                "Add them to your .env file. "
                "Do NOT reuse GOOGLE_CLIENT_ID — YouTube needs its own OAuth client."
            ),
        )


# ── Request models ────────────────────────────────────────────────────

class YouTubeConnectPayload(BaseModel):
    user_id:      str
    code:         str           # Authorization code from Google callback
    redirect_uri: str = ""      # Optional override; falls back to YOUTUBE_REDIRECT_URI


# ══════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════

@router.get("/auth-url")
def get_youtube_auth_url(redirect_uri: str = Query(default="")):
    """
    Return the Google OAuth consent URL scoped for YouTube.
    Uses YOUTUBE_CLIENT_ID and YOUTUBE_REDIRECT_URI.
    Does NOT touch GOOGLE_CLIENT_ID.
    """
    _check_yt_env()
    try:
        ytc = _ytc()
        url = ytc.get_auth_url(redirect_uri=redirect_uri)
        return {"url": url}
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/connect")
async def youtube_connect_route(payload: YouTubeConnectPayload):
    """
    Exchange OAuth authorization code for YouTube tokens.
    Stores channel info and tokens tied to user_id.

    Uses YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET for the token exchange.
    The existing Google login flow is completely unaffected.
    """
    _check_yt_env()
    ytc = _ytc()

    try:
        result = ytc.exchange_code(
            code         = payload.code,
            redirect_uri = payload.redirect_uri or os.getenv("YOUTUBE_REDIRECT_URI", ""),
        )
    except ValueError as e:
        raise HTTPException(400, str(e))
    except RuntimeError as e:
        raise HTTPException(503, str(e))
    except Exception as e:
        log.error("YouTube connect failed: %s", e)
        raise HTTPException(400, f"YouTube connect failed: {e}")

    # Persist tokens
    ytc.store_youtube_tokens(
        user_id       = payload.user_id,
        access_token  = result["access_token"],
        refresh_token = result["refresh_token"],
        channel_id    = result["channel_id"],
        channel_title = result["channel_title"],
        thumbnail_url = result.get("thumbnail_url", ""),
        subscribers   = result.get("subscribers",   0),
        total_views   = result.get("total_views",   0),
        video_count   = result.get("video_count",   0),
    )

    log.info(
        "YouTube connected — user=%s channel=%s subs=%s",
        payload.user_id, result["channel_id"], result.get("subscribers", 0),
    )

    return {
        "success":       True,
        "channel_id":    result["channel_id"],
        "channel_title": result["channel_title"],
        "thumbnail":     result.get("thumbnail_url", ""),
        "subscribers":   result.get("subscribers",   0),
        "total_views":   result.get("total_views",   0),
        "video_count":   result.get("video_count",   0),
    }


@router.get("/status/{user_id}")
def youtube_status(user_id: str):
    """
    Check whether a user has connected their YouTube channel.
    Returns basic channel info if connected.
    """
    ytc = _ytc()
    if not ytc.is_connected(user_id):
        return {"connected": False}
    try:
        info = ytc.get_channel_info(user_id)
        return {"connected": True, **info}
    except Exception as e:
        return {"connected": True, "error": str(e)}


@router.get("/channel/{user_id}")
def youtube_channel(user_id: str):
    """Live channel statistics: subscribers, views, video count."""
    ytc = _ytc()
    try:
        return ytc.get_channel_info(user_id)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/analytics/{user_id}")
def youtube_analytics(
    user_id: str,
    days:    int = Query(default=30, ge=7, le=90),
):
    """
    Daily views + subscribers for the last N days.
    Returns chart_data array ready for recharts LineChart.
    Falls back to mock data if YouTube Analytics API is unavailable.
    """
    ytc = _ytc()
    try:
        return ytc.get_analytics(user_id, days=days)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/videos/{user_id}")
def youtube_videos(
    user_id:     str,
    max_results: int = Query(default=10, ge=1, le=25),
):
    """Top videos by view count with title, thumbnail, likes, and comments."""
    ytc = _ytc()
    try:
        videos = ytc.get_top_videos(user_id, max_results=max_results)
        return {"videos": videos}
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/predict/{user_id}")
def youtube_predict(
    user_id: str,
    topic:   str = Query(..., min_length=1),
):
    """
    AI growth prediction: estimated views, subscribers, and milestone timeline
    if the user uploads a video on the given topic.
    """
    ytc = _ytc()
    try:
        channel = ytc.get_channel_info(user_id)
        return ytc.get_growth_prediction(user_id, topic=topic, channel_info=channel)
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/disconnect/{user_id}")
def youtube_disconnect(user_id: str):
    """Remove stored YouTube tokens for a user."""
    ytc = _ytc()
    ytc.disconnect(user_id)
    return {"success": True, "message": "YouTube account disconnected."}