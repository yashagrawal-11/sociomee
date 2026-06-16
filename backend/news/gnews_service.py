import httpx
import os
import time
from typing import List, Dict
import asyncio
from news.cache_service import increment_gnews_calls, is_gnews_quota_exceeded

GNEWS_KEY = os.getenv("GNEWS_API_KEY", "") or __import__("dotenv").dotenv_values("/var/www/sociomee/backend/.env").get("GNEWS_API_KEY", "")
GNEWS_URL = "https://gnews.io/api/v4/search"

CATEGORY_QUERIES = [
    ("creator",   "YouTuber content creator viral India"),
    ("cricket",   "cricket IPL India match 2026"),
    ("bollywood", "Bollywood movie release India 2026"),
    ("sports",    "India sports athlete 2026"),
    ("tech",      "AI startup technology India 2026"),
    ("stocks",    "Sensex Nifty stock market India"),
    ("gaming",    "BGMI gaming esports India"),
    ("milestone", "YouTube subscribers milestone record"),
    ("drama",     "controversy drama India viral"),
    ("platform",  "YouTube Instagram algorithm update 2026"),
    ("global",    "MrBeast viral creator global"),
    ("business",  "Indian startup funding unicorn 2026"),
]

CREATOR_NAMES = ["CarryMinati","Bhuvan Bam","Technical Guruji","Ashish Chanchlani",
                 "Triggered Insaan","Amit Bhadana","Elvish Yadav","Techno Gamerz","Total Gaming","MrBeast","PewDiePie"]

def detect_category(title: str, desc: str) -> str:
    text = f"{title} {desc}".lower()
    if any(w in text for w in ["cricket","ipl","bcci","wicket"]): return "cricket"
    if any(w in text for w in ["bollywood","film","movie","box office"]): return "bollywood"
    if any(w in text for w in ["sensex","nifty","stock","sebi","nse","bse"]): return "stocks"
    if any(w in text for w in ["gaming","bgmi","esports","pubg"]): return "gaming"
    if any(w in text for w in ["million subscribers","milestone","record","billion views"]): return "milestone"
    if any(w in text for w in ["drama","controversy","exposed","cancelled"]): return "drama"
    if any(w in text for w in ["algorithm","policy","monetization","demonetized"]): return "platform"
    if any(w in text for w in ["startup","funding","unicorn","ipo"]): return "business"
    if any(w in text for w in ["chatgpt","openai","smartphone","gadget"]): return "tech"
    if any(w in text for w in ["india","indian","desi","hindi","mumbai"]): return "india"
    return "global"

def detect_region(title: str, desc: str) -> str:
    text = f"{title} {desc}".lower()
    return "india" if any(w in text for w in ["india","indian","desi","hindi","mumbai","delhi","ipl","bollywood"]) else "global"

def extract_creators(title: str, desc: str) -> List[str]:
    text = f"{title} {desc}"
    return [n for n in CREATOR_NAMES if n.lower() in text.lower()][:3]

async def fetch_keyword(label: str, keyword: str) -> List[Dict]:
    if is_gnews_quota_exceeded():
        print(f"[GNews] Quota exceeded, skipping '{label}'")
        return []
    params = {"q": keyword, "token": GNEWS_KEY, "lang": "en", "max": 6, "sortby": "publishedAt"}
    try:
        async with httpx.AsyncClient(timeout=25.0) as client:
            r = await client.get(GNEWS_URL, params=params)
            if r.status_code == 200:
                total = increment_gnews_calls(1)
                print(f"[GNews] '{label}' fetched. Total today: {total}/90")
                articles = r.json().get("articles", [])
                for a in articles:
                    a["_query_category"] = label
                return articles
            elif r.status_code == 429:
                print(f"[GNews] Rate limited!")
                return []
    except Exception as e:
        print(f"[GNews] Error for '{label}': {e}")
    return []

async def fetch_all() -> List[Dict]:
    hour = int(time.time() // 3600) % len(CATEGORY_QUERIES)
    batch = (CATEGORY_QUERIES + CATEGORY_QUERIES)[hour:hour+4]
    tasks = [fetch_keyword(label, kw) for label, kw in batch]
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
    return articles[:30]
