"""
credits_manager.py — SocioMee Credit System
Monthly credits tied to user_id/email.
Resets every 30 days from last reset date.
Thread-safe with file locking.
"""

import json
import threading
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, Optional

# ── Plan config ───────────────────────────────────────────────────────
PLAN_LIMITS: Dict[str, int] = {
    "free":             20,
    "pro_monthly":      200,
    "pro_annual":       200,
    "premium_monthly":  500,
    "premium_annual":   500,
}

PLAN_PRICES: Dict[str, Dict[str, Any]] = {
    "pro_monthly": {
        "amount":    49900,
        "label":     "SocioMee Pro Monthly",
        "credits":   200,
        "uploads":   4,
        "type":      "plan",
        "features":  ["Full AI SEO", "Full script", "4 auto-uploads/month", "Instagram Auto DM", "Best time scheduling", "Thumbnail AI"],
    },
    "pro_annual": {
        "amount":    399900,
        "label":     "SocioMee Pro Annual",
        "credits":   200,
        "uploads":   4,
        "type":      "plan",
        "features":  ["Full AI SEO", "Full script", "4 auto-uploads/month", "Instagram Auto DM", "Best time scheduling", "Thumbnail AI", "33% off vs monthly"],
    },
    "premium_monthly": {
        "amount":    299900,
        "label":     "SocioMee Premium Monthly",
        "credits":   500,
        "uploads":   15,
        "type":      "plan",
        "features":  ["Perfect SEO + competitor research", "Script + hooks + research", "15 auto-uploads/month", "Instagram Auto DM", "Best time scheduling", "Thumbnail AI", "Priority support"],
    },
    "premium_annual": {
        "amount":    2399900,
        "label":     "SocioMee Premium Annual",
        "credits":   500,
        "uploads":   15,
        "type":      "plan",
        "features":  ["Perfect SEO + competitor research", "Script + hooks + research", "15 auto-uploads/month", "Instagram Auto DM", "Best time scheduling", "Thumbnail AI", "Priority support", "33% off vs monthly"],
    },
    "topup_99": {
        "amount":    9900,
        "label":     "50 Credits Top-Up",
        "credits":   50,
        "type":      "topup",
    },
    "topup_199": {
        "amount":    19900,
        "label":     "120 Credits Top-Up",
        "credits":   120,
        "type":      "topup",
    },
}

DATA_FILE = Path(__file__).resolve().parent / "credits_data.json"
_lock     = threading.Lock()


# ── Storage ───────────────────────────────────────────────────────────
def _load() -> Dict[str, Any]:
    if not DATA_FILE.exists():
        return {}
    try:
        raw = DATA_FILE.read_text(encoding="utf-8").strip()
        return json.loads(raw) if raw else {}
    except Exception:
        return {}


def _save(data: Dict[str, Any]) -> None:
    try:
        DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        pass


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _get_or_init(data: Dict, user_id: str) -> Dict[str, Any]:
    if user_id not in data:
        data[user_id] = {
            "plan":              "free",
            "credits_remaining": PLAN_LIMITS["free"],
            "last_reset":        _now_iso(),
            "plan_expires":      None,
            "email":             "",
        }
    else:
        record = data[user_id]
        if "credits_remaining" not in record:
            plan = record.get("plan", "free")
            record["credits_remaining"] = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
            record.setdefault("last_reset", _now_iso())
            record.setdefault("plan_expires", None)
            record.setdefault("email", "")
            data[user_id] = record
    return data[user_id]


def _check_and_reset(record: Dict[str, Any]) -> Dict[str, Any]:
    """Auto-reset credits every 30 days."""
    last = record.get("last_reset")
    if not last:
        record["last_reset"] = _now_iso()
        return record
    try:
        last_dt = datetime.fromisoformat(last)
        now     = datetime.now(timezone.utc)
        if (now - last_dt).days >= 30:
            plan = record.get("plan", "free")
            record["credits_remaining"] = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
            record["last_reset"]        = _now_iso()
    except Exception:
        pass
    return record


# ── Public API ────────────────────────────────────────────────────────

def get_credit_status(user_id: str) -> Dict[str, Any]:
    with _lock:
        data   = _load()
        record = _get_or_init(data, user_id)
        record = _check_and_reset(record)
        if record.get("credits_remaining") is None:
            plan = record.get("plan", "free")
            record["credits_remaining"] = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
        record["credits_remaining"] = max(0, int(record["credits_remaining"]))
        data[user_id] = record
        _save(data)

    plan    = record.get("plan", "free")
    credits = record.get("credits_remaining", 0)
    limit   = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
    last    = record.get("last_reset", _now_iso())

    try:
        next_reset = (datetime.fromisoformat(last) + timedelta(days=30)).isoformat()
    except Exception:
        next_reset = ""

    return {
        "plan":              plan,
        "plan_label":        plan.replace("_", " ").title(),
        "credits_remaining": credits,
        "credits":           credits,
        "monthly_limit":     limit,
        "next_reset":        next_reset,
        "email":             record.get("email", ""),
    }


def get_user_credits(user_id: str) -> int:
    return get_credit_status(user_id)["credits_remaining"]


def use_credit(user_id: str) -> bool:
    """Deduct 1 credit atomically. Returns True if successful."""
    with _lock:
        data    = _load()
        record  = _get_or_init(data, user_id)
        record  = _check_and_reset(record)
        credits = record.get("credits_remaining", 0)
        if credits <= 0:
            data[user_id] = record
            _save(data)
            return False
        record["credits_remaining"] = credits - 1
        data[user_id] = record
        _save(data)
        return True


def set_user_plan(user_id: str, plan: str, email: str = "") -> None:
    """Upgrade plan + reset credits to plan limit."""
    if plan not in PLAN_LIMITS:
        raise ValueError(f"Unknown plan: {plan}")
    with _lock:
        data   = _load()
        record = _get_or_init(data, user_id)
        record["plan"]              = plan
        record["credits_remaining"] = PLAN_LIMITS[plan]
        record["last_reset"]        = _now_iso()
        if email:
            record["email"] = email
        if plan == "pro_monthly":
            days = 30
        elif plan == "pro_annual":
            days = 365
        elif plan == "premium_monthly":
            days = 30
        elif plan == "premium_annual":
            days = 365
        else:
            days = None
        record["plan_expires"] = (
            (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()
            if days else None
        )
        data[user_id] = record
        _save(data)


def add_credits(user_id: str, amount: int, email: str = "") -> int:
    """Add credits (top-up). Does not change plan. Returns new total."""
    with _lock:
        data   = _load()
        record = _get_or_init(data, user_id)
        record = _check_and_reset(record)
        if email:
            record["email"] = email
        record["credits_remaining"] = record.get("credits_remaining", 0) + amount
        data[user_id] = record
        _save(data)
        return record["credits_remaining"]


def reset_user_credits(user_id: str) -> None:
    with _lock:
        data   = _load()
        record = _get_or_init(data, user_id)
        record["credits_remaining"] = PLAN_LIMITS.get(record.get("plan", "free"), 20)
        record["last_reset"]        = _now_iso()
        data[user_id] = record
        _save(data)


def get_all_usage() -> Dict[str, Any]:
    return _load()


def get_plan_info(plan: Optional[str] = None) -> Any:
    if plan:
        return PLAN_PRICES.get(plan, {})
    return PLAN_PRICES


# Legacy aliases
def get_abuse_report() -> dict:
    return {}


def add_bonus_credits(user_id: str, amount: int) -> int:
    return add_credits(user_id, amount)


def ban_user(user_id: str, reason: str = "") -> None:
    with _lock:
        data   = _load()
        record = _get_or_init(data, user_id)
        record["banned"]     = True
        record["ban_reason"] = reason
        data[user_id] = record
        _save(data)


def unban_user(user_id: str) -> None:
    with _lock:
        data = _load()
        if user_id in data:
            data[user_id].pop("banned",     None)
            data[user_id].pop("ban_reason", None)
            _save(data)