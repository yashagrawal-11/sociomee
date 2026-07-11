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
try:
    from push_routes import notify_out_of_credits, notify_credits_restored
    _HAS_PUSH = True
except Exception:
    _HAS_PUSH = False
    def notify_out_of_credits(u): pass
    def notify_credits_restored(u, c=20): pass
from typing import Any, Dict, Optional

# ── Plan config ───────────────────────────────────────────────────────
PLAN_LIMITS: Dict[str, int] = {
    "free":             20,
    "pro_monthly":      150,
    "pro_annual":       150,
    "premium_monthly":  300,
    "premium_annual":   300,
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
            new_credits = PLAN_LIMITS.get(plan, PLAN_LIMITS["free"])
            record["credits_remaining"] = new_credits
            record["last_reset"]        = _now_iso()
            try:
                notify_credits_restored(user_id, new_credits)
                _email = record.get("email", "")
                _name = record.get("name", "")
                if _email:
                    from email_service import send_low_credits_warning
                    # Reuse low credits template with full credits to signal restoration
                    from resend import Emails as _E
                    import os as _os
                    from email_service import _base_template, FROM_EMAIL, BRAND_PURPLE
                    _first = _name.split()[0] if _name else "creator"
                    _content = f"""
                      <div style="display:inline-block;background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.4);border-radius:99px;padding:6px 16px;font-size:12px;font-weight:700;color:#34d399;margin-bottom:16px">Credits Restored</div>
                      <h1 style="font-size:22px;font-weight:800;color:#ede8ff;margin:0 0 8px">{new_credits} fresh credits just dropped, {_first}.</h1>
                      <p style="font-size:14px;color:#c4b5fd;line-height:1.8;margin:0 0 16px">Your monthly credits have been reset. Time to create.</p>
                      <div style="text-align:center;margin:24px 0">
                        <a href="https://sociomeeai.com/app" style="display:inline-block;padding:13px 28px;border-radius:99px;background:linear-gradient(135deg,{BRAND_PURPLE},#ff3d8f);color:#fff;font-weight:800;font-size:14px;text-decoration:none">Start Creating</a>
                      </div>
                    """
                    _E.send({{"from": FROM_EMAIL, "to": [_email], "subject": f"credits just dropped — {{new_credits}} ready to use", "html": _base_template(_content)}})
            except Exception: pass
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
        "plan":                     plan,
        "plan_label":               plan.replace("_", " ").title(),
        "credits_remaining":        credits,
        "credits":                  credits,
        "monthly_limit":            limit,
        "next_reset":               next_reset,
        "email":                    record.get("email", ""),
        "scheduled_downgrade_plan": record.get("scheduled_downgrade_plan"),
        "scheduled_downgrade_at":   record.get("scheduled_downgrade_at"),
    }


def get_user_credits(user_id: str) -> int:
    return get_credit_status(user_id)["credits_remaining"]


def use_credit(user_id: str, cost: int = 1) -> bool:
    """Deduct credits atomically. cost=1 for small actions, cost=10 for full generation sessions. Returns True if successful."""
    with _lock:
        data    = _load()
        record  = _get_or_init(data, user_id)
        record  = _check_and_reset(record)
        credits = record.get("credits_remaining", 0)
        if credits <= 0:
            data[user_id] = record
            _save(data)
            try:
                notify_out_of_credits(user_id)
                _email = record.get("email", "")
                _name = record.get("name", "")
                _plan = record.get("plan", "free")
                if _plan == "free":
                    from push_routes import send_push
                    send_push(user_id, "upgrade to pro.", "200 credits/month for ₹499. your free credits are gone.", "https://sociomeeai.com/app", "upgrade-nudge", True)
                if _email:
                    from email_service import send_low_credits_warning
                    send_low_credits_warning(_email, _name, 0, _plan)
            except Exception: pass
            return False
        new_credits = credits - cost
        record["credits_remaining"] = new_credits
        record["last_generated"] = datetime.now(timezone.utc).isoformat()
        data[user_id] = record
        _save(data)
        # Low credits warning at 3 credits remaining
        if new_credits <= 3 and new_credits > 0:
            try:
                from push_routes import send_push
                from email_service import send_low_credits_warning
                _email = record.get("email", "")
                _name = record.get("name", "")
                _plan = record.get("plan", "free")
                send_push(user_id, "running low on credits", f"only {new_credits} left this month. top up before you run out.", "https://sociomeeai.com/app", "low-credits", False)
                if _email:
                    send_low_credits_warning(_email, _name, new_credits, _plan)
            except Exception: pass
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


def schedule_downgrade(user_id: str, target_plan: str) -> dict:
    """Schedule a downgrade to take effect at plan_expires. Does not change plan or credits now."""
    if target_plan not in PLAN_LIMITS:
        raise ValueError(f"Unknown plan: {target_plan}")
    with _lock:
        data   = _load()
        record = _get_or_init(data, user_id)
        expires = record.get("plan_expires")
        record["scheduled_downgrade_plan"] = target_plan
        record["scheduled_downgrade_at"]   = expires  # None = immediate if no expiry set
        data[user_id] = record
        _save(data)
    return {"scheduled_plan": target_plan, "effective_at": expires}

def cancel_scheduled_downgrade(user_id: str) -> None:
    """Cancel a pending scheduled downgrade (e.g. user re-upgrades)."""
    with _lock:
        data   = _load()
        record = _get_or_init(data, user_id)
        record.pop("scheduled_downgrade_plan", None)
        record.pop("scheduled_downgrade_at", None)
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