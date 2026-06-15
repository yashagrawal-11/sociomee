import os
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
import asyncio
import os
import sys

# Fix path for celery worker
sys.path.insert(0, '/var/www/sociomee/backend')
os.chdir('/var/www/sociomee/backend')

from datetime import datetime
from celery import Celery
from celery.schedules import crontab

broker = os.getenv("REDIS_URL", "redis://localhost:6379/1")
backend_url = os.getenv("REDIS_BACKEND", "redis://localhost:6379/2")

celery_app = Celery("sociomee_news", broker=broker, backend=backend_url)
celery_app.conf.update(
    timezone="Asia/Kolkata",
    enable_utc=True,
    beat_schedule={
        "fetch-news-every-2-hours": {
            "task": "news.tasks.fetch_and_store_news",
            "schedule": crontab(minute="0", hour="*/2"),
        }
    }
)

async def _run():
    sys.path.insert(0, '/var/www/sociomee/backend')
    from news.gnews_service import fetch_all, detect_category, detect_region, extract_creators
    from news.ai_service import batch_filter, generate_ideas
    from news.store import save_news, get_id_by_url, save_ideas, url_exists
    from news.cache_service import set_last_fetch, set_news_cache

    print(f"[{datetime.now()}] Fetching news...")
    raw = await fetch_all()
    print(f"Got {len(raw)} raw articles")

    filtered = await batch_filter(raw)
    print(f"Filtered to {len(filtered)} relevant")

    articles_to_save = []
    for a in filtered:
        url = a.get("url", "")
        if not url or url_exists(url):
            continue
        ai = a.get("_ai", {})
        try:
            pub = datetime.fromisoformat(a.get("publishedAt","").replace("Z","+00:00")).isoformat()
        except:
            pub = datetime.utcnow().isoformat()

        articles_to_save.append({
            "url": url,
            "title": a.get("title",""),
            "original_summary": a.get("description",""),
            "ai_summary": ai.get("ai_summary", a.get("description","")),
            "source_name": a.get("source",{}).get("name",""),
            "image_url": a.get("image",""),
            "published_at": pub,
            "category": ai.get("category", detect_category(a.get("title",""), a.get("description",""))),
            "region": ai.get("region", detect_region(a.get("title",""), a.get("description",""))),
            "creator_tags": ai.get("creator_tags", extract_creators(a.get("title",""), a.get("description",""))),
            "platform_tags": ai.get("platform_tags",[]),
            "is_relevant": True,
            "relevance_score": ai.get("relevance_score", 5),
        })

    count = save_news(articles_to_save)
    print(f"Saved {count} new articles")

    for a in articles_to_save:
        nid = get_id_by_url(a["url"])
        if nid:
            ideas = await generate_ideas(nid, a["title"], a["ai_summary"])
            if ideas:
                save_ideas(nid, ideas)

    # Invalidate stale cache so next request fetches fresh from DB
    from news.cache_service import invalidate_news_cache
    invalidate_news_cache()

    set_last_fetch(datetime.utcnow().isoformat())
    print("Done.")

@celery_app.task(name="news.tasks.fetch_and_store_news", bind=True, max_retries=3)
def fetch_and_store_news(self):
    try:
        sys.path.insert(0, '/var/www/sociomee/backend')
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(_run())
    except Exception as exc:
        print(f"Task failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
