import redis
import json
import os
from typing import Optional, Any
from datetime import date

r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)

NEWS_TTL = 7200  # 2 hours
IDEAS_TTL = 86400  # 24 hours
GNEWS_DAILY_LIMIT = 90  # stop at 90, keep 10 as buffer
NEWSDATA_DAILY_LIMIT = 450  # NewsData.io free tier is 500/day, keep 50 as buffer

# ── Generic cache helpers ──────────────────────────────────────────────
def cache_get(key: str) -> Optional[Any]:
    val = r.get(key)
    if val is None:
        return None
    try:
        return json.loads(val)
    except:
        return val

def cache_set(key: str, value: Any, ttl: int = NEWS_TTL):
    r.setex(key, ttl, json.dumps(value, default=str))

# ── News feed cache ────────────────────────────────────────────────────
def get_news_cache(category: str) -> Optional[list]:
    return cache_get(f"news:feed:{category}")

def set_news_cache(category: str, data: list):
    cache_set(f"news:feed:{category}", data, ttl=NEWS_TTL)

def invalidate_news_cache():
    for cat in ["all", "milestone", "drama", "platform", "india", "global", "trend"]:
        r.delete(f"news:feed:{cat}")

# ── Ideas cache ────────────────────────────────────────────────────────
def get_ideas_cache(news_id: str) -> Optional[dict]:
    return cache_get(f"news:ideas:{news_id}")

def set_ideas_cache(news_id: str, data: dict):
    cache_set(f"news:ideas:{news_id}", data, ttl=IDEAS_TTL)

# ── Last fetch timestamp ───────────────────────────────────────────────
def get_last_fetch() -> Optional[str]:
    return cache_get("news:last_fetch")

def set_last_fetch(ts: str):
    r.setex("news:last_fetch", NEWS_TTL * 2, ts)

# ── GNews quota tracker ────────────────────────────────────────────────
def get_gnews_quota_key() -> str:
    return f"gnews:calls:{date.today().isoformat()}"

def increment_gnews_calls(count: int = 1) -> int:
    key = get_gnews_quota_key()
    pipe = r.pipeline()
    pipe.incrby(key, count)
    pipe.expire(key, 86400)  # resets daily
    result = pipe.execute()
    return result[0]

def get_gnews_calls_today() -> int:
    val = r.get(get_gnews_quota_key())
    return int(val) if val else 0

def is_gnews_quota_exceeded() -> bool:
    return get_gnews_calls_today() >= GNEWS_DAILY_LIMIT

# ── NewsData.io quota tracker (fallback API) ───────────────────────────
def get_newsdata_quota_key() -> str:
    return f"newsdata:calls:{date.today().isoformat()}"

def increment_newsdata_calls(count: int = 1) -> int:
    key = get_newsdata_quota_key()
    pipe = r.pipeline()
    pipe.incrby(key, count)
    pipe.expire(key, 86400)  # resets daily
    result = pipe.execute()
    return result[0]

def get_newsdata_calls_today() -> int:
    val = r.get(get_newsdata_quota_key())
    return int(val) if val else 0

def is_newsdata_quota_exceeded() -> bool:
    return get_newsdata_calls_today() >= NEWSDATA_DAILY_LIMIT

# ── Per-user rate limiting (5 refreshes/hour) ─────────────────────────
USER_REFRESH_LIMIT = 5
USER_REFRESH_TTL = 3600  # 1 hour

def check_user_rate_limit(user_id: str) -> tuple[bool, int]:
    """Returns (is_allowed, remaining_count)"""
    key = f"ratelimit:news:{user_id}"
    count = r.get(key)
    if count is None:
        r.setex(key, USER_REFRESH_TTL, 1)
        return True, USER_REFRESH_LIMIT - 1
    count = int(count)
    if count >= USER_REFRESH_LIMIT:
        return False, 0
    r.incr(key)
    return True, USER_REFRESH_LIMIT - count - 1

# ── Per-IP rate limiting (10 requests/day) ────────────────────────────
IP_DAILY_LIMIT = 10

def check_ip_rate_limit(ip: str) -> tuple[bool, int]:
    """Returns (is_allowed, remaining_count)"""
    key = f"ratelimit:news:ip:{ip}"
    count = r.get(key)
    if count is None:
        r.setex(key, 86400, 1)
        return True, IP_DAILY_LIMIT - 1
    count = int(count)
    if count >= IP_DAILY_LIMIT:
        return False, 0
    r.incr(key)
    return True, IP_DAILY_LIMIT - count - 1

# ── Admin stats ────────────────────────────────────────────────────────
def get_quota_stats() -> dict:
    return {
        "gnews_calls_today": get_gnews_calls_today(),
        "gnews_daily_limit": GNEWS_DAILY_LIMIT,
        "gnews_quota_exceeded": is_gnews_quota_exceeded(),
        "newsdata_calls_today": get_newsdata_calls_today(),
        "newsdata_daily_limit": NEWSDATA_DAILY_LIMIT,
        "newsdata_quota_exceeded": is_newsdata_quota_exceeded(),
        "cache_ttl_seconds": NEWS_TTL,
        "last_fetch": get_last_fetch(),
    }
