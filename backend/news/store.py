import json
import os
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional
import uuid

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
    _write(NEWS_FILE, store)
    return count

def get_news(category: str = "all", limit: int = 20) -> List[Dict]:
    store = _read(NEWS_FILE)
    items = []
    for url, item in store.items():
        if category == "all":
            items.append(item)
        elif category == "india" and item.get("region") == "india":
            items.append(item)
        elif category == "global" and item.get("region") == "global":
            items.append(item)
        elif item.get("category") == category:
            items.append(item)
    items.sort(key=lambda x: x.get("relevance_score", 0), reverse=True)
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
