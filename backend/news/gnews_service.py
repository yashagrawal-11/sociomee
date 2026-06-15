import httpx
import os
from typing import List, Dict
import asyncio
from news.cache_service import increment_gnews_calls, is_gnews_quota_exceeded

GNEWS_KEY = os.getenv("GNEWS_API_KEY", "") or __import__("dotenv").dotenv_values("/var/www/sociomee/backend/.env").get("GNEWS_API_KEY", "")
GNEWS_URL = "https://gnews.io/api/v4/search"

KEYWORDS = [
    "MrBeast YouTube",
    "Indian YouTuber",
    "content creator viral",
    "YouTube milestone subscribers",
    "Instagram creator India",
    "CarryMinati YouTube",
    "Bhuvan Bam",
    "Amit Bhadana",
    "MrBeast subscribers milestone",
    "YouTube creator milestone India",
    "Instagram influencer India",
    "YouTube algorithm update 2026",
    "creator brand deal India",
    "Indian creator viral video",
    "PewDiePie",
]

CREATOR_NAMES = [
    "CarryMinati", "Bhuvan Bam", "Technical Guruji", "Ashish Chanchlani",
    "Triggered Insaan", "Amit Bhadana", "Round2Hell", "Techno Gamerz",
    "Fukra Insaan", "Elvish Yadav", "Ajju Bhai", "Total Gaming",
    "MrBeast", "PewDiePie", "Ninja", "Logan Paul", "KSI", "Markiplier",
    "Pewdiepie", "Jacksepticeye", "Dream", "Shroud",
]

def detect_category(title: str, desc: str) -> str:
    text = f"{title} {desc}".lower()
    if any(w in text for w in ["million subscribers", "milestone", "record", "100m", "200m", "crore views", "billion views", "fastest", "most subscribed"]):
        return "milestone"
    if any(w in text for w in ["drama", "controversy", "exposed", "cancelled", "beef", "feud", "lawsuit", "banned"]):
        return "drama"
    if any(w in text for w in ["algorithm", "policy", "update", "feature", "monetization", "demonetized", "new rule"]):
        return "platform"
    if any(w in text for w in ["india", "indian", "desi", "hindi", "mumbai", "delhi", "bangalore"]):
        return "india"
    if any(w in text for w in ["mrbeast", "pewdiepie", "global", "worldwide", "usa", "america"]):
        return "global"
    return "trend"

def detect_region(title: str, desc: str) -> str:
    text = f"{title} {desc}".lower()
    if any(w in text for w in ["india", "indian", "desi", "hindi", "mumbai", "delhi"]):
        return "india"
    return "global"

def extract_creators(title: str, desc: str) -> List[str]:
    text = f"{title} {desc}"
    return [n for n in CREATOR_NAMES if n.lower() in text.lower()][:3]

async def fetch_keyword(keyword: str) -> List[Dict]:
    # Hard stop if quota exceeded
    if is_gnews_quota_exceeded():
        print(f"[GNews] Quota exceeded, skipping fetch for '{keyword}'")
        return []

    params = {
        "q": keyword,
        "token": GNEWS_KEY,
        "lang": "en",
        "max": 5,
        "sortby": "publishedAt",
    }
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.get(GNEWS_URL, params=params)
            if r.status_code == 200:
                # Track this API call
                total = increment_gnews_calls(1)
                print(f"[GNews] API call made. Total today: {total}/90")
                return r.json().get("articles", [])
            elif r.status_code == 429:
                print(f"[GNews] Rate limited by GNews API!")
                return []
    except Exception as e:
        print(f"[GNews] Error for '{keyword}': {e}")
    return []

async def fetch_all() -> List[Dict]:
    # Only fetch 4 keywords max per run to conserve quota (4 calls per 2hr = 48/day max)
    tasks = [fetch_keyword(kw) for kw in KEYWORDS[:4]]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    seen = set()
    articles = []
    for result in results:
        if isinstance(result, list):
            for a in result:
                url = a.get("url", "")
                if url and url not in seen:
                    seen.add(url)
                    articles.append(a)
    return articles[:20]
