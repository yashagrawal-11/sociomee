from fastapi import APIRouter, HTTPException, Request, status, Response, Body, Depends
import logging
from middleware import get_current_user

log = logging.getLogger(__name__)
import secrets
from slowapi import Limiter
from slowapi.util import get_remote_address
limiter = Limiter(key_func=get_remote_address)
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
JWT_EXPIRE_DAYS = int(os.getenv("JWT_EXPIRE_DAYS", "1"))

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
@limiter.limit("20/minute")
def google_login(request: Request, response: Response):
    state = secrets.token_urlsafe(32)
    response.set_cookie(key="oauth_state", value=state, httponly=True, secure=True, samesite="lax", max_age=600)
    if not GOOGLE_CLIENT_ID:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")

    params = {
        "client_id": GOOGLE_CLIENT_ID,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
        "prompt": "select_account",
        "state": state,
    }

    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    return {"url": url}


# CALLBACK
@router.get("/google/callback")
@limiter.exempt
async def google_callback(request: Request, code: str, state: str = None):
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    cookie_state = request.cookies.get("oauth_state")
    if not state or not cookie_state or state != cookie_state:
        raise HTTPException(status_code=400, detail="Invalid or missing OAuth state. Please try logging in again.")

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

        try:
            import redis as _redis_mod, json as _json_mod, secrets as _secrets_mod
            _rc = _redis_mod.Redis(host="localhost", port=6379, db=0, decode_responses=True)
            _pending_raw = _rc.get(f"mcp_pending:{state}")
            if _pending_raw:
                _rc.delete(f"mcp_pending:{state}")
                _pending = _json_mod.loads(_pending_raw)
                _mcp_code = _secrets_mod.token_urlsafe(24)
                _rc.setex(f"mcp_code:{_mcp_code}", 120, _json_mod.dumps({
                    "client_id": _pending["client_id"], "redirect_uri": _pending["redirect_uri"],
                    "code_challenge": _pending["code_challenge"], "user_payload": user_payload,
                }))
                _sep = "&" if "?" in _pending["redirect_uri"] else "?"
                _location = f'{_pending["redirect_uri"]}{_sep}code={_mcp_code}'
                if _pending.get("state"):
                    _location += f'&state={_pending["state"]}'
                return RedirectResponse(url=_location, status_code=302)
        except Exception as _mcp_e:
            print(f"MCP Google bridge skip: {_mcp_e}")
        from oauth_age_manager import is_age_confirmed
        if not is_age_confirmed(user_payload["user_id"]):
            import redis as _redis_mod2, json as _json_mod2, secrets as _secrets_mod2
            _rc2 = _redis_mod2.Redis(host="localhost", port=6379, db=0, decode_responses=True)
            _pending_tok = _secrets_mod2.token_urlsafe(24)
            _rc2.setex(f"age_pending:{_pending_tok}", 600, _json_mod2.dumps(user_payload))
            return RedirectResponse(url=f"https://sociomee.in/app/confirm-age?pending={_pending_tok}", status_code=302)

        token = create_jwt_token(user_payload)

        return RedirectResponse(
            url=f"{FRONTEND_CALLBACK_URL}?token={token}",
            status_code=302,
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/confirm-age")
@limiter.limit("10/minute")
def confirm_age_endpoint(request: Request, response: Response, pending: str = Body(..., embed=True)):
    import redis as _redis_mod3, json as _json_mod3
    _rc3 = _redis_mod3.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    raw = _rc3.get(f"age_pending:{pending}")
    if not raw:
        raise HTTPException(400, "This confirmation link has expired. Please log in again.")
    _rc3.delete(f"age_pending:{pending}")
    user_payload = _json_mod3.loads(raw)
    from oauth_age_manager import confirm_age
    confirm_age(user_payload["user_id"])
    token = create_jwt_token(user_payload)
    response.set_cookie(
        key="sociomee_session", value=token, httponly=True, secure=True,
        samesite="lax", max_age=7*24*60*60, path="/",
    )
    return {"token": token}


# GET USER
@router.get("/me")
def get_me(request: Request):
    token = request.cookies.get("sociomee_session")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")
    try:
        payload = decode_jwt_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    # Token is valid from here on - any failure below should degrade
    # gracefully, never cause a 401 (that would wrongly log the user out).
    import json as _json
    from pathlib import Path as _Path
    _quota_file = _Path(__file__).parent / "data" / "upload_quota.json"
    try:
        _quota = _json.loads(_quota_file.read_text()) if _quota_file.exists() else {}
        _uq = _quota.get(payload.get("user_id", ""), {})
        _sp = _uq.get("plan", "")
        if _sp.startswith("premium"): payload["plan"] = "premium"
        elif _sp.startswith("pro"): payload["plan"] = "pro"
    except Exception:
        pass
    try:
        from credits_manager import get_credit_status
        live = get_credit_status(payload.get("user_id", ""))
        payload["plan"] = live.get("plan", payload.get("plan", "free"))
    except Exception:
        pass
    return payload
# REFRESH
@router.post("/refresh-token")
@limiter.limit("10/minute")
def refresh_token(request: Request, response: Response):
    token = request.cookies.get("sociomee_session")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
    if not token:
        raise HTTPException(status_code=401, detail="Missing token")

    payload = decode_jwt_token(token)
    new_token = create_jwt_token(payload)
    response.set_cookie(
        key="sociomee_session", value=new_token, httponly=True, secure=True,
        samesite="lax", max_age=7*24*60*60, path="/",
    )
    return {"token": new_token}


# LOGOUT
@router.post("/logout")
def logout():
    return {"message": "Logged out"}


# ══════════════════════════════════════════════════════════════════════
# GITHUB OAuth
# ══════════════════════════════════════════════════════════════════════
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
GITHUB_REDIRECT_URI = os.getenv("GITHUB_REDIRECT_URI", "https://sociomee.in/api/auth/github/callback")

@router.get("/github/login")
@limiter.limit("5/minute")
def github_login(request: Request):
    if not GITHUB_CLIENT_ID:
        raise HTTPException(status_code=500, detail="GitHub Client ID not configured")
    params = {
        "client_id": GITHUB_CLIENT_ID,
        "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "user:email",
    }
    url = "https://github.com/login/oauth/authorize?" + urlencode(params)
    return {"url": url}

@router.get("/github/callback")
@limiter.limit("10/minute")
async def github_callback(request: Request, code: str):
    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")
    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            token_res = await client.post(
                "https://github.com/login/oauth/access_token",
                data={
                    "client_id": GITHUB_CLIENT_ID,
                    "client_secret": GITHUB_CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": GITHUB_REDIRECT_URI,
                },
                headers={"Accept": "application/json"},
            )
        token_data = token_res.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(status_code=400, detail="No access token from GitHub")

        async with httpx.AsyncClient(timeout=20.0) as client:
            user_res = await client.get(
                "https://api.github.com/user",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            )
            email_res = await client.get(
                "https://api.github.com/user/emails",
                headers={"Authorization": f"Bearer {access_token}", "Accept": "application/json"},
            )

        user_data = user_res.json()
        emails = email_res.json()
        primary_email = ""
        if isinstance(emails, list):
            for e in emails:
                if e.get("primary") and e.get("verified"):
                    primary_email = e.get("email", "")
                    break
            if not primary_email and emails:
                primary_email = emails[0].get("email", "")

        user_payload = {
            "user_id": f"gh_{user_data.get('id', '')}",
            "email": primary_email or user_data.get("email") or f"gh_{user_data.get('id')}@github.local",
            "name": user_data.get("name") or user_data.get("login", "GitHub User"),
            "picture": user_data.get("avatar_url", ""),
            "provider": "github",
            "plan": "free",
        }
        try:
            import redis as _redis_mod, json as _json_mod, secrets as _secrets_mod
            _rc = _redis_mod.Redis(host="localhost", port=6379, db=0, decode_responses=True)
            _gh_state = request.query_params.get("state", "")
            _pending_raw = _rc.get(f"mcp_pending:{_gh_state}") if _gh_state else None
            if _pending_raw:
                _rc.delete(f"mcp_pending:{_gh_state}")
                _pending = _json_mod.loads(_pending_raw)
                _mcp_code = _secrets_mod.token_urlsafe(24)
                _rc.setex(f"mcp_code:{_mcp_code}", 120, _json_mod.dumps({
                    "client_id": _pending["client_id"], "redirect_uri": _pending["redirect_uri"],
                    "code_challenge": _pending["code_challenge"], "user_payload": user_payload,
                }))
                _sep = "&" if "?" in _pending["redirect_uri"] else "?"
                _location = f'{_pending["redirect_uri"]}{_sep}code={_mcp_code}'
                if _pending.get("state"):
                    _location += f'&state={_pending["state"]}'
                return RedirectResponse(url=_location, status_code=302)
        except Exception as _mcp_e:
            print(f"MCP GitHub bridge skip: {_mcp_e}")
        from oauth_age_manager import is_age_confirmed
        if not is_age_confirmed(user_payload["user_id"]):
            import redis as _redis_mod2, json as _json_mod2, secrets as _secrets_mod2
            _rc2 = _redis_mod2.Redis(host="localhost", port=6379, db=0, decode_responses=True)
            _pending_tok = _secrets_mod2.token_urlsafe(24)
            _rc2.setex(f"age_pending:{_pending_tok}", 600, _json_mod2.dumps(user_payload))
            return RedirectResponse(url=f"https://sociomee.in/app/confirm-age?pending={_pending_tok}", status_code=302)
        token = create_jwt_token(user_payload)
        redirect = RedirectResponse(
            url=f"{FRONTEND_CALLBACK_URL}?token={token}",
            status_code=302,
        )
        # SECURITY MIGRATION: set the httpOnly cookie here too, so the frontend can rely
        # on it instead of the token in the URL once it migrates away from localStorage.
        redirect.set_cookie(
            key="sociomee_session", value=token, httponly=True, secure=True,
            samesite="lax", max_age=7*24*60*60, path="/",
        )
        return redirect
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ══════════════════════════════════════════════════════════════════════
# EMAIL / PASSWORD AUTH
# ══════════════════════════════════════════════════════════════════════
import hashlib
import bcrypt, secrets, json
from pathlib import Path
from pydantic import BaseModel, Field

USERS_FILE = Path(__file__).parent / "data" / "users.json"

def _load_users():
    try: return json.loads(USERS_FILE.read_text()) if USERS_FILE.exists() else {}
    except: return {}

def _save_users(d):
    USERS_FILE.parent.mkdir(exist_ok=True)
    USERS_FILE.write_text(json.dumps(d, indent=2))

def _hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt(rounds=12)).decode()

def _verify_pw(pw: str, hashed: str) -> bool:
    try:
        # Support legacy SHA-256 hashes during transition
        if not hashed.startswith("$2b$") and not hashed.startswith("$2a$"):
            import hashlib
            return hashlib.sha256(pw.encode()).hexdigest() == hashed
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

class RegisterBody(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=8, max_length=128)
    age_confirmed: bool = Field(default=False)

class LoginBody(BaseModel):
    email: str = Field(..., min_length=5, max_length=200)
    password: str = Field(..., min_length=1, max_length=128)

class ForgotBody(BaseModel):
    email: str

class ResetBody(BaseModel):
    email: str
    otp: str
    new_password: str

@router.post("/register")
@limiter.limit("3/minute")
def register(body: RegisterBody, request: Request):
    if not body.age_confirmed:
        raise HTTPException(400, "You must confirm you are 18 years or older to register")
    if len(body.password) < 8:
        raise HTTPException(400, "Password must be at least 8 characters")
    users = _load_users()
    email = body.email.lower().strip()
    if email in users:
        raise HTTPException(400, "Email already registered. Please login.")
    user_id = hashlib.md5(email.encode()).hexdigest()
    users[email] = {
        "user_id": user_id,
        "name": body.name.strip(),
        "email": email,
        "password": _hash_pw(body.password),
        "provider": "email",
        "picture": "",
        "plan": "free",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _save_users(users)
    # Send welcome email
    try:
        from email_service import send_welcome_email
        send_welcome_email(email, users[email].get("name", email.split("@")[0]))
    except Exception:
        pass
    payload = {
        "user_id": users[email].get("user_id", ""),
        "name": users[email].get("name", ""),
        "email": users[email].get("email", email),
        "provider": users[email].get("provider", "email"),
        "picture": users[email].get("picture", ""),
        "plan": users[email].get("plan", "free"),
        "created_at": users[email].get("created_at", ""),
    }
    token = create_jwt_token(payload)
    response.set_cookie(
        key="sociomee_session", value=token, httponly=True, secure=True,
        samesite="lax", max_age=7*24*60*60, path="/",
    )
    return {"token": token, "user": payload}

@router.post("/set-session")
@limiter.limit("10/minute")
def set_session(request: Request, response: Response, token: str = Body(..., embed=True)):
    # Validates the token (so this can't be used to plant an arbitrary cookie) then sets
    # it as the httpOnly session cookie. Called directly from sociomee.in by the frontend
    # right after an OAuth redirect — setting the cookie here, on a same-origin request the
    # page actually lands on, avoids the unreliable behavior of setting cookies on a
    # redirect response that crosses through a third-party domain (Google) mid-chain.
    try:
        decode_jwt_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    response.set_cookie(
        key="sociomee_session", value=token, httponly=True, secure=True,
        samesite="lax", max_age=7*24*60*60, path="/",
    )
    return {"ok": True}

@router.post("/login")
@limiter.limit("5/minute")
def login_email(body: LoginBody, request: Request, response: Response):
    users = _load_users()
    email = body.email.lower().strip()
    user = users.get(email)
    if not user or not _verify_pw(body.password, user.get("password","")):
        raise HTTPException(401, "Invalid email or password")
    payload = {
        "user_id": user.get("user_id", ""),
        "name": user.get("name", ""),
        "email": user.get("email", email),
        "provider": user.get("provider", "email"),
        "picture": user.get("picture", ""),
        "plan": user.get("plan", "free"),
        "created_at": user.get("created_at", ""),
    }
    token = create_jwt_token(payload)
    # SECURITY MIGRATION: set the token as an httpOnly cookie (not readable by JS, safe
    # from XSS token theft) in addition to returning it in the body for now, so the
    # current frontend keeps working while it migrates away from localStorage.
    response.set_cookie(
        key="sociomee_session", value=token, httponly=True, secure=True,
        samesite="lax", max_age=7*24*60*60, path="/",
    )
    return {"token": token, "user": payload}

@router.post("/forgot-password")
@limiter.limit("3/minute")
def forgot_password(body: ForgotBody, request: Request):
    users = _load_users()
    email = body.email.lower().strip()
    if email not in users:
        return {"message": "If this email exists, an OTP has been sent."}
    otp = str(secrets.randbelow(900000) + 100000)
    users[email]["reset_otp"] = _hash_pw(otp)
    users[email]["reset_expiry"] = (datetime.now(timezone.utc) + timedelta(minutes=15)).isoformat()
    _save_users(users)
    # SECURITY: OTP must never be returned in the API response — it is emailed only.
    try:
        from email_service import send_otp_email
        name = users[email].get("name", "")
        sent = send_otp_email(email, name, otp)
        if not sent:
            import logging
            logging.getLogger("sociomee").error(f"OTP email failed to send for {email} — user will not receive their reset code.")
    except Exception as e:
        import logging
        logging.getLogger("sociomee").error(f"OTP email send raised an exception for {email}: {e}")
    return {"message": "If this email exists, an OTP has been sent."}

@router.post("/reset-password")
def reset_password(body: ResetBody):
    users = _load_users()
    email = body.email.lower().strip()
    user = users.get(email)
    if not user:
        raise HTTPException(400, "Invalid request")
    if user.get("reset_otp") != _hash_pw(body.otp):
        raise HTTPException(400, "Invalid OTP")
    expiry = datetime.fromisoformat(user.get("reset_expiry", "2000-01-01T00:00:00+00:00"))
    if datetime.now(timezone.utc) > expiry:
        raise HTTPException(400, "OTP expired. Request a new one.")
    users[email]["password"] = _hash_pw(body.new_password)
    users[email].pop("reset_otp", None)
    users[email].pop("reset_expiry", None)
    _save_users(users)
    return {"message": "Password reset successful. Please login."}


@router.delete("/delete-account")
def delete_account(user: dict = Depends(get_current_user)):
    """
    Permanently delete a user's account. Blocked if they have an active
    paid subscription — they must cancel first. On success, removes the
    account + credits record and disconnects every linked platform.
    """
    user_id = user["user_id"]

    from credits_manager import get_credit_status
    status = get_credit_status(user_id)
    plan = status.get("plan", "free")
    if plan != "free":
        raise HTTPException(
            400,
            detail=f"You have an active {status.get('plan_label', plan)} subscription. "
                   f"Please cancel your subscription before deleting your account."
        )

    # Disconnect every linked platform (best-effort — one failing
    # shouldn't block the others or the account deletion itself)
    try:
        from youtube_connect import disconnect as _yt_disconnect
        _yt_disconnect(user_id)
    except Exception as e:
        log.warning(f"delete_account: youtube disconnect failed for {user_id}: {e}")

    try:
        from pinterest_routes import _del_account as _pin_delete
        _pin_delete(user_id)
    except Exception as e:
        log.warning(f"delete_account: pinterest disconnect failed for {user_id}: {e}")

    try:
        from discord_routes import discord_disconnect as _discord_disconnect
        _discord_disconnect(user_id=user_id)
    except Exception as e:
        log.warning(f"delete_account: discord disconnect failed for {user_id}: {e}")

    try:
        from telegram_connect import disconnect as _tg_disconnect
        _tg_disconnect(user_id)
    except Exception as e:
        log.warning(f"delete_account: telegram disconnect failed for {user_id}: {e}")

    # Remove the core account + credits records
    try:
        import json
        from pathlib import Path
        users_file = Path(__file__).resolve().parent / "data" / "users.json"
        if users_file.exists():
            users = json.loads(users_file.read_text(encoding="utf-8"))
            users = {k: v for k, v in users.items() if v.get("user_id") != user_id and k != user_id}
            users_file.write_text(json.dumps(users, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning(f"delete_account: users.json removal failed for {user_id}: {e}")

    try:
        from credits_manager import DATA_FILE as _credits_file
        if _credits_file.exists():
            credits = json.loads(_credits_file.read_text(encoding="utf-8"))
            credits.pop(user_id, None)
            _credits_file.write_text(json.dumps(credits, indent=2), encoding="utf-8")
    except Exception as e:
        log.warning(f"delete_account: credits_data.json removal failed for {user_id}: {e}")

    log.info(f"Account deleted: user_id={user_id}")
    return {"ok": True, "message": "Account deleted successfully."}

