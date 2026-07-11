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
        },
        "check-due-reminders-every-minute": {
            "task": "news.tasks.check_due_reminders",
            "schedule": crontab(minute="*"),
        },
        "check-scheduled-downgrades-hourly": {
            "task": "news.tasks.check_scheduled_downgrades",
            "schedule": crontab(minute=0),
        },
        "idle-nudge-morning": {
            "task": "news.tasks.send_idle_nudges",
            "schedule": crontab(hour=9, minute=15),
        },
        "idle-nudge-afternoon": {
            "task": "news.tasks.send_idle_nudges",
            "schedule": crontab(hour=14, minute=30),
        },
        "idle-nudge-evening": {
            "task": "news.tasks.send_idle_nudges",
            "schedule": crontab(hour=19, minute=45),
        },
        "idle-nudge-late-night": {
            "task": "news.tasks.send_idle_nudges",
            "schedule": crontab(hour=23, minute=10),
        },
    }
)

import random as _random_tasks

@celery_app.task(name="news.tasks.send_idle_nudges", bind=True, max_retries=2)
def send_idle_nudges(self):
    """Sends a random time-appropriate engagement nudge to all subscribed users."""
    sys.path.insert(0, '/var/www/sociomee/backend')
    from push_routes import notify_idle_nudge, get_idle_eligible_user_ids
    user_ids = get_idle_eligible_user_ids(idle_days=2)
    sent = 0
    for uid in user_ids:
        try:
            if notify_idle_nudge(uid):
                sent += 1
        except Exception as exc:
            print(f"[idle-nudge] push failed for {uid}: {exc}")
    return {"sent": sent, "total": len(user_ids)}


@celery_app.task(name="news.tasks.check_due_reminders", bind=True, max_retries=2)
def check_due_reminders(self):
    """Checks for due reminders every minute and fires push notifications."""
    sys.path.insert(0, '/var/www/sociomee/backend')
    import reminders_manager as rm
    from push_routes import send_push
    due = rm.get_due_reminders()
    for r in due:
        try:
            send_push(
                r["user_id"],
                title="SocioMee Reminder",
                body=r["task"],
                url="https://sociomeeai.com/app",
                tag=f"reminder-{r['id']}",
            )
            rm.update_status(r["user_id"], r["id"], "sent")
        except Exception as exc:
            print(f"[reminders] push failed for {r['id']}: {exc}")
    return {"checked": len(due)}

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

@celery_app.task(name="news.tasks.check_scheduled_downgrades", bind=True, max_retries=2)
def check_scheduled_downgrades(self):
    """Every hour: apply any scheduled downgrades whose effective_at has passed."""
    try:
        sys.path.insert(0, '/var/www/sociomee/backend')
        from credits_manager import _load, _save, set_user_plan, _lock
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        with _lock:
            data = _load()
            changed = 0
            for user_id, record in data.items():
                target = record.get("scheduled_downgrade_plan")
                at_str = record.get("scheduled_downgrade_at")
                if not target:
                    continue
                # If no expiry date set, apply immediately
                if at_str is None:
                    apply = True
                else:
                    try:
                        at_dt = datetime.fromisoformat(at_str)
                        if at_dt.tzinfo is None:
                            at_dt = at_dt.replace(tzinfo=timezone.utc)
                        apply = now >= at_dt
                    except Exception:
                        apply = True
                if apply:
                    record["plan"] = target
                    from credits_manager import PLAN_LIMITS
                    record["credits_remaining"] = PLAN_LIMITS.get(target, 20)
                    record["last_reset"] = now.isoformat()
                    record["plan_expires"] = None
                    record.pop("scheduled_downgrade_plan", None)
                    record.pop("scheduled_downgrade_at", None)
                    data[user_id] = record
                    changed += 1
                    print(f"Downgrade applied: {user_id} -> {target}")
            if changed:
                _save(data)
        print(f"check_scheduled_downgrades: {changed} downgrades applied")
    except Exception as exc:
        print(f"check_scheduled_downgrades failed: {exc}")
        raise self.retry(exc=exc, countdown=60)
