"""
facebook_pages_routes.py — SocioMee Facebook Pages Integration
Handles OAuth, page selection, posting, and analytics.
Uses a separate Meta app (Sociomee 6) with pages permissions.
"""
import os, json, httpx, logging
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
load_dotenv()

log = logging.getLogger(__name__)
router = APIRouter(prefix="/facebook", tags=["facebook"])

FB_APP_ID       = os.getenv("IG_APP_ID", "")
FB_APP_SECRET   = os.getenv("IG_APP_SECRET", "")
FB_REDIRECT_URI = os.getenv("FB_PAGES_REDIRECT_URI", "https://sociomeeai.com/facebook/callback")
FB_SCOPE        = "pages_show_list,pages_manage_posts,pages_read_engagement,public_profile,email,business_management"
FB_API_VERSION  = "v19.0"

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
FB_FILE = DATA_DIR / "facebook_pages.json"

def _load() -> dict:
    if FB_FILE.exists():
        try:
            return json.loads(FB_FILE.read_text())
        except Exception:
            pass
    return {}

def _save(data: dict):
    FB_FILE.write_text(json.dumps(data, indent=2))

def _get(user_id: str):
    return _load().get(str(user_id))

def _set(user_id: str, data: dict):
    d = _load()
    d[str(user_id)] = data
    _save(d)

def _del(user_id: str):
    d = _load()
    d.pop(str(user_id), None)
    _save(d)

# ── Auth ──────────────────────────────────────────────────────────

@router.get("/auth-url")
async def get_auth_url(user_id: str):
    if not FB_APP_ID:
        raise HTTPException(500, "FB_PAGES_APP_ID not configured")
    url = (
        f"https://www.facebook.com/{FB_API_VERSION}/dialog/oauth"
        f"?client_id={FB_APP_ID}"
        f"&redirect_uri={FB_REDIRECT_URI}"
        f"&scope={FB_SCOPE}"
        f"&response_type=code"
        f"&state={user_id}"
        f"&auth_type=rerequest"
    )
    return {"url": url}

@router.get("/callback")
async def fb_callback(code: str = None, state: str = "", error: str = None):
    user_id = state
    if error or not code:
        return RedirectResponse(f"https://sociomeeai.com/app/facebook?error=denied")
    if not user_id:
        return RedirectResponse(f"https://sociomeeai.com/app/facebook?error=missing_state")
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            # Exchange code for user access token
            tr = await client.get(
                f"https://graph.facebook.com/{FB_API_VERSION}/oauth/access_token",
                params={
                    "client_id":     FB_APP_ID,
                    "client_secret": FB_APP_SECRET,
                    "redirect_uri":  FB_REDIRECT_URI,
                    "code":          code,
                }
            )
            td = tr.json()
            user_token = td.get("access_token")
            if not user_token:
                log.error("No access token: %s", td)
                return RedirectResponse(f"https://sociomeeai.com/app/facebook?error=no_token")

            # Get long-lived user token
            llr = await client.get(
                f"https://graph.facebook.com/{FB_API_VERSION}/oauth/access_token",
                params={
                    "grant_type":        "fb_exchange_token",
                    "client_id":         FB_APP_ID,
                    "client_secret":     FB_APP_SECRET,
                    "fb_exchange_token": user_token,
                }
            )
            lld = llr.json()
            long_token = lld.get("access_token", user_token)

            # Get user profile
            pr = await client.get(
                f"https://graph.facebook.com/me",
                params={"fields": "id,name,email,picture", "access_token": long_token}
            )
            profile = pr.json()

            # Get pages managed by this user
            pgr = await client.get(
                f"https://graph.facebook.com/{FB_API_VERSION}/me/accounts",
                params={"access_token": long_token, "fields": "id,name,access_token,picture,fan_count,category"}
            )
            pgd = pgr.json()
            pages = pgd.get("data", [])

        _set(user_id, {
            "user_token":   long_token,
            "fb_user_id":   profile.get("id"),
            "fb_name":      profile.get("name"),
            "fb_email":     profile.get("email"),
            "fb_pic":       profile.get("picture", {}).get("data", {}).get("url", ""),
            "pages":        pages,
            "selected_page": pages[0] if pages else None,
            "connected_at": datetime.utcnow().isoformat(),
        })
        return RedirectResponse(f"https://sociomeeai.com/app/facebook?connected=true")
    except Exception as e:
        log.error("Facebook pages callback error: %s", e)
        return RedirectResponse(f"https://sociomeeai.com/app/facebook?error=failed")

# ── Status ────────────────────────────────────────────────────────

@router.get("/status")
async def fb_status(user_id: str):
    data = _get(user_id)
    if not data:
        return {"connected": False}
    return {
        "connected":      True,
        "fb_name":        data.get("fb_name"),
        "fb_pic":         data.get("fb_pic"),
        "pages":          data.get("pages", []),
        "selected_page":  data.get("selected_page"),
    }

# ── Select page ───────────────────────────────────────────────────

@router.post("/select-page")
async def select_page(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    page_id = body.get("page_id")
    data = _get(user_id)
    if not data:
        raise HTTPException(404, "Not connected")
    pages = data.get("pages", [])
    page = next((p for p in pages if p["id"] == page_id), None)
    if not page:
        raise HTTPException(404, "Page not found")
    data["selected_page"] = page
    _set(user_id, data)
    return {"ok": True, "page": page}

# ── Disconnect ────────────────────────────────────────────────────

@router.post("/disconnect")
async def disconnect(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    _del(user_id)
    return {"ok": True}

# ── Post to page ──────────────────────────────────────────────────

@router.post("/post")
async def post_to_page(request: Request):
    body = await request.json()
    user_id  = body.get("user_id")
    message  = body.get("message", "")
    image_url = body.get("image_url", "")
    scheduled_time = body.get("scheduled_time")  # Unix timestamp optional

    data = _get(user_id)
    if not data:
        raise HTTPException(404, "Facebook not connected")

    page = data.get("selected_page")
    if not page:
        raise HTTPException(400, "No page selected")

    page_id    = page["id"]
    page_token = page["access_token"]

    try:
        async with httpx.AsyncClient(timeout=20) as client:
            if image_url:
                # Post with photo
                payload = {
                    "url":          image_url,
                    "caption":      message,
                    "access_token": page_token,
                }
                if scheduled_time:
                    payload["scheduled_publish_time"] = scheduled_time
                    payload["published"] = False
                r = await client.post(
                    f"https://graph.facebook.com/{FB_API_VERSION}/{page_id}/photos",
                    data=payload
                )
            else:
                # Text post
                payload = {
                    "message":      message,
                    "access_token": page_token,
                }
                if scheduled_time:
                    payload["scheduled_publish_time"] = scheduled_time
                    payload["published"] = False
                r = await client.post(
                    f"https://graph.facebook.com/{FB_API_VERSION}/{page_id}/feed",
                    data=payload
                )
            result = r.json()
            if "error" in result:
                raise HTTPException(400, result["error"].get("message", "Post failed"))
            return {"ok": True, "post_id": result.get("id"), "page": page.get("name")}
    except HTTPException:
        raise
    except Exception as e:
        log.error("Facebook post error: %s", e)
        raise HTTPException(500, str(e))

# ── Page insights ─────────────────────────────────────────────────

@router.get("/insights")
async def page_insights(user_id: str):
    data = _get(user_id)
    if not data:
        raise HTTPException(404, "Not connected")
    page = data.get("selected_page")
    if not page:
        raise HTTPException(400, "No page selected")

    page_id    = page["id"]
    page_token = page["access_token"]

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            metrics = "page_impressions,page_reach,page_engaged_users,page_fans,page_post_engagements"
            r = await client.get(
                f"https://graph.facebook.com/{FB_API_VERSION}/{page_id}/insights",
                params={
                    "metric":       metrics,
                    "period":       "day",
                    "access_token": page_token,
                }
            )
            result = r.json()
            return {"ok": True, "insights": result.get("data", []), "page": page.get("name")}
    except Exception as e:
        log.error("Facebook insights error: %s", e)
        raise HTTPException(500, str(e))

# ── Recent posts ──────────────────────────────────────────────────

@router.get("/posts")
async def recent_posts(user_id: str):
    data = _get(user_id)
    if not data:
        raise HTTPException(404, "Not connected")
    page = data.get("selected_page")
    if not page:
        raise HTTPException(400, "No page selected")

    page_id    = page["id"]
    page_token = page["access_token"]

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            r = await client.get(
                f"https://graph.facebook.com/{FB_API_VERSION}/{page_id}/posts",
                params={
                    "fields":       "id,message,created_time,full_picture,permalink_url,likes.summary(true),comments.summary(true),shares",
                    "limit":        10,
                    "access_token": page_token,
                }
            )
            result = r.json()
            return {"ok": True, "posts": result.get("data", []), "page": page.get("name")}
    except Exception as e:
        log.error("Facebook posts error: %s", e)
        raise HTTPException(500, str(e))
