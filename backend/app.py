from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from logic import generate_content
from ai_scriptwriter import AIScriptwriter
from youtube_engine import YouTubeIntelligenceEngine
from instagram_engine import InstagramEngine
from x_engine import XEngine
from pinterest_engine import PinterestEngine
from facebook_engine import FacebookEngine
from tiktok_engine import TikTokEngine
from telegram_engine import TelegramEngine
from threads_engine import ThreadsEngine
from ai_router import generate_content as ai_generate

app = FastAPI(title="SocioMee Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request models ────────────────────────────────────────────────────

class GenerateContentRequest(BaseModel):
    keyword:      str = Field(..., min_length=1)
    platform:     str
    content_type: str
    tone:         str
    language:     str = "english"


class ScriptRequest(BaseModel):
    topic:            str = Field(..., min_length=1)
    language:         str = "english"
    personality:      str = "default"
    duration_seconds: int = Field(default=60, ge=1)
    platform:         str = "instagram"


class XRequest(BaseModel):
    topic: str
    tone:  str = "bold"


class PinterestRequest(BaseModel):
    topic: str
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


class PlatformContentRequest(BaseModel):
    topic:            str = Field(..., min_length=1)
    platform:         str
    niche:            str = "general"
    tone:             str = "default"
    objective:        str = "engagement"
    personality:      str = "default"
    format_type:      str = "long"
    duration_seconds: int = Field(default=60, ge=1)
    segment_count:    int = Field(default=5, ge=2, le=7)
    destination_type: str = "channel"
    language:         str = "hinglish"


# ── Routes ────────────────────────────────────────────────────────────

@app.get("/")
def home():
    return {"message": "SocioMee Backend Running 🚀"}


@app.post("/generate-content")
def generate_content_api(payload: GenerateContentRequest):
    """All 8 platforms via logic.py."""
    try:
        return generate_content(
            keyword=payload.keyword.strip(),
            platform=payload.platform.strip().lower(),
            content_type=payload.content_type.strip().lower(),
            tone=payload.tone.strip().lower(),
            language=payload.language.strip().lower(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-script")
def generate_script_api(payload: ScriptRequest):
    """
    AI Scriptwriter — human-style scripts.
    English  : default, mrbeast, joerogan, alexhormozi
    Hinglish : default, carryminati, samayraina, dhruvrathee, shahrukhkhan, rebelkid
    """
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


@app.post("/generate-x")
def generate_x_api(payload: XRequest):
    """X/Twitter — tweet, thread, reply baits, viral analysis."""
    try:
        engine = XEngine()
        return engine.build_x_pack(
            topic=payload.topic.strip(),
            tone=payload.tone.strip().lower(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-pinterest")
def generate_pinterest_api(payload: PinterestRequest):
    """Pinterest — pin titles, descriptions, keywords, hashtags, viral score."""
    try:
        engine = PinterestEngine()
        return engine.generate(
            topic=payload.topic.strip(),
            niche=payload.niche.strip().lower(),
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-facebook")
def generate_facebook_api(payload: FacebookRequest):
    """
    Facebook — 19-field post pack.
    Tones     : default, bold, emotional, funny, educational, controversial
    Objectives: engagement, reach, leads, awareness
    """
    try:
        engine = FacebookEngine()
        return engine.generate(
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
    Tones     : default, bold, funny, educational, emotional, controversial
    Objectives: watch_time, comments, shares, saves, retention
    """
    try:
        engine = TikTokEngine()
        return engine.generate(
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
    Tones          : default, bold, educational, friendly, premium, promotional, controversial
    Objectives     : engagement, leads, sales, comments, community, conversion
    Destination    : channel, group
    """
    try:
        engine = TelegramEngine()
        return engine.generate(
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
    Tones     : default, bold, educational, friendly, premium, promotional, controversial, funny, emotional
    Objectives: engagement, comments, discussion, saves, leads
    Segments  : 2 to 7
    """
    try:
        engine = ThreadsEngine()
        return engine.generate(
            topic=payload.topic.strip(),
            niche=payload.niche.strip().lower(),
            tone=payload.tone.strip().lower(),
            objective=payload.objective.strip().lower(),
            segment_count=payload.segment_count,
        ).to_dict()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/generate-platform-content")
def generate_platform_content(payload: PlatformContentRequest):
    """
    Unified master route — dispatches to engine by platform.
    Also calls ai_router (DeepSeek → NVIDIA) for AI-enhanced output.

    Platforms  : youtube, instagram, x, pinterest, facebook, tiktok, telegram, threads
    YouTube    : persona-aware generate() — personality, format_type, language, duration_seconds
    Instagram  : build_intelligence_pack() — keyword, tone, niche, language
    """
    platform = payload.platform.strip().lower()
    topic    = payload.topic.strip()
    niche    = payload.niche.strip().lower()
    tone     = payload.tone.strip().lower()
    objective= payload.objective.strip().lower()
    language = payload.language.strip().lower()

    try:
        if platform == "youtube":
            engine = YouTubeIntelligenceEngine()
            return engine.generate(
                topic=topic,
                niche=niche,
                personality=payload.personality.strip().lower(),
                format_type=payload.format_type.strip().lower(),
                duration_seconds=payload.duration_seconds,
                language=language,
            )

        elif platform == "instagram":
            engine = InstagramEngine()
            return engine.build_intelligence_pack(
                keyword=topic,
                tone=tone,
                content_type="reel",
                niche=niche,
                language=language,
            )

        elif platform == "x":
            engine = XEngine()
            return engine.build_x_pack(topic=topic, tone=tone)

        elif platform == "pinterest":
            engine = PinterestEngine()
            return engine.generate(topic=topic, niche=niche)

        elif platform == "facebook":
            engine = FacebookEngine()
            return engine.generate(
                topic=topic, niche=niche, tone=tone, objective=objective,
            ).to_dict()

        elif platform == "tiktok":
            engine = TikTokEngine()
            return engine.generate(
                topic=topic, niche=niche, tone=tone,
                objective=objective, duration_seconds=payload.duration_seconds,
            ).to_dict()

        elif platform == "telegram":
            engine = TelegramEngine()
            return engine.generate(
                topic=topic, niche=niche, tone=tone,
                objective=objective,
                destination_type=payload.destination_type.strip().lower(),
            ).to_dict()

        elif platform == "threads":
            engine = ThreadsEngine()
            return engine.generate(
                topic=topic, niche=niche, tone=tone,
                objective=objective, segment_count=payload.segment_count,
            ).to_dict()

        elif platform == "ai":
            # Direct AI router call — DeepSeek → NVIDIA fallback
            return ai_generate({
                "topic":            topic,
                "platform":         payload.platform,
                "tone":             tone,
                "personality":      payload.personality.strip().lower(),
                "language":         language,
                "format_type":      payload.format_type.strip().lower(),
                "duration_seconds": payload.duration_seconds,
            })

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported platform: '{platform}'. Choose: youtube, instagram, x, pinterest, facebook, tiktok, telegram, threads, ai",
            )

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))