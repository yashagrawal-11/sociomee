"""
facebook_auth_routes.py — Facebook OAuth Login
"""
import os, logging, httpx, json
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse
from auth_routes import _load_users, _save_users, _make_token

log = logging.getLogger("facebook_auth")
router = APIRouter(prefix="/auth/facebook", tags=["facebook_auth"])

FB_APP_ID     = os.getenv("FB_APP_ID", "")
FB_APP_SECRET = os.getenv("FB_APP_SECRET", "")
REDIRECT_URI  = "https://sociomeeai.com/api/auth/facebook/callback"

@router.get("/login")
async def fb_login():
    url = (
        f"https://www.facebook.com/v19.0/dialog/oauth"
        f"?client_id={FB_APP_ID}"
        f"&redirect_uri={REDIRECT_URI}"
        f"&scope=email,public_profile"
        f"&response_type=code"
    )
    return RedirectResponse(url)

@router.get("/callback")
async def fb_callback(request: Request):
    code  = request.query_params.get("code")
    error = request.query_params.get("error")

    if error or not code:
        return RedirectResponse(f"/auth/callback?error=facebook_denied")

    try:
        async with httpx.AsyncClient() as client:
            # Exchange code for token
            tr = await client.get("https://graph.facebook.com/v19.0/oauth/access_token", params={
                "client_id":     FB_APP_ID,
                "client_secret": FB_APP_SECRET,
                "redirect_uri":  REDIRECT_URI,
                "code":          code,
            })
            td = tr.json()
            access_token = td.get("access_token")
            if not access_token:
                raise Exception("No access token")

            # Fetch user profile
            pr = await client.get("https://graph.facebook.com/me", params={
                "fields":       "id,name,email,picture",
                "access_token": access_token,
            })
            pd = pr.json()

        fb_id = pd.get("id")
        name  = pd.get("name", "")
        email = pd.get("email", f"fb_{fb_id}@facebook.com")
        pic   = pd.get("picture", {}).get("data", {}).get("url", "")

        users = _load_users()
        is_new = email not in users

        if is_new:
            users[email] = {
                "name":         name,
                "email":        email,
                "password":     None,
                "plan":         "free",
                "credits":      300,
                "profile_pic":  pic,
                "fb_id":        fb_id,
                "age_confirmed": True,
            }
        else:
            users[email]["fb_id"] = fb_id
            if pic: users[email]["profile_pic"] = pic

        _save_users(users)
        token = _make_token(email)
        return RedirectResponse(f"/auth/callback?token={token}&is_new={'true' if is_new else 'false'}")

    except Exception as e:
        log.error("Facebook auth error: %s", e)
        return RedirectResponse(f"/auth/callback?error=facebook_failed")
