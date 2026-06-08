import os, httpx, json, logging, re, time
from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from collections import defaultdict

# ── Rate Limiter ──────────────────────────────────────────────────────
_rate_store = defaultdict(list)
def rate_limit(ip: str, max_calls: int = 10, window: int = 60) -> bool:
    now = time.time()
    calls = [t for t in _rate_store[ip] if now - t < window]
    if len(calls) >= max_calls:
        return False
    calls.append(now)
    _rate_store[ip] = calls
    return True

# ── Word Filter ───────────────────────────────────────────────────────
BAD_WORDS = [
    "bomb","suicide","terrorist","terrorism","explosive","massacre","genocide",
    "rape","child porn","cp","loli","pedophile","naked child","underage",
    "drug deal","cocaine","heroin","meth","buy drugs","sell drugs",
    "kill yourself","kys","how to kill","murder tutorial","bomb making",
    "illegal weapons","gun shop","hire hitman","darkweb","dark web market",
    "hack bank","credit card dump","phishing kit","ddos attack",
    "nazi","isis","al qaeda","jihad attack","school shooting",
    "sex tape","porn","xxx","onlyfans hack","nude leak"
]
def has_bad_words(text: str) -> bool:
    t = text.lower()
    for w in BAD_WORDS:
        if re.search(r'\b' + re.escape(w) + r'\b', t):
            return True
    return False

log = logging.getLogger(__name__)
router = APIRouter(prefix="/youtube-tools", tags=["youtube-tools"])

YT_API_KEY = os.getenv("YOUTUBE_PUBLIC_API_KEY", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
YT_BASE = "https://www.googleapis.com/youtube/v3"

async def gemini(prompt: str) -> str:
    try:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.post(
                f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}",
                json={"contents":[{"parts":[{"text":prompt}]}]}
            )
            return r.json()["candidates"][0]["content"]["parts"][0]["text"]
    except Exception as e:
        log.error("gemini error: %s", e)
        return ""

# ── 1. Keyword Research ───────────────────────────────────────────────
class KeywordReq(BaseModel):
    keyword: str
    country: str = "IN"

@router.post("/keyword-research")
async def keyword_research(req: KeywordReq, request: Request):
    ip = request.client.host
    if not rate_limit(ip, max_calls=15, window=60):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    if has_bad_words(req.keyword):
        raise HTTPException(status_code=400, detail="Invalid search term.")
    try:
        async with httpx.AsyncClient(timeout=15) as c:
            # Get search suggestions via YouTube search
            r = await c.get(f"{YT_BASE}/search", params={
                "part": "snippet",
                "q": req.keyword,
                "type": "video",
                "maxResults": 10,
                "regionCode": req.country,
                "relevanceLanguage": "en",
                "key": YT_API_KEY
            })
            data = r.json()
            
            videos = []
            for item in data.get("items", []):
                videos.append({
                    "title": item["snippet"]["title"],
                    "channel": item["snippet"]["channelTitle"],
                    "published": item["snippet"]["publishedAt"][:10],
                    "video_id": item["id"]["videoId"],
                    "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"]
                })
            
            # Get related keywords via Gemini
            related_prompt = f"""For YouTube keyword: "{req.keyword}", generate:
1. 8 related keyword variations with estimated competition (Low/Medium/High)
2. 5 long-tail keyword suggestions
3. Overall opportunity score 1-100

Return ONLY valid JSON:
{{"related": [{{"keyword": "...", "competition": "Low", "opportunity": 85}}], "longtail": ["...", "..."], "opportunity_score": 75, "tip": "one actionable tip"}}"""
            
            ai_text = await gemini(related_prompt)
            try:
                clean = ai_text.replace("```json","").replace("```","").strip()
                ai_data = json.loads(clean)
            except:
                ai_data = {"related": [], "longtail": [], "opportunity_score": 60, "tip": "Focus on long-tail keywords for better ranking chances."}
            
            return {
                "keyword": req.keyword,
                "top_videos": videos,
                "related_keywords": ai_data.get("related", []),
                "longtail": ai_data.get("longtail", []),
                "opportunity_score": ai_data.get("opportunity_score", 60),
                "tip": ai_data.get("tip", "")
            }
    except Exception as e:
        log.error("keyword research error: %s", e)
        return {"error": str(e), "keyword": req.keyword, "top_videos": [], "related_keywords": [], "longtail": [], "opportunity_score": 0}

# ── 2. Trending Videos ────────────────────────────────────────────────
class TrendingReq(BaseModel):
    niche: str = "general"
    country: str = "IN"
    category_id: str = "0"
    video_type: str = "all"

CATEGORY_MAP = {
    "general": "0", "gaming": "20", "music": "10", "tech": "28",
    "education": "27", "entertainment": "24", "news": "25",
    "sports": "17", "comedy": "23", "film": "1", "food": "26",
    "fitness": "17", "travel": "19", "fashion": "26", "finance": "25",
    "bollywood": "24", "cricket": "17", "diy": "26", "beauty": "26",
    "science": "28", "motivation": "27", "kids": "20", "cooking": "26",
    "vlog": "22", "animals": "15", "cars": "2"
}

@router.post("/trending")
async def trending_videos(req: TrendingReq, request: Request = None):
    if request:
        ip = request.client.host
        if not rate_limit(ip, max_calls=15, window=60):
            raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
        if has_bad_words(req.niche):
            raise HTTPException(status_code=400, detail="Invalid search term.")
    try:
        cat_id = CATEGORY_MAP.get(req.niche.lower(), "0")
        async with httpx.AsyncClient(timeout=15) as client:
            # For shorts, use search API with videoDuration=short
            if req.video_type == "shorts":
                search_q = req.niche if req.niche != "general" else "trending"
                # Build region-aware query
                region_terms = {
                    "IN": "india hindi", "US": "usa america", "GB": "uk british",
                    "JP": "japan japanese", "BR": "brazil portuguese"
                }
                region_hint = region_terms.get(req.country, "")
                q = f"{search_q} {region_hint} shorts".strip()
                sr = await client.get(f"{YT_BASE}/search", params={
                    "part": "snippet",
                    "q": q,
                    "type": "video",
                    "videoDuration": "short",
                    "order": "viewCount",
                    "regionCode": req.country,
                    "relevanceLanguage": "hi" if req.country == "IN" else "en",
                    "maxResults": 20,
                    "key": YT_API_KEY
                })
                search_data = sr.json()
                video_ids = [item["id"]["videoId"] for item in search_data.get("items", []) if isinstance(item.get("id"), dict) and item["id"].get("videoId")]
                if not video_ids:
                    return {"niche": req.niche, "country": req.country, "videos": []}
                vr = await client.get(f"{YT_BASE}/videos", params={
                    "part": "snippet,statistics,contentDetails",
                    "id": ",".join(video_ids),
                    "key": YT_API_KEY
                })
                data = vr.json()
            else:
                params = {
                    "part": "snippet,statistics,contentDetails",
                    "chart": "mostPopular",
                    "regionCode": req.country,
                    "videoCategoryId": cat_id if cat_id != "0" else "",
                    "maxResults": 20,
                    "key": YT_API_KEY
                }
                if not params["videoCategoryId"]:
                    del params["videoCategoryId"]
                resp = await client.get(f"{YT_BASE}/videos", params=params)
                data = resp.json()
            
            videos = []
            for item in data.get("items", []):
                stats = item.get("statistics", {})
                duration = item.get("contentDetails", {}).get("duration", "PT0S")
                # Parse duration to detect shorts (< 60 seconds)
                import re as _re
                mins = int((_re.search(r"(\d+)M", duration) or type("", (), {"group": lambda s, x: "0"})()).group(1) or 0)
                secs = int((_re.search(r"(\d+)S", duration) or type("", (), {"group": lambda s, x: "0"})()).group(1) or 0)
                total_secs = mins * 60 + secs
                is_short = (req.video_type == "shorts") or (total_secs <= 60 and total_secs > 0)
                
                video = {
                    "title": item["snippet"]["title"],
                    "channel": item["snippet"]["channelTitle"],
                    "views": int(stats.get("viewCount", 0)),
                    "likes": int(stats.get("likeCount", 0)),
                    "comments": int(stats.get("commentCount", 0)),
                    "published": item["snippet"]["publishedAt"][:10],
                    "video_id": item["id"],
                    "thumbnail": item["snippet"]["thumbnails"]["medium"]["url"],
                    "tags": item["snippet"].get("tags", [])[:5],
                    "is_short": is_short,
                    "duration": duration
                }
                
                if req.video_type == "shorts" and not is_short:
                    continue
                if req.video_type == "videos" and is_short:
                    continue
                videos.append(video)
            
            videos.sort(key=lambda x: x["views"], reverse=True)
            return {"niche": req.niche, "country": req.country, "videos": videos[:12]}
    except Exception as e:
        log.error("trending error: %s", e)
        return {"error": str(e), "videos": []}

# ── 3. Evergreen Score ────────────────────────────────────────────────
class EvergreenReq(BaseModel):
    title: str
    description: Optional[str] = ""
    niche: str = "general"

@router.post("/evergreen-score")
async def evergreen_score(req: EvergreenReq, request: Request):
    ip = request.client.host
    if not rate_limit(ip, max_calls=15, window=60):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    if has_bad_words(req.title) or has_bad_words(req.description or ""):
        raise HTTPException(status_code=400, detail="Invalid content.")
    prompt = f"""Analyze this YouTube video for evergreen potential:
Title: "{req.title}"
Description: "{req.description[:300] if req.description else 'not provided'}"
Niche: {req.niche}

Evergreen = content that stays relevant and gets views for years (tutorials, how-to, timeless topics)
NOT evergreen = news, trends, current events, specific dates

Return ONLY valid JSON:
{{"evergreen_score": 85, "verdict": "Highly Evergreen", "reasons": ["reason1", "reason2", "reason3"], "shelf_life": "3-5 years", "improvement": "specific suggestion to make it more evergreen", "best_for": "search/browse/trending"}}

Score 0-100. Verdict: Highly Evergreen / Moderately Evergreen / Trend-Based / News-Based"""

    ai_text = await gemini(prompt)
    try:
        clean = ai_text.replace("```json","").replace("```","").strip()
        return json.loads(clean)
    except:
        return {
            "evergreen_score": 65,
            "verdict": "Moderately Evergreen",
            "reasons": ["Title has good search intent", "Topic has lasting relevance"],
            "shelf_life": "1-2 years",
            "improvement": "Add a specific year or make the title more tutorial-focused",
            "best_for": "search"
        }

# ── 4. Daily Video Ideas ──────────────────────────────────────────────
class VideoIdeasReq(BaseModel):
    niche: str
    channel_style: str = "educational"
    language: str = "English"

@router.post("/daily-ideas")
async def daily_video_ideas(req: VideoIdeasReq, request: Request):
    ip = request.client.host
    if not rate_limit(ip, max_calls=10, window=60):
        raise HTTPException(status_code=429, detail="Too many requests. Please wait a moment.")
    if has_bad_words(req.niche):
        raise HTTPException(status_code=400, detail="Invalid search term.")
    prompt = f"""Generate 7 daily YouTube video ideas for:
Niche: {req.niche}
Channel style: {req.channel_style}
Language: {req.language}

Each idea needs:
- title: compelling YouTube title (click-worthy but not clickbait)
- hook: first 15 seconds script hook
- why_now: why post this TODAY/this week
- estimated_views: realistic view estimate for small channel
- difficulty: Easy/Medium/Hard to make
- format: Tutorial/Vlog/List/Story/Reaction/Challenge

Indian context where relevant. Mix trending and evergreen ideas.

Return ONLY valid JSON array of 7 objects:
[{{"title":"...","hook":"...","why_now":"...","estimated_views":"1K-5K","difficulty":"Easy","format":"Tutorial"}}]"""

    ai_text = await gemini(prompt)
    try:
        clean = ai_text.replace("```json","").replace("```","").strip()
        import re
        m = re.search(r'\[[\s\S]*\]', clean)
        ideas = json.loads(m.group() if m else clean)
        return {"niche": req.niche, "ideas": ideas}
    except:
        return {
            "niche": req.niche,
            "ideas": [
                {"title": f"5 Things Nobody Tells You About {req.niche}", "hook": f"I spent 3 years in {req.niche} before I learned this...", "why_now": "Evergreen curiosity gap", "estimated_views": "2K-10K", "difficulty": "Easy", "format": "List"},
                {"title": f"How I Started {req.niche} With Zero Experience", "hook": "6 months ago I knew absolutely nothing about this...", "why_now": "Beginner audiences always growing", "estimated_views": "1K-8K", "difficulty": "Easy", "format": "Story"},
                {"title": f"The Complete {req.niche} Guide for Beginners 2026", "hook": f"If I was starting {req.niche} today, this is exactly what I'd do...", "why_now": "High search volume tutorials", "estimated_views": "5K-20K", "difficulty": "Medium", "format": "Tutorial"},
            ]
        }
