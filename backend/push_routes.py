import os, json, logging
from pathlib import Path
from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse

log = logging.getLogger(__name__)
router = APIRouter(prefix="/push", tags=["push"])
SUBS_FILE = Path("/var/www/sociomee/backend/data/push_subscriptions.json")
SUBS_FILE.parent.mkdir(parents=True, exist_ok=True)
VAPID_PUBLIC  = "BEByuC2Mkl9PWIgaiOFEgIcXjn6GSmlBo4tstvA8TS9d-PJtFshfg5KVqGQr75hb3-AWnFTsKZOnc1hF0OjTXLY"
VAPID_PRIVATE = "A_o6llgrCFdR9xqxHLsc9zxP-WeMJF0RsocqiXPm5SE"
VAPID_EMAIL   = "mailto:yash@sociomee.in"

def _load():
    try:
        if SUBS_FILE.exists(): return json.loads(SUBS_FILE.read_text())
    except: pass
    return {}

def _save(data):
    try: SUBS_FILE.write_text(json.dumps(data,indent=2))
    except Exception as e: log.error("push save: %s",e)

def send_push(user_id,title,body,url="https://sociomee.in/app",tag="sociomee",require_interaction=False):
    try:
        from pywebpush import webpush, WebPushException
        subs=_load(); user_subs=subs.get(user_id,[])
        if not user_subs: return False
        payload=json.dumps({"title":title,"body":body,"url":url,"tag":tag,"requireInteraction":require_interaction,"icon":"https://sociomee.in/s_logo.png","badge":"https://sociomee.in/s_logo.png"})
        dead=[]
        for sub in user_subs:
            try:
                webpush(subscription_info=sub,data=payload,vapid_private_key=VAPID_PRIVATE,vapid_claims={"sub":VAPID_EMAIL})
            except Exception as ex:
                if hasattr(ex,'response') and ex.response and ex.response.status_code in (404,410): dead.append(sub)
                log.warning("push fail %s: %s",user_id,ex)
        if dead:
            subs[user_id]=[s for s in user_subs if s not in dead]; _save(subs)
        return True
    except Exception as e: log.error("send_push: %s",e); return False

def notify_out_of_credits(user_id):
    return send_push(user_id,"⚠️ You're out of credits","Upgrade to Pro or buy a top-up to keep creating on SocioMee.","https://sociomee.in/app","out-of-credits",True)

def notify_credits_restored(user_id,credits=20):
    return send_push(user_id,"🎉 Your credits are back!",f"You have {credits} fresh credits this month. Time to create! 🚀","https://sociomee.in/app","credits-restored",False)

@router.post("/subscribe")
async def subscribe(request: Request):
    body=await request.json()
    user_id=body.get("user_id",""); sub=body.get("subscription",{})
    if not user_id or not sub.get("endpoint"): return JSONResponse({"error":"missing fields"},status_code=400)
    subs=_load(); user_subs=subs.get(user_id,[])
    is_new_sub = sub["endpoint"] not in [s.get("endpoint") for s in user_subs]
    if is_new_sub:
        user_subs.append(sub); subs[user_id]=user_subs; _save(subs)
    # Only fire welcome for real logged-in users (not anonymous/empty)
    if not user_id or len(user_id) < 5:
        return {"success":True,"count":len(user_subs)}
    # Fire welcome push on first subscription — delayed to avoid Chrome spam filter
    import threading
    def _delayed_welcome():
        import time; time.sleep(300)
        try:
            notify_welcome(user_id)
        except Exception as _we:
            log.warning("welcome push delayed failed: %s", _we)
    threading.Thread(target=_delayed_welcome, daemon=True).start()
    return {"success":True,"count":len(user_subs)}

@router.post("/unsubscribe")
async def unsubscribe(request: Request):
    body=await request.json(); user_id=body.get("user_id",""); endpoint=body.get("endpoint","")
    subs=_load()
    if user_id in subs:
        subs[user_id]=[s for s in subs[user_id] if s.get("endpoint")!=endpoint]; _save(subs)
    return {"success":True}

@router.get("/vapid-public-key")
async def vapid_key(): return {"publicKey":VAPID_PUBLIC}

@router.get("/status/{user_id}")
async def status(user_id:str):
    return {"subscribed":len(_load().get(user_id,[]))>0}

def notify_welcome(user_id, name=""):
    import redis as _redis_welcome
    _rw = _redis_welcome.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    key = f"welcomed:{user_id}"
    if _rw.get(key):
        return False
    _rw.set(key, "1", ex=365*24*3600)
    first = name.split()[0] if name else "creator"
    return send_push(
        user_id,
        f"welcome to socio world, {first}. you're in.",
        "",
        "https://sociomee.in/app",
        "welcome",
        False
    )


# ── Idle re-engagement nudges ──────────────────────────────────────────
import random
from datetime import datetime as _dt

NOTIFICATION_POOLS = {
    "morning": [
        "Sharma ji ka beta posted 3 reels this week. What about you?",
        "Sharma ji ka beta doesn't wait for inspiration. Neither should you.",
        "Your cousin posted content today. Your cousin is winning.",
        "Verma ji ki beti scripted 5 videos before breakfast. Just saying.",
        "Someone in your niche just posted. You're still thinking about it.",
        "The algorithm rewards consistency. You've been on a break since Tuesday.",
        "What's your excuse today? No time, no ideas, or no motivation?",
    ],
    "afternoon": [
        "Your competitor uploaded 3 times this week. You uploaded 0.",
        "That trending audio won't trend forever. Neither will your excuse.",
        "Sharma ji ka beta hit 10K followers. You hit snooze.",
        "Neighbour's kid is trending on Instagram. Neighbour's kid is you now.",
        "Busy is not a content strategy. 30 seconds is.",
        "Everyone's cousin is 'doing something' on Instagram. Be that cousin.",
        "That kid from your batch is a 'content creator' now. So are you. Act like it.",
    ],
    "evening": [
        "\"I'll post tomorrow\" said every creator who stopped growing.",
        "Sharma ji ki beti went viral. You went to sleep.",
        "Sharma ji ka beta got a brand deal. You got notifications.",
        "Sharma ji ka beta didn't overthink the caption. He just posted.",
        "Sharma ji ka beta's engagement is up 40%. Yours is up... thoughts and prayers.",
        "Your excuse expired. Your credits didn't.",
        "Your drafts folder called. It wants closure.",
    ],
    "late_night": [
        "It's 11pm. Your best ideas show up now, don't they?",
        "Can't sleep? Neither can your unposted content.",
        "Midnight thoughts make surprisingly good captions.",
    ],
    "weekend": [
        "Weekend plans: brunch, nap, one solid post. Pick all three.",
        "Sunday scroll or Sunday script? Your choice.",
        "Everyone's resting. Your competitors' content isn't.",
    ],
    "genz": [
        "bestie your content calendar is giving empty.",
        "mood: should post. reality: hasn't.",
        "it's giving unposted main character energy.",
        "delulu is not a content strategy. SocioMee is.",
    ],
    "savage": [
        "Your last post was 12 days ago. We counted.",
        "You opened the app. You didn't post. Bold strategy.",
        "Ideas don't expire. But your audience's patience does.",
    ],
}

def get_random_nudge_message():
    now = _dt.now()
    if now.weekday() >= 5:
        pools = ["weekend", "genz", "savage"]
    elif 5 <= now.hour < 12:
        pools = ["morning", "genz"]
    elif 12 <= now.hour < 17:
        pools = ["afternoon", "genz"]
    elif 17 <= now.hour < 23:
        pools = ["evening", "savage"]
    else:
        pools = ["late_night"]
    chosen_pool = random.choice(pools)
    return random.choice(NOTIFICATION_POOLS[chosen_pool])

def notify_idle_nudge(user_id):
    """Send a random time-appropriate re-engagement nudge."""
    if not user_id or len(user_id) < 5:
        return False
    message = get_random_nudge_message()
    return send_push(
        user_id,
        "SocioMee",
        message,
        "https://sociomee.in/app",
        "idle-nudge",
        False
    )

def get_all_subscribed_user_ids():
    subs = _load()
    return list(subs.keys())

MARKETING_OPT_OUT_FILE = Path("/var/www/sociomee/backend/data/marketing_opt_outs.json")
MARKETING_OPT_OUT_FILE.parent.mkdir(parents=True, exist_ok=True)

def _load_opt_outs():
    try:
        if MARKETING_OPT_OUT_FILE.exists():
            return set(json.loads(MARKETING_OPT_OUT_FILE.read_text()))
    except Exception:
        pass
    return set()

def _save_opt_outs(opt_outs):
    try:
        MARKETING_OPT_OUT_FILE.write_text(json.dumps(list(opt_outs), indent=2))
    except Exception as e:
        log.error("opt-out save: %s", e)

def is_marketing_opted_out(user_id):
    return user_id in _load_opt_outs()

@router.post("/marketing-opt-out")
async def marketing_opt_out(request: Request):
    body = await request.json()
    user_id = body.get("user_id", "")
    if not user_id:
        return JSONResponse({"error": "missing user_id"}, status_code=400)
    opt_outs = _load_opt_outs()
    opt_outs.add(user_id)
    _save_opt_outs(opt_outs)
    return {"success": True, "message": "Unsubscribed from marketing pushes. Credit alerts still active."}

@router.post("/marketing-opt-in")
async def marketing_opt_in(request: Request):
    body = await request.json()
    user_id = body.get("user_id", "")
    opt_outs = _load_opt_outs()
    opt_outs.discard(user_id)
    _save_opt_outs(opt_outs)
    return {"success": True, "message": "Re-subscribed to marketing pushes."}

def get_idle_eligible_user_ids(idle_days=2):
    """Users with push subs, who haven't opted out of marketing, and haven't generated content in idle_days."""
    import sys
    sys.path.insert(0, '/var/www/sociomee/backend')
    from datetime import datetime, timezone
    import credits_manager
    all_data = credits_manager._load()
    opted_out = _load_opt_outs()
    subscribed = set(get_all_subscribed_user_ids())
    eligible = []
    now = datetime.now(timezone.utc)
    for uid in subscribed:
        if uid in opted_out:
            continue
        record = all_data.get(uid, {})
        last_gen = record.get("last_generated")
        if not last_gen:
            # never generated content — treat as idle/eligible
            eligible.append(uid)
            continue
        try:
            last_gen_dt = datetime.fromisoformat(last_gen)
            if (now - last_gen_dt).days >= idle_days:
                eligible.append(uid)
        except Exception:
            eligible.append(uid)
    return eligible
