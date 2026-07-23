"""
plan_limits.py — Connection limits per plan
Free: 0 (cannot connect anything)
Pro: 2 accounts per platform
Pro+: 4 accounts per platform
"""
from credits_manager import get_credit_status

CONNECT_LIMITS = {
    "free":             0,
    "pro_monthly":      2,
    "pro_annual":       2,
    "premium_monthly":  4,
    "premium_annual":   4,
}

def get_connect_limit(user_id: str) -> int:
    try:
        plan = get_credit_status(user_id).get("plan", "free")
        return CONNECT_LIMITS.get(plan, 0)
    except:
        return 0

def check_connect_limit(user_id: str, current_count: int, platform: str = "platform") -> dict:
    """
    Returns {"allowed": True} or {"allowed": False, "reason": "...", "upgrade": True}
    """
    limit = get_connect_limit(user_id)
    if limit == 0:
        return {
            "allowed": False,
            "reason": f"Free plan cannot connect {platform}. Upgrade to Pro to connect up to 2 accounts.",
            "upgrade": True,
            "limit": 0
        }
    if current_count >= limit:
        plan = get_credit_status(user_id).get("plan", "free")
        if "premium" in plan:
            return {
                "allowed": False,
                "reason": f"Maximum {limit} {platform} accounts reached on your Pro+ plan.",
                "upgrade": False,
                "limit": limit
            }
        return {
            "allowed": False,
            "reason": f"Maximum {limit} {platform} accounts reached on your Pro plan. Upgrade to Pro+ to connect up to 4 accounts.",
            "upgrade": True,
            "limit": limit
        }
    return {"allowed": True, "limit": limit}
