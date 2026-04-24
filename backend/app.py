"""
app.py — SocioMee FastAPI Backend
"The API Layer — Routes, Request Validation, Response Assembly"

Architecture:
    All AI work happens in the engines — this file only routes, validates,
    assembles responses, and enforces credits. No AI logic lives here.

Engine routing:
    /generate-full-content      → ai_router.generate_full_content()   (6-engine pipeline)
    /generate-deep-research     → research_engine.generate_research()  (GNews + DeepSeek)
    /generate-script            → ai_scriptwriter.AIScriptwriter       (Gemma)
    /generate-platform-content  → per-platform engine dispatch
    /generate-content           → logic.generate_content()             (legacy)
    /generate-x                 → XEngine
    /generate-pinterest         → PinterestEngine
    /generate-facebook          → FacebookEngine
    /generate-tiktok            → TikTokEngine
    /generate-telegram          → TelegramEngine
    /generate-threads           → ThreadsEngine
    /thumbnail/*                → thumbnail_ai

Key changes vs v1:
    - Passes persona_data to generate_seo() so SEO pack is persona-aware
    - /generate-full-content now returns the new seo_engine platform packs
      (youtube, instagram, tiktok, x, facebook, threads, pinterest, telegram)
    - /generate-deep-research route is properly wired (was broken in v1)
    - ai_generate ("ai" platform) now passes full payload correctly
    - All NVIDIA references removed from response assembly
    - Credits check unified into a single helper _check_credits()
    - Response normalizer _normalize_full_content() is the single source
      of truth for the /generate-full-content response shape
    - Auth routes now handled via auth.router (APIRouter) — no direct imports
"""

from __future__ import annotations

import io
import logging
import os
import re
from typing import Any, Dict, Optional

from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from pydantic import BaseModel, Field

# ── Logger (must be defined before any try/except import blocks use it)
log = logging.getLogger("app")

from auth_routes import router as auth_router
from middleware import get_current_user, optional_user, require_plan

try:
    from PIL import Image as PILImage
except ImportError:
    PILImage = None


# ══════════════════════════════════════════════════════════════════════
# ENGINE IMPORTS  (all safe — never crash the server on import failure)
# ══════════════════════════════════════════════════════════════════════

# ── Core pipeline ─────────────────────────────────────────────────────
try:
    from ai_router import generate_full_content as _generate_full_content
    from ai_router import generate_content as _ai_generate
    _HAS_AI_ROUTER = True
except Exception as _e:
    log.warning("ai_router import failed: %s", _e)
    _HAS_AI_ROUTER = False
    _generate_full_content = None  # type: ignore[assignment]
    def _ai_generate(data: dict) -> dict:  # type: ignore[misc]
        return {"error": "ai_router not available", "model_used": "none", "score": 0, "optimized": False}

try:
    from research_engine import generate_research as _generate_research
    _HAS_RESEARCH = True
except Exception as _e:
    log.warning("research_engine import failed: %s", _e)
    _HAS_RESEARCH = False
    def _generate_research(*a, **kw) -> dict:  # type: ignore[misc]
        return {"error": "research_engine not available"}

try:
    from ai_scriptwriter import AIScriptwriter
    _HAS_SCRIPTWRITER = True
except Exception as _e:
    log.warning("ai_scriptwriter import failed: %s", _e)
    _HAS_SCRIPTWRITER = False
    AIScriptwriter = None  # type: ignore[assignment,misc]

# ── Credits ───────────────────────────────────────────────────────────
try:
    from credits_manager import (
        use_credit, get_user_credits, get_credit_status,
        set_user_plan, ban_user, unban_user,
        reset_user_credits as _reset_user_credits,
        add_bonus_credits, get_abuse_report, get_plan_info,
    )
    _HAS_CREDITS = True
except Exception:
    _HAS_CREDITS = False
    def use_credit(user_id: str) -> bool:               return True   # type: ignore[misc]
    def get_user_credits(user_id: str) -> int:          return 999    # type: ignore[misc]
    def get_credit_status(user_id: str) -> dict:        return {"credits_left": 999, "plan": "unlimited"}  # type: ignore[misc]
    def set_user_plan(uid: str, plan: str) -> None:     pass  # type: ignore[misc]
    def ban_user(uid: str, reason: str = "") -> None:   pass  # type: ignore[misc]
    def unban_user(uid: str) -> None:                   pass  # type: ignore[misc]
    def _reset_user_credits(uid: str) -> None:          pass  # type: ignore[misc]
    def add_bonus_credits(uid: str, amt: int) -> int:   return 999  # type: ignore[misc]
    def get_abuse_report() -> dict:                     return {}  # type: ignore[misc]
    def get_plan_info(plan=None) -> dict:               return {}  # type: ignore[misc]

# ── Legacy content engine ─────────────────────────────────────────────
try:
    from logic import generate_content as _logic_generate_content
    _HAS_LOGIC = True
except Exception:
    _HAS_LOGIC = False
    def _logic_generate_content(*a, **kw) -> dict:  # type: ignore[misc]
        return {"error": "logic.py not available"}

# ── Platform engines ──────────────────────────────────────────────────
try:
    from youtube_engine import YouTubeIntelligenceEngine
    _HAS_YOUTUBE_ENGINE = True
except Exception:
    _HAS_YOUTUBE_ENGINE = False
    YouTubeIntelligenceEngine = None  # type: ignore[assignment,misc]

try:
    from instagram_engine import InstagramEngine
    _HAS_INSTAGRAM = True
except Exception:
    _HAS_INSTAGRAM = False
    InstagramEngine = None  # type: ignore[assignment,misc]

try:
    from x_engine import XEngine
    _HAS_X = True
except Exception:
    _HAS_X = False
    XEngine = None  # type: ignore[assignment,misc]

try:
    from pinterest_engine import PinterestEngine
    _HAS_PINTEREST = True
except Exception:
    _HAS_PINTEREST = False
    PinterestEngine = None  # type: ignore[assignment,misc]

try:
    from facebook_engine import FacebookEngine
    _HAS_FACEBOOK = True
except Exception:
    _HAS_FACEBOOK = False
    FacebookEngine = None  # type: ignore[assignment,misc]

try:
    from tiktok_engine import TikTokEngine
    _HAS_TIKTOK = True
except Exception:
    _HAS_TIKTOK = False
    TikTokEngine = None  # type: ignore[assignment,misc]

try:
    from telegram_engine import TelegramEngine
    _HAS_TELEGRAM = True
except Exception:
    _HAS_TELEGRAM = False
    TelegramEngine = None  # type: ignore[assignment,misc]

try:
    from threads_engine import ThreadsEngine
    _HAS_THREADS = True
except Exception:
    _HAS_THREADS = False
    ThreadsEngine = None  # type: ignore[assignment,misc]

# ── Thumbnail AI ──────────────────────────────────────────────────────
try:
    from thumbnail_ai import analyze_thumbnail_real, compare_thumbnails_real
    _HAS_THUMBNAIL = True
except ImportError:
    _HAS_THUMBNAIL = False
    def analyze_thumbnail_real(image_bytes, mime_type, keyword, niche, plan):  # type: ignore[misc]
        return None
    def compare_thumbnails_real(**kwargs):  # type: ignore[misc]
        return None


# ══════════════════════════════════════════════════════════════════════
# APP SETUP
# ══════════════════════════════════════════════════════════════════════

app = FastAPI(
    title="SocioMee Backend",
    version="2.0.0",
    description="AI-powered multi-platform content generation suite",
)

app.include_router(auth_router)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register auth router ───────────────────────────────────────────────
app.include_router(auth_router)

# _DEFAULT_USER kept as fallback only — real routes use Depends(get_current_user)
_DEFAULT_USER = "default_user"


# ══════════════════════════════════════════════════════════════════════
# REQUEST MODELS
# ══════════════════════════════════════════════════════════════════════

class GenerateContentRequest(BaseModel):
    keyword:      str = Field(..., min_length=1)
    platform:     str
    content_type: str
    tone:         str
    language:     str = "english"


class ScriptRequest(BaseModel):
    topic:            str = Field(..., min_length=1)
    language:         str = "hinglish"
    personality:      str = "default"
    duration_seconds: int = Field(default=180, ge=1)
    platform:         str = "youtube"


class XRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    tone:  str = "bold"


class PinterestRequest(BaseModel):
    topic: str = Field(..., min_length=1)
    niche: str = "general"


class FacebookRequest(BaseModel):
    topic:     str = Field(..., min_length=1)
    niche:     str = "lifestyle"
    tone:      str = "default"
    objective: str = "engagement"


class TikTokRequest(BaseModel):
    topic:            str = Field(..., min_length=1)
    niche:            str = "lifestyle"
    tone:             str = "default"
    objective:        str = "watch_time"
    duration_seconds: int = Field(default=30, ge=5)


class TelegramRequest(BaseModel):
    topic:            str = Field(..., min_length=1)
    niche:            str = "business"
    tone:             str = "default"
    objective:        str = "engagement"
    destination_type: str = "channel"


class ThreadsRequest(BaseModel):
    topic:         str = Field(..., min_length=1)
    niche:         str = "business"
    tone:          str = "default"
    objective:     str = "engagement"
    segment_count: int = Field(default=5, ge=2, le=7)


class DeepResearchRequest(BaseModel):
    keyword:     str = Field(..., min_length=1)
    language:    str = "hinglish"
    country:     str = "in"
    platform:    str = "youtube"
    personality: str = "dhruvrathee"
    tone:        str = "informative"
    format_type: str = "long"


class FullContentRequest(BaseModel):
    topic:    str = Field(..., min_length=1)
    persona:  str = "dhruvrathee"
    language: str = "hinglish"
    country:  str = "in"
    platform: str = "youtube"   # target platform for SEO pack selection


class PlatformContentRequest(BaseModel):
    topic:            str = Field(..., min_length=1)
    platform:         str
    niche:            str = "general"
    tone:             str = "default"
    objective:        str = "engagement"
    personality:      str = "default"
    format_type:      str = "long"
    duration_seconds: int = Field(default=180, ge=1)
    segment_count:    int = Field(default=5, ge=2, le=7)
    destination_type: str = "channel"
    language:         str = "hinglish"


# ══════════════════════════════════════════════════════════════════════
# SHARED HELPERS
# ══════════════════════════════════════════════════════════════════════

def _check_credits(user_id: str = _DEFAULT_USER) -> Optional[Dict[str, Any]]:
    """
    Consume one credit. Returns None on success (request allowed).
    Returns a structured error dict if banned or any limit is reached.
    The error dict includes the full credit_status block so the frontend
    can show the correct message and upgrade prompt.
    """
    allowed = use_credit(user_id)
    if not allowed:
        try:
            status = get_credit_status(user_id)
        except Exception:
            status = {"credits_left": 0, "plan": "free", "upgrade_message": ""}

        if status.get("banned"):
            msg = f"Account suspended: {status.get('ban_reason', 'Policy violation')}."
        else:
            plan   = status.get("plan", "free")
            limit  = status.get("daily_limit", 30)
            upgrade= status.get("upgrade_message", "")
            msg    = (
                f"Daily limit of {limit} credits reached on your {plan.title()} plan. "
                + (upgrade if upgrade else "")
            )

        return {
            "error":          msg,
            "credits_left":   0,
            "credit_status":  status,
        }
    return None


def _attach_credits(result: dict, user_id: str = _DEFAULT_USER) -> dict:
    """
    Attach the full credit_status block to any successful response.
    The frontend uses this to show the credit counter + upgrade nudge.
    """
    if isinstance(result, dict):
        try:
            status = get_credit_status(user_id)
        except Exception:
            status = {"credits_left": get_user_credits(user_id)}
        result["credits_left"]  = status.get("credits_left", 0)
        result["credit_status"] = status
    return result


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]", "", (text or "").lower())


def _normalize_full_content(
    raw:      Dict[str, Any],
    payload:  FullContentRequest,
    platform: str = "youtube",
) -> Dict[str, Any]:
    """
    Single source of truth for the /generate-full-content response shape.

    Assembles the full normalized response from the ai_router pipeline output.
    Uses the new seo_engine platform packs directly — no manual re-building.

    Args:
        raw:      Output of ai_router.generate_full_content().
        payload:  Original request payload.
        platform: Target platform for SEO pack selection (default "youtube").

    Returns:
        Normalized response dict ready to send to the client.
    """
    structure  = raw.get("structure",  {})
    seo_scores = raw.get("seo_scores", [])    # list of {title, score, grade, breakdown, tips}
    titles     = raw.get("titles",     [])
    script     = raw.get("script",     "")
    persona_d  = raw.get("persona",    {})
    research   = raw.get("research",   {})
    errors     = raw.get("errors",     [])

    # ── SEO platform packs (new seo_engine output) ────────────────────
    seo_result  = raw.get("seo_result", {})
    yt_pack     = seo_result.get("youtube",   {})
    ig_pack     = seo_result.get("instagram", {})
    tiktok_pack = seo_result.get("tiktok",    {})
    x_pack      = seo_result.get("x",         {})
    fb_pack     = seo_result.get("facebook",  {})
    threads_pack= seo_result.get("threads",   {})
    pinterest_pack = seo_result.get("pinterest", {})
    telegram_pack  = seo_result.get("telegram",  {})

    # Select the platform-specific pack for the requested platform
    platform_pack = {
        "youtube":   yt_pack,
        "instagram": ig_pack,
        "tiktok":    tiktok_pack,
        "x":         x_pack,
        "facebook":  fb_pack,
        "threads":   threads_pack,
        "pinterest": pinterest_pack,
        "telegram":  telegram_pack,
    }.get(platform, yt_pack)

    # ── Script metadata ───────────────────────────────────────────────
    topic_slug  = _slug(payload.topic)
    best_score  = seo_scores[0].get("score", 0) if seo_scores else 0
    best_title  = raw.get("best_title", titles[0] if titles else payload.topic)

    # ── Titles with score (client-friendly shape) ─────────────────────
    titles_with_score = [
        {
            "title":     s.get("title",     ""),
            "seo_score": s.get("score",      0),
            "grade":     s.get("grade",     ""),
            "tips":      s.get("tips",       []),
            "breakdown": s.get("breakdown",  {}),
        }
        for s in seo_scores
    ]

    # ── Sections (for frontend rendering) ─────────────────────────────
    kp_sections = [
        {"title": f"Key Point {i + 1}", "text": kp}
        for i, kp in enumerate(structure.get("key_points", []))
    ]
    all_sections = [
        {"title": "Hook",       "text": structure.get("hook",       "")},
        {"title": "Background", "text": structure.get("background", "")},
        {"title": "Timeline",   "text": " | ".join(structure.get("timeline", []))},
        {"title": "Main Issue", "text": structure.get("conflict",   "")},
    ] + kp_sections + [
        {"title": "Conclusion", "text": structure.get("conclusion", "")},
    ]

    # ── YouTube description (from seo_engine pack if available) ───────
    yt_description = (
        yt_pack.get("description")
        or (
            structure.get("hook", "") + "\n\n"
            + structure.get("conflict", "") + "\n\n"
            + "Watch till the end for the full breakdown.\n\n"
            + "Subscribe for more in-depth analysis."
        )
    )

    # ── SEO metadata (from seo_engine pack if available) ──────────────
    search_queries = (
        yt_pack.get("search_queries")
        or [
            f"{payload.topic} analysis", f"{payload.topic} explained",
            f"{payload.topic} full story", f"{payload.topic} truth",
            f"{payload.topic} investigation",
        ]
    )
    seo_hashtags = (
        yt_pack.get("hashtags")
        or [f"#{topic_slug}", "#investigation", "#viral", "#youtube", "#trending"]
    )

    return {
        # ── Identity ──────────────────────────────────────────────────
        "platform":           platform,
        "topic":              raw.get("topic",    payload.topic),
        "keyword":            raw.get("topic",    payload.topic),
        "language":           raw.get("language", payload.language),
        "personality":        persona_d.get("voice", payload.persona),
        "personality_used":   persona_d.get("name",  payload.persona),
        "format_type":        "long",

        # ── Script ───────────────────────────────────────────────────
        "script_text":        script,
        "word_count":         len(script.split()),
        "tone_style":         persona_d.get("tone",   "analytical"),
        "pacing":             persona_d.get("pacing", "medium"),
        "energy":             persona_d.get("energy", "medium"),

        # ── Structure ─────────────────────────────────────────────────
        "hook":               structure.get("hook",       ""),
        "intro":              structure.get("background", ""),
        "outro":              structure.get("conclusion", ""),
        "cta":                (persona_d.get("cta") or ["Subscribe for more content"])[0],
        "sections":           all_sections,
        "arc_structure":      [
            "hook", "background", "timeline", "main_issue",
            "evidence", "counterpoints", "implications", "conclusion",
        ],
        "content_mode":       "deep_research",

        # ── Titles + SEO scores ───────────────────────────────────────
        "titles":             titles,
        "titles_with_score":  titles_with_score,
        "best_title":         best_title,
        "scores": {
            "final_score":   best_score,
            "content_score": min(100, len(script.split()) // 20),
            "ai_score":      min(100, best_score + 5),
            "level":         seo_scores[0].get("grade", "B") if seo_scores else "B",
        },

        # ── YouTube SEO (always present) ──────────────────────────────
        "seo_description":    yt_description,
        "search_queries":     search_queries,
        "seo_hashtags":       seo_hashtags,
        "youtube_description":yt_description,
        "yt_tags":            yt_pack.get("tags",            []),
        "yt_timestamps":      yt_pack.get("timestamps",      []),
        "yt_pinned_comment":  yt_pack.get("pinned_comment",  ""),

        # ── Platform SEO packs (full) ──────────────────────────────────
        "seo_packs": {
            "youtube":   yt_pack,
            "instagram": ig_pack,
            "tiktok":    tiktok_pack,
            "x":         x_pack,
            "facebook":  fb_pack,
            "threads":   threads_pack,
            "pinterest": pinterest_pack,
            "telegram":  telegram_pack,
        },

        # ── Active platform pack ───────────────────────────────────────
        "platform_seo":       platform_pack,

        # ── Research provenance ───────────────────────────────────────
        "sources_raw":        research.get("timeline",     [])[:5],
        "sources_count":      len(research.get("sources",  [])),
        "research_brief":     structure,
        "research_errors":    errors,
    }


# ══════════════════════════════════════════════════════════════════════
# ROUTES
# ══════════════════════════════════════════════════════════════════════

@app.get("/")
def home():
    return {
        "message": "SocioMee Backend Running 🚀",
        "version": "2.0.0",
        "engines": {
            "ai_router":      _HAS_AI_ROUTER,
            "research":       _HAS_RESEARCH,
            "scriptwriter":   _HAS_SCRIPTWRITER,
            "youtube_engine": _HAS_YOUTUBE_ENGINE,
            "instagram":      _HAS_INSTAGRAM,
            "x":              _HAS_X,
            "pinterest":      _HAS_PINTEREST,
            "facebook":       _HAS_FACEBOOK,
            "tiktok":         _HAS_TIKTOK,
            "telegram":       _HAS_TELEGRAM,
            "threads":        _HAS_THREADS,
            "thumbnail_ai":   _HAS_THUMBNAIL,
        },
    }


@app.get("/health")
def health():
    """Quick health check — confirms the server is up."""
    return {"status": "ok"}


# ── Research test endpoint ────────────────────────────────────────────

@app.get("/test-research")
def test_research(
    topic:    str = Query(...),
    language: str = Query(default="english"),
    country:  str = Query(default="in"),
):
    """Test GNews + DeepSeek research pipeline directly."""
    if not _HAS_RESEARCH:
        raise HTTPException(status_code=503, detail="research_engine not available.")
    return _generate_research(topic=topic.strip(), language=language, country=country)


# ── Legacy content generator ──────────────────────────────────────────

@app.post("/generate-content")
def generate_content_api(payload: GenerateContentRequest):
    """
    Legacy 8-platform content generator via logic.py.
    Use /generate-platform-content for the full AI-powered pipeline.
    """
    if not _HAS_LOGIC:
        raise HTTPException(status_code=503, detail="logic.py not available.")
    try:
        return _logic_generate_content(
            keyword=payload.keyword.strip(),
            platform=payload.platform.strip().lower(),
            content_type=payload.content_type.strip().lower(),
            tone=payload.tone.strip().lower(),
            language=payload.language.strip().lower(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── AI Script Writer ──────────────────────────────────────────────────

@app.post("/generate-script")
def generate_script_api(payload: ScriptRequest):
    """
    Google Gemma 3 27B script writer — 2000-5000 word persona-aware scripts.

    Personas (Hinglish): dhruvrathee, carryminati, samayraina, shahrukhkhan, rebelkid, default
    Personas (English):  mrbeast, alexhormozi, joerogan, default
    Platforms: youtube, instagram, tiktok, x, threads, facebook, telegram, pinterest
    """
    if not _HAS_SCRIPTWRITER:
        raise HTTPException(status_code=503, detail="ai_scriptwriter not available.")
    try:
        writer = AIScriptwriter(
            language=payload.language.strip().lower(),
            personality=payload.personality.strip().lower(),
        )
        result = writer.generate_script(
            topic=payload.topic.strip(),
            duration_seconds=payload.duration_seconds,
            platform=payload.platform.strip().lower(),
        )
        return result.to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Platform-specific legacy routes (kept for backward compatibility) ─

@app.post("/generate-x")
def generate_x_api(payload: XRequest):
    """X/Twitter — tweet variants, thread opener, reply baits, viral analysis."""
    if not _HAS_X:
        raise HTTPException(status_code=503, detail="XEngine not available.")
    try:
        return XEngine().build_x_pack(
            topic=payload.topic.strip(),
            tone=payload.tone.strip().lower(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-pinterest")
def generate_pinterest_api(payload: PinterestRequest):
    """Pinterest — pin titles, descriptions, keywords, hashtags, viral score."""
    if not _HAS_PINTEREST:
        raise HTTPException(status_code=503, detail="PinterestEngine not available.")
    try:
        return PinterestEngine().generate(
            topic=payload.topic.strip(),
            niche=payload.niche.strip().lower(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-facebook")
def generate_facebook_api(payload: FacebookRequest):
    """
    Facebook — 19-field post pack.
    Tones:      default, bold, emotional, funny, educational, controversial
    Objectives: engagement, reach, leads, awareness
    """
    if not _HAS_FACEBOOK:
        raise HTTPException(status_code=503, detail="FacebookEngine not available.")
    try:
        return FacebookEngine().generate(
            topic=payload.topic.strip(),
            niche=payload.niche.strip().lower(),
            tone=payload.tone.strip().lower(),
            objective=payload.objective.strip().lower(),
        ).to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-tiktok")
def generate_tiktok_api(payload: TikTokRequest):
    """
    TikTok — 20-field video pack.
    Tones:      default, bold, funny, educational, emotional, controversial
    Objectives: watch_time, comments, shares, saves, retention
    """
    if not _HAS_TIKTOK:
        raise HTTPException(status_code=503, detail="TikTokEngine not available.")
    try:
        return TikTokEngine().generate(
            topic=payload.topic.strip(),
            niche=payload.niche.strip().lower(),
            tone=payload.tone.strip().lower(),
            objective=payload.objective.strip().lower(),
            duration_seconds=payload.duration_seconds,
        ).to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-telegram")
def generate_telegram_api(payload: TelegramRequest):
    """
    Telegram — 22-field channel/group pack.
    Tones:          default, bold, educational, friendly, premium, promotional, controversial
    Objectives:     engagement, leads, sales, comments, community, conversion
    Destination:    channel, group
    """
    if not _HAS_TELEGRAM:
        raise HTTPException(status_code=503, detail="TelegramEngine not available.")
    try:
        return TelegramEngine().generate(
            topic=payload.topic.strip(),
            niche=payload.niche.strip().lower(),
            tone=payload.tone.strip().lower(),
            objective=payload.objective.strip().lower(),
            destination_type=payload.destination_type.strip().lower(),
        ).to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-threads")
def generate_threads_api(payload: ThreadsRequest):
    """
    Threads — 21-field conversation pack.
    Tones:      default, bold, educational, friendly, premium, promotional, controversial, funny, emotional
    Objectives: engagement, comments, discussion, saves, leads
    Segments:   2 to 7
    """
    if not _HAS_THREADS:
        raise HTTPException(status_code=503, detail="ThreadsEngine not available.")
    try:
        return ThreadsEngine().generate(
            topic=payload.topic.strip(),
            niche=payload.niche.strip().lower(),
            tone=payload.tone.strip().lower(),
            objective=payload.objective.strip().lower(),
            segment_count=payload.segment_count,
        ).to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Deep Research ─────────────────────────────────────────────────────

@app.post("/generate-deep-research-content")
def deep_research_route(payload: DeepResearchRequest):
    """
    GNews + DeepSeek deep research pipeline.
    Stage 1: Fetch live news → clean → DeepSeek structural analysis
    Stage 2: Returns structured research brief (timeline, facts, insights, controversies)

    Use /generate-full-content to run the full 6-engine pipeline including
    script generation and SEO on top of the research.
    """
    if not _HAS_RESEARCH:
        raise HTTPException(status_code=503, detail="research_engine not available.")
    try:
        return _generate_research(
            topic=payload.keyword.strip(),
            language=payload.language.strip().lower(),
            country=payload.country or "in",
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ── Full Content Pipeline (master route) ──────────────────────────────

@app.post("/generate-full-content")
def generate_full_content_route(payload: FullContentRequest, user: dict = Depends(get_current_user)):
    """
    Master 6-engine AI pipeline.
    Enforces daily credits (30 per user).

    Pipeline:
        Step 1: GNews research      (research_engine)
        Step 2: YouTube trending    (youtube_engine)
        Step 3: Script structure    (structure_engine → DeepSeek)
        Step 4: Persona profile     (persona_profiles)
        Step 5: Script generation   (ai_scriptwriter → Google Gemma)
        Step 6: SEO pack            (seo_engine → 8 platforms)

    Returns a normalized content pack including:
        - 2000-5000 word persona-aware script
        - 3 SEO-scored title candidates with improvement tips
        - Full YouTube SEO pack (description, tags, timestamps, pinned comment)
        - Platform SEO packs for Instagram, TikTok, X, Facebook, Threads, Pinterest, Telegram
        - Script structure (hook, background, timeline, key points, conclusion)
        - Research provenance (sources, timeline)
    """
    if not _HAS_AI_ROUTER or _generate_full_content is None:
        raise HTTPException(status_code=503, detail="ai_router not available.")

    credit_err = _check_credits(user["user_id"])
    if credit_err:
        return credit_err

    try:
        raw = _generate_full_content(
            topic=payload.topic.strip(),
            persona=payload.persona.strip().lower(),
            language=payload.language.strip().lower(),
            country=payload.country.strip().lower(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    platform = payload.platform.strip().lower()
    result   = _normalize_full_content(raw, payload, platform=platform)
    return _attach_credits(result, user["user_id"])


# ── Unified Platform Content Dispatcher ──────────────────────────────

@app.post("/generate-platform-content")
def generate_platform_content(payload: PlatformContentRequest, user: dict = Depends(get_current_user)):
    """
    Unified platform content dispatcher.
    Routes to the correct engine based on platform.
    Enforces daily credits.

    Platforms:
        youtube   → YouTubeIntelligenceEngine.generate()
        instagram → InstagramEngine.build_intelligence_pack()
        x         → XEngine.build_x_pack()
        pinterest → PinterestEngine.generate()
        facebook  → FacebookEngine.generate()
        tiktok    → TikTokEngine.generate()
        telegram  → TelegramEngine.generate()
        threads   → ThreadsEngine.generate()
        ai        → ai_router.generate_content() (DeepSeek → Gemma)
    """
    platform  = payload.platform.strip().lower()
    topic     = payload.topic.strip()
    niche     = payload.niche.strip().lower()
    tone      = payload.tone.strip().lower()
    objective = payload.objective.strip().lower()
    language  = payload.language.strip().lower()
    personality = payload.personality.strip().lower()

    credit_err = _check_credits(user["user_id"])
    if credit_err:
        return credit_err

    try:
        if platform == "youtube":
            if not _HAS_YOUTUBE_ENGINE:
                raise HTTPException(status_code=503, detail="YouTubeIntelligenceEngine not available.")
            engine = YouTubeIntelligenceEngine()
            try:
                result = engine.generate(
                    topic=topic,
                    niche=niche,
                    personality=personality,
                    format_type=payload.format_type.strip().lower(),
                    duration_seconds=payload.duration_seconds,
                    language=language,
                    tone=tone,
                )
            except TypeError:
                result = engine.generate(
                    topic=topic,
                    niche=niche,
                    personality=personality,
                    format_type=payload.format_type.strip().lower(),
                    duration_seconds=payload.duration_seconds,
                    language=language,
                )

        elif platform == "instagram":
            if not _HAS_INSTAGRAM:
                raise HTTPException(status_code=503, detail="InstagramEngine not available.")
            result = InstagramEngine().build_intelligence_pack(
                keyword=topic,
                tone=tone,
                content_type="reel",
                niche=niche,
                language=language,
            )

        elif platform == "x":
            if not _HAS_X:
                raise HTTPException(status_code=503, detail="XEngine not available.")
            result = XEngine().build_x_pack(topic=topic, tone=tone)

        elif platform == "pinterest":
            if not _HAS_PINTEREST:
                raise HTTPException(status_code=503, detail="PinterestEngine not available.")
            result = PinterestEngine().generate(topic=topic, niche=niche)

        elif platform == "facebook":
            if not _HAS_FACEBOOK:
                raise HTTPException(status_code=503, detail="FacebookEngine not available.")
            result = FacebookEngine().generate(
                topic=topic, niche=niche, tone=tone, objective=objective,
            ).to_dict()

        elif platform == "tiktok":
            if not _HAS_TIKTOK:
                raise HTTPException(status_code=503, detail="TikTokEngine not available.")
            result = TikTokEngine().generate(
                topic=topic, niche=niche, tone=tone,
                objective=objective,
                duration_seconds=payload.duration_seconds,
            ).to_dict()

        elif platform == "telegram":
            if not _HAS_TELEGRAM:
                raise HTTPException(status_code=503, detail="TelegramEngine not available.")
            result = TelegramEngine().generate(
                topic=topic, niche=niche, tone=tone,
                objective=objective,
                destination_type=payload.destination_type.strip().lower(),
            ).to_dict()

        elif platform == "threads":
            if not _HAS_THREADS:
                raise HTTPException(status_code=503, detail="ThreadsEngine not available.")
            result = ThreadsEngine().generate(
                topic=topic, niche=niche, tone=tone,
                objective=objective,
                segment_count=payload.segment_count,
            ).to_dict()

        elif platform == "ai":
            result = _ai_generate({
                "topic":            topic,
                "platform":         payload.platform,
                "tone":             tone,
                "personality":      personality,
                "language":         language,
                "format_type":      payload.format_type.strip().lower(),
                "duration_seconds": payload.duration_seconds,
            })

        else:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"Unsupported platform: '{platform}'. "
                    f"Supported: youtube, instagram, x, pinterest, facebook, "
                    f"tiktok, telegram, threads, ai"
                ),
            )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    return _attach_credits(result, user["user_id"])


# ══════════════════════════════════════════════════════════════════════
# THUMBNAIL ROUTES
# ══════════════════════════════════════════════════════════════════════

@app.post("/thumbnail/analyze")
async def thumbnail_analyze(
    file:    UploadFile = File(...),
    keyword: str        = Form(""),
    niche:   str        = Form(""),
    plan:    str        = Form("free"),
):
    """
    AI Thumbnail Analyzer — scores and gives actionable feedback.
    Accepts multipart/form-data: file (jpg/png/webp), keyword, niche, plan.
    """
    try:
        image_bytes = await file.read()
        result = analyze_thumbnail_real(
            image_bytes=image_bytes,
            mime_type=file.content_type or "image/jpeg",
            keyword=keyword or niche or "general",
            niche=niche or keyword or "general",
            plan=plan,
        )
        if result:
            return result
        raise ValueError("analyze_thumbnail_real returned None")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/thumbnail/compare")
async def thumbnail_compare(
    file1:   UploadFile = File(...),
    file2:   UploadFile = File(...),
    keyword: str        = Form(""),
    niche:   str        = Form(""),
    plan:    str        = Form("pro"),
):
    """
    A/B Thumbnail Comparator — picks the higher-CTR thumbnail using AI.
    Accepts multipart/form-data: file1, file2, keyword, niche, plan.
    """
    try:
        image1_bytes = await file1.read()
        image2_bytes = await file2.read()
        result = compare_thumbnails_real(
            image1_bytes=image1_bytes,
            mime1=file1.content_type or "image/jpeg",
            image2_bytes=image2_bytes,
            mime2=file2.content_type or "image/jpeg",
            keyword=keyword,
            niche=niche,
            plan=plan,
        )
        if result:
            return result
        raise ValueError("compare_thumbnails_real returned None")
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/analyze-thumbnail")
async def analyze_thumbnail_simple(
    file:    UploadFile = File(...),
    keyword: str        = Form(""),
    niche:   str        = Form(""),
    title:   str        = Form(""),
):
    """
    Simple thumbnail analyzer — PIL-based fallback when thumbnail_ai is unavailable.
    Returns: fit_score, ctr_potential, verdict, suggestions, dimensions.
    """
    try:
        image_bytes = await file.read()

        if _HAS_THUMBNAIL:
            try:
                result = analyze_thumbnail_real(
                    image_bytes=image_bytes,
                    mime_type=file.content_type or "image/jpeg",
                    keyword=keyword or niche or "general",
                    niche=niche or keyword or "general",
                    plan="free",
                )
                if result:
                    return result
            except Exception:
                pass

        # ── PIL fallback ──────────────────────────────────────────────
        score  = 70
        width  = 0
        height = 0

        if PILImage:
            try:
                img           = PILImage.open(io.BytesIO(image_bytes))
                width, height = img.size
                ratio         = width / height if height > 0 else 0
                if 1.7 <= ratio <= 1.8:     score += 10
                if width >= 1280:            score += 8
                elif width >= 854:           score += 4
            except Exception:
                pass

        score = min(score, 100)

        suggestions = [
            "Increase contrast between subject and background for better visibility.",
            "Use bigger bold text — most viewers watch on mobile.",
            "Add a human face with a strong emotion to boost CTR.",
            "Use brighter, more saturated colors to stand out in the feed.",
        ]
        if width and width < 1280:
            suggestions.insert(0, f"Upgrade to 1280×720 minimum — current: {width}×{height}.")
        if width and height:
            ratio = width / height
            if not (1.7 <= ratio <= 1.8):
                suggestions.insert(0, "Use 16:9 aspect ratio (1280×720 or 1920×1080) for YouTube.")

        return {
            "fit_score":     score,
            "ctr_potential": max(0, score - 10),
            "verdict":       (
                "Good thumbnail with room for improvement."
                if score >= 70 else
                "Needs improvement for better CTR."
            ),
            "suggestions":   suggestions[:5],
            "dimensions":    f"{width}×{height}" if width else "unknown",
        }

    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ══════════════════════════════════════════════════════════════════════
# CREDITS & ADMIN ROUTES
# ══════════════════════════════════════════════════════════════════════

class SetPlanRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    plan:    str = Field(..., description="free | pro | team | unlimited")


class BanRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    reason:  str = "Policy violation"


class BonusRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    amount:  int = Field(..., ge=1, le=500)


@app.get("/credits/{user_id}")
def get_credits(user_id: str):
    """Return the full credit status for a user."""
    try:
        return get_credit_status(user_id)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/plans")
def list_plans():
    """Return all available plans and their limits — for upgrade UI."""
    try:
        return get_plan_info()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/admin/set-plan")
def admin_set_plan(payload: SetPlanRequest):
    """Upgrade or downgrade a user's plan. PROTECT THIS ENDPOINT."""
    try:
        set_user_plan(payload.user_id, payload.plan)
        return {
            "success": True,
            "message": f"Plan for '{payload.user_id}' set to '{payload.plan}'.",
            "status":  get_credit_status(payload.user_id),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/admin/reset-credits")
def admin_reset_credits(user_id: str = Query(...)):
    """Manually reset a user's daily credits to full. PROTECT THIS ENDPOINT."""
    try:
        _reset_user_credits(user_id)
        return {
            "success": True,
            "message": f"Credits reset for '{user_id}'.",
            "status":  get_credit_status(user_id),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/admin/ban")
def admin_ban(payload: BanRequest):
    """Ban a user. PROTECT THIS ENDPOINT."""
    try:
        ban_user(payload.user_id, payload.reason)
        return {
            "success": True,
            "message": f"User '{payload.user_id}' banned: {payload.reason}",
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/admin/unban")
def admin_unban(user_id: str = Query(...)):
    """Remove a ban from a user. PROTECT THIS ENDPOINT."""
    try:
        unban_user(user_id)
        return {
            "success": True,
            "message": f"User '{user_id}' unbanned.",
            "status":  get_credit_status(user_id),
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/admin/add-bonus")
def admin_add_bonus(payload: BonusRequest):
    """Add bonus credits to a user's daily pool. PROTECT THIS ENDPOINT."""
    try:
        new_total = add_bonus_credits(payload.user_id, payload.amount)
        return {
            "success":      True,
            "message":      f"+{payload.amount} bonus credits added for '{payload.user_id}'.",
            "credits_left": new_total,
            "status":       get_credit_status(payload.user_id),
        }
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/admin/abuse-report")
def admin_abuse_report():
    """Return users who hit daily limits or are banned today. PROTECT THIS ENDPOINT."""
    try:
        return get_abuse_report()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.get("/admin/all-usage")
def admin_all_usage():
    """Return raw usage data for all users. DEBUG ONLY. PROTECT THIS ENDPOINT."""
    try:
        from credits_manager import get_all_usage
        return get_all_usage()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


# ══════════════════════════════════════════════════════════════════════
# RAZORPAY PAYMENT ROUTES
# ══════════════════════════════════════════════════════════════════════

try:
    import razorpay as _razorpay
    _HAS_RAZORPAY = True
except ImportError:
    _HAS_RAZORPAY = False

RAZORPAY_KEY_ID:     str = os.getenv("RAZORPAY_KEY_ID",     "")
RAZORPAY_KEY_SECRET: str = os.getenv("RAZORPAY_KEY_SECRET", "")

_PLAN_PRICES: Dict[str, int] = {
    "pro":  59900,
    "team": 249900,
}

_PLAN_LABELS: Dict[str, str] = {
    "pro":  "SocioMee Pro — ₹599/month",
    "team": "SocioMee Team — ₹2499/month",
}


class CreateOrderRequest(BaseModel):
    user_id: str = Field(..., min_length=1)
    plan:    str = Field(..., description="pro | team")


class VerifyPaymentRequest(BaseModel):
    user_id:             str = Field(..., min_length=1)
    plan:                str
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str


@app.post("/payment/create-order")
def payment_create_order(payload: CreateOrderRequest):
    """Create a Razorpay order for a plan upgrade."""
    if not _HAS_RAZORPAY:
        raise HTTPException(status_code=503,
            detail="razorpay package not installed. Run: pip install razorpay")
    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503,
            detail="RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET not set in .env")

    plan = payload.plan.strip().lower()
    if plan not in _PLAN_PRICES:
        raise HTTPException(status_code=400,
            detail=f"Invalid plan '{plan}'. Choose: pro | team")

    try:
        client = _razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
        order  = client.order.create({
            "amount":   _PLAN_PRICES[plan],
            "currency": "INR",
            "receipt":  f"{payload.user_id}_{plan}_{int(__import__('time').time())}",
            "notes": {
                "user_id": payload.user_id,
                "plan":    plan,
                "product": "SocioMee",
            },
        })
        return {
            "order_id":   order["id"],
            "amount":     order["amount"],
            "currency":   order["currency"],
            "plan":       plan,
            "plan_label": _PLAN_LABELS[plan],
            "key_id":     RAZORPAY_KEY_ID,
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Razorpay order failed: {exc}")


@app.post("/payment/verify")
def payment_verify(payload: VerifyPaymentRequest):
    """Verify Razorpay payment signature and upgrade the user's plan on success."""
    if not _HAS_RAZORPAY:
        raise HTTPException(status_code=503, detail="razorpay not installed.")
    if not RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="RAZORPAY_KEY_SECRET not set.")

    import hmac, hashlib

    body     = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

    if not hmac.compare_digest(expected, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed.")

    plan = payload.plan.strip().lower()
    if plan not in _PLAN_PRICES:
        raise HTTPException(status_code=400, detail=f"Invalid plan: {plan}")

    try:
        set_user_plan(payload.user_id, plan)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Plan upgrade failed: {exc}")

    status = get_credit_status(payload.user_id)
    log.info("Payment verified — user=%r upgraded to plan=%s", payload.user_id, plan)

    return {
        "success":       True,
        "message":       f"Welcome to SocioMee {plan.title()}! Your plan is now active.",
        "plan":          plan,
        "plan_label":    _PLAN_LABELS.get(plan, plan),
        "credit_status": status,
    }


@app.get("/payment/plans")
def payment_plans():
    """Return available plans with prices — safe to call publicly for the upgrade UI."""
    return {
        "plans": [
            {
                "id":          "free",
                "label":       "Free",
                "price":       "₹0",
                "price_paise": 0,
                "credits":     30,
                "features": [
                    "30 credits / day",
                    "Short scripts (up to 500 words)",
                    "Basic SEO — 3 title candidates",
                    "8-platform content generation",
                ],
                "cta":         "Current Plan",
                "highlighted": False,
            },
            {
                "id":           "pro",
                "label":        "Pro",
                "price":        "₹599",
                "price_suffix": "/month",
                "price_paise":  59900,
                "credits":      200,
                "features": [
                    "200 credits / day",
                    "3000-5000 word deep research scripts",
                    "Full SEO packs for all 8 platforms",
                    "Per-title improvement tips",
                    "Thumbnail analyzer",
                    "Thumbnail A/B comparator",
                    "YouTube account connect (coming soon)",
                    "Competitor analysis (coming soon)",
                ],
                "cta":         "Upgrade to Pro",
                "highlighted": True,
            },
        ]
    }


@app.get("/user/plan/{user_id}")
def get_user_plan_route(user_id: str):
    """Return the current plan and feature access for a user."""
    try:
        from credits_manager import can_use_feature, get_user_plan
        plan   = get_user_plan(user_id)
        status = get_credit_status(user_id)
        return {
            "user_id": user_id,
            "plan":    plan,
            "status":  status,
            "features": {
                "short_script":      can_use_feature(user_id, "short_script"),
                "long_script":       can_use_feature(user_id, "long_script"),
                "deep_research":     can_use_feature(user_id, "deep_research"),
                "basic_seo":         can_use_feature(user_id, "basic_seo"),
                "full_seo_pack":     can_use_feature(user_id, "full_seo_pack"),
                "seo_tips":          can_use_feature(user_id, "seo_tips"),
                "thumbnail_analyze": can_use_feature(user_id, "thumbnail_analyze"),
                "thumbnail_compare": can_use_feature(user_id, "thumbnail_compare"),
                "youtube_connect":   can_use_feature(user_id, "youtube_connect"),
                "max_script_words":  can_use_feature(user_id, "max_script_words") or 500,
            },
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))