"""
consent_log.py — Append-only audit trail of DPDP Section 6 consent events.

Every account creation, regardless of login method (email, Google, Facebook,
Microsoft, LinkedIn, Pinterest), must produce exactly one entry here recording
what was agreed to, when, from where, and under which Terms/Privacy Policy
version. This is the durable, verifiable record required under DPDP Act
Section 6 if consent validity is ever challenged or audited.

Deliberately append-only (JSONL, never rewritten in place) so entries can't
be silently altered after the fact.
"""
import json
from pathlib import Path
from datetime import datetime, timezone

LOG_FILE = Path(__file__).resolve().parent / "data" / "consent_log.jsonl"

# Bump these whenever Terms or Privacy Policy content materially changes,
# so historical log entries stay tied to the exact version a user agreed to.
TERMS_VERSION = "2026-08-07"
PRIVACY_VERSION = "2026-08-07"

def log_consent(user_id: str, email: str, method: str, ip: str = "", user_agent: str = "") -> None:
    """Records one consent event. Never raises — a logging failure must never
    block signup, but should not be silently invisible either."""
    try:
        LOG_FILE.parent.mkdir(exist_ok=True)
        entry = {
            "user_id": user_id,
            "email": email,
            "method": method,
            "age_confirmed": True,
            "terms_version": TERMS_VERSION,
            "privacy_version": PRIVACY_VERSION,
            "consented_at": datetime.now(timezone.utc).isoformat(),
            "ip": ip,
            "user_agent": user_agent,
        }
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(json.dumps(entry) + "\n")
    except Exception as e:
        import logging
        logging.getLogger("consent_log").error(f"Failed to log consent for user={user_id}: {e}")
