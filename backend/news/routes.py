from fastapi import APIRouter, Query, Request
from datetime import datetime
from news.store import get_news, get_ideas, save_ideas
from news.cache_service import (
    get_news_cache, set_news_cache,
    get_ideas_cache, set_ideas_cache,
    get_last_fetch, check_user_rate_limit,
    check_ip_rate_limit, get_quota_stats,
    is_gnews_quota_exceeded
)

router = APIRouter(prefix="/news", tags=["news"])

def get_client_ip(request: Request) -> str:
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"

@router.get("/feed")
def get_feed(
    request: Request,
    category: str = Query("all"),
    limit: int = Query(20),
    user_id: str = Query("anonymous"),
):
    ip = get_client_ip(request)

    # 1. Always try cache first
    cached = get_news_cache(category)
    if cached:
        return {
            "items": cached[:limit],
            "last_updated": get_last_fetch(),
            "cached": True,
            "message": None,
        }

    # 2. Check IP rate limit (for anonymous/non-logged-in)
    if user_id == "anonymous":
        ip_allowed, ip_remaining = check_ip_rate_limit(ip)
        if not ip_allowed:
            items = get_news(category, limit)
            return {
                "items": items,
                "last_updated": get_last_fetch(),
                "cached": False,
                "message": "Daily limit reached. News refreshes automatically every 2 hours ⚡",
            }

    # 3. Check per-user rate limit
    if user_id != "anonymous":
        user_allowed, user_remaining = check_user_rate_limit(user_id)
        if not user_allowed:
            items = get_news(category, limit)
            return {
                "items": items,
                "last_updated": get_last_fetch(),
                "cached": False,
                "message": "News refreshes every hour to keep things fast ⚡",
            }

    # 4. Cache miss — fetch from DB and cache it
    items = get_news(category, limit)
    if items:
        set_news_cache(category, items)

    return {
        "items": items,
        "last_updated": get_last_fetch(),
        "cached": False,
        "message": None,
    }

@router.get("/status")
def get_status():
    return {
        "last_updated": get_last_fetch(),
        "current_time": datetime.utcnow().isoformat(),
        "quota_exceeded": is_gnews_quota_exceeded(),
    }

@router.get("/admin/quota")
def get_quota():
    """Admin endpoint — shows GNews API usage stats"""
    return get_quota_stats()

@router.get("/{news_id}/ideas")
def get_ideas_route(news_id: str):
    cached = get_ideas_cache(news_id)
    if cached:
        return {"ideas": cached}
    ideas = get_ideas(news_id)
    if ideas:
        set_ideas_cache(news_id, ideas)
    return {"ideas": ideas or {}}

@router.post("/interaction")
def record_interaction(news_id: str, user_id: str, action: str):
    return {"status": "ok"}

@router.post("/trigger")
def trigger_fetch():
    from news.tasks import fetch_and_store_news
    task = fetch_and_store_news.delay()
    return {"task_id": task.id, "status": "queued"}
