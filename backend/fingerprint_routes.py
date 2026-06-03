"""
fingerprint_routes.py — Device fingerprint anti-abuse
Tracks device fingerprints to prevent multi-account credit farming
"""

import json
from pathlib import Path
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
import jwt, os
from datetime import datetime, timezone

router = APIRouter(prefix="/fingerprint", tags=["fingerprint"])

FP_FILE = Path(__file__).resolve().parent / "data" / "fingerprints.json"
JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

def _load():
    try: return json.loads(FP_FILE.read_text()) if FP_FILE.exists() else {}
    except: return {}

def _save(d):
    FP_FILE.parent.mkdir(exist_ok=True)
    FP_FILE.write_text(json.dumps(d, indent=2))

def _get_user(request: Request):
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "): raise HTTPException(401, "Missing token")
    token = auth.split(" ")[1]
    try: return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except: raise HTTPException(401, "Invalid token")

class FingerprintBody(BaseModel):
    fingerprint: str

@router.post("/register")
def register_fingerprint(body: FingerprintBody, request: Request):
    user = _get_user(request)
    user_id = user["user_id"]
    fp = body.fingerprint.strip()
    if not fp or len(fp) < 8:
        return {"ok": False, "reason": "Invalid fingerprint"}

    data = _load()

    # Check if this fingerprint belongs to a different user
    fp_record = data.get("by_fp", {})
    existing_user = fp_record.get(fp)

    if existing_user and existing_user != user_id:
        # Same device, different account — flag as duplicate
        user_record = data.get("by_user", {})
        if user_id not in user_record:
            # New account on known device — zero out credits
            from credits_manager import _load as cm_load, _save as cm_save, _get_or_init
            cm_data = cm_load()
            record = _get_or_init(cm_data, user_id)
            record["credits_remaining"] = 0
            record["flagged_duplicate"] = True
            record["flagged_at"] = datetime.now(timezone.utc).isoformat()
            cm_data[user_id] = record
            cm_save(cm_data)

            user_record[user_id] = {
                "fingerprint": fp,
                "duplicate_of": existing_user,
                "flagged_at": datetime.now(timezone.utc).isoformat()
            }
            data["by_user"] = user_record
            _save(data)
            return {"ok": True, "flagged": True}

    # New fingerprint or same user — register it
    fp_record[fp] = user_id
    user_record = data.get("by_user", {})
    if user_id not in user_record:
        user_record[user_id] = {
            "fingerprint": fp,
            "registered_at": datetime.now(timezone.utc).isoformat()
        }
    data["by_fp"] = fp_record
    data["by_user"] = user_record
    _save(data)
    return {"ok": True, "flagged": False}
