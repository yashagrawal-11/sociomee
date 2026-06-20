import json
import asyncio
from typing import Dict, List, Optional

CATEGORY_KEYWORDS = {
    "cricket":   ["cricket", "ipl", "bcci", "virat", "rohit sharma", "dhoni", "test match", "odi", "t20", "icc", "wicket", "batsman", "bowler"],
    "bollywood": ["bollywood", "shah rukh", "salman", "deepika", "alia bhatt", "ranveer", "karan johar", "netflix india", "box office", "film", "movie release", "trailer"],
    "sports":    ["football", "fifa", "tennis", "badminton", "hockey", "athletics", "olympics", "premier league", "pv sindhu", "neeraj chopra"],
    "tech":      ["artificial intelligence", "openai", "chatgpt", "google", "apple", "smartphone", "startup", "app launch", "software", "gadget"],
    "business":  ["funding", "ipo", "acquisition", "revenue", "unicorn", "investment", "entrepreneur"],
    "stocks":    ["sensex", "nifty", "stock market", "shares", "sebi", "rbi", "mutual fund", "trading", "market rally", "market crash", "bse", "nse"],
    "gaming":    ["gaming", "esports", "pubg", "bgmi", "free fire", "valorant", "minecraft", "playstation", "xbox", "gamer",
                  "scout", "mortal", "payal gaming", "techno gamerz", "jonathan gaming", "dynamo gaming",
                  "gyan gaming", "romeo gaming", "8bit thug", "soul mortal", "ghatak", "maxtern", "s8ul",
                  "godlike esports", "codm", "call of duty mobile", "gta 5", "gta v", "garena", "twitch",
                  "loco gaming", "rooter", "streamer", "fortnite", "apex legends", "league of legends"],
    "creator":   ["youtuber", "content creator", "instagram", "influencer", "mrbeast", "carryminati", "bhuvan bam", "subscribers", "viral video", "brand deal"],
    "milestone": ["million subscribers", "billion views", "record", "fastest", "most subscribed", "crore views", "100m", "200m"],
    "drama":     ["controversy", "exposed", "cancelled", "beef", "feud", "lawsuit", "banned", "drama"],
    "platform":  ["youtube update", "instagram update", "algorithm", "monetization", "demonetized", "new feature", "policy change"],
    "india":     ["india", "indian", "modi", "mumbai", "delhi", "bangalore", "desi", "hindi"],
    "global":    ["usa", "america", "uk", "global", "worldwide", "international"],
    "kpop":      ["k-pop", "kpop", "bts", "blackpink", "korean pop", "k pop", "korean idol", "kdrama", "korean drama", "jungkook", "lisa", "v bts", "jimin", "jin", "suga", "jhope", "rm bts", "rose", "jisoo", "hybe", "south korea idol"],
}

CREATORS = ["CarryMinati", "Bhuvan Bam", "MrBeast", "Technical Guruji", "Ashish Chanchlani",
            "Triggered Insaan", "Amit Bhadana", "Elvish Yadav", "Techno Gamerz", "Total Gaming"]
PLATFORMS = ["YouTube", "Instagram", "Twitter", "TikTok", "LinkedIn", "Pinterest", "Reddit", "Telegram"]

def classify_article(title: str, desc: str) -> dict:
    text = f"{title} {desc}".lower()
    scores = {}
    for cat, keywords in CATEGORY_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw in text)
        if score > 0:
            scores[cat] = score
    if not scores:
        return None
    best_cat = max(scores, key=scores.get)
    region = "india" if any(w in text for w in ["india", "indian", "desi", "hindi", "mumbai", "delhi", "ipl", "bollywood"]) else "global"
    creator_tags = [c for c in CREATORS if c.lower() in text][:3]
    platform_tags = [p for p in PLATFORMS if p.lower() in text][:3]
    summary = (desc or title)[:200].strip()
    if not summary.endswith("."): summary += "..."
    return {
        "is_relevant": True,
        "relevance_score": min(10, sum(scores.values()) + 4),
        "ai_summary": summary,
        "category": best_cat,
        "region": region,
        "creator_tags": creator_tags,
        "platform_tags": platform_tags,
    }

async def filter_article(article: Dict) -> Optional[Dict]:
    return classify_article(article.get("title",""), article.get("description","") or "")

async def generate_ideas(news_id: str, title: str, summary: str) -> Optional[Dict]:
    return None

async def batch_filter(articles: List[Dict]) -> List[Dict]:
    filtered = []
    for article in articles:
        result = classify_article(article.get("title",""), article.get("description","") or "")
        if result:
            article["_ai"] = result
            filtered.append(article)
    filtered.sort(key=lambda x: x["_ai"].get("relevance_score", 0), reverse=True)
    return filtered
