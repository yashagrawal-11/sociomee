"""
youtube_connect.py — SocioMee YouTube Account Connection
=========================================================
Uses YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REDIRECT_URI
from .env EXCLUSIVELY.

The main Google login flow (auth_routes.py) continues to use
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — completely separate.

Required .env additions (do NOT reuse GOOGLE_ vars):
    YOUTUBE_CLIENT_ID     = <your youtube oauth client id>
    YOUTUBE_CLIENT_SECRET = <your youtube oauth client secret>
    YOUTUBE_REDIRECT_URI  = http://localhost:3000/youtube/callback
"""

from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional

log = logging.getLogger("youtube_connect")

# ── YouTube-specific env vars (NEVER touch GOOGLE_CLIENT_*) ──────────
def _yt_client_id()     -> str: return os.getenv("YOUTUBE_CLIENT_ID",     "")
def _yt_client_secret() -> str: return os.getenv("YOUTUBE_CLIENT_SECRET", "")
def _yt_redirect_uri()  -> str:
    return os.getenv("YOUTUBE_REDIRECT_URI", "http://localhost:3000/youtube/callback")

def _assert_yt_env() -> None:
    """Raise a clear error if YouTube OAuth vars are missing."""
    missing = []
    if not _yt_client_id():     missing.append("YOUTUBE_CLIENT_ID")
    if not _yt_client_secret(): missing.append("YOUTUBE_CLIENT_SECRET")
    if missing:
        raise RuntimeError(
            f"Missing YouTube OAuth env vars: {', '.join(missing)}. "
            "Add them to .env — do NOT reuse GOOGLE_CLIENT_ID/SECRET."
        )

# ── Storage ───────────────────────────────────────────────────────────
DATA_FILE = Path(__file__).resolve().parent / "youtube_accounts.json"


def _load() -> Dict:
    if not DATA_FILE.exists():
        return {}
    try:
        raw = DATA_FILE.read_text(encoding="utf-8").strip()
        return json.loads(raw) if raw else {}
    except Exception:
        return {}


def _save(data: Dict) -> None:
    try:
        DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        pass


# ── YouTube OAuth client config dict ─────────────────────────────────
def _yt_client_config(redirect_uri: str = "") -> Dict:
    """
    Build the client_config dict for google_auth_oauthlib.flow.Flow.
    Always uses YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET.
    """
    _assert_yt_env()
    redir = redirect_uri or _yt_redirect_uri()
    return {
        "web": {
            "client_id":     _yt_client_id(),
            "client_secret": _yt_client_secret(),
            "redirect_uris": [redir],
            "auth_uri":      "https://accounts.google.com/o/oauth2/auth",
            "token_uri":     "https://oauth2.googleapis.com/token",
        }
    }


# ── OAuth scopes ──────────────────────────────────────────────────────
YT_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/yt-analytics.readonly",
    "openid",
    "email",
    "profile",
]


# ── Google API client helpers ─────────────────────────────────────────
def _build_youtube_client(credentials):
    try:
        from googleapiclient.discovery import build
        return build("youtube", "v3", credentials=credentials, cache_discovery=False)
    except Exception as e:
        raise RuntimeError(f"Failed to build YouTube client: {e}")


def _build_analytics_client(credentials):
    try:
        from googleapiclient.discovery import build
        return build("youtubeAnalytics", "v2", credentials=credentials, cache_discovery=False)
    except Exception as e:
        raise RuntimeError(f"Failed to build Analytics client: {e}")


def _get_credentials(user_id: str):
    """
    Load stored OAuth tokens for a user and return a Credentials object.
    Uses YOUTUBE_CLIENT_ID/SECRET for token refresh — never GOOGLE_ vars.
    """
    try:
        from google.oauth2.credentials import Credentials
        from google.auth.transport.requests import Request
    except ImportError:
        raise RuntimeError(
            "Run: pip install google-auth google-auth-oauthlib google-api-python-client"
        )

    _assert_yt_env()

    data   = _load()
    record = data.get(user_id)
    if not record:
        raise ValueError("YouTube account not connected. Please connect first.")

    creds = Credentials(
        token         = record.get("access_token"),
        refresh_token = record.get("refresh_token"),
        token_uri     = "https://oauth2.googleapis.com/token",
        client_id     = _yt_client_id(),       # ← YOUTUBE_CLIENT_ID
        client_secret = _yt_client_secret(),   # ← YOUTUBE_CLIENT_SECRET
        scopes        = record.get("scopes", YT_SCOPES),
    )

    # Auto-refresh if expired
    if creds.expired and creds.refresh_token:
        try:
            creds.refresh(Request())
            record["access_token"] = creds.token
            record["token_expiry"] = creds.expiry.isoformat() if creds.expiry else ""
            data[user_id] = record
            _save(data)
            log.info("YouTube token refreshed for user=%s", user_id)
        except Exception as e:
            log.warning("YouTube token refresh failed for user=%s: %s", user_id, e)

    return creds


# ── Public API ────────────────────────────────────────────────────────

def get_auth_url(redirect_uri: str = "") -> str:
    """
    Build the Google OAuth consent URL for YouTube scopes.
    Constructed manually to guarantee NO code_challenge/PKCE is included.
    Uses YOUTUBE_CLIENT_ID and YOUTUBE_REDIRECT_URI.
    """
    import urllib.parse
    _assert_yt_env()
    redir = redirect_uri or _yt_redirect_uri()

    params = {
        "client_id":     _yt_client_id(),
        "redirect_uri":  redir,
        "response_type": "code",
        "scope":         " ".join(YT_SCOPES),
        "access_type":   "offline",
        "prompt":        "consent",
        "include_granted_scopes": "true",
    }
    return "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)


def exchange_code(code: str, redirect_uri: str = "") -> Dict[str, str]:
    """
    Exchange OAuth authorization code for tokens using raw HTTP request.
    Bypasses google-auth-oauthlib's PKCE code_verifier injection entirely.
    """
    try:
        import requests as _requests
        from googleapiclient.discovery import build
        from google.oauth2.credentials import Credentials
    except ImportError:
        raise RuntimeError(
            "Run: pip install google-auth google-auth-oauthlib google-api-python-client requests"
        )

    _assert_yt_env()
    redir = redirect_uri or _yt_redirect_uri()

    # Raw token exchange — no Flow, no PKCE, no code_verifier
    token_resp = _requests.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code":          code,
            "client_id":     _yt_client_id(),
            "client_secret": _yt_client_secret(),
            "redirect_uri":  redir,
            "grant_type":    "authorization_code",
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        timeout=15,
    )

    if not token_resp.ok:
        raise ValueError(f"Token exchange failed: {token_resp.text}")

    tokens = token_resp.json()
    if "error" in tokens:
        raise ValueError(f"Token error: {tokens['error']} — {tokens.get('error_description','')}")

    access_token  = tokens["access_token"]
    refresh_token = tokens.get("refresh_token", "")

    # Build credentials from raw tokens
    creds = Credentials(
        token         = access_token,
        refresh_token = refresh_token,
        token_uri     = "https://oauth2.googleapis.com/token",
        client_id     = _yt_client_id(),
        client_secret = _yt_client_secret(),
        scopes        = YT_SCOPES,
    )

    # Fetch channel info
    youtube = build("youtube", "v3", credentials=creds, cache_discovery=False)
    resp    = youtube.channels().list(part="snippet,statistics", mine=True).execute()
    items   = resp.get("items", [])

    if not items:
        raise ValueError("No YouTube channel found on this Google account.")

    ch    = items[0]
    stats = ch.get("statistics", {})
    snip  = ch.get("snippet", {})

    return {
        "access_token":  creds.token,
        "refresh_token": creds.refresh_token or "",
        "channel_id":    ch["id"],
        "channel_title": snip.get("title", ""),
        "thumbnail_url": snip.get("thumbnails", {}).get("medium", {}).get("url", ""),
        "subscribers":   int(stats.get("subscriberCount", 0)),
        "total_views":   int(stats.get("viewCount", 0)),
        "video_count":   int(stats.get("videoCount", 0)),
    }


def store_youtube_tokens(
    user_id:       str,
    access_token:  str,
    refresh_token: str,
    channel_id:    str,
    channel_title: str,
    thumbnail_url: str = "",
    subscribers:   int = 0,
    total_views:   int = 0,
    video_count:   int = 0,
) -> None:
    """Persist YouTube tokens + channel metadata for a user."""
    data = _load()
    data[user_id] = {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "channel_id":    channel_id,
        "channel_title": channel_title,
        "thumbnail_url": thumbnail_url,
        "subscribers":   subscribers,
        "total_views":   total_views,
        "video_count":   video_count,
        "scopes":        YT_SCOPES,
        "connected_at":  datetime.now(timezone.utc).isoformat(),
        # Record which client was used — for auditability
        "yt_client_id":  _yt_client_id()[:12] + "…",
    }
    _save(data)
    log.info("YouTube tokens stored for user=%s channel=%s", user_id, channel_id)


def is_connected(user_id: str) -> bool:
    return user_id in _load()


def disconnect(user_id: str) -> None:
    data = _load()
    data.pop(user_id, None)
    _save(data)
    log.info("YouTube disconnected for user=%s", user_id)


def get_channel_info(user_id: str) -> Dict[str, Any]:
    """
    Fetch live channel stats from YouTube Data API v3.
    Falls back to stored values on error.
    """
    data   = _load()
    record = data.get(user_id, {})
    if not record:
        raise ValueError("YouTube account not connected.")

    try:
        creds   = _get_credentials(user_id)
        youtube = _build_youtube_client(creds)
        resp    = youtube.channels().list(
            part="snippet,statistics,brandingSettings",
            id=record.get("channel_id", ""),
        ).execute()

        items = resp.get("items", [])
        if not items:
            raise ValueError("Channel not found.")

        ch    = items[0]
        stats = ch.get("statistics", {})
        snip  = ch.get("snippet", {})

        return {
            "channel_id":    ch["id"],
            "channel_title": snip.get("title", record.get("channel_title", "")),
            "description":   snip.get("description", "")[:200],
            "thumbnail":     snip.get("thumbnails", {}).get("medium", {}).get("url", record.get("thumbnail_url", "")),
            "subscribers":   int(stats.get("subscriberCount", 0)),
            "total_views":   int(stats.get("viewCount", 0)),
            "video_count":   int(stats.get("videoCount", 0)),
            "country":       snip.get("country", "IN"),
            "created_at":    snip.get("publishedAt", "")[:10],
            "connected":     True,
        }
    except Exception as e:
        log.warning("get_channel_info live fetch failed, using stored: %s", e)
        return {
            "channel_id":    record.get("channel_id",    ""),
            "channel_title": record.get("channel_title", "Your Channel"),
            "thumbnail":     record.get("thumbnail_url", ""),
            "subscribers":   record.get("subscribers",   0),
            "total_views":   record.get("total_views",   0),
            "video_count":   record.get("video_count",   0),
            "connected":     True,
            "error":         str(e),
        }


def get_analytics(user_id: str, days: int = 30) -> Dict[str, Any]:
    """
    Fetch last N days of daily views + subscribers from YouTube Analytics API.
    Falls back to mock data if API unavailable.
    """
    data   = _load()
    record = data.get(user_id, {})
    if not record:
        raise ValueError("YouTube account not connected.")

    channel_id = record.get("channel_id", "")
    end_date   = datetime.now(timezone.utc).date()
    start_date = end_date - timedelta(days=days)

    try:
        creds     = _get_credentials(user_id)
        analytics = _build_analytics_client(creds)
        resp      = analytics.reports().query(
            ids        = f"channel=={channel_id}",
            startDate  = start_date.isoformat(),
            endDate    = end_date.isoformat(),
            metrics    = "views,subscribersGained,estimatedMinutesWatched",
            dimensions = "day",
            sort       = "day",
        ).execute()

        rows       = resp.get("rows", [])
        chart_data = []
        for row in rows:
            chart_data.append({
                "date":    row[0],
                "views":   int(row[1]),
                "subs":    int(row[2]),
                "minutes": int(row[3]),
            })

        return {
            "chart_data":  chart_data,
            "total_views": sum(r["views"] for r in chart_data),
            "total_subs":  sum(r["subs"]  for r in chart_data),
            "period_days": days,
            "start_date":  start_date.isoformat(),
            "end_date":    end_date.isoformat(),
            "is_mock":     False,
        }

    except Exception as e:
        log.warning("Analytics API failed, returning mock: %s", e)
        return _mock_analytics(days)


def _mock_analytics(days: int) -> Dict:
    import random
    chart_data  = []
    base_views  = random.randint(80, 600)
    base_subs   = random.randint(0,  12)
    for i in range(days):
        date = (datetime.now(timezone.utc).date() - timedelta(days=days - i)).isoformat()
        chart_data.append({
            "date":    date,
            "views":   max(0, base_views  + random.randint(-30, 100)),
            "subs":    max(0, base_subs   + random.randint(-1,  6)),
            "minutes": max(0, base_views  * 3 + random.randint(-50, 150)),
        })
    return {
        "chart_data":  chart_data,
        "total_views": sum(r["views"] for r in chart_data),
        "total_subs":  sum(r["subs"]  for r in chart_data),
        "period_days": days,
        "is_mock":     True,
    }


def get_top_videos(user_id: str, max_results: int = 10) -> List[Dict]:
    """Top videos by view count."""
    try:
        creds   = _get_credentials(user_id)
        youtube = _build_youtube_client(creds)
        data    = _load()
        channel_id = data.get(user_id, {}).get("channel_id", "")

        search_resp = youtube.search().list(
            part="id,snippet",
            channelId  = channel_id,
            order      = "viewCount",
            type       = "video",
            maxResults = max_results,
        ).execute()

        video_ids = [
            item["id"]["videoId"]
            for item in search_resp.get("items", [])
            if item.get("id", {}).get("videoId")
        ]
        if not video_ids:
            return []

        stats_resp = youtube.videos().list(
            part="snippet,statistics",
            id=",".join(video_ids),
        ).execute()

        videos = []
        for item in stats_resp.get("items", []):
            stats = item.get("statistics", {})
            snip  = item.get("snippet", {})
            videos.append({
                "video_id":    item["id"],
                "title":       snip.get("title", ""),
                "thumbnail":   snip.get("thumbnails", {}).get("medium", {}).get("url", ""),
                "published_at":snip.get("publishedAt", "")[:10],
                "views":       int(stats.get("viewCount",    0)),
                "likes":       int(stats.get("likeCount",    0)),
                "comments":    int(stats.get("commentCount", 0)),
                "url":         f"https://youtube.com/watch?v={item['id']}",
            })

        videos.sort(key=lambda x: x["views"], reverse=True)
        return videos

    except Exception as e:
        log.warning("get_top_videos error: %s", e)
        return []


def get_growth_prediction(
    user_id:      str,
    topic:        str,
    channel_info: Optional[Dict] = None,
) -> Dict[str, Any]:
    """AI growth prediction for a given topic based on channel baseline."""
    if channel_info is None:
        try:
            channel_info = get_channel_info(user_id)
        except Exception:
            channel_info = {"subscribers": 1000, "total_views": 50000, "video_count": 10}

    subs        = channel_info.get("subscribers",  0)
    total_views = channel_info.get("total_views",  0)
    video_count = max(1, channel_info.get("video_count", 1))

    avg_views = max(100, total_views // video_count)

    # Virality score from topic keywords
    import re as _re
    virality = 50
    for kw in ["exposed","truth","shocking","scam","leaked","viral","trending",
               "secret","never","real story","sach","asli","kyun","kaise","pura"]:
        if kw in topic.lower():
            virality += 10
            break
    virality = min(95, virality)

    view_mult  = 0.5 + (virality / 100) * 3.0
    est_views  = int(avg_views * view_mult)
    sub_rate   = 0.015 + (virality / 100) * 0.02
    est_subs   = int(est_views * sub_rate)
    growth_pct = round((est_subs / max(subs, 1)) * 100, 2)

    # Next subscriber milestone
    milestone = None
    for m in [1_000, 5_000, 10_000, 50_000, 100_000, 500_000, 1_000_000]:
        if m > subs:
            monthly = est_subs * 3
            months  = max(1, (m - subs) // monthly) if monthly > 0 else 999
            milestone = {"target": m, "months": min(months, 120)}
            break

    return {
        "topic":              topic,
        "virality_score":     virality,
        "estimated_views":    est_views,
        "estimated_subs":     est_subs,
        "estimated_minutes":  est_views * 4,
        "growth_pct":         growth_pct,
        "avg_views_baseline": avg_views,
        "next_milestone":     milestone,
        "recommendation": (
            "🔥 High viral potential! Upload within 24-48 hours of trend peak."
            if virality >= 70 else
            "👍 Good topic. Nail the thumbnail and title for best CTR."
            if virality >= 50 else
            "📌 Steady topic. Add a trending angle to boost reach."
        ),
        "best_upload_time":   "Saturday or Sunday, 6–8 PM IST",
        "best_thumbnail_tip": "Face with strong emotion + bold text + contrasting background.",
    }