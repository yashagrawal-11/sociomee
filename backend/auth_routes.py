from fastapi import APIRouter, HTTPException, Request, status
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv
from urllib.parse import urlencode
from datetime import datetime, timedelta, timezone
import os
import httpx
import jwt

# ✅ Absolute path - works regardless of where uvicorn is launched from
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ENV_PATH = os.path.join(BASE_DIR, ".env")
load_dotenv(ENV_PATH, override=True)  # override=True forces it to overwrite any existing env vars

print("CLIENT ID:", os.getenv("GOOGLE_CLIENT_ID"))
print("JWT:", os.getenv("JWT_SECRET"))

router = APIRouter(prefix="/auth", tags=["auth"])

# ENV VARIABLES
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv(
    "GOOGLE_REDIRECT_URI",
    "http://127.0.0.1:8000/auth/google/callback",
)
FRONTEND_CALLBACK_URL = os.getenv(
    "FRONTEND_CALLBACK_URL",
    "http://localhost:3000/auth/callback",
)

JWT_SECRET = os.getenv("JWT_SECRET")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "7"))

# SAFE WARNINGS (NO CRASH)
if not GOOGLE_CLIENT_ID:
    print("⚠️ GOOGLE_CLIENT_ID missing")

if not GOOGLE_CLIENT_SECRET:
    print("⚠️ GOOGLE_CLIENT_SECRET missing")

if not JWT_SECRET:
    print("⚠️ JWT_SECRET missing")


# JWT FUNCTIONS
def create_jwt_token(payload: dict) -> str:
    now = datetime.now(timezone.utc)
    token_payload = {
        **payload,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(days=JWT_EXPIRE_DAYS)).timestamp()),
    }
    return jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_jwt_token(token: str) -> dict:
    return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])


# GOOGLE LOGIN
@router.get("/google/login")
def google_login():
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
    }

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return {"url": url}


# CALLBACK
@router.get("/google/callback")
async def google_callback(code: str):
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            token_res = await client.post(
                "https://oauth2.googleapis.com/token",
                data={
                    "code": code,
                    "client_id": GOOGLE_CLIENT_ID,
                    "client_secret": GOOGLE_CLIENT_SECRET,
                    "redirect_uri": GOOGLE_REDIRECT_URI,
                    "grant_type": "authorization_code",
                },
            )

        token_data = token_res.json()

        if token_res.status_code != 200:
            raise HTTPException(status_code=400, detail=token_data)

        access_token = token_data.get("access_token")

        async with httpx.AsyncClient(timeout=20.0) as client:
            user_res = await client.get(
                "https://www.googleapis.com/oauth2/v2/userinfo",
                headers={"Authorization": f"Bearer {access_token}"},
            )

        user_data = user_res.json()

        if user_res.status_code != 200:
            raise HTTPException(status_code=400, detail=user_data)

        user_payload = {
            "user_id": str(user_data.get("id", "")),
            "email": user_data.get("email", ""),
            "name": user_data.get("name", ""),
            "picture": user_data.get("picture", ""),
            "provider": "google",
            "plan": "free",
        }

        token = create_jwt_token(user_payload)

        return RedirectResponse(
            url=f"{FRONTEND_CALLBACK_URL}?token={token}",
            status_code=302,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# GET USER
@router.get("/me")
def get_me(request: Request):
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth_header.split(" ")[1]

    try:
        payload = decode_jwt_token(token)
        return payload
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")


# REFRESH
@router.post("/refresh-token")
def refresh_token(request: Request):
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")

    token = auth_header.split(" ")[1]

    payload = decode_jwt_token(token)
    new_token = create_jwt_token(payload)

    return {"token": new_token}


# LOGOUT
@router.post("/logout")
def logout():
    return {"message": "Logged out"}