"""
device_fingerprint.py — Device-based abuse prevention for SocioMee.
Tracks device signatures across accounts to prevent free credit abuse.
Works across Google, GitHub, Facebook, Microsoft, LinkedIn, Pinterest, Phone, Email logins.
"""
import hashlib
import json
import time
import os
from pathlib import Path
from typing import Optional
import threading

_lock = threading.Lock()
DATA_FILE = Path(__file__).resolve().parent / "fingerprint_data.json"

def _load() -> dict:
    try:
        if DATA_FILE.exists():
            return json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except Exception:
        pass
    return {}

def _save(data: dict):
    try:
        DATA_FILE.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except Exception:
        pass

def make_fingerprint(
    ip: str = "",
    user_agent: str = "",
    screen: str = "",
    timezone: str = "",
    language: str = "",
    canvas: str = "",
    webgl: str = "",
    fonts: str = "",
    platform: str = "",
) -> str:
    """Generate a device fingerprint hash from browser signals."""
    components = [
        ip.split(":")[0] if ":" in ip else ip,  # IPv4 only
        user_agent,
        screen,
        timezone,
        language,
        canvas[:100] if canvas else "",
        webgl[:100] if webgl else "",
        platform,
    ]
    raw = "|".join(str(c).lower().strip() for c in components)
    return hashlib.sha256(raw.encode()).hexdigest()[:32]

def check_fingerprint(fingerprint: str, user_id: str, email: str = "") -> dict:
    """
    Check if this device has been used before.
    Returns: {allowed: bool, reason: str, is_new_device: bool, abuse_score: int}
    """
    if not fingerprint:
        return {"allowed": True, "reason": "", "is_new_device": True, "abuse_score": 0}

    with _lock:
        data = _load()
        fp_data = data.get("fingerprints", {})
        user_data = data.get("users", {})

        # Get existing records for this fingerprint
        fp_record = fp_data.get(fingerprint, {
            "first_seen": int(time.time()),
            "last_seen": int(time.time()),
            "user_ids": [],
            "emails": [],
            "account_count": 0,
            "blocked": False,
        })

        # Get existing records for this user
        user_record = user_data.get(user_id, {
            "fingerprints": [],
            "first_seen": int(time.time()),
        })

        abuse_score = 0
        is_new_device = fingerprint not in user_record.get("fingerprints", [])
        is_new_user = user_id not in fp_record.get("user_ids", [])

        # Update records
        fp_record["last_seen"] = int(time.time())
        if user_id not in fp_record["user_ids"]:
            fp_record["user_ids"].append(user_id)
            fp_record["account_count"] = len(fp_record["user_ids"])
        if email and email not in fp_record.get("emails", []):
            fp_record.setdefault("emails", []).append(email)

        if fingerprint not in user_record.get("fingerprints", []):
            user_record.setdefault("fingerprints", []).append(fingerprint)

        # Calculate abuse score
        account_count = fp_record["account_count"]

        if account_count >= 2:
            abuse_score += 20 * (account_count - 1)  # 20 per extra account

        # High abuse threshold — block if 5+ accounts on same device
        if account_count >= 5:
            fp_record["blocked"] = True
            abuse_score = 100

        # Save updated data
        if "fingerprints" not in data:
            data["fingerprints"] = {}
        if "users" not in data:
            data["users"] = {}
        data["fingerprints"][fingerprint] = fp_record
        data["users"][user_id] = user_record
        _save(data)

        allowed = not fp_record.get("blocked", False)
        reason = ""
        if not allowed:
            reason = "This device has been used to create too many accounts. Please contact support."
        elif abuse_score >= 60:
            reason = "Suspicious activity detected on this device."
            allowed = False

        return {
            "allowed": allowed,
            "reason": reason,
            "is_new_device": is_new_device,
            "abuse_score": min(abuse_score, 100),
            "account_count": account_count,
        }

def reduce_credits_for_suspicious(user_id: str, abuse_score: int) -> int:
    """Return reduced free credit limit based on abuse score."""
    if abuse_score == 0:
        return 20  # Normal free tier
    if abuse_score < 40:
        return 10  # Slightly suspicious
    if abuse_score < 70:
        return 5   # Very suspicious
    return 0       # Block completely
