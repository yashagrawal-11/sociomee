"""
mcp_oauth_routes.py — Minimal OAuth 2.1 + PKCE Authorization Server for the
SocioMee MCP connector. Mounted on the main backend so it reuses the existing
user store and JWT issuance directly — no parallel auth system.
"""
import json
import time
import base64
import hashlib
import secrets
from urllib.parse import urlencode

from fastapi import APIRouter, Request, HTTPException, Form
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse

from auth_routes import create_jwt_token, _load_users, _verify_pw, GOOGLE_CLIENT_ID, GOOGLE_REDIRECT_URI, GITHUB_CLIENT_ID, GITHUB_REDIRECT_URI

import redis as redis_lib
_redis = redis_lib.Redis(host="localhost", port=6379, db=0, decode_responses=True)

router = APIRouter(tags=["mcp-oauth"])

ISSUER = "https://sociomee.in"
CODE_TTL = 120
CLIENT_TTL = 60 * 60 * 24 * 90


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode()


@router.get("/.well-known/oauth-authorization-server")
def oauth_metadata():
    return {
        "issuer": ISSUER,
        "authorization_endpoint": f"{ISSUER}/oauth/authorize",
        "token_endpoint": f"{ISSUER}/oauth/token",
        "registration_endpoint": f"{ISSUER}/oauth/register",
        "response_types_supported": ["code"],
        "grant_types_supported": ["authorization_code", "refresh_token"],
        "code_challenge_methods_supported": ["S256"],
        "token_endpoint_auth_methods_supported": ["none"],
        "scopes_supported": ["mcp"],
    }


def _get_client(client_id: str):
    raw = _redis.get(f"mcp_client:{client_id}")
    return json.loads(raw) if raw else None


@router.post("/oauth/register")
async def oauth_register(request: Request):
    body = await request.json()
    redirect_uris = body.get("redirect_uris", [])
    if not redirect_uris:
        raise HTTPException(400, "redirect_uris is required")
    client_id = "mcp_" + secrets.token_urlsafe(16)
    record = {
        "client_id": client_id, "redirect_uris": redirect_uris,
        "client_name": body.get("client_name", "MCP Client"),
        "token_endpoint_auth_method": "none", "created": int(time.time()),
    }
    _redis.setex(f"mcp_client:{client_id}", CLIENT_TTL, json.dumps(record))
    return JSONResponse({
        "client_id": client_id, "redirect_uris": redirect_uris,
        "token_endpoint_auth_method": "none",
        "client_id_issued_at": record["created"],
    })


@router.get("/oauth/authorize", response_class=HTMLResponse)
def oauth_authorize_form(client_id: str, redirect_uri: str, state: str = "",
                          code_challenge: str = "", code_challenge_method: str = "S256"):
    client = _get_client(client_id)
    if not client or redirect_uri not in client["redirect_uris"]:
        raise HTTPException(400, "Unknown client or redirect_uri")
    if code_challenge_method != "S256":
        raise HTTPException(400, "Only S256 PKCE is supported")
    return f"""<html><head><style>
      @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@800;900&family=Poppins:wght@400;500;600;700&display=swap');
      *{{box-sizing:border-box;}}
      body{{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
        background:#0a0a0a;font-family:'Poppins',sans-serif;position:relative;overflow:hidden;}}
      .glow{{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:500px;height:300px;
        background:radial-gradient(ellipse,rgba(124,58,237,0.15) 0%,transparent 70%);pointer-events:none;}}
      .card{{position:relative;z-index:1;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
        border-radius:24px;padding:36px 32px;width:340px;backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px);
        box-shadow:0 20px 60px rgba(0,0,0,0.5);}}
      .logo{{font-family:'Orbitron',sans-serif;font-weight:900;font-size:14px;color:#fff;letter-spacing:3px;
        text-align:center;margin-bottom:18px;}}
      h2{{margin:0 0 10px;color:#fff;font-size:19px;font-weight:700;text-align:center;}}
      .sub{{color:rgba(255,255,255,0.45);font-size:12.5px;text-align:center;line-height:1.6;margin:0 0 24px;}}
      input{{width:100%;padding:12px 14px;margin-bottom:10px;border-radius:12px;border:1px solid rgba(255,255,255,0.1);
        background:rgba(255,255,255,0.03);color:#fff;font-size:13px;font-family:inherit;outline:none;
        transition:border-color 0.2s;}}
      input::placeholder{{color:rgba(255,255,255,0.3);}}
      input:focus{{border-color:rgba(124,58,237,0.5);}}
      .pwwrap{{position:relative;margin-bottom:6px;}}
      .pwwrap input{{margin-bottom:0;padding-right:48px;}}
      .toggle{{position:absolute;right:14px;top:50%;transform:translateY(-50%);font-size:11px;
        color:rgba(255,255,255,0.35);cursor:pointer;user-select:none;}}
      .btn-pill{{display:block;width:100%;text-align:center;padding:12px;margin-top:14px;border-radius:99px;
        border:1px solid rgba(255,255,255,0.18);background:rgba(255,255,255,0.07);color:#fff;font-size:13px;
        font-weight:700;font-family:inherit;cursor:pointer;text-decoration:none;backdrop-filter:blur(16px);
        -webkit-backdrop-filter:blur(16px);box-shadow:inset 0 1px 0 rgba(255,255,255,0.15),0 4px 20px rgba(0,0,0,0.3);
        transition:all 0.35s cubic-bezier(0.34,1.56,0.64,1);}}
      .btn-pill:hover{{background:radial-gradient(ellipse at 30% 30%,#9b5cf6,#7c3aed 50%,#4c1d95);
        border-color:transparent;box-shadow:0 0 25px rgba(124,58,237,0.7),0 8px 32px rgba(124,58,237,0.3),
        inset 0 1px 0 rgba(255,255,255,0.2);transform:translateY(-2px);}}
      .divider{{text-align:center;color:rgba(255,255,255,0.25);font-size:11px;margin:18px 0;}}
    </style></head>
    <body>
      <div class="glow"></div>
      <div class="card">
        <div class="logo">SOCIOMEE</div>
        <h2>Connect Claude to SocioMee</h2>
        <p class="sub">Log in to allow Claude to read your credit status, news, calendar, history, and create share links.</p>
        <form method="post" action="/oauth/authorize">
          <input type="hidden" name="client_id" value="{client_id}"/>
          <input type="hidden" name="redirect_uri" value="{redirect_uri}"/>
          <input type="hidden" name="state" value="{state}"/>
          <input type="hidden" name="code_challenge" value="{code_challenge}"/>
          <input name="email" placeholder="Email"/>
          <div class="pwwrap">
            <input id="pw" name="password" type="password" placeholder="Password"/>
            <span class="toggle" onclick="var p=document.getElementById('pw');p.type=p.type==='password'?'text':'password';this.textContent=p.type==='password'?'Show':'Hide';">Show</span>
          </div>
          <button type="submit" class="btn-pill" style="border:none;cursor:pointer;">Allow Access</button>
        </form>
        <div class="divider">— or —</div>
        <a class="btn-pill" href="/oauth/authorize/google?client_id={client_id}&redirect_uri={redirect_uri}&state={state}&code_challenge={code_challenge}">Sign in with Google</a>
        <a class="btn-pill" href="/oauth/authorize/github?client_id={client_id}&redirect_uri={redirect_uri}&state={state}&code_challenge={code_challenge}">Sign in with GitHub</a>
      </div>
    </body></html>"""


@router.post("/oauth/authorize")
def oauth_authorize_submit(client_id: str = Form(...), redirect_uri: str = Form(...),
                            state: str = Form(""), code_challenge: str = Form(...),
                            email: str = Form(...), password: str = Form(...)):
    client = _get_client(client_id)
    if not client or redirect_uri not in client["redirect_uris"]:
        raise HTTPException(400, "Unknown client or redirect_uri")
    users = _load_users()
    user = users.get(email.lower().strip())
    if not user or not _verify_pw(password, user.get("password", "")):
        raise HTTPException(401, "Invalid email or password")
    code = secrets.token_urlsafe(24)
    user_payload = {k: v for k, v in user.items() if k != "password"}
    _redis.setex(f"mcp_code:{code}", CODE_TTL, json.dumps({
        "client_id": client_id, "redirect_uri": redirect_uri,
        "code_challenge": code_challenge, "user_payload": user_payload,
    }))
    sep = "&" if "?" in redirect_uri else "?"
    location = f"{redirect_uri}{sep}code={code}"
    if state:
        location += f"&state={state}"
    return RedirectResponse(url=location, status_code=302)


@router.get("/oauth/authorize/google")
def oauth_authorize_google(client_id: str, redirect_uri: str, state: str = "",
                            code_challenge: str = ""):
    client = _get_client(client_id)
    if not client or redirect_uri not in client["redirect_uris"]:
        raise HTTPException(400, "Unknown client or redirect_uri")
    google_state = secrets.token_urlsafe(32)
    _redis.setex(f"mcp_pending:{google_state}", 600, json.dumps({
        "client_id": client_id, "redirect_uri": redirect_uri,
        "code_challenge": code_challenge, "state": state,
    }))
    params = {
        "client_id": GOOGLE_CLIENT_ID, "redirect_uri": GOOGLE_REDIRECT_URI,
        "response_type": "code", "scope": "openid email profile",
        "access_type": "offline", "prompt": "select_account", "state": google_state,
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urlencode(params)
    response = RedirectResponse(url=url, status_code=302)
    response.set_cookie(key="oauth_state", value=google_state, httponly=True, secure=True, samesite="lax", max_age=600)
    return response


@router.get("/oauth/authorize/github")
def oauth_authorize_github(client_id: str, redirect_uri: str, state: str = "",
                            code_challenge: str = ""):
    client = _get_client(client_id)
    if not client or redirect_uri not in client["redirect_uris"]:
        raise HTTPException(400, "Unknown client or redirect_uri")
    github_state = secrets.token_urlsafe(32)
    _redis.setex(f"mcp_pending:{github_state}", 600, json.dumps({
        "client_id": client_id, "redirect_uri": redirect_uri,
        "code_challenge": code_challenge, "state": state,
    }))
    params = {
        "client_id": GITHUB_CLIENT_ID, "redirect_uri": GITHUB_REDIRECT_URI,
        "scope": "user:email", "state": github_state,
    }
    url = "https://github.com/login/oauth/authorize?" + urlencode(params)
    response = RedirectResponse(url=url, status_code=302)
    response.set_cookie(key="oauth_state", value=github_state, httponly=True, secure=True, samesite="lax", max_age=600)
    return response


@router.post("/oauth/token")
async def oauth_token(request: Request):
    body = await request.form()
    if body.get("grant_type") != "authorization_code":
        raise HTTPException(400, "Only grant_type=authorization_code is supported")
    code = body.get("code")
    redirect_uri = body.get("redirect_uri")
    code_verifier = body.get("code_verifier")
    raw = _redis.get(f"mcp_code:{code}")
    if not raw:
        raise HTTPException(400, "Invalid or expired code")
    record = json.loads(raw)
    _redis.delete(f"mcp_code:{code}")
    if record["redirect_uri"] != redirect_uri:
        raise HTTPException(400, "redirect_uri mismatch")
    expected = _b64url(hashlib.sha256(code_verifier.encode()).digest())
    if expected != record["code_challenge"]:
        raise HTTPException(400, "PKCE verification failed")
    payload = dict(record["user_payload"])
    payload["client_id"] = record["client_id"]
    access_token = create_jwt_token(payload)
    return {"access_token": access_token, "token_type": "Bearer",
            "expires_in": 60 * 60 * 24, "scope": "mcp"}
