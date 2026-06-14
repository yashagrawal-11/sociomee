from fastapi import APIRouter, Query
from datetime import datetime
from news.store import get_news, get_ideas, save_ideas
from news.cache_service import get_news_cache, set_news_cache, get_ideas_cache, set_ideas_cache, get_last_fetch

router = APIRouter(prefix="/news", tags=["news"])

@router.get("/feed")
def get_feed(category: str = Query("all"), limit: int = Query(20)):
    cached = get_news_cache(category)
    if cached:
        return {"items": cached[:limit], "last_updated": get_last_fetch(), "cached": True}
    items = get_news(category, limit)
    set_news_cache(category, items)
    return {"items": items, "last_updated": get_last_fetch(), "cached": False}

@router.get("/status")
def get_status():
    return {"last_updated": get_last_fetch(), "current_time": datetime.utcnow().isoformat()}

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
