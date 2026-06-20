"""
mcp_server.py — SocioMee MCP Connector
Exposes a small set of read-mostly tools to Claude via the Model Context Protocol.
Runs as its own process (PM2: sociomee-mcp) on port 8010, reverse-proxied at
https://mcp.sociomee.in by Nginx.

Tool surface is deliberately narrow: no money movement (SocioMee Pay excluded),
no AI image/video/audio generation (Pixel/Thumbnail Studio excluded) — both are
explicitly unsupported categories under Anthropic's Connectors Directory policy.
"""
import os
import sys
import json
import time
import secrets
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
import jwt

BASE_DIR = Path(__file__).parent
load_dotenv(BASE_DIR / ".env", override=True)

JWT_SECRET = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

sys.path.insert(0, str(BASE_DIR))
import credits_manager
import history_routes
import festival_routes
from news import store as news_store

import redis as redis_lib
_redis = redis_lib.Redis(host="localhost", port=6379, db=0, decode_responses=True)

from mcp.server.fastmcp import FastMCP
from mcp.server.auth.provider import TokenVerifier, AccessToken
from mcp.server.auth.settings import AuthSettings
from mcp.server.auth.middleware.auth_context import get_access_token
from mcp.server.transport_security import TransportSecuritySettings


class SocioMeeTokenVerifier(TokenVerifier):
    async def verify_token(self, token: str) -> Optional[AccessToken]:
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

        user_id = payload.get("user_id", payload.get("sub", ""))
        if not user_id:
            return None

        return AccessToken(
            token=token,
            client_id=payload.get("client_id", "sociomee-mcp-client"),
            scopes=["mcp"],
            expires_at=payload.get("exp"),
            subject=user_id,
        )


def _current_user_id() -> str:
    """Pull the verified caller's user_id from the auth context. Never accept
    a user_id as a tool argument — that would let the model impersonate anyone."""
    access_token = get_access_token()
    if not access_token or not access_token.subject:
        raise PermissionError("Not authenticated. Please connect your SocioMee account.")
    return access_token.subject


mcp = FastMCP(
    name="SocioMee",
    instructions=(
        "Tools for SocioMee creators: check your credit/plan status, browse "
        "AI-curated creator news, see upcoming Indian festivals for content "
        "planning, view your past content generations, and create instant "
        "file-share links."
    ),
    host="127.0.0.1",
    port=8010,
    streamable_http_path="/mcp",
    token_verifier=SocioMeeTokenVerifier(),
    auth=AuthSettings(
        issuer_url="https://sociomee.in",
        resource_server_url="https://mcp.sociomee.in",
        required_scopes=["mcp"],
    ),
    transport_security=TransportSecuritySettings(
        allowed_hosts=["mcp.sociomee.in", "127.0.0.1:8010", "localhost:8010"],
        allowed_origins=["https://claude.ai", "https://mcp.sociomee.in"],
    ),
)


@mcp.tool(title="Get SocioMee credit status", annotations={"readOnlyHint": True})
def get_credit_status() -> dict:
    """Returns the authenticated SocioMee user's current plan, remaining
    credits, and upload allowance. Read-only — makes no changes."""
    return credits_manager.get_credit_status(_current_user_id())


@mcp.tool(title="Search SocioMee creator news", annotations={"readOnlyHint": True})
def search_news(category: str = "all", limit: int = 10) -> list:
    """Returns recent AI-curated creator news and trending platform updates
    from SocioMee News. category: 'all' or a specific category. limit: max
    articles to return (default 10, max 20)."""
    limit = max(1, min(limit, 20))
    return news_store.get_news(category=category, limit=limit)


@mcp.tool(title="List upcoming Indian festivals", annotations={"readOnlyHint": True})
def list_upcoming_festivals() -> list:
    """Returns the next upcoming Indian festivals and events from the SocioMee
    Calendar, each with days-until, useful for content planning. Read-only."""
    return festival_routes.get_upcoming_festivals()


@mcp.tool(title="Get SocioMee generation history", annotations={"readOnlyHint": True})
def get_generation_history(limit: int = 20) -> list:
    """Returns the authenticated user's most recent SocioMee content
    generations (topic, platform, title, hashtags, word count). Read-only."""
    limit = max(1, min(limit, 50))
    return history_routes.get_history(_current_user_id())[:limit]


@mcp.tool(title="Create a SocioMee share link", annotations={"readOnlyHint": False, "destructiveHint": False})
def create_share_link(text: str, expires_minutes: int = 30) -> dict:
    """Creates a short-lived 6-digit code and link for sharing a piece of text
    (e.g. a script, caption, or note) across devices via SocioMee Share. Does
    not move money or large files. expires_minutes: link lifetime (default 30, max 1440)."""
    user_id = _current_user_id()
    expires_minutes = max(1, min(expires_minutes, 1440))
    expires_in = expires_minutes * 60
    code = str(secrets.randbelow(900000) + 100000)
    payload = {
        "code": code, "name": "shared-text.txt", "type": "text/plain",
        "size": len(text.encode("utf-8")), "file": text, "message": "",
        "sender": user_id, "created": int(time.time()),
        "expires": int(time.time()) + expires_in,
    }
    _redis.setex(f"share:{code}", expires_in, json.dumps(payload))
    return {"code": code, "expires_in_minutes": expires_minutes}


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
