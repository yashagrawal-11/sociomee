"""
telegram_connect.py — Per-User Telegram Connect
================================================
Each user connects their own Telegram by:
1. Clicking "Connect Telegram" → gets a unique link
2. Tapping the link → Telegram opens → clicks Start
3. Bot receives /start CODE → saves their chat_id
4. Dashboard shows "Connected ✅" automatically

Uses background polling (no webhook/ngrok needed for localhost).

Required .env:
    TELEGRAM_BOT_TOKEN = your_bot_token
    TELEGRAM_BOT_USERNAME = your_bot_username (e.g. SocioMeeBot)
"""

from __future__ import annotations
import json, logging, os, secrets, threading, time
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, Optional
import requests

log = logging.getLogger("telegram_connect")

BASE      = "https://api.telegram.org"
DATA_FILE = Path(__file__).resolve().parent / "telegram_accounts.json"
PEND_FILE = Path(__file__).resolve().parent / "telegram_pending.json"

# ── Env ───────────────────────────────────────────────────────────────
def _token()        -> str: return os.getenv("TELEGRAM_BOT_TOKEN",    "")
def _bot_username() -> str: return os.getenv("TELEGRAM_BOT_USERNAME", "")

def _assert_env():
    if not _token():
        raise RuntimeError("Missing TELEGRAM_BOT_TOKEN in .env")

# ── Storage ───────────────────────────────────────────────────────────
def _load(path: Path) -> Dict:
    if not path.exists(): return {}
    try:
        raw = path.read_text(encoding="utf-8").strip()
        return json.loads(raw) if raw else {}
    except Exception: return {}

def _save(path: Path, data: Dict):
    path.write_text(json.dumps(data, indent=2), encoding="utf-8")

# ── Connect flow ──────────────────────────────────────────────────────
def generate_connect_link(user_id: str) -> Dict[str, str]:
    """
    Generate a unique Telegram connect link for a user.
    Returns: { link, code, expires_in }
    """
    _assert_env()
    code   = secrets.token_hex(16)  # only hex chars 0-9a-f, safe for Telegram URLs
    bot_un = _bot_username()

    # Store pending connection
    pending = _load(PEND_FILE)
    pending[code] = {
        "user_id":    user_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "expires_at": (datetime.now(timezone.utc) + timedelta(minutes=10)).isoformat(),
    }
    _save(PEND_FILE, pending)

    bot_un_clean = bot_un.lstrip("@") if bot_un else ""
    if bot_un_clean:
        link = f"https://t.me/{bot_un_clean}?start={code}"
    else:
        link = f"https://t.me/sociomee_bot?start={code}"

    log.info("Generated Telegram connect link for user=%s code=%s", user_id, code)
    return {
        "link":       link,
        "code":       code,
        "expires_in": 600,  # 10 minutes
        "bot_username": bot_un,
    }

def handle_start(code: str, chat_id: int, telegram_username: str = "", full_name: str = "") -> bool:
    """
    Called when bot receives /start CODE from a user.
    Links their Telegram chat_id to their SocioMee user_id.
    Returns True if successfully linked.
    """
    pending = _load(PEND_FILE)
    record  = pending.get(code)
    if not record:
        log.warning("Unknown code: %s", code)
        return False

    # Check expiry
    expires_at = datetime.fromisoformat(record["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        log.warning("Code expired: %s", code)
        pending.pop(code, None)
        _save(PEND_FILE, pending)
        return False

    user_id = record["user_id"]

    # Save the connection
    accounts = _load(DATA_FILE)
    accounts[user_id] = {
        "chat_id":          str(chat_id),
        "telegram_username": telegram_username,
        "full_name":         full_name,
        "connected_at":      datetime.now(timezone.utc).isoformat(),
    }
    _save(DATA_FILE, accounts)

    # Remove pending record
    pending.pop(code, None)
    _save(PEND_FILE, pending)

    # Send welcome message to user
    try:
        send_message(
            chat_id=str(chat_id),
            text=(
                f"✅ <b>SocioMee Connected!</b>\n\n"
                f"Hey {full_name or 'there'}! Your Telegram is now linked to SocioMee.\n\n"
                f"🚀 Every time you generate content, you can send it here instantly!\n"
                f"Built with 💜 by SocioMee"
            )
        )
    except Exception as e:
        log.warning("Could not send welcome message: %s", e)

    log.info("Telegram connected: user_id=%s chat_id=%s", user_id, chat_id)
    return True

def is_connected(user_id: str) -> bool:
    return user_id in _load(DATA_FILE)

def get_connection(user_id: str) -> Optional[Dict]:
    return _load(DATA_FILE).get(user_id)

def disconnect(user_id: str):
    data = _load(DATA_FILE)
    data.pop(user_id, None)
    _save(DATA_FILE, data)

def get_chat_id(user_id: str) -> Optional[str]:
    conn = get_connection(user_id)
    return conn["chat_id"] if conn else None

def save_channel(user_id: str, channel: str) -> None:
    """Save user's channel username."""
    accounts = _load(DATA_FILE)
    if user_id not in accounts:
        raise ValueError("Telegram not connected yet.")
    # Normalize: ensure starts with @
    channel = channel.strip()
    if not channel.startswith("@"):
        channel = "@" + channel
    accounts[user_id]["channel"] = channel
    _save(DATA_FILE, accounts)

def verify_channel(user_id: str) -> Dict[str, Any]:
    """Test sending to user's channel. Bot must be admin."""
    conn = get_connection(user_id)
    if not conn:
        raise ValueError("Telegram not connected.")
    channel = conn.get("channel", "")
    if not channel:
        raise ValueError("No channel saved.")
    
    # Try sending a test message
    try:
        result = send_message(
            chat_id=channel,
            text=(
                "✅ <b>SocioMee Channel Connected!</b>\n\n"
                "Your channel is now linked to SocioMee.\n"
                "Generated content will be sent here automatically!\n\n"
                "⚡ Powered by <b>SocioMee AI</b>"
            )
        )
        # Mark channel as verified
        accounts = _load(DATA_FILE)
        accounts[user_id]["channel_verified"] = True
        _save(DATA_FILE, accounts)
        return {"success": True, "channel": channel}
    except Exception as e:
        err = str(e)
        if "chat not found" in err.lower():
            raise ValueError(f"Channel {channel} not found. Make sure the username is correct.")
        elif "not enough rights" in err.lower() or "forbidden" in err.lower():
            raise ValueError(f"@sociomee_bot is not admin in {channel}. Add it as admin first.")
        raise ValueError(f"Failed to send to {channel}: {err}")

def remove_channel(user_id: str) -> None:
    """Remove user's channel."""
    accounts = _load(DATA_FILE)
    if user_id in accounts:
        accounts[user_id].pop("channel", None)
        accounts[user_id].pop("channel_verified", None)
        _save(DATA_FILE, accounts)

# ── Send message ──────────────────────────────────────────────────────
def send_message(chat_id: str, text: str, parse_mode: str = "HTML") -> Dict:
    _assert_env()
    if len(text) > 4096:
        text = text[:4090] + "\n..."
    resp = requests.post(
        f"{BASE}/bot{_token()}/sendMessage",
        json={
            "chat_id":                  chat_id,
            "text":                     text,
            "parse_mode":               parse_mode,
            "disable_web_page_preview": True,
        },
        timeout=15,
    )
    data = resp.json()
    if not data.get("ok"):
        raise ValueError(f"Telegram error: {data.get('description', 'Unknown')}")
    return data

def send_content_pack(
    user_id:     str,
    topic:       str,
    platform:    str,
    script_text: str = "",
    best_title:  str = "",
    hook:        str = "",
    hashtags:    list = None,
    description: str = "",
) -> Dict[str, Any]:
    """Send full content pack to user's connected Telegram."""
    chat_id = get_chat_id(user_id)
    if not chat_id:
        raise ValueError("Telegram not connected. Please connect first.")

    platform_emoji = {
        "youtube":"▶️","instagram":"📸","tiktok":"🎵",
        "x":"𝕏","facebook":"📘","threads":"🧵",
        "telegram":"✈️","pinterest":"📌"
    }.get(platform.lower(), "📢")

    msgs_sent = []

    # Message 1: Header + Title + Hook
    msg1 = (
        f"{platform_emoji} <b>SocioMee Content Pack</b>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n"
        f"📍 Platform: <b>{platform.upper()}</b>\n"
        f"🔑 Topic: <code>{topic}</code>\n"
        f"━━━━━━━━━━━━━━━━━━━━\n\n"
        f"🎯 <b>{best_title or topic.title()}</b>"
    )
    if hook:
        msg1 += f"\n\n💡 <b>HOOK:</b>\n{hook}"
    r1 = send_message(chat_id, msg1)
    msgs_sent.append(r1["result"]["message_id"])

    # Message 2: Script
    if script_text:
        clean = script_text.replace("<", "&lt;").replace(">", "&gt;")
        if len(clean) > 3000:
            clean = clean[:2990] + "\n\n<i>... [Full script in SocioMee]</i>"
        msg2 = f"📜 <b>SCRIPT</b>\n━━━━━━━━━━━━━━━━━━━━\n\n{clean}"
        r2 = send_message(chat_id, msg2)
        msgs_sent.append(r2["result"]["message_id"])

    # Message 3: SEO
    seo_parts = []
    if description:
        seo_parts.append(f"📋 <b>DESCRIPTION:</b>\n<code>{description[:400]}...</code>")
    if hashtags:
        seo_parts.append(f"🏷️ <b>HASHTAGS:</b>\n{' '.join(hashtags[:15])}")

    if seo_parts:
        msg3 = (
            "🔍 <b>SEO PACK</b>\n━━━━━━━━━━━━━━━━━━━━\n\n"
            + "\n\n".join(seo_parts)
            + "\n\n━━━━━━━━━━━━━━━━━━━━\n⚡ Generated by <b>SocioMee AI</b>"
        )
        r3 = send_message(chat_id, msg3)
        msgs_sent.append(r3["result"]["message_id"])

    # Also send to channel if connected and verified
    conn     = get_connection(user_id)
    channel  = conn.get("channel", "") if conn else ""
    verified = conn.get("channel_verified", False) if conn else False
    ch_sent  = 0

    if channel and verified:
        try:
            # Send header to channel
            ch1 = send_message(channel, msg1)
            ch_sent += 1
            if script_text:
                ch2 = send_message(channel, msg2)
                ch_sent += 1
        except Exception as e:
            log.warning("Channel send failed: %s", e)

    return {
        "success":        True,
        "messages_sent":  len(msgs_sent),
        "channel_sent":   ch_sent,
        "channel":        channel if channel and verified else None,
        "message_ids":    msgs_sent,
    }

# ── Background polling ────────────────────────────────────────────────
_polling_thread: Optional[threading.Thread] = None
_last_update_id = 0

def _poll_loop():
    """Background thread that polls Telegram for new messages."""
    global _last_update_id
    log.info("Telegram polling started")
    while True:
        try:
            resp = requests.get(
                f"{BASE}/bot{_token()}/getUpdates",
                params={"offset": _last_update_id + 1, "timeout": 10, "limit": 10},
                timeout=20,
            )
            if not resp.ok:
                time.sleep(5); continue

            data    = resp.json()
            updates = data.get("result", [])

            for update in updates:
                _last_update_id = update["update_id"]
                msg = update.get("message", {})
                text = msg.get("text", "")

                if text.startswith("/start"):
                    parts    = text.split()
                    code     = parts[1] if len(parts) > 1 else ""
                    chat_id  = msg["chat"]["id"]
                    username = msg["from"].get("username", "")
                    fname    = msg["from"].get("first_name", "")
                    lname    = msg["from"].get("last_name", "")
                    full_name= f"{fname} {lname}".strip()

                    if code:
                        success = handle_start(code, chat_id, username, full_name)
                        if not success:
                            send_message(str(chat_id),
                                "⚠️ Link expired or invalid. Please get a new link from SocioMee.")
                    else:
                        send_message(str(chat_id),
                            "👋 Hi! Please use the connect link from SocioMee to link your account.")

        except Exception as e:
            log.warning("Polling error: %s", e)
            time.sleep(5)

        time.sleep(2)

def start_polling():
    """Start the background polling thread. Call once from app startup."""
    global _polling_thread
    if not _token():
        log.warning("TELEGRAM_BOT_TOKEN not set — polling not started")
        return
    if _polling_thread and _polling_thread.is_alive():
        return
    _polling_thread = threading.Thread(target=_poll_loop, daemon=True, name="telegram-poll")
    _polling_thread.start()
    log.info("Telegram polling thread started")