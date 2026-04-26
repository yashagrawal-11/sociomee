"""
threads_routes.py — SocioMee Threads API Routes
================================================
Add to app.py:
    from threads_routes import router as threads_router
    app.include_router(threads_router)
"""

from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

log    = logging.getLogger("threads_routes")
router = APIRouter(prefix="/threads", tags=["threads"])

def _tc():
    try:
        import threads_connect
        return threads_connect
    except ImportError as e:
        raise HTTPException(503, f"threads_connect not found: {e}")


class PublishRequest(BaseModel):
    text: str


@router.get("/status")
def threads_status():
    """Check if Threads is connected (token + user_id in env)."""
    tc = _tc()
    try:
        tc._assert_env()
        profile = tc.get_profile()
        return {"connected": True, **profile}
    except Exception as e:
        return {"connected": False, "error": str(e)}


@router.get("/profile")
def threads_profile():
    """Full Threads profile."""
    tc = _tc()
    try:
        return tc.get_profile()
    except ValueError as e:
        raise HTTPException(404, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/posts")
def threads_posts(limit: int = Query(default=10, ge=1, le=25)):
    """Recent thread posts with engagement stats."""
    tc = _tc()
    try:
        return {"posts": tc.get_threads_posts(limit=limit)}
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/insights")
def threads_insights(days: int = Query(default=30, ge=7, le=90)):
    """Account-level insights for last N days."""
    tc = _tc()
    try:
        return tc.get_insights(days=days)
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/publish")
def threads_publish(payload: PublishRequest):
    """Publish a new thread post."""
    tc = _tc()
    try:
        return tc.publish_thread(text=payload.text)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))


@router.get("/predict")
def threads_predict(topic: str = Query(..., min_length=1)):
    """AI growth prediction for a topic on Threads."""
    tc = _tc()
    try:
        return tc.get_growth_prediction(topic=topic)
    except Exception as e:
        raise HTTPException(500, str(e))