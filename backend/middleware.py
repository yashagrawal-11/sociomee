"""
middleware.py — SocioMee Route Protection
"""

from __future__ import annotations

import logging
import os
from typing import Any, Dict, Optional

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# Load env so JWT_SECRET is available
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
load_dotenv(os.path.join(BASE_DIR, ".env"), override=True)

JWT_SECRET    = os.getenv("JWT_SECRET", "")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")

log = logging.getLogger("middleware")

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated. Please log in with Google.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return {
            "user_id": payload.get("user_id", payload.get("sub", "")),
            "email":   payload.get("email", ""),
            "plan":    payload.get("plan", "free"),
            "name":    payload.get("name", ""),
            "picture": payload.get("picture", ""),
        }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired. Please log in again.")
    except jwt.InvalidTokenError as exc:
        log.error("Token verification error: %s", exc)
        raise HTTPException(status_code=401, detail="Authentication failed.")
    except Exception as exc:
        log.error("Token verification error: %s", exc)
        raise HTTPException(status_code=401, detail="Authentication failed.")


def optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(_bearer),
) -> Dict[str, Any]:
    if not credentials or not credentials.credentials:
        return {}
    try:
        return get_current_user(credentials)
    except HTTPException:
        return {}


def require_plan(minimum_plan: str):
    plan_rank = {"free": 0, "pro": 1, "team": 2, "unlimited": 3}

    def _check(user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_plan = user.get("plan", "free")
        if plan_rank.get(user_plan, 0) < plan_rank.get(minimum_plan, 1):
            raise HTTPException(
                status_code=403,
                detail=f"This feature requires a {minimum_plan.title()} plan. "
                       f"Your current plan is {user_plan.title()}.",
            )
        return user
    return _check