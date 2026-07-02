"""
SocioMee Coupon Code System
Validates discount codes and returns discount details.
All coupons apply to Pro Monthly (₹499) only.
"""
from datetime import datetime, timezone
from typing import Optional

COUPONS = {
    "PHHUNT30": {
        "discount_pct": 30,
        "description": "Product Hunt Launch — 30% off Pro Monthly",
        "applies_to": ["pro_monthly"],
        "expires_at": "2026-07-14T23:59:59+00:00",
        "active": True,
    },
    "SOCIOMEE143": {
        "discount_pct": 20,
        "description": "SocioMee Official — 20% off Pro Monthly",
        "applies_to": ["pro_monthly"],
        "expires_at": None,
        "active": True,
    },
    "CREATOR15": {
        "discount_pct": 15,
        "description": "Creator Discount — 15% off Pro Monthly",
        "applies_to": ["pro_monthly"],
        "expires_at": None,
        "active": True,
    },
}

PLAN_PRICES = {
    "pro_monthly": 49900,   # ₹499 in paise
    "pro_annual": 399900,   # ₹3,999 in paise
    "premium_monthly": 199900,
    "premium_annual": 1599900,
}

def validate_coupon(code: str, plan_key: str) -> dict:
    """
    Validates a coupon code for a given plan.
    Returns dict with valid, discount_pct, discounted_price, message.
    """
    code = code.strip().upper()
    coupon = COUPONS.get(code)

    if not coupon:
        return {"valid": False, "message": "Invalid coupon code."}

    if not coupon["active"]:
        return {"valid": False, "message": "This coupon is no longer active."}

    if plan_key not in coupon["applies_to"]:
        return {"valid": False, "message": f"This coupon only applies to: {', '.join(coupon['applies_to']).replace('_', ' ').title()}."}

    if coupon["expires_at"]:
        expiry = datetime.fromisoformat(coupon["expires_at"])
        if datetime.now(timezone.utc) > expiry:
            return {"valid": False, "message": "This coupon has expired."}

    original_price = PLAN_PRICES.get(plan_key, 0)
    discount_pct = coupon["discount_pct"]
    discount_amount = int(original_price * discount_pct / 100)
    discounted_price = original_price - discount_amount

    return {
        "valid": True,
        "code": code,
        "discount_pct": discount_pct,
        "original_price": original_price,
        "discounted_price": discounted_price,
        "discount_amount": discount_amount,
        "description": coupon["description"],
        "message": f"{discount_pct}% discount applied.",
    }
