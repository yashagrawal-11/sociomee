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
        payload=json.dumps({"title":title,"body":body,"url":url,"tag":tag,"requireInteraction":require_interaction})
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
    if sub["endpoint"] not in [s.get("endpoint") for s in user_subs]:
        user_subs.append(sub); subs[user_id]=user_subs; _save(subs)
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
    import redis as _redis_welcome, random
    _rw = _redis_welcome.Redis(host="localhost", port=6379, db=0, decode_responses=True)
    key = f"welcomed:{user_id}"
    if _rw.get(key):
        return False
    _rw.set(key, "1", ex=365*24*3600)
    first = name.split()[0] if name else "creator"
    bodies = [
        f"you just unlocked infinite content mode. let's build something big.",
        f"one topic. infinite content. you're in the right place.",
        f"the grind just got smarter. welcome to SocioMee.",
        f"india's creators just got one more. drop your first topic and see what happens.",
    ]
    return send_push(
        user_id,
        f"welcome to socio world, {first}. you're in.",
        random.choice(bodies),
        "https://sociomee.in/app",
        "welcome",
        False
    )
