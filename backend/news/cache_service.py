import redis
import json
import os
from typing import Optional, Any

r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)

def cache_get(key: str) -> Optional[Any]:
    val = r.get(key)
    try:
        return json.loads(val)
    except:
        return val

def cache_set(key: str, value: Any, ttl: int = 900):
    r.setex(key, ttl, json.dumps(value, default=str))

def get_last_fetch() -> Optional[str]:
    return cache_get("news:last_fetch")

def set_last_fetch(ts: str):
    r.setex("news:last_fetch", 3600, ts)

def get_news_cache(category: str) -> Optional[list]:
    return cache_get(f"news:feed:{category}")

def set_news_cache(category: str, data: list):
    cache_set(f"news:feed:{category}", data, ttl=900)

def get_ideas_cache(news_id: str) -> Optional[dict]:
    return cache_get(f"news:ideas:{news_id}")

def set_ideas_cache(news_id: str, data: dict):
    cache_set(f"news:ideas:{news_id}", data, ttl=86400)
