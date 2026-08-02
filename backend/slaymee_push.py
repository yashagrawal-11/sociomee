import os, json, logging, random
from pathlib import Path
from datetime import datetime as _dt
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

log = logging.getLogger(__name__)
router = APIRouter(prefix="/slaymee/push", tags=["slaymee-push"])

SUBS_FILE = Path("/var/www/sociomee/backend/data/slaymee_push_subscriptions.json")
SUBS_FILE.parent.mkdir(parents=True, exist_ok=True)

VAPID_PUBLIC  = "BARF6PdUt5Shppq2J9nm3qJA6haptbcUVcCofZddF3If-2krghnNtI8nfkSkLGTjCH-UpPHa4zW6fo-mgLeL4n4"
VAPID_PRIVATE = "0X9_k2rc-GZXov_ifZnEgtcEQXdZGU1GKd1UmsUm4DE"
VAPID_EMAIL   = "mailto:support@slaymee.com"

def _load():
    try:
        if SUBS_FILE.exists(): return json.loads(SUBS_FILE.read_text())
    except: pass
    return {}

def _save(data):
    try: SUBS_FILE.write_text(json.dumps(data, indent=2))
    except Exception as e: log.error("slaymee push save: %s", e)

def send_push(user_id, title, body, url="https://slaymee.com", tag="slaymee", require_interaction=False):
    try:
        from pywebpush import webpush, WebPushException
        subs = _load(); user_subs = subs.get(user_id, [])
        if not user_subs: return False
        payload = json.dumps({
            "title": title, "body": body, "url": url, "tag": tag,
            "requireInteraction": require_interaction,
            "icon": "https://slaymee.com/slay-logo.png",
            "badge": "https://slaymee.com/slay-logo.png"
        })
        dead = []
        for sub in user_subs:
            try:
                webpush(subscription_info=sub, data=payload, vapid_private_key=VAPID_PRIVATE, vapid_claims={"sub": VAPID_EMAIL})
            except Exception as ex:
                if hasattr(ex, 'response') and ex.response and ex.response.status_code in (404, 410): dead.append(sub)
                log.warning("slaymee push fail %s: %s", user_id, ex)
        if dead:
            subs[user_id] = [s for s in user_subs if s not in dead]; _save(subs)
        return True
    except Exception as e: log.error("slaymee send_push: %s", e); return False

NOTIFICATION_POOLS = {
    "morning": [
        "auntie your daughter is about to slay today. open slaymee.",
        "rise and check your drip. the fits are waiting.",
        "no cap your morning routine is missing one thing. slaymee.",
        "bet you haven't checked what's new on slaymee yet.",
        "main character does not leave the house without checking slaymee first.",
        "the fit won't pick itself bestie.",
        "good morning. your style era starts now.",
    ],
    "afternoon": [
        "3pm and your drip is still undecided. slaymee can fix that.",
        "pov: you find your next bussin outfit right now.",
        "no mid looks allowed. slaymee has fire fits only.",
        "lunch break = slaymee break. bet.",
        "that outfit you were thinking about is still there. just saying.",
        "your afternoon is giving very almost-slayed energy. let's finish it.",
        "one scroll on slaymee and the fit is sorted. fr.",
    ],
    "evening": [
        "auntie your daughter is slayinggg. new looks on slaymee.",
        "evening out? the drip needs to be fire. slaymee got you.",
        "the girls are getting ready. your fit should too.",
        "golden hour energy deserves a golden fit. no cap.",
        "rizz level depends heavily on the fit. check slaymee.",
        "night out or night in, the look has to be bussin.",
        "your slay era is not gonna start itself bestie.",
    ],
    "weekend": [
        "it is Saturday and your drip should reflect that.",
        "brunch fit. market fit. couch fit. slaymee has all three.",
        "weekend mogging starts with the right outfit. bet.",
        "sunday reset includes finding your next fit. slaymee is right here.",
        "no plans is not an excuse for mid drip. just saying.",
        "your weekend is fire. your fit should match.",
    ],
    "genz": [
        "bestie your next slay fit is literally one tap away.",
        "it is giving very about to look incredible energy.",
        "no cap slaymee found something very you.",
        "the fit check called. slaymee answered.",
        "your drip era is now. not tomorrow. now.",
        "skibidi fits are not allowed here. only fire ones.",
        "pov you open slaymee and find your next obsession.",
    ],
    "motivational": [
        "confidence is the best fit. slaymee handles the rest.",
        "dress how you want to feel. feel like the main character.",
        "looking good and feeling good are the same thing.",
        "every slay starts with one decision. make it today.",
        "you deserve outfits that match your energy. slaymee has them.",
        "your style is a whole vibe. let slaymee bring it out.",
    ],
}

def get_random_nudge():
    now = _dt.now()
    if now.weekday() >= 5:
        pools = ["weekend", "genz"]
    elif 5 <= now.hour < 12:
        pools = ["morning", "motivational"]
    elif 12 <= now.hour < 17:
        pools = ["afternoon", "genz"]
    elif 17 <= now.hour < 23:
        pools = ["evening", "genz"]
    else:
        pools = ["genz", "motivational"]
    pool = random.choice(pools)
    return random.choice(NOTIFICATION_POOLS[pool])

def notify_welcome(user_id, name=""):
    first = name.split()[0] if name else "babe"
    return send_push(
        user_id,
        f"welcome to SlayMee, {first}",
        "your slay era starts now. no cap.",
        "https://slaymee.com",
        "welcome",
        False
    )

def notify_idle_nudge(user_id):
    if not user_id or len(user_id) < 5: return False
    message = get_random_nudge()
    return send_push(user_id, "SlayMee", message, "https://slaymee.com", "idle-nudge", False)

def get_all_subscribed_user_ids():
    return list(_load().keys())

@router.post("/subscribe")
async def subscribe(request: Request):
    body = await request.json()
    user_id = body.get("user_id", ""); sub = body.get("subscription", {})
    if not user_id or not sub.get("endpoint"):
        return JSONResponse({"error": "missing fields"}, status_code=400)
    subs = _load(); user_subs = subs.get(user_id, [])
    is_new = sub["endpoint"] not in [s.get("endpoint") for s in user_subs]
    if is_new:
        user_subs.append(sub); subs[user_id] = user_subs; _save(subs)
    if is_new and len(user_id) >= 5:
        import threading, time
        def _delayed():
            time.sleep(300)
            try: notify_welcome(user_id)
            except Exception as e: log.warning("slaymee welcome failed: %s", e)
        threading.Thread(target=_delayed, daemon=True).start()
    return {"success": True, "count": len(user_subs)}

@router.post("/unsubscribe")
async def unsubscribe(request: Request):
    body = await request.json(); user_id = body.get("user_id", ""); endpoint = body.get("endpoint", "")
    subs = _load()
    if user_id in subs:
        subs[user_id] = [s for s in subs[user_id] if s.get("endpoint") != endpoint]; _save(subs)
    return {"success": True}

@router.get("/vapid-public-key")
async def vapid_key(): return {"publicKey": VAPID_PUBLIC}

@router.get("/status/{user_id}")
async def status(user_id: str):
    return {"subscribed": len(_load().get(user_id, [])) > 0}
