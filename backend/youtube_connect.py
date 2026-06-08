"""
youtube_connect.py — SocioMee YouTube Account Connection
=========================================================
Uses YOUTUBE_CLIENT_ID / YOUTUBE_CLIENT_SECRET / YOUTUBE_REDIRECT_URI
from .env EXCLUSIVELY.

The main Google login flow (auth_routes.py) continues to use
GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET — completely separate.

Required .env additions (do NOT reuse GOOGLE_ vars):
    YOUTUBE_CLIENT_ID     = 
    YOUTUBE_CLIENT_SECRET = 
    YOUTUBE_REDIRECT_URI  = http://localhost:3000/youtube/callback
"""

from __future__ import annotations

import json
import re
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


# ── OAuth scopes — includes upload scope ─────────────────────────────
YT_SCOPES = [
    "https://www.googleapis.com/auth/youtube.readonly",
    "https://www.googleapis.com/auth/youtube.upload",      # ← NEW: for auto-upload
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
    raw = data.get(user_id)
    if not raw:
        raise ValueError("YouTube account not connected. Please connect first.")
    # Support multi-channel structure
    if "channels" in raw:
        active_id = raw.get("active_channel_id", "")
        channels = raw.get("channels", [])
        record = next((c for c in channels if c.get("channel_id") == active_id), channels[0] if channels else None)
        if not record:
            raise ValueError("No active YouTube channel found.")
    else:
        record = raw  # legacy flat record

    creds = Credentials(
        token         = record.get("access_token"),
        refresh_token = record.get("refresh_token"),
        token_uri     = "https://oauth2.googleapis.com/token",
        client_id     = _yt_client_id(),
        client_secret = _yt_client_secret(),
        scopes        = record.get("scopes", YT_SCOPES),
    )

    # Auto-refresh if expired - with timeout
    if (creds.expired or not creds.valid) and creds.refresh_token:
        try:
            import threading, requests
            result = [None]
            def _refresh():
                try:
                    creds.refresh(Request())
                    result[0] = "ok"
                except Exception as e:
                    result[0] = str(e)
            t = threading.Thread(target=_refresh, daemon=True)
            t.start()
            t.join(timeout=20)
            if result[0] == "ok":
                record["access_token"] = creds.token
                record["token_expiry"] = creds.expiry.isoformat() if creds.expiry else ""
                # Save back into multi-channel structure
                raw2 = data.get(user_id, {})
                if "channels" in raw2:
                    raw2["channels"] = [record if c.get("channel_id") == record.get("channel_id") else c for c in raw2["channels"]]
                    data[user_id] = raw2
                else:
                    data[user_id] = record
                _save(data)
                log.info("YouTube token refreshed for user=%s", user_id)
            else:
                log.warning("YouTube token refresh failed or timed out: %s", result[0])
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

    creds = Credentials(
        token         = access_token,
        refresh_token = refresh_token,
        token_uri     = "https://oauth2.googleapis.com/token",
        client_id     = _yt_client_id(),
        client_secret = _yt_client_secret(),
        scopes        = YT_SCOPES,
    )

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


def _plan_channel_limit(plan: str) -> int:
    """Return max YouTube channels allowed per plan."""
    return {"free": 1, "pro_monthly": 2, "pro_annual": 2, "premium_monthly": 5, "premium_annual": 5}.get(plan, 1)


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
    plan:          str = "free",
) -> dict:
    """Add or update a channel for a user. Returns {ok, error, count}."""
    data = _load()
    user_data = data.get(user_id)

    new_channel = {
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
        "yt_client_id":  _yt_client_id()[:12] + "…",
    }

    # Migrate legacy flat record → multi-channel structure
    if user_data and "channels" not in user_data:
        user_data = {
            "active_channel_id": user_data.get("channel_id", ""),
            "channels": [user_data]
        }

    if not user_data:
        user_data = {"active_channel_id": channel_id, "channels": []}

    channels = user_data.get("channels", [])
    limit = _plan_channel_limit(plan)

    # Check if channel already connected — update it
    existing_ids = [c.get("channel_id") for c in channels]
    if channel_id in existing_ids:
        channels = [new_channel if c.get("channel_id") == channel_id else c for c in channels]
        user_data["channels"] = channels
        user_data["active_channel_id"] = channel_id
        data[user_id] = user_data
        _save(data)
        log.info("YouTube tokens updated for user=%s channel=%s", user_id, channel_id)
        return {"ok": True, "count": len(channels)}

    # Check limit
    if len(channels) >= limit:
        return {"ok": False, "error": f"Plan limit reached ({limit} channels). Upgrade to add more.", "limit": limit}

    # Add new channel
    channels.append(new_channel)
    user_data["channels"] = channels
    user_data["active_channel_id"] = channel_id
    data[user_id] = user_data
    _save(data)
    log.info("YouTube tokens stored for user=%s channel=%s (%d total)", user_id, channel_id, len(channels))
    return {"ok": True, "count": len(channels)}


def is_connected(user_id: str) -> bool:
    data = _load()
    raw = data.get(user_id)
    if not raw:
        return False
    if "channels" in raw:
        return len(raw.get("channels", [])) > 0
    return True


def get_connected_channels(user_id: str) -> list:
    """Return list of all connected channels for a user."""
    data = _load()
    raw = data.get(user_id)
    if not raw:
        return []
    if "channels" in raw:
        return raw.get("channels", [])
    return [raw]  # legacy


def get_active_channel_id(user_id: str) -> str:
    data = _load()
    raw = data.get(user_id, {})
    if "channels" in raw:
        return raw.get("active_channel_id", "")
    return raw.get("channel_id", "")


def set_active_channel(user_id: str, channel_id: str) -> bool:
    data = _load()
    raw = data.get(user_id)
    if not raw or "channels" not in raw:
        return False
    ids = [c.get("channel_id") for c in raw.get("channels", [])]
    if channel_id not in ids:
        return False
    raw["active_channel_id"] = channel_id
    data[user_id] = raw
    _save(data)
    return True


def disconnect(user_id: str, channel_id: str = None) -> None:
    data = _load()
    raw = data.get(user_id)
    if not raw:
        return
    if channel_id and "channels" in raw:
        raw["channels"] = [c for c in raw["channels"] if c.get("channel_id") != channel_id]
        if raw["channels"]:
            if raw.get("active_channel_id") == channel_id:
                raw["active_channel_id"] = raw["channels"][0]["channel_id"]
            data[user_id] = raw
        else:
            data.pop(user_id, None)
    else:
        data.pop(user_id, None)
    _save(data)
    log.info("YouTube disconnected for user=%s channel=%s", user_id, channel_id)


def get_channel_info(user_id: str) -> Dict[str, Any]:
    data   = _load()
    raw = data.get(user_id, {})
    if not raw:
        raise ValueError("YouTube account not connected.")
    # Multi-channel: get active channel record
    if "channels" in raw:
        active_id = raw.get("active_channel_id", "")
        channels = raw.get("channels", [])
        record = next((ch for ch in channels if ch.get("channel_id") == active_id), channels[0] if channels else None)
        if not record:
            raise ValueError("No active channel found.")
    else:
        record = raw  # legacy flat

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
    data   = _load()
    raw = data.get(user_id, {})
    if not raw:
        raise ValueError("YouTube account not connected.")
    # Multi-channel: get active channel record
    if "channels" in raw:
        active_id = raw.get("active_channel_id", "")
        channels = raw.get("channels", [])
        record = next((ch for ch in channels if ch.get("channel_id") == active_id), channels[0] if channels else None)
        if not record:
            raise ValueError("No active channel found.")
    else:
        record = raw

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
    try:
        creds   = _get_credentials(user_id)
        youtube = _build_youtube_client(creds)
        data    = _load()
        raw = _load().get(user_id, {})
        active_id = raw.get("active_channel_id", "")
        _chs = raw.get("channels", [])
        _rec = next((c for c in _chs if c.get("channel_id")==active_id), _chs[0] if _chs else {})
        channel_id = _rec.get("channel_id", "")

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



def _parse_duration_secs(dur):
    """Parse ISO 8601 duration PT#H#M#S to seconds."""
    if not dur or dur == "P0D":
        return 0
    h = int(re.search(r'(\d+)H', dur).group(1)) if 'H' in dur else 0
    m = int(re.search(r'(\d+)M', dur).group(1)) if 'M' in dur else 0
    s = int(re.search(r'(\d+)S', dur).group(1)) if 'S' in dur else 0
    return h*3600 + m*60 + s

def _vtype(item):
    """Detect video type: short, live, or video."""
    snip = item.get("snippet", {})
    live = snip.get("liveBroadcastContent", "none")
    if live in ("live", "completed"):
        return "live"
    dur = item.get("contentDetails", {}).get("duration", "")
    secs = _parse_duration_secs(dur)
    # Check title for live keywords regardless of duration
    title = snip.get("title", "").lower()
    live_keywords = ["is live", "live stream", "livestream", "live!", "live -", "- live"]
    if any(kw in title for kw in live_keywords):
        return "live"
    # Duration-based detection
    if 0 < secs <= 60:
        return "short"
    # Very long or zero duration with stream in title
    if (secs == 0 or secs > 7200) and "stream" in title:
        return "live"
    return "video"


def get_all_videos(user_id: str, max_results: int = 50) -> List[Dict]:
    """Fetch all uploaded videos via uploads playlist."""
    try:
        creds   = _get_credentials(user_id)
        youtube = _build_youtube_client(creds)
        raw = _load().get(user_id, {})
        active_id = raw.get("active_channel_id", "")
        _chs = raw.get("channels", [])
        _rec = next((c for c in _chs if c.get("channel_id")==active_id), _chs[0] if _chs else {})
        channel_id = _rec.get("channel_id", "") if _rec else ""
        ch_resp = youtube.channels().list(
            part="contentDetails",
            id=channel_id,
        ).execute()
        items = ch_resp.get("items", [])
        if not items:
            return []
        uploads_playlist = items[0]["contentDetails"]["relatedPlaylists"]["uploads"]

        # Fetch playlist items
        video_ids = []
        next_page = None
        while len(video_ids) < max_results:
            pl_resp = youtube.playlistItems().list(
                part="contentDetails",
                playlistId=uploads_playlist,
                maxResults=min(50, max_results - len(video_ids)),
                pageToken=next_page,
            ).execute()
            for item in pl_resp.get("items", []):
                vid = item["contentDetails"].get("videoId")
                if vid:
                    video_ids.append(vid)
            next_page = pl_resp.get("nextPageToken")
            if not next_page:
                break

        if not video_ids:
            return []

        # Fetch stats in batches of 50
        videos = []
        for i in range(0, len(video_ids), 50):
            batch = video_ids[i:i+50]
            stats_resp = youtube.videos().list(
                part="snippet,statistics,contentDetails",
                id=",".join(batch),
            ).execute()
            for item in stats_resp.get("items", []):
                stats = item.get("statistics", {})
                snip  = item.get("snippet", {})
                views   = int(stats.get("viewCount",    0))
                likes   = int(stats.get("likeCount",    0))
                comments= int(stats.get("commentCount", 0))
                eng     = round((likes + comments) / max(views, 1) * 100, 2)
                videos.append({
                    "video_id":    item["id"],
                    "title":       snip.get("title", ""),
                    "thumbnail":   snip.get("thumbnails", {}).get("medium", {}).get("url", ""),
                    "published_at":snip.get("publishedAt", "")[:10],
                    "views":       views,
                    "likes":       likes,
                    "comments":    comments,
                    "engagement":  eng,
                    "url":         f"https://youtube.com/watch?v={item['id']}",
                    "description": snip.get("description", "")[:200],
                    "tags":        snip.get("tags", [])[:10],
                    "video_type":  _vtype(item),











                })
        videos.sort(key=lambda x: x["views"], reverse=True)
        return videos
    except Exception as e:
        log.warning("get_all_videos error: %s", e)
        return []

def get_growth_prediction(
    user_id:      str,
    topic:        str,
    channel_info: Optional[Dict] = None,
) -> Dict[str, Any]:
    if channel_info is None:
        try:
            channel_info = get_channel_info(user_id)
        except Exception:
            channel_info = {"subscribers": 1000, "total_views": 50000, "video_count": 10}

    subs        = channel_info.get("subscribers",  0)
    total_views = channel_info.get("total_views",  0)
    video_count = max(1, channel_info.get("video_count", 1))
    avg_views   = max(100, total_views // video_count)

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