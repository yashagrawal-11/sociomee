"""
phone_auth_routes.py — Firebase Phone Auth verification
Verifies Firebase ID token and creates/logs in SocioMee user
"""
import os, logging, httpx
from fastapi import APIRouter, Request, HTTPException
from auth_routes import _load_users, _save_users, _make_token

log = logging.getLogger("phone_auth")
router = APIRouter(prefix="/auth/phone", tags=["phone_auth"])

FIREBASE_PROJECT_ID = "sociomee-ai"

@router.post("/verify")
async def verify_phone(request: Request):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON")

    id_token = payload.get("id_token")
    if not id_token:
        raise HTTPException(400, "id_token required")

    # Verify Firebase ID token
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            r = await client.get(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup",
                params={"key": "AIzaSyDw-HHdksQE3kz9am1Qbh6-qYcocdIID24"},
                json={"idToken": id_token},
            )
            # Use token verification endpoint instead
            verify_url = f"https://oauth2.googleapis.com/tokeninfo?id_token={id_token}"
            vr = await client.get(
                f"https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=AIzaSyDw-HHdksQE3kz9am1Qbh6-qYcocdIID24",
                json={"idToken": id_token},
            )
            vd = vr.json()

        users_list = vd.get("users", [])
        if not users_list:
            raise Exception("Token verification failed")

        firebase_user = users_list[0]
        phone = firebase_user.get("phoneNumber", "")
        uid = firebase_user.get("localId", "")

        if not phone:
            raise HTTPException(400, "No phone number in token")

        # Use phone as email key
        email_key = f"phone_{phone.replace('+', '')}@sociomee.phone"

        users = _load_users()
        is_new = email_key not in users

        if is_new:
            users[email_key] = {
                "name": phone,
                "email": email_key,
                "phone": phone,
                "password": None,
                "plan": "free",
                "credits": 300,
                "firebase_uid": uid,
                "age_confirmed": True,
            }
        else:
            users[email_key]["firebase_uid"] = uid

        _save_users(users)
        token = _make_token(email_key)
        return {"token": token, "is_new": is_new}

    except HTTPException:
        raise
    except Exception as e:
        log.error("Phone auth error: %s", e)
        raise HTTPException(500, f"Phone verification failed: {e}")
