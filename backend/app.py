"""
app.py — SocioMee FastAPI Backend v3
Clean, no duplicate routes. Monthly credit system. Full Razorpay.
YouTube connect via separate YOUTUBE_CLIENT_ID (not GOOGLE_CLIENT_ID).
"""
from __future__ import annotations
import hashlib, hmac, io, logging, os, re, time
from typing import Any, Dict, Optional
import fastapi
from fastapi import Body, Depends, FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field

import json as _json_logging
from datetime import datetime as _dt_logging, timezone as _tz_logging

class _JSONFormatter(logging.Formatter):
    """Structured JSON logging — makes it possible to actually search/filter/alert on
    logs by severity, logger name, or message content, instead of grepping plain text.
    Falls back gracefully if any field is unexpected (never breaks logging itself)."""
    def format(self, record):
        try:
            entry = {
                "timestamp": _dt_logging.fromtimestamp(record.created, tz=_tz_logging.utc).isoformat(),
                "level": record.levelname,
                "logger": record.name,
                "message": record.getMessage(),
            }
            if record.exc_info:
                entry["exception"] = self.formatException(record.exc_info)
            return _json_logging.dumps(entry)
        except Exception:
            return super().format(record)

_log_handler = logging.StreamHandler()
_log_handler.setFormatter(_JSONFormatter())

class _EmailAlertHandler(logging.Handler):
    """Sends a real email alert whenever an ERROR (or worse) is logged anywhere in the
    app. Rate-limited to avoid flooding the inbox if something fails repeatedly in a
    tight loop — at most one alert email per 5 minutes per unique message."""
    def __init__(self):
        super().__init__(level=logging.ERROR)
        self._last_sent = {}
        self._cooldown_seconds = 300

    def emit(self, record):
        try:
            import time as _time_alert
            key = f"{record.name}:{record.getMessage()[:100]}"
            now = _time_alert.time()
            last = self._last_sent.get(key, 0)
            if now - last < self._cooldown_seconds:
                return
            self._last_sent[key] = now
            from email_service import resend, FROM_EMAIL, _base_template
            if not resend.api_key:
                return
            msg = self.format(record) if self.formatter else record.getMessage()
            content = f"""
              <div class="warn-badge">⚠️ Backend Error Alert</div>
              <h1 class="h1">{record.name}</h1>
              <p class="p" style="font-family:monospace;font-size:12px;white-space:pre-wrap">{msg[:2000]}</p>
            """
            resend.Emails.send({
                "from": FROM_EMAIL,
                "to": ["freefirelove88x@gmail.com"],
                "subject": f"⚠️ SocioMee backend error — {record.name}",
                "html": _base_template(content),
            })
        except Exception:
            pass  # alerting must never itself crash the app

_alert_handler = _EmailAlertHandler()
_alert_handler.setFormatter(_JSONFormatter())
logging.basicConfig(level=logging.INFO, handlers=[_log_handler, _alert_handler], force=True)

log = logging.getLogger("app")

try:
    from auth_routes import router as auth_router
    _HAS_AUTH = True
except Exception as e:
    log.warning("auth_routes failed: %s", e); _HAS_AUTH = False; auth_router = None

try:
    from youtube_tools_routes import router as yt_tools_router
    _HAS_YT_TOOLS=True
except Exception as e:
    log.warning('yt_tools_routes failed: %s',e); _HAS_YT_TOOLS=False; yt_tools_router=None

try:
    from push_routes import router as push_router
    _HAS_PUSH = True
except Exception as _pe:
    log.warning('push_routes failed: %s', _pe); _HAS_PUSH = False; push_router = None
try:
    from reminder_routes import router as reminder_router
    _HAS_REMINDERS = True
except Exception as _re:
    log.warning('reminder_routes failed: %s', _re); _HAS_REMINDERS = False; reminder_router = None

# ── YouTube upload router ────────────────────────────────────────────
try:
    from youtube_upload import router as yt_upload_router
    _HAS_YT_UPLOAD = True
except Exception as e:
    log.warning("youtube_upload failed: %s", e); _HAS_YT_UPLOAD = False; yt_upload_router = None
# ── YouTube connect router ─────────────────────────────────────────
try:
    from youtube_routes import router as yt_router
    _HAS_YT_ROUTES = True
except Exception as e:
    log.warning("youtube_routes failed: %s", e); _HAS_YT_ROUTES = False; yt_router = None

# ── Threads router ────────────────────────────────────────────────────
try:
    from threads_routes import router as threads_router
    _HAS_THREADS_ROUTES = True
except Exception as e:
    log.warning("threads_routes failed: %s", e); _HAS_THREADS_ROUTES = False; threads_router = None

try:
    from subscription_routes import router as subscription_router
except Exception as e:
    log.warning("subscription_routes failed: %s", e); subscription_router = None
try:
    from phone_auth_routes import router as phone_auth_router
except Exception as e:
    log.warning("phone_auth_routes failed: %s", e); phone_auth_router = None
try:
    from facebook_auth_routes import router as fb_auth_router
    from facebook_pages_routes import router as fb_pages_router
except Exception as e:
    log.warning("facebook_auth_routes failed: %s", e); fb_auth_router = None
try:
    from linkedin_routes import router as linkedin_router
except Exception as e:
    log.warning("linkedin_routes failed: %s", e); linkedin_router = None
try:
    from bug_routes import router as bug_router
except Exception as e:
    log.warning("bug_routes failed: %s", e); bug_router = None
# ── Instagram router ──────────────────────────────────────────────────
try:
    from instagram_routes import router as instagram_router
    _HAS_INSTAGRAM_ROUTES = True
except Exception as e:
    log.warning("instagram_routes failed: %s", e); _HAS_INSTAGRAM_ROUTES = False; instagram_router = None

# ── Pinterest router ──────────────────────────────────────────────────
try:
    from pinterest_routes import router as pinterest_router
    _HAS_PINTEREST_ROUTES = True
except Exception as e:
    log.warning("pinterest_routes failed: %s", e); _HAS_PINTEREST_ROUTES = False; pinterest_router = None

# ── Festival router ──────────────────────────────────────────────────
try:
    from festival_routes import router as festival_router
    _HAS_FESTIVAL_ROUTES = True
except Exception as e:
    log.warning("festival_routes failed: %s", e); _HAS_FESTIVAL_ROUTES = False; festival_router = None

# ── History router ───────────────────────────────────────────────────
try:
    from history_routes import router as history_router
    _HAS_HISTORY = True
except Exception as e:
    log.warning("history_routes failed: %s", e); _HAS_HISTORY = False; history_router = None

# ── Telegram router ───────────────────────────────────────────────────
try:
    from telegram_routes import router as telegram_router
    _HAS_TG_ROUTES = True
except Exception as e:
    log.warning("telegram_routes failed: %s", e); _HAS_TG_ROUTES = False; telegram_router = None


# ── WhatsApp router ───────────────────────────────────────────────────
try:
    from whatsapp_routes import router as whatsapp_router
    _HAS_WA_ROUTES = True
except Exception as e:
    log.warning("whatsapp_routes failed: %s", e); _HAS_WA_ROUTES = False; whatsapp_router = None

# ── TikTok router ─────────────────────────────────────────────────────
try:
    from tiktok_routes import router as tiktok_router
    _HAS_TT_ROUTES = True
except Exception as e:
    log.warning("tiktok_routes failed: %s", e); _HAS_TT_ROUTES = False; tiktok_router = None
try:
    from telegram_scheduler import router as tg_sched_router
    from discord_routes import router as discord_router
    from streak_routes import router as streak_router
    _HAS_TG_SCHED = True
except Exception as e:
    log.warning("telegram_scheduler failed: %s", e); _HAS_TG_SCHED = False; tg_sched_router = None

# ── Start Telegram polling on startup ─────────────────────────────────
try:
    from telegram_connect import start_polling as _start_tg_polling
    _start_tg_polling()
except Exception as _e:
    log.warning("Telegram polling not started: %s", _e)

try:
    from middleware import get_current_user
except Exception:
    def get_current_user(): return {"user_id": "default_user", "email": "", "plan": "free"}

try:
    from PIL import Image as PILImage
except ImportError:
    PILImage = None

try:
    from ai_router import generate_full_content as _generate_full_content, generate_content as _ai_generate, _check_topic_safety
    _HAS_AI_ROUTER = True
except Exception as e:
    log.warning("ai_router: %s", e); _HAS_AI_ROUTER = False; _generate_full_content = None
    def _ai_generate(d): return {"error": "ai_router not available"}
    def _check_topic_safety(t): return False  # fail closed if ai_router unavailable

try:
    from credits_manager import (use_credit, get_user_credits, get_credit_status,
        set_user_plan, add_credits, reset_user_credits as _reset_credits,
        get_all_usage, get_plan_info, PLAN_PRICES, PLAN_LIMITS)
    _HAS_CREDITS = True
except Exception as e:
    log.warning("credits_manager: %s", e); _HAS_CREDITS = False
    PLAN_PRICES = {}; PLAN_LIMITS = {}
    def use_credit(u): return True
    def get_user_credits(u): return 20
    def get_credit_status(u): return {"credits_remaining": 20, "credits": 20, "plan": "free", "monthly_limit": 20}
    def set_user_plan(u, p, email=""): pass
    def add_credits(u, a, email=""): return 20
    def _reset_credits(u): pass
    def get_all_usage(): return {}
    def get_plan_info(p=None): return {}

try:
    from youtube_engine import YouTubeIntelligenceEngine; _HAS_YT = True
except Exception: _HAS_YT = False; YouTubeIntelligenceEngine = None
try:
    from instagram_engine import InstagramEngine; _HAS_IG = True
except Exception: _HAS_IG = False; InstagramEngine = None
try:
    from x_engine import XEngine; _HAS_X = True
except Exception: _HAS_X = False; XEngine = None
try:
    from pinterest_engine import PinterestEngine; _HAS_PINT = True
except Exception: _HAS_PINT = False; PinterestEngine = None
try:
    from facebook_engine import FacebookEngine; _HAS_FB = True
except Exception: _HAS_FB = False; FacebookEngine = None
try:
    from tiktok_engine import TikTokEngine; _HAS_TT = True
except Exception: _HAS_TT = False; TikTokEngine = None
try:
    from telegram_engine import TelegramEngine; _HAS_TG = True
except Exception: _HAS_TG = False; TelegramEngine = None
try:
    from threads_engine import ThreadsEngine; _HAS_THR = True
except Exception: _HAS_THR = False; ThreadsEngine = None
try:
    from thumbnail_ai import analyze_thumbnail_real; _HAS_THUMB = True
except Exception: _HAS_THUMB = False; analyze_thumbnail_real = lambda *a,**k: None
try:
    import razorpay as _razorpay; _HAS_RZP = True
except ImportError: _HAS_RZP = False

RZP_KEY_ID  = os.getenv("RAZORPAY_KEY_ID",     "")
RZP_SECRET  = os.getenv("RAZORPAY_KEY_SECRET",  "")

# ══════════════════════════════════════════════════════════════════════
# ── Rate limiter ──────────────────────────────────────────────────────
from limiter_shared import limiter
try:
    from referral_routes import router as referral_router
    _HAS_REFERRAL = True
except Exception as e:
    print("referral_routes failed:", e); _HAS_REFERRAL = False; referral_router = None

try:
    from fingerprint_routes import router as fp_router
    _HAS_FP = True
except Exception as e:
    print("fingerprint_routes failed:", e); _HAS_FP = False; fp_router = None


BLOCKED_TOPICS = ["bomb","suicide","kill yourself","terrorism","terrorist","jihad","massacre","genocide","rape","child porn","cocaine","heroin","meth","assassination","how to make","explosive","drug deal","illegal weapon"]

def is_blocked_topic(topic: str) -> bool:
    t = topic.lower()
    return any(w in t for w in BLOCKED_TOPICS)

app = FastAPI(title="SocioMee API", version="3.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Google login router
if _HAS_AUTH and auth_router is not None:
    app.include_router(auth_router)
if _HAS_YT_TOOLS and yt_tools_router:
    app.include_router(yt_tools_router)
if _HAS_PUSH and push_router:
    app.include_router(push_router)
if _HAS_REMINDERS and reminder_router:
    app.include_router(reminder_router)

# YouTube connect router
if _HAS_YT_ROUTES and yt_router is not None:
    app.include_router(yt_router)
    app.include_router(yt_upload_router)

# Threads router
if _HAS_THREADS_ROUTES and threads_router is not None:
    app.include_router(threads_router)
if subscription_router: app.include_router(subscription_router)
if phone_auth_router: app.include_router(phone_auth_router)
if fb_auth_router: app.include_router(fb_auth_router)
try:
    from facebook_pages_routes import router as fb_pages_router
    app.include_router(fb_pages_router)
    if linkedin_router: app.include_router(linkedin_router)
except Exception as e:
    log.warning("facebook_pages_routes failed: %s", e)
if bug_router: app.include_router(bug_router)
# WhatsApp router
if _HAS_WA_ROUTES and whatsapp_router is not None:
    app.include_router(whatsapp_router)

# TikTok router
if _HAS_TT_ROUTES and tiktok_router is not None:
    app.include_router(tiktok_router)


# Instagram router
if _HAS_INSTAGRAM_ROUTES and instagram_router is not None:
    app.include_router(instagram_router)

# Pinterest router
if _HAS_PINTEREST_ROUTES and pinterest_router is not None:
    app.include_router(pinterest_router)
if _HAS_FESTIVAL_ROUTES and festival_router is not None:
    app.include_router(festival_router)
if _HAS_HISTORY and history_router is not None:
    app.include_router(history_router)
if _HAS_REFERRAL and referral_router is not None:
    app.include_router(referral_router)
if _HAS_FP and fp_router is not None:
    app.include_router(fp_router)

# Telegram router
if _HAS_TG_SCHED:
    try:
        from telegram_scheduler import restore_scheduled_jobs
        restore_scheduled_jobs()
    except Exception as e:
        log.warning("restore_scheduled_jobs failed: %s", e)
try:
    from discord_routes import restore_discord_scheduled_jobs, restore_discord_bot_scheduled_jobs
    restore_discord_scheduled_jobs()
    restore_discord_bot_scheduled_jobs()
except Exception as e:
    log.warning("restore_discord_scheduled_jobs failed: %s", e)
try:
    from pinterest_routes import restore_pinterest_scheduled_jobs
    restore_pinterest_scheduled_jobs()
except Exception as e:
    log.warning("restore_pinterest_scheduled_jobs failed: %s", e)
if _HAS_TG_ROUTES and telegram_router is not None:
    app.include_router(telegram_router)
if _HAS_TG_SCHED and tg_sched_router is not None:
    app.include_router(tg_sched_router)
    try:
        app.include_router(discord_router)
        app.include_router(streak_router)
    except Exception as e:
        print(f"Discord router skip: {e}")

# ── News router ──────────────────────────────────────────────────────
try:
    from news.routes import router as news_router
    app.include_router(news_router)
except Exception as e:
    print(f'News router skip: {e}')

# ── MCP OAuth router ─────────────────────────────────────────────────
try:
    from mcp_oauth_routes import router as mcp_oauth_router
    app.include_router(mcp_oauth_router)
except Exception as e:
    print(f'MCP OAuth router skip: {e}')

# ── CORS ─────────────────────────────────────────────────────────────
ALLOWED_ORIGINS = [
    "https://sociomee.in",
    "https://www.sociomee.in",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins     = ALLOWED_ORIGINS,
    allow_credentials = True,
    allow_methods     = ["GET","POST","PUT","DELETE","OPTIONS"],
    allow_headers     = ["Authorization", "Content-Type", "Accept", "X-Requested-With"],
)

# ── Security Headers Middleware ──────────────────────────────────────
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request as StarletteRequest

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: StarletteRequest, call_next):
        try:
            response = await call_next(request)
        except Exception as e:
            from starlette.responses import JSONResponse
            return JSONResponse({"detail": "Internal server error"}, status_code=500)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: https:; "
            "connect-src 'self' https://api.razorpay.com https://sociomeeai.com https://sociomee.in; "
            "frame-src https://api.razorpay.com https://checkout.razorpay.com;"
        )
        # Remove server info header
        try:
            del response.headers["server"]
        except: pass
        try:
            del response.headers["x-powered-by"]
        except: pass
        return response

app.add_middleware(SecurityHeadersMiddleware)

# ── Models ────────────────────────────────────────────────────────────
class FullContentRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300); persona: str = "dhruvrathee"
    deep_research: bool = Field(default=True)
    language: str = Field(default="hinglish", max_length=20)
    country: str = Field(default="in", max_length=10)
    platform: str = Field(default="youtube", max_length=30)

class PlatformContentRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=300)
    platform: str = Field(..., max_length=30)
    niche: str = Field(default="general", max_length=50)
    tone: str = Field(default="default", max_length=30)
    objective: str = Field(default="engagement", max_length=50)
    personality: str = Field(default="default", max_length=50)
    persona: str = Field(default="default", max_length=50)
    format_type: str = Field(default="long", max_length=20)
    duration_seconds: int = Field(default=180, ge=1, le=3600)
    segment_count: int = Field(default=5, ge=2, le=7)
    destination_type: str = Field(default="channel", max_length=20)
    language: str = Field(default="hinglish", max_length=20)

    def effective_persona(self) -> str:
        return self.persona or self.personality or "default"

class CreateOrderRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    plan: str = Field(...); email: str = ""

class VerifyPaymentRequest(BaseModel):
    user_id: str = Field(..., min_length=1); plan: str; email: str = ""
    razorpay_order_id: str; razorpay_payment_id: str; razorpay_signature: str

class SetPlanRequest(BaseModel):
    user_id: str = Field(..., min_length=1); plan: str

class BonusRequest(BaseModel):
    user_id: str = Field(..., min_length=1); amount: int = Field(..., ge=1, le=500)

# ── Helpers ───────────────────────────────────────────────────────────
def _check_credits(user_id: str):
    ok = use_credit(user_id, cost=10)
    if not ok:
        status = get_credit_status(user_id)
        return {"error": f"No credits remaining on your {status.get('plan','free').replace('_',' ').title()} plan.", "credits": 0, "credit_status": status}
    return None

def _attach_credits(result: dict, user_id: str) -> dict:
    if isinstance(result, dict):
        status = get_credit_status(user_id)
        result["credits"] = status.get("credits_remaining", 0)
        result["credit_status"] = status
    return result

# ── SEO Title Generator + Scorer ─────────────────────────────────────
def _seo_score_title(title: str, keyword: str) -> int:
    import unicodedata as _ud
    score = 50
    t = title.lower(); k = keyword.lower(); length = len(title)
    if 45 <= length <= 65:   score += 20
    elif 35 <= length <= 75: score += 10
    elif length < 25 or length > 90: score -= 10
    if k in t: score += 10
    elif any(w in t for w in k.split() if len(w) > 3): score += 5
    for w in ["secret","truth","exposed","real","shocking","why","how","what",
              "never","always","mistake","hidden","revealed","untold","full story",
              "sach","kyun","kaise","asli","sachchi","pura","real","sahi","bata"]:
        if w in t: score += 5; break
    if re.search(r'\d', title): score += 5
    if "?" in title: score += 4
    if "|" in title or "—" in title or "-" in title: score += 3
    if any(_ud.category(c) in ("So","Sm") for c in title): score += 3
    return min(99, max(10, score))

def _seo_tips(title: str, keyword: str, score: int) -> list:
    tips = []
    if len(title) < 45: tips.append("Make title longer (aim for 45-65 characters for maximum CTR)")
    if len(title) > 75: tips.append("Shorten to under 75 chars — YouTube truncates longer titles in search")
    if keyword.lower() not in title.lower(): tips.append(f"Include the exact keyword '{keyword}' earlier in the title")
    if not re.search(r'\d', title): tips.append("Add a number (e.g. '7 Reasons', '2024') to boost CTR by up to 36%")
    if "?" not in title and "|" not in title and "—" not in title: tips.append("Add a separator (|) or question mark to improve scan-ability")
    if score < 70: tips.append("Use emotional/power words: Exposed, Truth, Shocking, Never Told, Real Story")
    return tips[:3]

def _generate_titles_with_scores(topic: str, persona: str, language: str) -> list:
    t = topic.strip(); tc = t.title()
    is_hi = "hindi" in language.lower() or language.lower() == "hinglish"
    p = str(persona).lower().strip() if isinstance(persona, str) else "default"
    TITLE_SETS = {
        "dhruvrathee": [
            f"{tc}: Woh Sachchi Kahani Jo Media Chhupaata Hai | Full Investigation",
            f"Kya Sach Hai {tc} Ke Baare Mein? Evidence-Based Analysis",
            f"{tc} — Asli Hakikat Kya Hai? Poora Sach Aaj Jaaniye",
        ],
        "carryminati": [
            f"{tc} Ka Pura Scene | Bhai Maine Research Kiya",
            f"Yaar Seriously {tc}? | Seedha Point Pe Aata Hoon",
            f"{tc} — Bhai Tune Kya Kiya? Full Roast + Analysis",
        ],
        "samayraina": [
            f"{tc}... Matlab Seriously? | Dark Comedy Analysis",
            f"Haan Toh {tc} Ke Baare Mein Baat Karte Hain",
            f"{tc} — Ye Bhi Theek Hai I Guess | Honest Review",
        ],
        "rebelkid": [
            f"Stop Normalizing {tc} — Here's The Truth Nobody Says",
            f"{tc} Is A Cute Little Red Flag We Need To Talk About",
            f"Respectfully, {tc} Needs To Be Called Out | Full Take",
        ],
        "mrbeast": [
            f"The SHOCKING Truth About {tc} Nobody Talks About",
            f"I Researched {tc} For 30 Days — Here's What I Found",
            f"Why {tc} Is MORE Insane Than You Think (FULL STORY)",
        ],
        "alexhormozi": [
            f"The {tc} Framework Nobody Teaches You (Do This Instead)",
            f"Why 99% of People Get {tc} Completely Wrong",
            f"{tc}: The Brutally Honest Truth | No Fluff",
        ],
        "joerogan": [
            f"Dude, {tc} Is Crazier Than You Think | Deep Dive",
            f"The {tc} Conversation Nobody Is Having | Full Analysis",
            f"Think About {tc} For A Second — It's Wild",
        ],
        "default": [
            f"{tc}: The Complete Truth Finally Revealed | Full Analysis",
            f"Why {tc} Matters More Than You Think — Deep Dive",
            f"Everything You Were Wrong About {tc} | Explained Simply",
        ],
    }
    if not is_hi:
        eng_personas = {"mrbeast","alexhormozi","joerogan","rebelkid","default"}
        if p not in eng_personas: p = "default"
    raw_titles = TITLE_SETS.get(p, TITLE_SETS["default"])
    result = []
    for title in raw_titles:
        score = _seo_score_title(title, topic)
        tips  = _seo_tips(title, topic, score)
        grade = "A" if score >= 80 else "B" if score >= 65 else "C" if score >= 50 else "D"
        result.append({"title": title, "seo_score": score, "grade": grade, "tips": tips})
    result.sort(key=lambda x: x["seo_score"], reverse=True)
    return result

# NOTE: _check_topic_safety is imported from ai_router (see top of file) — do NOT
# redefine it here. A duplicate copy previously existed in this exact spot and
# silently shadowed the real one, meaning fixes to the real function never applied
# to any of this file's own usages. Single source of truth now.
def _generate_yt_description(topic: str, hook: str, structure: dict, titles_with_score: list) -> str:
    import requests as _r, re as _re, os as _os
    t = topic.strip(); tc = t.title()
    if not _check_topic_safety(t):
        return ("This topic cannot be generated. SocioMee does not create content involving self-harm, "
                "sexual content, slurs, hate speech, or violence. Please choose a different topic.")
    kp = structure.get("key_points", [])
    best_title = titles_with_score[0]["title"] if titles_with_score else tc
    NL = "\n"

    # Generate with Gemini
    try:
        api_key = _os.environ.get("GOOGLE_API_KEY","")
        kp_text = ", ".join(str(p) for p in kp[:5] if p)
        prompt = f"""Write a professional YouTube video description for:
Topic: {t}
Title: {best_title}

Use EXACTLY this format (no markdown, no asterisks, plain text only):

{best_title}

ABOUT THIS VIDEO
[Write 2-3 engaging sentences in Hinglish about what this video covers, why it matters, and what viewer will learn. Make it specific to {t}.]

IS VIDEO MEIN AAP JANENGE
- [Point 1 specific to {t}]
- [Point 2 specific to {t}]
- [Point 3 specific to {t}]
- [Point 4 specific to {t}]
- [Point 5 specific to {t}]

YOUR QUERIES
{t}
{t} explained
{t} full analysis
{t} truth revealed
{t} in hindi
{t} 2024
{t} real story
{t} investigation
about {t}
{t} facts

TIMESTAMPS
00:00 - Introduction
00:30 - Background
02:00 - [Section specific to {t}]
05:00 - [Section specific to {t}]
08:00 - [Section specific to {t}]
12:00 - Conclusion

HASHTAGS
#{t.lower().replace(' ','')} #viralvideo #trending #youtube #india #facts #analysis #investigation #hinglish #viral

DISCLAIMER
This video is for educational and informational purposes only. All information is based on publicly available sources. We do not claim ownership of any third-party content shown. Copyright © SocioMee 2024.

Write the ABOUT THIS VIDEO and IS VIDEO MEIN AAP JANENGE sections with content specific to {t}. Keep rest exactly as shown."""

        resp = _r.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}",
            headers={"Content-Type":"application/json"},
            json={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":1500,"temperature":0.7}},
            timeout=30
        )
        data = resp.json()
        if "candidates" in data:
            raw = data["candidates"][0]["content"]["parts"][0]["text"]
            # Clean any markdown
            raw = _re.sub(r"\*\*(.*?)\*\*", r"\1", raw)
            raw = _re.sub(r"\*(.*?)\*", r"\1", raw)
            raw = _re.sub(r"^(Okay|Sure|Here|Alright)[^\n]*\n", "", raw.strip(), flags=_re.IGNORECASE)
            return raw.strip()
    except Exception as e:
        log.warning("Gemini description failed: %s", e)

    # Fallback
    queries = [t, t+" explained", t+" full analysis", t+" truth revealed", t+" in hindi",
               t+" documentary", "about "+t, t+" real story", t+" latest news", t+" facts"]
    kp_bullets = NL.join(f"• {str(p)[:80]}" for p in kp[:5] if p)
    hashtags = f"#{t.lower().replace(' ','')} #viralvideo #trending #youtube #india #facts #analysis #viral"
    return f"""{best_title}

ABOUT THIS VIDEO
Aaj hum {t} ke baare mein ek honest aur detailed analysis karenge. Is video mein hum sab angles cover karenge bina kisi bias ke.

IS VIDEO MEIN AAP JANENGE
{kp_bullets or f"• {tc} ki poori kahani"}

YOUR QUERIES
{NL.join(queries)}

TIMESTAMPS
00:00 - Introduction
00:30 - Background
02:00 - Main Analysis
08:00 - Key Findings
12:00 - Conclusion

HASHTAGS
{hashtags}

DISCLAIMER
This video is for educational and informational purposes only. All information is based on publicly available sources. Copyright © SocioMee 2024."""


def _normalize(raw: dict, payload: FullContentRequest, platform: str = "youtube") -> dict:
    structure = raw.get("structure", {}); seo_scores = raw.get("seo_scores", [])
    titles = raw.get("titles", []); script = raw.get("script", "")
    persona_d = raw.get("persona", {}); errors = raw.get("errors", [])
    seo_result = raw.get("seo_result", {})
    packs = {p: seo_result.get(p, {}) for p in
             ["youtube","instagram","tiktok","x","facebook","threads","pinterest","telegram"]}
    yt = packs["youtube"]
    if isinstance(persona_d, dict):
        persona_key = persona_d.get("voice") or persona_d.get("name") or payload.persona
    else:
        persona_key = str(persona_d) if persona_d else payload.persona
    persona_key = str(persona_key).lower().strip() or "default"
    generated_tws = _generate_titles_with_scores(
        topic=raw.get("topic", payload.topic), persona=persona_key,
        language=raw.get("language", payload.language))
    tws = generated_tws
    if seo_scores:
        pipeline_tws = [{"title": s.get("title",""), "seo_score": s.get("score",0),
                         "grade": s.get("grade",""), "tips": s.get("tips",[])}
                        for s in seo_scores if s.get("title","").strip()]
        if len(pipeline_tws) >= 3: tws = pipeline_tws
    best_title = tws[0]["title"] if tws else (titles[0] if titles else payload.topic)
    best_score = tws[0]["seo_score"] if tws else 0
    yt_description = (yt.get("description") or _generate_yt_description(
        topic=raw.get("topic", payload.topic), hook=structure.get("hook",""),
        structure=structure, titles_with_score=tws))
    topic_str = raw.get("topic", payload.topic).strip()
    search_queries = yt.get("search_queries") or [
        f"{topic_str} analysis", f"{topic_str} explained", f"{topic_str} full story",
        f"{topic_str} truth revealed", f"{topic_str} investigation 2024"]
    slug = re.sub(r"[^a-z0-9]", "", topic_str.lower())
    seo_hashtags = yt.get("hashtags") or [
        f"#{slug}", "#viralvideo", "#trending", "#youtube", "#analysis", "#india", "#facts"]
    sects = ([{"title": "Hook", "text": structure.get("hook","")}]
             + [{"title": f"Key Point {i+1}", "text": kp}
                for i, kp in enumerate(structure.get("key_points",[]))]
             + [{"title": "Conclusion", "text": structure.get("conclusion","")}])
    return {
        "platform": platform, "topic": topic_str,
        "language": raw.get("language", payload.language), "personality_used": persona_key,
        "format_type": "long", "script_text": script, "word_count": len(script.split()),
        "content_mode": "deep_research", "hook": structure.get("hook",""),
        "sections": sects, "titles": [t["title"] for t in tws],
        "titles_with_score": tws, "best_title": best_title,
        "scores": {"final_score": best_score, "content_score": min(100, len(script.split())//20),
                   "ai_score": min(100, best_score+5)},
        "seo_description": yt_description, "youtube_description": yt_description,
        "search_queries": search_queries, "seo_hashtags": seo_hashtags,
        "seo_packs": {**packs, "youtube": {**packs.get("youtube",{}), "description": yt_description,
            "hashtags": seo_hashtags, "search_queries": search_queries,
            "timestamps": [l for l in yt_description.split("\n") if re.match(r"\d+:\d+", l.strip())]}},
        "research_errors": errors,
    }

# ══════════════════════════════════════════════════════════════════════
# ROUTES
@app.get("/")
def home(): return {"message": "SocioMee API v3 🚀", "status": "ok"}

@app.get("/health")
def health(): return {"status": "ok"}

@app.post("/apps/notify-interest")
def apps_notify_interest(app_id: str = Body(..., embed=True)):
    """Records interest in a coming-soon app. Simple counter file, no auth required."""
    import json
    from pathlib import Path
    f = Path(__file__).parent / "app_interest.json"
    try:
        data = json.loads(f.read_text()) if f.exists() else {}
    except Exception:
        data = {}
    data[app_id] = data.get(app_id, 0) + 1
    f.write_text(json.dumps(data, indent=2))
    return {"success": True}

@app.get("/apps/catalog")
def apps_catalog():
    """Returns the full list of available SocioMee apps."""
    import user_apps
    return {"apps": user_apps.ALL_APPS}

@app.get("/apps/my/{user_id}")
def apps_my(user_id: str):
    """Returns the list of app ids this user has added to their sidebar."""
    import user_apps
    return {"added": user_apps.get_user_apps(user_id)}

@app.post("/apps/add")
def apps_add(user_id: str = Body(..., embed=True), app_id: str = Body(..., embed=True)):
    import user_apps
    try:
        updated = user_apps.add_app(user_id, app_id)
        return {"success": True, "added": updated}
    except ValueError as e:
        raise HTTPException(400, str(e))

@app.post("/apps/remove")
def apps_remove(user_id: str = Body(..., embed=True), app_id: str = Body(..., embed=True)):
    import user_apps
    updated = user_apps.remove_app(user_id, app_id)
    return {"success": True, "added": updated}

@app.post("/validate-coupon")
@limiter.limit("20/minute")
def validate_coupon_endpoint(request: Request, code: str = Body(..., embed=True), plan: str = Body(..., embed=True)):
    """Validate a coupon code for a given plan. Returns discount details if valid."""
    try:
        from coupon_manager import validate_coupon
        _ip = request.headers.get("X-Real-IP", request.client.host if request.client else "")
        return validate_coupon(code, plan, _ip)
    except Exception as e:
        log.error("validate_coupon error: %s", e)
        return {"valid": False, "message": "Could not validate coupon. Please try again."}


@app.get("/credits/{user_id}")
def get_credits(user_id: str, request: Request, user: dict = Depends(get_current_user)):
    # Ownership check — user can only access their own credits
    token_user_id = user.get("user_id", "")
    if token_user_id != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    try: return get_credit_status(user_id)
    except Exception as e:
        import logging
        logging.getLogger("sociomee").error(f"Internal error: {e}", exc_info=True)
        raise HTTPException(500, "Something went wrong. Please try again.")

@app.post("/use-credit")
def use_credit_route(user: dict = Depends(get_current_user)):
    ok = use_credit(user.get("user_id",""))
    if not ok:
        status = get_credit_status(user.get("user_id",""))
        raise HTTPException(status_code=402, detail={"error": "No credits remaining", "credit_status": status})
    return get_credit_status(user.get("user_id",""))

@app.post("/api/ai/generate")
@limiter.limit("10/minute")
async def ai_generate_proxy(request: Request, user: dict = Depends(get_current_user)):
    import httpx, re
    body = await request.json()
    api_key = os.environ.get("GOOGLE_API_KEY","")
    if not api_key:
        raise HTTPException(503, "AI service unavailable.")
    model = "gemini-2.5-flash"
    messages = body.get("messages",[])
    if not messages:
        raise HTTPException(400, "No messages provided.")
    # Sanitize prompt — strip injection attempts
    raw_prompt = messages[0].get("content","") if isinstance(messages[0], dict) else str(messages[0])
    # Truncate to 4000 chars max
    prompt = raw_prompt[:4000].strip()
    if not prompt:
        raise HTTPException(400, "Empty prompt.")
    # Remove common prompt injection patterns
    injection_patterns = [
        r"ignore (all |previous |prior )?instructions",
        r"disregard (all |previous |prior )?instructions",
        r"system prompt",
        r"you are now",
        r"act as (a |an )?(?!creator|youtuber|writer)",
    ]
    for pattern in injection_patterns:
        if re.search(pattern, prompt, re.IGNORECASE):
            raise HTTPException(400, "Invalid prompt content.")
    # Check credits
    err = _check_credits(user.get("user_id",""))
    if err:
        return err
    async with httpx.AsyncClient(timeout=60) as client:
        r = await client.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={api_key}",
            headers={"Content-Type":"application/json"},
            json={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":1000}}
        )
        if r.status_code != 200:
            raise HTTPException(502, "AI service error. Please try again.")
        data = r.json()
        text = data.get("candidates",[{}])[0].get("content",{}).get("parts",[{}])[0].get("text","")
        # Return in Anthropic-compatible format
        return {"content":[{"type":"text","text":text}]}

def _check_email_verified(user: dict) -> Optional[dict]:
    """Returns an error response if the user's account isn't email-verified yet
    (only applies to email/password accounts — OAuth accounts are pre-verified by
    Google/GitHub themselves). Returns None if verification is fine to proceed."""
    try:
        from auth_routes import _load_users
        users = _load_users()
        record = users.get(user.get("email", ""))
        if record and record.get("provider") == "email" and not record.get("email_verified", False):
            raise HTTPException(403, "Please verify your email before generating content. Check your inbox for the verification link, or request a new one from your account settings.")
    except HTTPException:
        raise
    except Exception as e:
        log.warning("Email verification check failed, allowing through: %s", e)
    return None


@app.post("/generate-full-content")
@limiter.limit("10/minute")
def gen_full(request: Request, payload: FullContentRequest, user: dict = Depends(get_current_user)):
    if not _HAS_AI_ROUTER or not _generate_full_content: raise HTTPException(503, "ai_router not available.")
    _check_email_verified(user)
    err = _check_credits(user["user_id"])
    if err: return err
    try:
        raw = _generate_full_content(topic=payload.topic.strip(), persona=payload.persona.strip().lower(),
                                     language=payload.language.strip().lower(), country=payload.country.strip().lower(),
                                     plan=user.get("plan","free"), deep_research=getattr(payload,"deep_research",None))
    except Exception as e:
        import logging
        logging.getLogger("sociomee").error(f"Internal error: {e}", exc_info=True)
        try:
            from credits_manager import add_credits
            add_credits(user["user_id"], 1)
        except Exception as refund_err:
            logging.getLogger("sociomee").error(f"Refund failed: {refund_err}", exc_info=True)
        if "UNSAFE_TOPIC" in str(e):
            raise HTTPException(400, "This topic cannot be generated. SocioMee does not create content involving self-harm, sexual content, slurs, hate speech, or violence.")
        raise HTTPException(500, "Something went wrong. Please try again.")
    normalized = _normalize(raw, payload, payload.platform.strip().lower())
    try:
        from history_routes import save_generation
        save_generation(user["user_id"], payload.topic, payload.platform,
            normalized.get("best_title",""), normalized.get("script_text","")[:300],
            normalized.get("seo_hashtags",[]), normalized.get("word_count",0),
            normalized.get("language","hinglish"))
    except Exception as _he:
        log.warning("history save failed: %s", _he)
    return _attach_credits(normalized, user["user_id"])

@app.post("/generate-platform-content")
@limiter.limit("10/minute")
def gen_platform(request: Request, payload: PlatformContentRequest, user: dict = Depends(get_current_user)):
    p = payload.platform.strip().lower(); topic = payload.topic.strip()
    _check_email_verified(user)
    if not _check_topic_safety(topic):
        raise HTTPException(400, "This topic cannot be generated. SocioMee does not create content involving self-harm, sexual content, slurs, hate speech, or violence.")
    err = _check_credits(user["user_id"])
    if err: return err
    try:
        if p == "youtube":
            if not _HAS_YT: raise HTTPException(503, "YouTubeIntelligenceEngine not available.")
            e = YouTubeIntelligenceEngine()
            try: result = e.generate(topic=topic, niche=payload.niche, personality=payload.personality, format_type=payload.format_type, duration_seconds=payload.duration_seconds, language=payload.language, tone=payload.tone)
            except TypeError: result = e.generate(topic=topic, niche=payload.niche, personality=payload.personality, format_type=payload.format_type, duration_seconds=payload.duration_seconds, language=payload.language)
        elif p == "instagram":
            if not _HAS_IG: raise HTTPException(503, "InstagramEngine not available.")
            from vertex_engine import generate_instagram
            _ig = generate_instagram(topic=topic, tone=payload.tone or "casual", persona=payload.effective_persona(), language=payload.language or "hinglish", niche=payload.niche or "general")
            result = {
                "platform": "instagram",
                "topic": topic,
                "reel_hook": _ig.get("reel_hook",""),
                "caption": _ig.get("caption",""),
                "post": _ig.get("caption",""),
                "hashtags": _ig.get("hashtags",[]),
                "cta": _ig.get("cta",""),
                "story_ideas": _ig.get("story_ideas",[]),
                "seo_packs": {"instagram": {"caption": _ig.get("caption",""), "description": _ig.get("caption",""), "hashtags": _ig.get("hashtags",[])}},
            }
            # normalise: pull best caption from scripts bundle
            if "scripts" in result and isinstance(result["scripts"], dict):
                selected = result["scripts"].get("selected_script", {})
                if isinstance(selected, dict):
                    script_text = selected.get("full_script","") or selected.get("hook","")
                elif isinstance(selected, str):
                    script_text = selected
                else:
                    script_text = ""
                result["caption"] = script_text or result.get("description","")
            else:
                result["caption"] = result.get("description","")
        elif p == "x":
            if not _HAS_X: raise HTTPException(503, "XEngine not available.")
            from vertex_engine import generate_twitter_x
            _x = generate_twitter_x(topic=topic, tone=payload.tone or "bold", persona=payload.effective_persona(), language=payload.language or "english")
            result = {
                "platform": "x",
                "topic": topic,
                "tweet": _x.get("tweet",""),
                "post": _x.get("tweet",""),
                "caption": _x.get("tweet",""),
                "thread": _x.get("thread",[]),
                "hashtags": _x.get("hashtags",[]),
                "reply_bait": _x.get("reply_bait",""),
                "seo_packs": {"x": {"caption": _x.get("tweet",""), "description": _x.get("tweet",""), "hashtags": _x.get("hashtags",[])}},
            }
            result["caption"] = result.get("post") or result.get("tweet") or result.get("caption","")
        elif p == "pinterest":
            if not _HAS_PINT: raise HTTPException(503, "PinterestEngine not available.")
            result = PinterestEngine().generate(topic=topic, niche=payload.niche)
            result["caption"] = result.get("description","")
        elif p == "facebook":
            if not _HAS_FB: raise HTTPException(503, "FacebookEngine not available.")
            from vertex_engine import generate_facebook
            _fb = generate_facebook(topic=topic, tone=payload.tone or "casual", persona=payload.effective_persona(), language=payload.language or "hinglish", objective=payload.objective or "engagement")
            result = {
                "platform": "facebook",
                "topic": topic,
                "post": _fb.get("post",""),
                "caption": _fb.get("post",""),
                "hashtags": _fb.get("hashtags",[]),
                "hook_line": _fb.get("hook_line",""),
                "cta": _fb.get("cta",""),
                "seo_packs": {"facebook": {"caption": _fb.get("post",""), "description": _fb.get("post",""), "hashtags": _fb.get("hashtags",[])}},
            }
            result["caption"] = result.get("long_copy") or result.get("short_copy") or result.get("title_hook","")
        elif p == "tiktok":
            if not _HAS_TT: raise HTTPException(503, "TikTokEngine not available.")
            result = TikTokEngine().generate(topic=topic, niche=payload.niche, tone=payload.tone, objective=payload.objective, duration_seconds=payload.duration_seconds).to_dict()
            result["caption"] = result.get("caption") or result.get("script","")
        elif p == "telegram":
            if not _HAS_TG: raise HTTPException(503, "TelegramEngine not available.")
            from vertex_engine import generate_telegram
            _tg = generate_telegram(topic=topic, tone=payload.tone or "informative", persona=payload.effective_persona(), language=payload.language or "hinglish", destination_type=payload.destination_type or "channel")
            result = {
                "platform": "telegram",
                "topic": topic,
                "message": _tg.get("message",""),
                "post": _tg.get("message",""),
                "caption": _tg.get("message",""),
                "hashtags": _tg.get("hashtags",[]),
                "poll_question": _tg.get("poll_question",""),
                "poll_options": _tg.get("poll_options",[]),
                "seo_packs": {"telegram": {"caption": _tg.get("message",""), "description": _tg.get("message",""), "hashtags": _tg.get("hashtags",[])}},
            }
            result["caption"] = result.get("post_body") or result.get("short_version") or result.get("opening_line","")
        elif p == "threads":
            if not _HAS_THR: raise HTTPException(503, "ThreadsEngine not available.")
            from vertex_engine import generate_threads
            _th = generate_threads(topic=topic, tone=payload.tone or "casual", persona=payload.effective_persona(), language=payload.language or "hinglish")
            result = {
                "platform": "threads",
                "topic": topic,
                "post": _th.get("main_post",""),
                "caption": _th.get("main_post",""),
                "thread_replies": _th.get("thread_replies",[]),
                "hashtags": _th.get("hashtags",[]),
                "seo_packs": {"threads": {"caption": _th.get("main_post",""), "description": _th.get("main_post",""), "hashtags": _th.get("hashtags",[])}},
            }
            result["caption"] = result.get("full_thread") or result.get("opening_line","")
        elif p == "reddit":
            import requests as _req
            _gemini_key = __import__('os').getenv('GOOGLE_API_KEY','')
            _reddit_prompt = f"""Write a Reddit post about: {topic}
Tone: {getattr(payload,'tone','informative')}
Language: English (Reddit is English only)

Write a Reddit post that feels genuinely human. NOT like AI generated content.

Rules:
- Title: compelling, curiosity-driven, 60-100 characters
- Body: conversational, first-person, like a real person sharing experience
- Share a genuine perspective or insight, not generic advice
- Include 2-3 specific points that feel real and lived-in
- End with a question to spark discussion
- NO bullet points with numbers like "1. 2. 3." — write in flowing paragraphs
- NO phrases like "Here is what actually matters" or "Most people approach X wrong"
- Sound like a real Reddit user, not a content writer

Return ONLY valid JSON:
{{"post_title": "...", "post_body": "..."}}"""
            try:
                _r = _req.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={{_gemini_key}}",
                    headers={{"Content-Type":"application/json"}},
                    json={{"contents":[{{"parts":[{{"text":_reddit_prompt}}]}}],"generationConfig":{{"maxOutputTokens":600,"temperature":0.9,"thinkingConfig":{{"thinkingBudget":0}}}}}},
                    timeout=30
                )
                _rd = _r.json()
                _rt = _rd["candidates"][0]["content"]["parts"][0]["text"].strip()
                _rt = _rt.replace("```json","").replace("```","").strip()
                _rj = __import__('json').loads(_rt)
                post_title = _rj.get("post_title", topic)
                post_body = _rj.get("post_body", "")
            except Exception as _re:
                post_title = f"{topic} — sharing what I learned"
                post_body = f"Been thinking about {topic} a lot lately. Would love to hear what others think about this."
            sep = "\n\n"
            result = {
                "platform": "reddit",
                "topic": topic,
                "caption": post_title + sep + post_body,
                "post_title": post_title,
                "post": post_body,
                "hashtags": [],
            }
        elif p == "quora":
            import requests as _req_q
            _gkey_q = __import__('os').getenv('GOOGLE_API_KEY','')
            _persona_q = getattr(payload,'personality','default') or 'default'
            _tone_q = getattr(payload,'tone','informative') or 'informative'
            _quora_prompt = f"""Write a Quora answer about this topic: {topic}
Voice/Persona: {_persona_q}
Tone: {_tone_q}

Write a genuinely helpful, credible Quora answer. Rules:
- Opening line must be specific and hook the reader immediately, NOT generic
- Write in flowing paragraphs, not bullet points or numbered lists
- Share a real insight or angle specific to this exact topic
- Use concrete reasoning or examples, not vague advice
- 250 to 350 words total
- End naturally without a forced CTA
- Sound like a knowledgeable person who genuinely understands this topic
- NEVER use these phrases: "Most people overcomplicate", "Here is what actually matters", "The answer becomes clear", "What is the best way to approach"
- The answer must be specifically about: {topic}

Return ONLY valid JSON with no extra text:
{{"quora_question": "a specific relevant question about the topic", "quora_answer": "the full answer text"}}"""
            try:
                _r_q = _req_q.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={{_gkey_q}}",
                    headers={{"Content-Type":"application/json"}},
                    json={{"contents":[{{"parts":[{{"text":_quora_prompt}}]}}],"generationConfig":{{"maxOutputTokens":700,"temperature":0.85,"thinkingConfig":{{"thinkingBudget":0}}}}}},
                    timeout=30
                )
                _rd_q = _r_q.json()
                _rt_q = _rd_q["candidates"][0]["content"]["parts"][0]["text"].strip()
                _rt_q = _rt_q.replace("```json","").replace("```","").strip()
                _rj_q = __import__('json').loads(_rt_q)
                question = _rj_q.get("quora_question", f"What should I know about {topic}?")
                answer = _rj_q.get("quora_answer","")
            except Exception as _qe:
                question = f"What should I know about {topic}?"
                answer = f"This topic has more depth than most people realize. {topic} is worth understanding properly before forming an opinion."
            sep = "\n\n"
            full_post = f"Question: {{question}}{{sep}}{{answer}}"
            result = {{
                "platform": "quora",
                "topic": topic,
                "caption": full_post,
                "post": full_post,
                "quora_question": question,
                "quora_answer": answer,
                "hashtags": [],
            }}
        elif p == "linkedin":
            import requests as _req3
            _gemini_key3 = __import__('os').getenv('GOOGLE_API_KEY','')
            _persona3 = getattr(payload,'personality','default') or 'default'
            _tone3 = getattr(payload,'tone','informative') or 'informative'
            _lang3 = getattr(payload,'language','english') or 'english'
            _li_prompt = f"""Write a LinkedIn post about: {topic}
Persona/Voice: {_persona3}
Tone: {_tone3}
Language: {_lang3}

Write a LinkedIn post that gets saves and comments from professionals.

Rules:
- Opening line must stop the scroll — bold claim, surprising stat, or strong opinion
- Write in short punchy paragraphs (1-3 lines each) with line breaks between them
- Share a genuine professional insight, not generic motivational fluff
- Be specific — vague posts get ignored on LinkedIn
- 150-220 words total
- End with a genuine question or soft CTA that invites discussion
- NO phrases like "Most professionals overcomplicate X" or "Here is what most people miss"
- NO generic "1. Clarity 2. Basics 3. Consistency" structure
- Sound like a founder or creator who has real skin in the game

Return ONLY valid JSON:
{{"post": "...", "hashtags": ["tag1","tag2","tag3","tag4","tag5"]}}"""
            try:
                _r3 = _req3.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={{_gemini_key3}}",
                    headers={{"Content-Type":"application/json"}},
                    json={{"contents":[{{"parts":[{{"text":_li_prompt}}]}}],"generationConfig":{{"maxOutputTokens":500,"temperature":0.9,"thinkingConfig":{{"thinkingBudget":0}}}}}},
                    timeout=30
                )
                _rd3 = _r3.json()
                _rt3 = _rd3["candidates"][0]["content"]["parts"][0]["text"].strip()
                _rt3 = _rt3.replace("```json","").replace("```","").strip()
                _rj3 = __import__('json').loads(_rt3)
                _li_post = _rj3.get("post","")
                _li_tags = _rj3.get("hashtags",["#linkedin","#professional","#growth","#india","#creator"])
            except Exception as _le:
                _li_post = f"Been thinking about {topic} lately. There is more to it than most people share publicly."
                _li_tags = ["#linkedin","#professional","#growth","#india","#creator","#business"]
            result = {
                "platform": "linkedin",
                "topic": topic,
                "caption": _li_post,
                "post": _li_post,
                "hashtags": _li_tags,
            }
        else: raise HTTPException(400, f"Unknown platform: {p}")
    except HTTPException: raise
    except Exception as e:
        import logging
        logging.getLogger("sociomee").error(f"Internal error: {e}", exc_info=True)
        raise HTTPException(500, "Something went wrong. Please try again.")
    # wrap caption into seo_packs so PlatformSEOTabs can render it
    caption = result.get("caption","") or result.get("post","") or result.get("description","")
    if "seo_packs" not in result:
        result["seo_packs"] = {}
    result["seo_packs"][p] = {
        **result["seo_packs"].get(p, {}),
        "caption": caption,
        "description": caption,
        "hashtags": result.get("hashtags", []),
    }
    try:
        from history_routes import save_generation
        save_generation(user["user_id"], topic, p,
            result.get("best_title") or result.get("topic","") or topic,
            (caption or "")[:300],
            result.get("hashtags", []),
            len((caption or "").split()),
            getattr(payload, "language", "hinglish"))
    except Exception as _he:
        import logging
        logging.getLogger("sociomee").warning(f"history save failed: {_he}")
    return _attach_credits(result, user["user_id"])

@app.post("/thumbnail/ab-test")
async def thumb_ab_test(
    file_a: UploadFile = File(...),
    file_b: UploadFile = File(...),
    niche: str = Form("general"),
    user: dict = Depends(get_current_user)
):
    err = _check_credits(user.get("user_id",""))
    if err: return err
    try:
        if _HAS_THUMB:
            from thumbnail_ai import ab_test_thumbnails
            bytes_a = await file_a.read()
            bytes_b = await file_b.read()
            result = ab_test_thumbnails(bytes_a, bytes_b, file_a.content_type or "image/jpeg", file_b.content_type or "image/jpeg", niche)
            return result
        return {"error": "Thumbnail AI not available"}
    except Exception as e:
        log.error("ab_test error: %s", e)
        return {"error": str(e)}

@app.post("/thumbnail/analyze")
async def thumb_analyze(file: UploadFile = File(...), keyword: str = Form(""), niche: str = Form(""), user: dict = Depends(get_current_user)):
    err = _check_credits(user.get("user_id",""))
    if err: return err
    real_plan = get_credit_status(user.get("user_id",""))["plan"]
    try:
        b = await file.read()
        if _HAS_THUMB:
            r = analyze_thumbnail_real(image_bytes=b, mime_type=file.content_type or "image/jpeg", keyword=keyword or niche or "general", niche=niche or keyword or "general", plan=real_plan)
            if r: return r
        score = 70
        if PILImage:
            try:
                img = PILImage.open(io.BytesIO(b)); w,h = img.size
                if h > 0 and 1.7 <= w/h <= 1.8: score += 10
                if w >= 1280: score += 8
            except Exception: pass
        return {"fit_score": min(score,100), "ctr_potential": min(score-10,100), "verdict": "Good thumbnail." if score>=70 else "Needs improvement.", "suggestions": ["Bigger text","Add a face","Brighter colors","Use 16:9 ratio"]}
    except Exception as e:
        import logging
        logging.getLogger("sociomee").error(f"Internal error: {e}", exc_info=True)
        raise HTTPException(500, "Something went wrong. Please try again.")

# ── Payment ───────────────────────────────────────────────────────────
@app.get("/payment/plans")
def payment_plans():
    return {
        "plans": [
            {"id":"free","label":"Free","price_inr":0,"price_paise":0,"credits":20,"period":"month","features":["20 credits/month","Short scripts ≤500 words","Basic SEO"],"highlighted":False,"cta":"Current Plan"},
            {"id":"pro_monthly","label":"Pro Monthly","price_inr":499,"price_paise":49900,"credits":150,"period":"month","features":["150 credits/month","3000-5000 word scripts","Full SEO — 8 platforms","Thumbnail analyzer"],"highlighted":False,"cta":"Upgrade to Pro"},
            {"id":"pro_annual","label":"Pro Annual","price_inr":3999,"original_inr":5999,"price_paise":399900,"credits":150,"period":"year","features":["150 credits/month","All Pro features","Save ₹2000 vs monthly","Priority support"],"highlighted":True,"badge":"Best Value","cta":"Get Annual Plan"},
        ],
        "topups": [
            {"id":"topup_99","label":"Starter Pack","price_inr":99,"price_paise":9900,"credits":50,"cta":"Buy 50 Credits"},
            {"id":"topup_199","label":"Value Pack","price_inr":199,"price_paise":19900,"credits":120,"badge":"Most Popular","cta":"Buy 120 Credits"},
        ],
    }

@app.post("/payment/create-order")
@limiter.limit("5/minute")
def create_order(request: Request, payload: CreateOrderRequest):
    if not _HAS_RZP: raise HTTPException(503, "pip install razorpay")
    if not RZP_KEY_ID or not RZP_SECRET: raise HTTPException(503, "Razorpay keys missing from .env")
    plan = payload.plan.strip().lower()
    if plan not in PLAN_PRICES: raise HTTPException(400, f"Invalid plan: {plan}")
    info = PLAN_PRICES[plan]
    try:
        client = _razorpay.Client(auth=(RZP_KEY_ID, RZP_SECRET))
        order = client.order.create({"amount": info["amount"], "currency": "INR", "receipt": f"{payload.user_id[:15]}_{plan}_{int(time.time())}", "notes": {"user_id": payload.user_id, "email": payload.email, "plan": plan}})
        return {"order_id": order["id"], "amount": order["amount"], "currency": order["currency"], "plan": plan, "plan_label": info["label"], "key_id": RZP_KEY_ID}
    except Exception as e: raise HTTPException(500, f"Razorpay error: {e}")

@app.post("/payment/verify")
def verify_payment(payload: VerifyPaymentRequest):
    if not RZP_SECRET: raise HTTPException(503, "RAZORPAY_KEY_SECRET missing")
    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected = hmac.new(RZP_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, payload.razorpay_signature):
        raise HTTPException(400, "Payment signature verification failed.")
    plan = payload.plan.strip().lower()
    if plan not in PLAN_PRICES: raise HTTPException(400, f"Invalid plan: {plan}")
    info = PLAN_PRICES[plan]
    if info.get("type") == "topup":
        total = add_credits(payload.user_id, info["credits"], email=payload.email)
        msg = f"+{info['credits']} credits added to your account!"
    else:
        set_user_plan(payload.user_id, plan, email=payload.email)
        total = PLAN_LIMITS.get(plan, 20)
        msg = f"Welcome to {info['label']}! Your plan is now active."
    log.info("Payment verified: user=%s plan=%s", payload.user_id, plan)
    # Send payment confirmation email
    try:
        from email_service import send_payment_confirmation
        plan_info = PLAN_PRICES.get(plan, {})
        amount_inr = plan_info.get("amount", 0) // 100
        send_payment_confirmation(
            to_email=payload.email,
            name=payload.email.split("@")[0],
            plan_label=info["label"],
            credits=total,
            amount=amount_inr,
            payment_id=payload.razorpay_payment_id,
        )
        # Send GST invoice (only for plan purchases, not top-ups)
        if info.get("type") != "topup":
            from email_service import send_invoice_email
            send_invoice_email(
                to_email=payload.email,
                name=payload.email.split("@")[0],
                plan_label=info["label"],
                amount=amount_inr,
                payment_id=payload.razorpay_payment_id,
                order_id=payload.razorpay_order_id,
            )
    except Exception as _e:
        log.warning("Payment email failed: %s", _e)
    return {"success": True, "message": msg, "plan": plan, "plan_label": info["label"], "credits": total, "credit_status": get_credit_status(payload.user_id)}

# ── Admin ─────────────────────────────────────────────────────────────
def _require_admin(x_admin_key: str = fastapi.Header(default="")):
    secret = os.getenv("ADMIN_SECRET_KEY", "")
    if not secret or x_admin_key != secret:
        raise HTTPException(status_code=403, detail="Admin access denied.")

@app.post("/admin/set-plan")
def admin_set_plan(p: SetPlanRequest, _=Depends(_require_admin)):
    try: set_user_plan(p.user_id, p.plan); return {"success": True, "status": get_credit_status(p.user_id)}
    except Exception as e: raise HTTPException(400, str(e))

@app.post("/admin/reset-credits")
def admin_reset(user_id: str = Query(...), _=Depends(_require_admin)):
    try: _reset_credits(user_id); return {"success": True, "status": get_credit_status(user_id)}
    except Exception as e:
        import logging
        logging.getLogger("sociomee").error(f"Internal error: {e}", exc_info=True)
        raise HTTPException(500, "Something went wrong. Please try again.")

@app.post("/admin/add-bonus")
def admin_bonus(p: BonusRequest, _=Depends(_require_admin)):
    try: total = add_credits(p.user_id, p.amount); return {"success": True, "credits": total}
    except Exception as e:
        import logging
        logging.getLogger("sociomee").error(f"Internal error: {e}", exc_info=True)
        raise HTTPException(500, "Something went wrong. Please try again.")

@app.get("/admin/all-usage")
def admin_usage(_=Depends(_require_admin)):
    try: return get_all_usage()
    except Exception as e:
        import logging
        logging.getLogger("sociomee").error(f"Internal error: {e}", exc_info=True)
        raise HTTPException(500, "Something went wrong. Please try again.")

# ── Google Translate Proxy (no API key needed) ─────────────────────
@app.post("/translate")
@limiter.limit("20/minute")
async def translate_text(request: Request):
    import httpx, urllib.parse
    body = await request.json()
    text = body.get("text", "").strip()[:5000]  # max 5000 chars
    target_lang = body.get("target_lang", "hi")
    if not text:
        raise HTTPException(status_code=400, detail="No text provided")
    if len(text) > 5000:
        raise HTTPException(status_code=400, detail="Text too long. Max 5000 characters.")
    
    lang_map = {"hi":"hi","mr":"mr","ta":"ta","bn":"bn","gu":"gu","te":"te"}
    tl = lang_map.get(target_lang, "hi")
    
    source_lang = body.get("source_lang", "auto")
    sl = source_lang if source_lang != "en" else "en"
    encoded = urllib.parse.quote(text)
    url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl={sl}&tl={tl}&dt=t&q={encoded}"
    
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(url, headers={"User-Agent":"Mozilla/5.0"})
    
    if resp.status_code != 200:
        raise HTTPException(status_code=502, detail="Translation service error")
    
    data = resp.json()
    translated = "".join(part[0] for part in data[0] if part[0])
    return {"translated": translated, "lang": target_lang}

# ── Subtitle Generator (AssemblyAI) ───────────────────────────────────
@app.post("/subtitles/upload")
@limiter.limit("3/hour")
async def upload_for_subtitles(request: Request, file: UploadFile = File(...), lang: str = Form("auto"), user: dict = Depends(get_current_user)):
    import httpx, os
    err = _check_credits(user.get("user_id",""))
    if err: return err
    api_key = os.environ.get("ASSEMBLYAI_API_KEY", "")

    contents = await file.read()
    # Validate file size (max 25MB)
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 25MB.")
    # Validate MIME type
    allowed_types = ["audio/mpeg","audio/mp4","audio/wav","audio/ogg","audio/webm","video/mp4","video/webm","video/quicktime","application/octet-stream"]
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Invalid file type: {file.content_type}. Allowed: audio/video files only.")
    if not contents or len(contents) < 1000:
        raise HTTPException(status_code=400, detail=f"File is empty or too small ({len(contents)} bytes). Please try again.")

    # Map lang codes
    lang_map = {"en":"en","hi":"hi","auto":None,"mr":"hi","ta":"ta","bn":"bn","gu":"gu","te":"te"}
    language_code = lang_map.get(lang, None)

    async with httpx.AsyncClient(timeout=180) as client:
        # Step 1: Upload raw bytes to AssemblyAI
        upload_resp = await client.post(
            "https://api.assemblyai.com/v2/upload",
            headers={"authorization": api_key, "content-type": "application/octet-stream"},
            content=contents
        )
        if upload_resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Upload failed: {upload_resp.text}")
        upload_url = upload_resp.json()["upload_url"]

        # Step 2: Request transcription
        payload = {
            "audio_url": upload_url,
            "punctuate": True,
            "format_text": True,
        }
        if language_code:
            payload["language_code"] = language_code
        else:
            payload["language_detection"] = True

        transcript_resp = await client.post(
            "https://api.assemblyai.com/v2/transcript",
            headers={"authorization": api_key, "content-type": "application/json"},
            json=payload
        )
        if transcript_resp.status_code != 200:
            raise HTTPException(status_code=502, detail=f"Transcription request failed: {transcript_resp.text}")
        transcript_id = transcript_resp.json()["id"]
        # SECURITY: record which user owns this transcript so /subtitles/status can
        # verify ownership later (prevents one user from viewing another's transcript
        # just by guessing or obtaining the ID — IDOR).
        try:
            import redis as _redis_subtitle, json as _json_subtitle
            _rcs = _redis_subtitle.Redis(host="localhost", port=6379, db=0, decode_responses=True)
            _rcs.setex(f"transcript_owner:{transcript_id}", 24*60*60, user.get("user_id", ""))
        except Exception as _own_e:
            log.warning("Failed to record transcript ownership: %s", _own_e)
        return {"transcript_id": transcript_id}

@app.get("/subtitles/status/{transcript_id}")
@limiter.limit("30/minute")
async def subtitle_status(transcript_id: str, request: Request, user: dict = Depends(get_current_user)):
    import httpx, os
    # SECURITY: verify the requesting user actually owns this transcript before
    # returning anything (IDOR check).
    try:
        import redis as _redis_subtitle2
        _rcs2 = _redis_subtitle2.Redis(host="localhost", port=6379, db=0, decode_responses=True)
        _owner = _rcs2.get(f"transcript_owner:{transcript_id}")
        if _owner is not None and _owner != user.get("user_id", ""):
            raise HTTPException(status_code=403, detail="Access denied")
    except HTTPException:
        raise
    except Exception as _own_e2:
        log.warning("Transcript ownership check failed (allowing through, record may have expired): %s", _own_e2)
    api_key = os.environ.get("ASSEMBLYAI_API_KEY", "")
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(
            f"https://api.assemblyai.com/v2/transcript/{transcript_id}",
            headers={"authorization": api_key}
        )
        data = resp.json()
        status = data.get("status")
        if status == "completed":
            words = data.get("words", [])
            text  = data.get("text", "")

            def ms_to_srt(ms):
                s = ms // 1000
                ms_r = ms % 1000
                return f"{s//3600:02}:{(s%3600)//60:02}:{s%60:02},{ms_r:03}"

            chunk_size = 10
            chunks = [words[i:i+chunk_size] for i in range(0, len(words), chunk_size)]

            srt = ""
            for i, chunk in enumerate(chunks):
                if not chunk: continue
                srt += f"{i+1}\n{ms_to_srt(chunk[0]['start'])} --> {ms_to_srt(chunk[-1]['end'])}\n{' '.join(w['text'] for w in chunk)}\n\n"

            import urllib.parse
            srt_en = ""
            translated_text = ""
            try:
                import httpx as _hx
                # Add context hint to preserve proper nouns like game names, creator names
                context_text = text.replace("GT", "GTA").replace("dhani", "Dhoni")
                encoded = urllib.parse.quote(context_text)
                tr = await _hx.AsyncClient(timeout=30).get(
                    f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q={encoded}",
                    headers={"User-Agent":"Mozilla/5.0"}
                )
                tr_data = tr.json()
                translated_text = "".join(part[0] for part in tr_data[0] if part[0])
                tr_words = translated_text.split()
                valid_chunks = [c for c in chunks if c]
                wpc = max(1, len(tr_words) // max(1, len(valid_chunks)))
                idx2 = 0
                for i, chunk in enumerate(chunks):
                    if not chunk: continue
                    cw = tr_words[idx2:idx2+wpc]
                    idx2 += wpc
                    if cw:
                        srt_en += f"{i+1}\n{ms_to_srt(chunk[0]['start'])} --> {ms_to_srt(chunk[-1]['end'])}\n{' '.join(cw)}\n\n"
            except Exception as e:
                print(f"[SUBTITLE] Translation error: {e}")

            return {"status":"completed","text":text,"srt":srt,"srt_en":srt_en,"translated_text":translated_text,"words":len(words)}
        return {"status": status}

# ── Hashtag Generator (Real trending from best-hashtags.com) ─────────
@app.post("/hashtags/generate")
@limiter.limit("10/minute")
async def generate_hashtags(request: Request):
    import httpx, re
    from bs4 import BeautifulSoup
    body = await request.json()
    keyword = body.get("keyword", "").strip()[:100]  # max 100 chars
    platform = body.get("platform", "instagram")
    if not keyword:
        raise HTTPException(status_code=400, detail="Keyword required")
    if len(keyword) > 100:
        raise HTTPException(status_code=400, detail="Keyword too long. Max 100 characters.")
    if not _check_topic_safety(keyword):
        raise HTTPException(status_code=400, detail="This topic cannot be generated. SocioMee does not create content involving self-harm, sexual content, slurs, hate speech, or violence.")

    kw_slug = keyword.lower().replace(" ", "")
    hashtags = []

    async with httpx.AsyncClient(timeout=20, follow_redirects=True) as client:
        # Scrape real trending hashtags from best-hashtags.com
        try:
            url = f"https://best-hashtags.com/hashtag/{kw_slug}/"
            r = await client.get(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, "html.parser")
                # Find all hashtag text blocks (they're in p1 tag boxes)
                tag_boxes = soup.find_all("div", class_="p1")
                for box in tag_boxes[:2]:  # First 2 sets
                    text = box.get_text()
                    found = re.findall(r"#\w+", text)
                    for tag in found:
                        if tag not in hashtags:
                            hashtags.append(tag.lower())
                # Also get recommended hashtags from sidebar
                sidebar = soup.find_all("li")
                for li in sidebar:
                    a = li.find("a")
                    if a and a.get_text().startswith("#"):
                        tag = a.get_text().strip().lower()
                        if tag not in hashtags:
                            hashtags.append(tag)
        except Exception as e:
            print(f"[HASHTAG] Scrape error: {e}")

    # If scraping failed or not enough, add platform-specific power tags
    platform_tags = {
        "instagram": ["#reels","#instadaily","#explore","#viral","#trending","#instagood",
                      "#fyp","#foryou","#india","#indiancreator","#instagram","#reelsindia",
                      "#viralreels","#reelsviral","#instagramreels","#explorepage",
                      "#followforfollowback","#likeforlikes","#photography","#love"],
        "youtube":   ["#youtube","#shorts","#viral","#trending","#youtuber","#subscribe",
                      "#youtubeshorts","#india","#hindivideo","#youtubeindia","#viralvideo",
                      "#youtubevideos","#ytshorts","#newvideo","#vlog","#youtubecreatorsforchange"],
        "twitter":   ["#trending","#viral","#india","#twitter","#thread","#twitterindia",
                      "#tweet","#news","#indiatweets","#breakingnews"],
        "linkedin":  ["#linkedin","#professional","#career","#business","#india","#growth",
                      "#networking","#jobs","#hiring","#motivation","#startup","#entrepreneurship"],
    }

    # Merge scraped + platform tags, keyword first
    kw_tag = f"#{kw_slug}"
    final = [kw_tag] if kw_tag not in hashtags else []
    final += hashtags
    for tag in platform_tags.get(platform, []):
        if tag not in final:
            final.append(tag)

    # Clean and limit
    cleaned = []
    for tag in final:
        t = re.sub(r"[^\w#]", "", tag)
        if t.startswith("#") and 2 < len(t) < 36:
            cleaned.append(t)

    return {"hashtags": cleaned[:30], "keyword": keyword, "platform": platform}

# ── Hook Generator (Free - template based) ────────────────────────────
@app.post("/hooks/generate")
@limiter.limit("10/minute")
async def generate_hooks(request: Request):
    import random
    body = await request.json()
    topic = body.get("topic", "").strip()[:200]  # max 200 chars
    platform = body.get("platform", "youtube")
    tone = body.get("tone", "curiosity")
    language = body.get("language", "hinglish")

    if not topic:
        raise HTTPException(status_code=400, detail="Topic required")
    if not _check_topic_safety(topic):
        raise HTTPException(status_code=400, detail="This topic cannot be generated. SocioMee does not create content involving self-harm, sexual content, slurs, hate speech, or violence.")
    if len(topic) > 200:
        raise HTTPException(status_code=400, detail="Topic too long. Max 200 characters.")

    t = topic.lower()
    T = topic.title()

    # Hook templates by style
    templates = {
        "curiosity": [
            f"Nobody tells you this about {t}...",
            f"The {t} secret nobody is talking about",
            f"What they don't want you to know about {t}",
            f"I discovered something shocking about {t}",
            f"The hidden truth about {t} that changed everything",
            f"Why everyone is wrong about {t}",
            f"The {t} mistake 99% of people make",
            f"This {t} hack will blow your mind",
            f"I wish someone told me this about {t} earlier",
            f"The real reason {t} doesn't work for most people",
        ],
        "shock": [
            f"I wasted ₹50,000 on {t} before learning this",
            f"{T} is lying to you — here's proof",
            f"Stop doing {t} right now — watch this first",
            f"I tried {t} for 30 days — the results shocked me",
            f"This {t} mistake is costing you money",
            f"Warning: {T} is not what you think",
            f"The dark side of {t} nobody shows you",
            f"I almost quit {t} until I discovered this",
            f"{T} destroyed my life — here's what I learned",
            f"This is what {t} does to your body/mind/money",
        ],
        "pov": [
            f"POV: You finally figured out {t}",
            f"POV: You discovered the secret to {t}",
            f"POV: Your {t} journey just changed forever",
            f"Day 1 of learning {t} vs Day 30",
            f"Me before {t} vs me after {t}",
            f"POV: You're watching this before starting {t}",
            f"That moment when {t} finally clicks",
            f"POV: You just found the best {t} guide",
            f"POV: You wish you knew this about {t} earlier",
            f"Imagine if {t} was actually this simple",
        ],
        "number": [
            f"5 {t} mistakes you're making right now",
            f"10 things I learned from {t} in 30 days",
            f"3 {t} hacks that changed my life",
            f"7 reasons why your {t} isn't working",
            f"Top 5 {t} secrets experts use",
            f"I tried 10 {t} methods — here's what works",
            f"5 signs you're doing {t} wrong",
            f"3 {t} tips that got me 10x results",
            f"The only 5 things you need for {t}",
            f"7 {t} facts that will shock you",
        ],
        "story": [
            f"How {t} completely changed my life in 30 days",
            f"My {t} journey from zero to results",
            f"The day {t} changed everything for me",
            f"From broke to successful using {t} — my story",
            f"I failed at {t} 10 times before this worked",
            f"How I mastered {t} in just 30 days",
            f"The moment I realized {t} was the answer",
            f"My honest {t} journey — the good and bad",
            f"How {t} saved me ₹1 lakh",
            f"The {t} journey nobody talks about honestly",
        ],
        "question": [
            f"Are you making this {t} mistake?",
            f"Why is nobody talking about this {t} secret?",
            f"What if {t} could change your life?",
            f"Have you tried this {t} hack yet?",
            f"Is {t} really worth it in 2025?",
            f"Why does {t} work for some but not others?",
            f"What happens when you do {t} every day?",
            f"Can {t} really make a difference?",
            f"Are you ready to transform your {t}?",
            f"What's stopping you from succeeding at {t}?",
        ],
        "hinglish": [
            f"Yaar, ye {t} wali baat kisi ne nahi batai",
            f"{T} ka ye secret ab tak chupaaya gaya tha",
            f"Bhai, {t} mein ye galti mat karna",
            f"₹500 mein {t} ka ye jugaad try karo",
            f"Maine {t} try kiya aur ye hua...",
            f"{T} ke baare mein sach janke shock ho jaoge",
            f"Ye {t} hack dekho, life badal jaayegi",
            f"Bina paise ke {t} kaise karein — full guide",
            f"{T} mein itna paisa kyun waste karte ho?",
            f"Ab {t} easy ho gaya — dekho kaise",
        ],
    }

    # Platform specific additions
    platform_prefix = {
        "instagram": ["Reels mein viral hoga ye {t} content", "Save karo ye {t} tips"],
        "youtube": [f"Watch till end for the best {t} hack", f"This {t} video will change how you think"],
        "linkedin": [f"After 10 years in {t}, here's what I learned", f"Unpopular opinion about {t}:"],
    }

    # Pick templates based on tone
    chosen = templates.get(tone, templates["curiosity"])
    if language == "hinglish":
        chosen = chosen + templates.get("hinglish", [])

    # Mix and get 10 unique hooks
    random.shuffle(chosen)
    hooks = chosen[:10]

    # Add platform specific if available
    plat_hooks = platform_prefix.get(platform, [])
    for ph in plat_hooks:
        if len(hooks) < 10:
            hooks.append(ph.format(t=t, T=T) if "{t}" in ph or "{T}" in ph else ph)

    return {"hooks": hooks[:10], "topic": topic, "platform": platform, "tone": tone}

# ── Promo Code Validator ──────────────────────────────────────────────
PROMO_CODES = {
    "PRODUCTHUNT": {"plan": "pro", "months": 1, "discount": 100, "desc": "1 month Pro free for Product Hunt community"},
    "BIRTHDAY11":  {"plan": "pro", "months": 1, "discount": 100, "desc": "Birthday special - 1 month Pro free"},
    "SOCIOMEE50":  {"plan": "pro", "months": 1, "discount": 50,  "desc": "50% off Pro plan"},
}

@app.post("/promo/validate")
async def validate_promo(request: Request):
    body = await request.json()
    code = body.get("code", "").strip().upper()
    if code in PROMO_CODES:
        return {"valid": True, "promo": PROMO_CODES[code], "code": code}
    raise HTTPException(status_code=404, detail="Invalid promo code")

@app.post("/removebg")
@limiter.limit("5/hour")
async def remove_bg(request: Request, user: dict = Depends(get_current_user)):
    import httpx, base64
    body = await request.json()
    img_data = body.get("image","")
    api_key = os.environ.get("REMOVE_BG_API_KEY","")
    if not api_key:
        raise HTTPException(503, "Remove BG not configured.")
    # Decode base64 image
    if "," in img_data:
        img_data = img_data.split(",")[1]
    img_bytes = base64.b64decode(img_data)
    # Check credits before calling paid API
    err = _check_credits(user.get("user_id",""))
    if err: return err

    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(
            "https://api.remove.bg/v1.0/removebg",
            headers={"X-Api-Key": api_key},
            files={"image_file": ("image.png", img_bytes, "image/png")},
            data={"size": "auto"}
        )
        if r.status_code != 200:
            raise HTTPException(502, "BG removal failed.")
        result_b64 = base64.b64encode(r.content).decode()
        return {"image": f"data:image/png;base64,{result_b64}"}

# ── SocioMee Share ─────────────────────────────────────────────────────────
import secrets, base64, time

@app.post("/share/create")
@limiter.limit("30/hour")
async def share_create(request: Request, user: dict = Depends(get_current_user)):
    body = await request.json()
    file_data = body.get("file", "")      # base64
    file_name = body.get("name", "file")
    file_type = body.get("type", "application/octet-stream")
    file_size = body.get("size", 0)
    message   = body.get("message", "")
    expires_in = int(body.get("expires", 1800))  # 30 min default

    if file_size > 50 * 1024 * 1024:
        raise HTTPException(400, "File too large. Max 50MB.")

    ALLOWED_TYPES = {
        # Images
        "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml",
        # Video
        "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
        # Audio
        "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
        # Documents
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        # Text
        "text/plain", "text/csv",
        # Archives
        "application/zip", "application/x-rar-compressed", "application/x-7z-compressed",
    }
    if file_type not in ALLOWED_TYPES:
        raise HTTPException(400, f"File type '{file_type}' is not allowed.")

    code = str(secrets.randbelow(900000) + 100000)  # 6-digit code
    key  = f"share:{code}"
    payload = {
        "code": code,
        "name": file_name,
        "type": file_type,
        "size": file_size,
        "file": file_data,
        "message": message,
        "sender": user.get("name", "Someone"),
        "created": int(time.time()),
        "expires": int(time.time()) + expires_in,
    }
    import json, redis as _redis_mod
    _rc = _redis_mod.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    _rc.setex(key, expires_in, json.dumps(payload))
    return {"code": code, "expires_in": expires_in}

@app.get("/share/{code}")
async def share_get(code: str, request: Request):
    import json, redis as _redis_mod
    _rc = _redis_mod.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    key = f"share:{code}"
    raw = _rc.get(key)
    if not raw:
        raise HTTPException(404, "Share not found or expired.")
    data = json.loads(raw)
    # Return metadata only first
    return {
        "code": data["code"],
        "name": data["name"],
        "type": data["type"],
        "size": data["size"],
        "message": data["message"],
        "sender": data["sender"],
        "expires": data["expires"],
        "file": data["file"],  # base64
    }

@app.delete("/share/{code}")
async def share_delete(code: str, user: dict = Depends(get_current_user)):
    import redis as _redis_mod
    _rc = _redis_mod.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    _rc.delete(f"share:{code}")
    return {"deleted": True}

# ── SocioMee Share — Abuse Report ──────────────────────────────────────────
@app.post("/share/report")
@limiter.limit("10/hour")
async def share_report(request: Request):
    body = await request.json()
    code = body.get("code", "unknown")
    reason = body.get("reason", "not specified")
    reporter_ip = request.headers.get("X-Real-IP", request.client.host)
    import logging, redis as _redis_report
    _rc_report = _redis_report.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    logging.warning(f"[ABUSE REPORT] code={code} reason={reason} ip={reporter_ip}")
    _rc_report.delete(f"share:{code}")
    return {"status": "reported", "message": "Thank you. The file has been removed and will be reviewed."}
