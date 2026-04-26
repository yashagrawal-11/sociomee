"""
app.py — SocioMee FastAPI Backend v3
Clean, no duplicate routes. Monthly credit system. Full Razorpay.
YouTube connect via separate YOUTUBE_CLIENT_ID (not GOOGLE_CLIENT_ID).
"""
from __future__ import annotations
import hashlib, hmac, io, logging, os, re, time
from typing import Any, Dict, Optional
import fastapi
from fastapi import Depends, FastAPI, File, Form, HTTPException, Query, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from pydantic import BaseModel, Field

log = logging.getLogger("app")

try:
    from auth_routes import router as auth_router
    _HAS_AUTH = True
except Exception as e:
    log.warning("auth_routes failed: %s", e); _HAS_AUTH = False; auth_router = None

# ── YouTube connect router (separate OAuth from login) ─────────────────
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

# ── Instagram router ──────────────────────────────────────────────────
try:
    from instagram_routes import router as instagram_router
    _HAS_INSTAGRAM_ROUTES = True
except Exception as e:
    log.warning("instagram_routes failed: %s", e); _HAS_INSTAGRAM_ROUTES = False; instagram_router = None

# ── Telegram router ───────────────────────────────────────────────────
try:
    from telegram_routes import router as telegram_router
    _HAS_TG_ROUTES = True
except Exception as e:
    log.warning("telegram_routes failed: %s", e); _HAS_TG_ROUTES = False; telegram_router = None

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
    from ai_router import generate_full_content as _generate_full_content, generate_content as _ai_generate
    _HAS_AI_ROUTER = True
except Exception as e:
    log.warning("ai_router: %s", e); _HAS_AI_ROUTER = False; _generate_full_content = None
    def _ai_generate(d): return {"error": "ai_router not available"}

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
limiter = Limiter(key_func=get_remote_address, default_limits=["200/hour"])
app = FastAPI(title="SocioMee API", version="3.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Google login router (uses GOOGLE_CLIENT_ID)
if _HAS_AUTH and auth_router is not None:
    app.include_router(auth_router)

# YouTube connect router (uses YOUTUBE_CLIENT_ID — completely separate)
if _HAS_YT_ROUTES and yt_router is not None:
    app.include_router(yt_router)

# Threads router
if _HAS_THREADS_ROUTES and threads_router is not None:
    app.include_router(threads_router)

# Instagram router
if _HAS_INSTAGRAM_ROUTES and instagram_router is not None:
    app.include_router(instagram_router)

# Telegram router
if _HAS_TG_ROUTES and telegram_router is not None:
    app.include_router(telegram_router)

# ── CORS — restricted to production domain ────────────────────────────
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
    allow_headers     = ["*"],
)

# ── Models ────────────────────────────────────────────────────────────
class FullContentRequest(BaseModel):
    topic: str = Field(..., min_length=1); persona: str = "dhruvrathee"
    language: str = "hinglish"; country: str = "in"; platform: str = "youtube"

class PlatformContentRequest(BaseModel):
    topic: str = Field(..., min_length=1); platform: str; niche: str = "general"
    tone: str = "default"; objective: str = "engagement"; personality: str = "default"
    format_type: str = "long"; duration_seconds: int = Field(default=180, ge=1)
    segment_count: int = Field(default=5, ge=2, le=7)
    destination_type: str = "channel"; language: str = "hinglish"

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
    ok = use_credit(user_id)
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
            f"Kya Sach Hai {tc} Ke Baare Mein? Evidence-Based Analysis 🔍",
            f"{tc} — Asli Hakikat Kya Hai? Poora Sach Aaj Jaaniye",
        ],
        "carryminati": [
            f"{tc} Ka Pura Scene 😤 | Bhai Maine Research Kiya",
            f"Yaar Seriously {tc}? | Seedha Point Pe Aata Hoon 💀",
            f"{tc} — Bhai Tune Kya Kiya? Full Roast + Analysis",
        ],
        "samayraina": [
            f"{tc}... [pause] Matlab Seriously? | Dark Comedy Analysis",
            f"Haan Toh {tc} Ke Baare Mein Baat Karte Hain",
            f"{tc} — Ye Bhi Theek Hai I Guess | Honest Review",
        ],
        "rebelkid": [
            f"Stop Normalizing {tc} — Here's The Truth Nobody Says",
            f"{tc} Is A Cute Little Red Flag We Need To Talk About",
            f"Respectfully, {tc} Needs To Be Called Out | Full Take",
        ],
        "mrbeast": [
            f"The SHOCKING Truth About {tc} Nobody Talks About 🤯",
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
            f"Why {tc} Matters More Than You Think — Deep Dive 🔍",
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

def _generate_yt_description(topic: str, hook: str, structure: dict, titles_with_score: list) -> str:
    t = topic.strip(); tc = t.title()
    kp = structure.get("key_points", [])
    best_title = titles_with_score[0]["title"] if titles_with_score else tc
    queries = [t, f"{t} explained", f"{t} full analysis", f"{t} truth revealed",
               f"{t} in hindi", f"{t} documentary", f"about {t}", f"{t} real story",
               f"{t} latest news", f"{t} investigation", f"{t} facts", f"why {t}",
               f"how {t}", f"{t} 2024", f"{t} 2025"]
    seen = set(); unique_q = []
    for q in queries:
        if q not in seen: seen.add(q); unique_q.append(q)
    unique_q = unique_q[:12]
    timestamps = ["00:00 — Introduction", "00:00 — Background"]
    for i, point in enumerate(kp[:5], 1):
        label = str(point)[:55].strip() if point else f"Part {i}"
        timestamps.append(f"00:00 — {label}")
    timestamps.append("00:00 — Conclusion")
    kp_bullets = "\n".join(f"▶ {str(kp_item)[:80]}" for kp_item in kp[:5] if kp_item)
    desc = f"""{best_title}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📌 ABOUT THIS VIDEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{hook or f"Aaj hum {t} ke baare mein ek honest aur detailed analysis karenge."}

Is video mein aap janenge:
{kp_bullets or f"▶ {tc} ki poori kahani\n▶ Evidence aur facts\n▶ Asal truth kya hai"}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 YOUR QUERIES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{chr(10).join(unique_q)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️ TIMESTAMPS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{chr(10).join(timestamps)}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📢 MORE ABOUT THIS CHANNEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Hum yahan par in-depth research, honest analysis, aur fact-based content banate hain.
Agar aap bhi real information chahte hain bina kisi bias ke — toh channel subscribe karein.

🔔 Subscribe karein aur bell icon dabayein — taaki koi bhi video miss na ho.
👍 Video useful lagi toh LIKE zaroor karein.
💬 Apne thoughts COMMENT mein share karein — main har comment padhta hoon.
📤 Apne doston ke saath SHARE karein jo yeh jaanna chahte hain.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ COPYRIGHT DISCLAIMER
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This video is made under the Fair Use guidelines for educational and informational purposes only. All clips, images, and media used belong to their respective owners. No copyright infringement is intended. If you are the owner of any content used and wish it to be removed, please contact us directly and we will act promptly.

© {tc} Analysis | All Rights Reserved."""
    return desc.strip()

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

@app.get("/credits/{user_id}")
def get_credits(user_id: str):
    try: return get_credit_status(user_id)
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/use-credit")
def use_credit_route(user: dict = Depends(get_current_user)):
    ok = use_credit(user.get("user_id",""))
    if not ok:
        status = get_credit_status(user.get("user_id",""))
        raise HTTPException(status_code=402, detail={"error": "No credits remaining", "credit_status": status})
    return get_credit_status(user.get("user_id",""))

@app.post("/generate-full-content")
@limiter.limit("10/minute")
def gen_full(request: Request, payload: FullContentRequest, user: dict = Depends(get_current_user)):
    if not _HAS_AI_ROUTER or not _generate_full_content: raise HTTPException(503, "ai_router not available.")
    err = _check_credits(user["user_id"])
    if err: return err
    try:
        raw = _generate_full_content(topic=payload.topic.strip(), persona=payload.persona.strip().lower(),
                                     language=payload.language.strip().lower(), country=payload.country.strip().lower())
    except Exception as e: raise HTTPException(500, str(e))
    return _attach_credits(_normalize(raw, payload, payload.platform.strip().lower()), user["user_id"])

@app.post("/generate-platform-content")
@limiter.limit("10/minute")
def gen_platform(request: Request, payload: PlatformContentRequest, user: dict = Depends(get_current_user)):
    p = payload.platform.strip().lower(); topic = payload.topic.strip()
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
            result = InstagramEngine().build_intelligence_pack(keyword=topic, tone=payload.tone, content_type="reel", niche=payload.niche, language=payload.language)
        elif p == "x":
            if not _HAS_X: raise HTTPException(503, "XEngine not available.")
            result = XEngine().build_x_pack(topic=topic, tone=payload.tone)
        elif p == "pinterest":
            if not _HAS_PINT: raise HTTPException(503, "PinterestEngine not available.")
            result = PinterestEngine().generate(topic=topic, niche=payload.niche)
        elif p == "facebook":
            if not _HAS_FB: raise HTTPException(503, "FacebookEngine not available.")
            result = FacebookEngine().generate(topic=topic, niche=payload.niche, tone=payload.tone, objective=payload.objective).to_dict()
        elif p == "tiktok":
            if not _HAS_TT: raise HTTPException(503, "TikTokEngine not available.")
            result = TikTokEngine().generate(topic=topic, niche=payload.niche, tone=payload.tone, objective=payload.objective, duration_seconds=payload.duration_seconds).to_dict()
        elif p == "telegram":
            if not _HAS_TG: raise HTTPException(503, "TelegramEngine not available.")
            result = TelegramEngine().generate(topic=topic, niche=payload.niche, tone=payload.tone, objective=payload.objective, destination_type=payload.destination_type).to_dict()
        elif p == "threads":
            if not _HAS_THR: raise HTTPException(503, "ThreadsEngine not available.")
            result = ThreadsEngine().generate(topic=topic, niche=payload.niche, tone=payload.tone, objective=payload.objective, segment_count=payload.segment_count).to_dict()
        else: raise HTTPException(400, f"Unknown platform: {p}")
    except HTTPException: raise
    except Exception as e: raise HTTPException(500, str(e))
    return _attach_credits(result, user["user_id"])

@app.post("/thumbnail/analyze")
async def thumb_analyze(file: UploadFile = File(...), keyword: str = Form(""), niche: str = Form(""), plan: str = Form("free")):
    try:
        b = await file.read()
        if _HAS_THUMB:
            r = analyze_thumbnail_real(image_bytes=b, mime_type=file.content_type or "image/jpeg", keyword=keyword or niche or "general", niche=niche or keyword or "general", plan=plan)
            if r: return r
        score = 70
        if PILImage:
            try:
                img = PILImage.open(io.BytesIO(b)); w,h = img.size
                if h > 0 and 1.7 <= w/h <= 1.8: score += 10
                if w >= 1280: score += 8
            except Exception: pass
        return {"fit_score": min(score,100), "ctr_potential": min(score-10,100), "verdict": "Good thumbnail." if score>=70 else "Needs improvement.", "suggestions": ["Bigger text","Add a face","Brighter colors","Use 16:9 ratio"]}
    except Exception as e: raise HTTPException(500, str(e))

# ── Payment ───────────────────────────────────────────────────────────
@app.get("/payment/plans")
def payment_plans():
    return {
        "plans": [
            {"id":"free","label":"Free","price_inr":0,"price_paise":0,"credits":20,"period":"month","features":["20 credits/month","Short scripts ≤500 words","Basic SEO"],"highlighted":False,"cta":"Current Plan"},
            {"id":"pro_monthly","label":"Pro Monthly","price_inr":499,"price_paise":49900,"credits":200,"period":"month","features":["200 credits/month","3000-5000 word scripts","Full SEO — 8 platforms","Thumbnail analyzer"],"highlighted":False,"cta":"Upgrade to Pro"},
            {"id":"pro_annual","label":"Pro Annual","price_inr":3999,"original_inr":5999,"price_paise":399900,"credits":200,"period":"year","features":["200 credits/month","All Pro features","Save ₹2000 vs monthly","Priority support"],"highlighted":True,"badge":"Best Value","cta":"Get Annual Plan"},
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
        total = PLAN_LIMITS.get(plan, 200)
        msg = f"Welcome to {info['label']}! Your plan is now active."
    log.info("Payment verified: user=%s plan=%s", payload.user_id, plan)
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
    except Exception as e: raise HTTPException(500, str(e))

@app.post("/admin/add-bonus")
def admin_bonus(p: BonusRequest, _=Depends(_require_admin)):
    try: total = add_credits(p.user_id, p.amount); return {"success": True, "credits": total}
    except Exception as e: raise HTTPException(500, str(e))

@app.get("/admin/all-usage")
def admin_usage(_=Depends(_require_admin)):
    try: return get_all_usage()
    except Exception as e: raise HTTPException(500, str(e))