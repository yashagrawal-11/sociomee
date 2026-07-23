"""
bio_routes.py — Link in Bio
Save/fetch user bio links. Public page served via sociomee-next.
1 credit per save. Pro+ only enforced on frontend.
"""
import os, json, logging, re
from fastapi import APIRouter, Request, HTTPException
from pathlib import Path
from credits_manager import use_credit, get_credit_status

log = logging.getLogger("bio_routes")
router = APIRouter(prefix="/bio", tags=["bio"])

BIO_FILE = Path("/var/www/sociomee/backend/data/bio_pages.json")
BIO_FILE.parent.mkdir(parents=True, exist_ok=True)

def _load():
    if BIO_FILE.exists():
        try: return json.loads(BIO_FILE.read_text())
        except: return {}
    return {}

def _save(data):
    BIO_FILE.write_text(json.dumps(data, indent=2))

def _valid_handle(h):
    return bool(re.match(r'^[a-z0-9_]{3,30}$', h))

@router.get("/check-handle/{handle}")
async def check_handle(handle: str):
    if not _valid_handle(handle):
        return {"available": False, "reason": "Handle must be 3-30 characters, lowercase letters, numbers, underscores only."}
    data = _load()
    taken = any(v.get("handle") == handle for v in data.values())
    return {"available": not taken}

@router.get("/me/{user_id}")
async def get_my_bio(user_id: str):
    data = _load()
    if user_id not in data:
        return {"exists": False, "handle": "", "name": "", "bio": "", "links": [], "avatar": ""}
    return {"exists": True, **data[user_id]}

@router.post("/save")
async def save_bio(request: Request):
    try: payload = await request.json()
    except: raise HTTPException(400, "Invalid JSON")

    user_id    = payload.get("user_id", "")
    user_email = payload.get("user_email", "")
    handle     = payload.get("handle", "").strip().lower()
    name       = payload.get("name", "").strip()
    bio        = payload.get("bio", "").strip()
    links      = payload.get("links", [])
    avatar     = payload.get("avatar", "")

    if not user_id: raise HTTPException(400, "user_id required")
    if not _valid_handle(handle): raise HTTPException(400, "Invalid handle")
    if not name: raise HTTPException(400, "Name required")
    if len(links) > 20: raise HTTPException(400, "Max 20 links")

    data = _load()

    # Check handle not taken by someone else
    for uid, v in data.items():
        if v.get("handle") == handle and uid != user_id:
            raise HTTPException(409, "Handle already taken")

    # Deduct 1 credit
    ok = use_credit(user_id, cost=1)
    if not ok:
        status = get_credit_status(user_id)
        raise HTTPException(402, f"No credits remaining on your {status.get('plan','free')} plan.")

    data[user_id] = {
        "handle": handle,
        "name": name,
        "bio": bio,
        "links": links,
        "avatar": avatar,
        "user_email": user_email,
        "updated_at": __import__("datetime").datetime.utcnow().isoformat()
    }
    _save(data)

    credit_status = get_credit_status(user_id)
    return {"success": True, "handle": handle, "url": f"https://sociomeeai.com/bio/{handle}", "credit_status": credit_status}

@router.get("/page/{handle}")
async def get_bio_page(handle: str):
    data = _load()
    for uid, v in data.items():
        if v.get("handle") == handle:
            return {
                "exists": True,
                "handle": handle,
                "name": v.get("name",""),
                "bio": v.get("bio",""),
                "links": v.get("links",[]),
                "avatar": v.get("avatar","")
            }
    return {"exists": False}
