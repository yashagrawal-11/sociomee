import os, json, secrets, httpx, logging
from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse, JSONResponse
from dotenv import load_dotenv
load_dotenv()

log = logging.getLogger(__name__)
from plan_limits import check_connect_limit
router = APIRouter(prefix="/linkedin", tags=["linkedin"])

CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
REDIRECT_URI = "https://sociomeeai.com/linkedin/callback"
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DATA_FILE = DATA_DIR / "linkedin_connections.json"

def _load():
    if DATA_FILE.exists():
        try:
            return json.loads(DATA_FILE.read_text())
        except:
            return {}
    return {}

def _save(d):
    DATA_FILE.write_text(json.dumps(d, indent=2))

def _get(user_id):
    return _load().get(str(user_id))

def _set(user_id, data):
    d = _load()
    d[str(user_id)] = data
    _save(d)

def _del(user_id):
    d = _load()
    d.pop(str(user_id), None)
    _save(d)

@router.get("/connect")
async def linkedin_connect(user_id: str):
    state = user_id
    url = ("https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=" + CLIENT_ID + "&redirect_uri=" + REDIRECT_URI + "&scope=openid%20profile%20email%20w_member_social&state=" + state)
    return RedirectResponse(url)

@router.get("/callback")
async def linkedin_callback(request: Request, code: str = None, state: str = None, error: str = None):
    if error or not code:
        return RedirectResponse("https://sociomeeai.com/app/linkedin?error=access_denied")
    user_id = state
    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://www.linkedin.com/oauth/v2/accessToken", data={"grant_type": "authorization_code", "code": code, "redirect_uri": REDIRECT_URI, "client_id": CLIENT_ID, "client_secret": CLIENT_SECRET}, headers={"Content-Type": "application/x-www-form-urlencoded"})
        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        if not access_token:
            log.warning("LinkedIn token failed: %s", tokens)
            return RedirectResponse("https://sociomeeai.com/app/linkedin?error=token_failed")
        profile_resp = await client.get("https://api.linkedin.com/v2/userinfo", headers={"Authorization": "Bearer " + access_token})
        profile = profile_resp.json()
    _set(user_id, {"access_token": access_token, "name": profile.get("name", ""), "picture": profile.get("picture", ""), "email": profile.get("email", ""), "sub": profile.get("sub", "")})
    return RedirectResponse("https://sociomeeai.com/app/linkedin?connected=true")

@router.get("/status")
async def linkedin_status(user_id: str):
    data = _get(user_id)
    if not data:
        return JSONResponse({"connected": False})
    return JSONResponse({"connected": True, "name": data.get("name"), "picture": data.get("picture"), "email": data.get("email")})

@router.post("/post")
async def linkedin_post(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    text = body.get("text", "").strip()
    if not text:
        return JSONResponse({"error": "text required"}, status_code=400)
    data = _get(user_id)
    if not data:
        return JSONResponse({"error": "not connected"}, status_code=400)
    access_token = data["access_token"]
    sub = data["sub"]
    async with httpx.AsyncClient() as client:
        resp = await client.post("https://api.linkedin.com/v2/ugcPosts", headers={"Authorization": "Bearer " + access_token, "Content-Type": "application/json", "X-Restli-Protocol-Version": "2.0.0"}, json={"author": "urn:li:person:" + sub, "lifecycleState": "PUBLISHED", "specificContent": {"com.linkedin.ugc.ShareContent": {"shareCommentary": {"text": text}, "shareMediaCategory": "NONE"}}, "visibility": {"com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"}})
    if resp.status_code in (200, 201):
        return JSONResponse({"success": True})
    return JSONResponse({"error": resp.text}, status_code=400)

@router.post("/disconnect")
async def linkedin_disconnect(request: Request):
    body = await request.json()
    user_id = body.get("user_id")
    _del(user_id)
    return JSONResponse({"success": True})
