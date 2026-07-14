"""
rate_limiter.py — Sliding window rate limiter for Vertex AI API calls.
Prevents abuse at window edges and burst attacks.
Uses Redis if available, falls back to in-memory.
"""
import time
import threading
from collections import defaultdict, deque
from typing import Tuple
import logging

logger = logging.getLogger("rate_limiter")

# ══════════════════════════════════════════════════════════════════════
# LIMITS — adjust these based on your Vertex AI quota
# ══════════════════════════════════════════════════════════════════════
LIMITS = {
    "free":    {"per_minute": 2,  "per_hour": 5,   "per_day": 10},
    "pro":     {"per_minute": 5,  "per_hour": 50,  "per_day": 200},
    "premium": {"per_minute": 10, "per_hour": 150, "per_day": 500},
    "default": {"per_minute": 2,  "per_hour": 5,   "per_day": 10},
}

# Global sliding window stores — {user_id: deque of timestamps}
_minute_windows = defaultdict(deque)
_hour_windows = defaultdict(deque)
_day_windows = defaultdict(deque)
_lock = threading.Lock()

def _clean_window(window: deque, cutoff: float):
    """Remove timestamps older than cutoff."""
    while window and window[0] < cutoff:
        window.popleft()

def check_rate_limit(user_id: str, plan: str = "free") -> Tuple[bool, str, dict]:
    """
    Sliding window rate limit check.
    Returns (allowed, reason, headers_dict)
    """
    limits = LIMITS.get(plan, LIMITS["default"])
    now = time.time()

    with _lock:
        minute_window = _minute_windows[user_id]
        hour_window = _hour_windows[user_id]
        day_window = _day_windows[user_id]

        # Clean old entries
        _clean_window(minute_window, now - 60)
        _clean_window(hour_window, now - 3600)
        _clean_window(day_window, now - 86400)

        minute_count = len(minute_window)
        hour_count = len(hour_window)
        day_count = len(day_window)

        headers = {
            "X-RateLimit-Limit-Minute": str(limits["per_minute"]),
            "X-RateLimit-Limit-Hour": str(limits["per_hour"]),
            "X-RateLimit-Limit-Day": str(limits["per_day"]),
            "X-RateLimit-Remaining-Minute": str(max(0, limits["per_minute"] - minute_count)),
            "X-RateLimit-Remaining-Hour": str(max(0, limits["per_hour"] - hour_count)),
            "X-RateLimit-Remaining-Day": str(max(0, limits["per_day"] - day_count)),
        }

        # Check per-minute limit (sliding window, no edge case)
        if minute_count >= limits["per_minute"]:
            retry_after = int(minute_window[0] + 60 - now) + 1
            headers["Retry-After"] = str(retry_after)
            return False, f"Rate limit: {limits['per_minute']} generations per minute. Retry in {retry_after}s.", headers

        # Check per-hour limit
        if hour_count >= limits["per_hour"]:
            retry_after = int(hour_window[0] + 3600 - now) + 1
            headers["Retry-After"] = str(retry_after)
            return False, f"Rate limit: {limits['per_hour']} generations per hour. Retry in {retry_after // 60}min.", headers

        # Check per-day limit
        if day_count >= limits["per_day"]:
            retry_after = int(day_window[0] + 86400 - now) + 1
            headers["Retry-After"] = str(retry_after)
            return False, f"Daily limit reached: {limits['per_day']} generations per day.", headers

        # All checks passed — record this request
        minute_window.append(now)
        hour_window.append(now)
        day_window.append(now)

        return True, "ok", headers

def get_usage(user_id: str, plan: str = "free") -> dict:
    """Get current usage stats for a user."""
    limits = LIMITS.get(plan, LIMITS["default"])
    now = time.time()

    with _lock:
        minute_window = _minute_windows[user_id]
        hour_window = _hour_windows[user_id]
        day_window = _day_windows[user_id]

        _clean_window(minute_window, now - 60)
        _clean_window(hour_window, now - 3600)
        _clean_window(day_window, now - 86400)

        return {
            "minute": {"used": len(minute_window), "limit": limits["per_minute"]},
            "hour": {"used": len(hour_window), "limit": limits["per_hour"]},
            "day": {"used": len(day_window), "limit": limits["per_day"]},
        }
