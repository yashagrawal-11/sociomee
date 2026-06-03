"""
referral_routes.py — SocioMee Refer & Earn
- Referrer gets +15 credits when friend signs up AND generates once
- Friend gets +5 credits on signup
- Each user can only earn referral reward once
"""

import json
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from credits_manager import add_credits
import jwt, os
from datetime import datetime, timezone

router = APIRouter(prefix="/referral", tags=["referral"])

REFERRAL_FILE = Path(__file__).resolve().parent / "data" / "referrals.json"
JWT_SECRET    = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def _load():
    try: return json.loads(REFERRAL_FILE.read_text()) if REFERRAL_FILE.exists() else {}
    except: return {}

def _save(d):
    REFERRAL_FILE.parent.mkdir(exist_ok=True)
    REFERRAL_FILE.write_text(json.dumps(d, indent=2))

def _get_user(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(401, "Missing token")
    token = auth.split(" ")[1]
    try: return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except: raise HTTPException(401, "Invalid token")

@router.get("/link")
def get_referral_link(request: Request):
    user = _get_user(request)
    user_id = user["user_id"]
    data = _load()
    record = data.get(user_id, {"referred_users": [], "reward_claimed": False})
    return {
        "referral_link": f"https://sociomee.in/app?ref={user_id}",
        "referred_count": len(record.get("referred_users", [])),
        "reward_claimed": record.get("reward_claimed", False),
    }

class SignupRef(BaseModel):
    new_user_id: str
    new_user_email: str
    referrer_id: str

@router.post("/signup")
def referral_signup(body: SignupRef):
    if body.new_user_id == body.referrer_id:
        raise HTTPException(400, "Cannot refer yourself")
    data = _load()
    new_record = data.get(body.new_user_id, {})
    if new_record.get("referred_by"):
        raise HTTPException(400, "User already used a referral")
    add_credits(body.new_user_id, 5, body.new_user_email)
    new_record["referred_by"] = body.referrer_id
    new_record["signup_bonus_given"] = True
    new_record["joined_at"] = datetime.now(timezone.utc).isoformat()
    data[body.new_user_id] = new_record
    ref_record = data.get(body.referrer_id, {"referred_users": [], "reward_claimed": False})
    referred = ref_record.get("referred_users", [])
    if body.new_user_id not in [r["user_id"] for r in referred]:
        referred.append({"user_id": body.new_user_id, "used_app": False, "joined_at": datetime.now(timezone.utc).isoformat()})
    ref_record["referred_users"] = referred
    data[body.referrer_id] = ref_record
    _save(data)
    return {"success": True, "bonus_credits": 5}

class UsedApp(BaseModel):
    user_id: str

@router.post("/used-app")
def referral_used_app(body: UsedApp):
    data = _load()
    user_record = data.get(body.user_id, {})
    referrer_id = user_record.get("referred_by")
    if not referrer_id:
        return {"success": False, "reason": "No referrer"}
    if user_record.get("app_use_tracked"):
        return {"success": False, "reason": "Already tracked"}
    user_record["app_use_tracked"] = True
    data[body.user_id] = user_record
    ref_record = data.get(referrer_id, {})
    if not ref_record.get("reward_claimed"):
        add_credits(referrer_id, 15)
        ref_record["reward_claimed"] = True
        ref_record["reward_claimed_at"] = datetime.now(timezone.utc).isoformat()
    referred = ref_record.get("referred_users", [])
    for r in referred:
        if r["user_id"] == body.user_id:
            r["used_app"] = True
    ref_record["referred_users"] = referred
    data[referrer_id] = ref_record
    _save(data)
    return {"success": True, "referrer_credited": 15}

@router.get("/status")
def referral_status(request: Request):
    user = _get_user(request)
    user_id = user["user_id"]
    data = _load()
    record = data.get(user_id, {})
    referred = record.get("referred_users", [])
    completed = [r for r in referred if r.get("used_app")]
    return {
        "referral_link": f"https://sociomee.in/app?ref={user_id}",
        "total_referred": len(referred),
        "completed": len(completed),
        "reward_claimed": record.get("reward_claimed", False),
        "credits_earned": 15 if record.get("reward_claimed") else 0,
        "referred_by": record.get("referred_by"),
        "signup_bonus": 5 if record.get("signup_bonus_given") else 0,
    }
