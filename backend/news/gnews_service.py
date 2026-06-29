import httpx
import os
import time
from typing import List, Dict
import asyncio
from news.cache_service import increment_gnews_calls, is_gnews_quota_exceeded, increment_newsdata_calls, is_newsdata_quota_exceeded

GNEWS_KEY = os.getenv("GNEWS_API_KEY", "") or __import__("dotenv").dotenv_values("/var/www/sociomee/backend/.env").get("GNEWS_API_KEY", "")
NEWSDATA_KEY = os.getenv("NEWSDATA_API_KEY", "") or __import__("dotenv").dotenv_values("/var/www/sociomee/backend/.env").get("NEWSDATA_API_KEY", "")

GNEWS_URL = "https://gnews.io/api/v4/search"
NEWSDATA_URL = "https://newsdata.io/api/1/news"

CATEGORY_QUERIES = {
    "creator":   ["YouTuber", "content creator", "influencer India", "viral video India"],
    "cricket":   ["cricket", "IPL", "India cricket", "T20 cricket"],
    "bollywood": ["Bollywood", "Hindi film", "Bollywood movie", "Bollywood actor"],
    "sports":    ["sports India", "athlete India", "Olympics India", "football India", "FIFA", "Lionel Messi", "Cristiano Ronaldo", "Neymar", "Kylian Mbappe", "Argentina football", "Brazil football", "Portugal football", "football World Cup"],
    "tech":      ["AI India", "startup tech", "smartphone launch", "technology India"],
    "stocks":    ["Sensex", "Nifty", "stock market India", "share market"],
    "gaming":    ["BGMI esports", "Free Fire India", "Valorant India", "Scout gaming",
                  "Mortal gamer", "Payal Gaming", "Techno Gamerz", "Triggered Insaan gaming",
                  "Indian esports", "PUBG mobile India", "Garena Free Fire", "CODM India",
                  "Minecraft India streamer", "GTA 5 India gaming", "gaming tournament India"],
    "milestone": ["YouTube subscribers", "million views", "subscriber milestone", "viral record"],
    "drama":     ["controversy India", "celebrity drama", "viral controversy", "exposed India"],
    "platform":  ["YouTube update", "Instagram update", "algorithm change", "platform policy"],
    "business":  ["startup funding", "Indian startup", "unicorn India", "funding round"],
    "global":    ["MrBeast", "viral creator", "global trend", "PewDiePie"],
    "kpop":      ["BTS Jungkook", "Blackpink Lisa", "K-pop BTS", "HYBE South Korea"],
}

CREATOR_NAMES = ["CarryMinati","Bhuvan Bam","Technical Guruji","Ashish Chanchlani",
                 "Triggered Insaan","Amit Bhadana","Elvish Yadav","Techno Gamerz","Total Gaming","MrBeast","PewDiePie",
                 "Scout","Mortal","Payal Gaming","Jonathan Gaming","Dynamo Gaming","Gyan Gaming",
                 "Romeo Gaming","8bit Thug","Sc0ut","Soul Mortal","Ghatak","Maxtern","S8UL","GodLike Esports"]

def detect_category(title: str, desc: str) -> str:
    text = f"{title} {desc}".lower()
    if any(w in text for w in ["k-pop","kpop","bts","blackpink","korean pop","k pop","jungkook","lisa blackpink","hybe","jimin","jin bts","suga","jhope","v bts","rm bts","rose blackpink","jisoo","south korea idol","kdrama","k-drama"]): return "kpop"
    if any(w in text for w in ["cricket","ipl","bcci","wicket","t20","odi"]): return "cricket"
    if any(w in text for w in ["bollywood","film","movie","box office","hindi cinema"]): return "bollywood"
    if any(w in text for w in ["sensex","nifty","stock","sebi","nse","bse","share market"]): return "stocks"
    if any(w in text for w in ["gaming","bgmi","esports","pubg","free fire","valorant","scout","mortal","payal gaming","techno gamerz","triggered insaan","codm","call of duty mobile","minecraft","gta 5","gta v","garena","gamer india","streamer india","twitch india","loco gaming","rooter"]): return "gaming"
    if any(w in text for w in ["million subscribers","milestone","record","billion views"]): return "milestone"
    if any(w in text for w in ["drama","controversy","exposed","cancelled"]): return "drama"
    if any(w in text for w in ["algorithm","policy","monetization","demonetized"]): return "platform"
    if any(w in text for w in ["startup","funding","unicorn","ipo"]): return "business"
    if any(w in text for w in ["chatgpt","openai","smartphone","gadget","artificial intelligence"]): return "tech"
    if any(w in text for w in ["india","indian","desi","hindi","mumbai"]): return "india"
    return "global"

def detect_region(title: str, desc: str) -> str:
    text = f"{title} {desc}".lower()
    return "india" if any(w in text for w in ["india","indian","desi","hindi","mumbai","delhi","ipl","bollywood"]) else "global"

def extract_creators(title: str, desc: str) -> List[str]:
    text = f"{title} {desc}"
    return [n for n in CREATOR_NAMES if n.lower() in text.lower()][:3]

async def fetch_gnews(label: str, keyword: str) -> List[Dict]:
    if is_gnews_quota_exceeded():
        return []
    params = {"q": keyword, "token": GNEWS_KEY, "lang": "en", "max": 6, "sortby": "publishedAt"}
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(GNEWS_URL, params=params)
            if r.status_code == 200:
                total = increment_gnews_calls(1)
                print(f"[GNews] '{label}' ({keyword}) fetched. Total today: {total}/90")
                articles = r.json().get("articles", [])
                for a in articles:
                    a["_query_category"] = label
                    a["_source_api"] = "gnews"
                return articles
            elif r.status_code == 429:
                print(f"[GNews] Rate limited on '{label}'")
                return []
    except Exception as e:
        print(f"[GNews] Error for '{label}': {e}")
    return []

async def fetch_newsdata(label: str, keyword: str) -> List[Dict]:
    if not NEWSDATA_KEY:
        return []
    if is_newsdata_quota_exceeded():
        print(f"[NewsData] Daily quota exceeded, skipping '{label}'")
        return []
    params = {"apikey": NEWSDATA_KEY, "q": keyword, "language": "en", "size": 6}
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            r = await client.get(NEWSDATA_URL, params=params)
            if r.status_code == 200:
                total = increment_newsdata_calls(1)
                print(f"[NewsData] Quota used: {total}/450 today")
                data = r.json()
                results = data.get("results", [])
                articles = []
                for item in results:
                    articles.append({
                        "title": item.get("title",""),
                        "description": item.get("description","") or (item.get("content","") or "")[:300],
                        "url": item.get("link",""),
                        "image": item.get("image_url",""),
                        "publishedAt": item.get("pubDate",""),
                        "source": {"name": item.get("source_id","") or item.get("source_name","")},
                        "_query_category": label,
                        "_source_api": "newsdata",
                    })
                print(f"[NewsData] '{label}' ({keyword}) fetched {len(articles)} articles")
                return articles
            elif r.status_code == 429:
                print(f"[NewsData] Rate limited on '{label}'")
                return []
            else:
                print(f"[NewsData] Status {r.status_code} for '{label}'")
                return []
    except Exception as e:
        print(f"[NewsData] Error for '{label}': {e}")
        return []

async def fetch_keyword(label: str, keyword: str) -> List[Dict]:
    articles = await fetch_gnews(label, keyword)
    if not articles:
        print(f"[Fallback] GNews empty for '{label}', trying NewsData.io...")
        articles = await fetch_newsdata(label, keyword)
    return articles

async def fetch_all() -> List[Dict]:
    hour_seed = int(time.time() // 3600)
    labels = list(CATEGORY_QUERIES.keys())
    rotation = (labels + labels)[hour_seed % len(labels): hour_seed % len(labels) + 5]

    tasks = []
    for label in rotation:
        variants = CATEGORY_QUERIES[label]
        variant = variants[hour_seed % len(variants)]
        tasks.append(fetch_keyword(label, variant))

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
    return articles[:35]
