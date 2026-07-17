"""
subscription_routes.py — Razorpay Autopay Subscriptions
"""
import os, hmac, hashlib, logging, time
from fastapi import APIRouter, Request, HTTPException
from pydantic import BaseModel
from credits_manager import set_user_plan, add_credits
from auth_routes import _load_users, _save_users

log = logging.getLogger("subscription")
router = APIRouter(prefix="/subscription", tags=["subscription"])

import razorpay
RZP_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RZP_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")

PLAN_MAP = {
    "pro_monthly":      os.getenv("RZP_PLAN_PRO_MONTHLY", ""),
    "pro_annual":       os.getenv("RZP_PLAN_PRO_ANNUAL", ""),
    "premium_monthly":  os.getenv("RZP_PLAN_PREMIUM_MONTHLY", ""),
    "premium_annual":   os.getenv("RZP_PLAN_PREMIUM_ANNUAL", ""),
}

PLAN_INFO = {
    "pro_monthly":     {"label": "Pro Monthly",     "credits": 180, "plan": "pro_monthly"},
    "pro_annual":      {"label": "Pro Annual",      "credits": 180, "plan": "pro_annual"},
    "premium_monthly": {"label": "Premium Monthly", "credits": 300, "plan": "premium_monthly"},
    "premium_annual":  {"label": "Premium Annual",  "credits": 300, "plan": "premium_annual"},
}

class CreateSubRequest(BaseModel):
    user_id: str
    email: str
    plan: str

class VerifySubRequest(BaseModel):
    user_id: str
    email: str
    plan: str
    razorpay_payment_id: str
    razorpay_subscription_id: str
    razorpay_signature: str

@router.post("/create")
def create_subscription(payload: CreateSubRequest):
    plan = payload.plan.strip().lower()
    if plan not in PLAN_MAP:
        raise HTTPException(400, f"Invalid plan: {plan}")
    plan_id = PLAN_MAP[plan]
    if not plan_id:
        raise HTTPException(500, f"Plan ID not configured for {plan}")
    try:
        client = razorpay.Client(auth=(RZP_KEY_ID, RZP_SECRET))
        sub = client.subscription.create({
            "plan_id": plan_id,
            "total_count": 12 if "monthly" in plan else 1,
            "quantity": 1,
            "notes": {
                "user_id": payload.user_id,
                "email": payload.email,
                "plan": plan,
            }
        })
        return {
            "subscription_id": sub["id"],
            "plan": plan,
            "plan_label": PLAN_INFO[plan]["label"],
            "key_id": RZP_KEY_ID,
        }
    except Exception as e:
        log.error("Subscription create error: %s", e)
        raise HTTPException(500, f"Razorpay error: {e}")

@router.post("/verify")
def verify_subscription(payload: VerifySubRequest):
    body = f"{payload.razorpay_payment_id}|{payload.razorpay_subscription_id}"
    expected = hmac.new(RZP_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected, payload.razorpay_signature):
        raise HTTPException(400, "Signature verification failed")

    plan = payload.plan.strip().lower()
    if plan not in PLAN_INFO:
        raise HTTPException(400, f"Invalid plan: {plan}")

    info = PLAN_INFO[plan]
    set_user_plan(payload.user_id, plan, email=payload.email)

    # Save subscription ID to user record
    try:
        users = _load_users()
        for key, u in users.items():
            if u.get("user_id") == payload.user_id or u.get("email") == payload.email:
                u["rzp_subscription_id"] = payload.razorpay_subscription_id
                u["rzp_plan"] = plan
                break
        _save_users(users)
    except Exception as e:
        log.warning("Could not save subscription ID: %s", e)

    log.info("Subscription verified: user=%s plan=%s sub=%s",
             payload.user_id, plan, payload.razorpay_subscription_id)

    return {
        "success": True,
        "message": f"Welcome to {info['label']}! Auto-renewal is active.",
        "plan": plan,
        "credits": info["credits"],
    }

@router.post("/webhook")
async def subscription_webhook(request: Request):
    """Handle Razorpay subscription webhooks for auto-renewal"""
    body = await request.body()
    sig = request.headers.get("X-Razorpay-Signature", "")
    webhook_secret = os.getenv("RZP_WEBHOOK_SECRET", "")

    if webhook_secret:
        expected = hmac.new(webhook_secret.encode(), body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, sig):
            raise HTTPException(400, "Invalid webhook signature")

    try:
        import json
        event = json.loads(body)
        event_type = event.get("event")
        log.info("Webhook event: %s", event_type)

        if event_type == "subscription.charged":
            payload = event.get("payload", {})
            sub = payload.get("subscription", {}).get("entity", {})
            notes = sub.get("notes", {})
            user_id = notes.get("user_id", "")
            email = notes.get("email", "")
            plan = notes.get("plan", "")

            if user_id and plan in PLAN_INFO:
                set_user_plan(user_id, plan, email=email)
                log.info("Auto-renewed: user=%s plan=%s", user_id, plan)

        elif event_type == "subscription.cancelled":
            payload = event.get("payload", {})
            sub = payload.get("subscription", {}).get("entity", {})
            notes = sub.get("notes", {})
            user_id = notes.get("user_id", "")
            email = notes.get("email", "")
            if user_id:
                set_user_plan(user_id, "free", email=email)
                log.info("Subscription cancelled, reverted to free: user=%s", user_id)

    except Exception as e:
        log.error("Webhook error: %s", e)

    return {"status": "ok"}
