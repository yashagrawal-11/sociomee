import json
import os
from pathlib import Path
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
import uuid

def _parse_dt(s: str):
    if not s:
        return None
    try:
        s2 = s.replace("Z", "+00:00")
        dt = datetime.fromisoformat(s2)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except Exception:
        return None

def _ranking_score(item: Dict) -> float:
    """Blend relevance_score with recency so old high-score articles
    can never permanently bury fresh ones. Articles older than 7 days
    are excluded entirely by get_news() before this is even applied."""
    base = item.get("relevance_score", 0)
    pub = _parse_dt(item.get("published_at", ""))
    if not pub:
        return base
    now = datetime.now(timezone.utc)
    age_hours = max((now - pub).total_seconds() / 3600.0, 0)
    # Decay: full boost at 0h, halved by ~24h, fading further after that
    recency_boost = 10 / (1 + age_hours / 24)
    return base + recency_boost

PRUNE_AFTER_DAYS = 7

NEWS_FILE = Path(__file__).resolve().parent.parent / "data" / "creator_news.json"
IDEAS_FILE = Path(__file__).resolve().parent.parent / "data" / "news_ideas.json"

def _read(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except:
        return {}

def _write(path: Path, data: dict):
    path.parent.mkdir(exist_ok=True)
    path.write_text(json.dumps(data, indent=2, default=str), encoding="utf-8")

def save_news(articles: List[Dict]) -> int:
    store = _read(NEWS_FILE)
    count = 0
    for a in articles:
        url = a.get("url", "")
        if not url or url in store:
            continue
        nid = str(uuid.uuid4())
        store[url] = {**a, "id": nid, "fetched_at": datetime.utcnow().isoformat()}
        count += 1
    prune_old_news(store)
    _write(NEWS_FILE, store)
    return count

def prune_old_news(store: dict) -> int:
    """Remove articles older than PRUNE_AFTER_DAYS from the store in place."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=PRUNE_AFTER_DAYS)
    to_remove = []
    for url, item in store.items():
        pub = _parse_dt(item.get("published_at", ""))
        if pub and pub < cutoff:
            to_remove.append(url)
    for url in to_remove:
        del store[url]
    return len(to_remove)

def get_news(category: str = "all", limit: int = 20) -> List[Dict]:
    store = _read(NEWS_FILE)
    cutoff = datetime.now(timezone.utc) - timedelta(days=PRUNE_AFTER_DAYS)
    items = []
    for url, item in store.items():
        pub = _parse_dt(item.get("published_at", ""))
        if pub and pub < cutoff:
            continue
        if category == "all":
            items.append(item)
        elif category == "india" and item.get("region") == "india":
            items.append(item)
        elif category == "global" and item.get("region") == "global":
            items.append(item)
        elif item.get("category") == category:
            items.append(item)
    items.sort(key=_ranking_score, reverse=True)
    return items[:limit]

def url_exists(url: str) -> bool:
    return url in _read(NEWS_FILE)

def get_id_by_url(url: str) -> Optional[str]:
    store = _read(NEWS_FILE)
    return store.get(url, {}).get("id")

def save_ideas(news_id: str, ideas: dict):
    store = _read(IDEAS_FILE)
    store[news_id] = ideas
    _write(IDEAS_FILE, store)

def get_ideas(news_id: str) -> Optional[dict]:
    return _read(IDEAS_FILE).get(news_id)
