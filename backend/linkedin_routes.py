import os, json, secrets, httpx, logging, math, uuid, shutil, threading
from pathlib import Path
from datetime import datetime, timezone
from fastapi import APIRouter, Request, UploadFile, File
from fastapi.responses import RedirectResponse, JSONResponse
from dotenv import load_dotenv
load_dotenv()

log = logging.getLogger(__name__)
from plan_limits import check_connect_limit
router = APIRouter(prefix="/linkedin", tags=["linkedin"])

CLIENT_ID     = os.getenv("LINKEDIN_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET", "")
REDIRECT_URI  = "https://sociomeeai.com/linkedin/callback"
DATA_DIR      = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
DATA_FILE     = DATA_DIR / "linkedin_connections.json"
SCHED_FILE    = DATA_DIR / "linkedin_scheduled.json"
UPLOAD_DIR    = Path("/var/www/sociomee/uploads/linkedin")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

def _load():
    if DATA_FILE.exists():
        try: return json.loads(DATA_FILE.read_text())
        except: return {}
    return {}

def _save(d): DATA_FILE.write_text(json.dumps(d, indent=2))
def _get(user_id): return _load().get(str(user_id))
def _set(user_id, data):
    d = _load(); d[str(user_id)] = data; _save(d)
def _del(user_id):
    d = _load(); d.pop(str(user_id), None); _save(d)

def _load_sched():
    if SCHED_FILE.exists():
        try: return json.loads(SCHED_FILE.read_text())
        except: return []
    return []

def _save_sched(jobs): SCHED_FILE.write_text(json.dumps(jobs, indent=2))

# ── Scheduler ─────────────────────────────────────────────────────────
_scheduler = None
_sched_lock = threading.Lock()

def _get_scheduler():
    global _scheduler
    with _sched_lock:
        if _scheduler is None:
            from apscheduler.schedulers.background import BackgroundScheduler
            _scheduler = BackgroundScheduler()
            _scheduler.start()
    return _scheduler

def _run_scheduled_post(job_id: str):
    jobs = _load_sched()
    job = next((j for j in jobs if j["job_id"] == job_id), None)
    if not job: return
    job["status"] = "sending"
    _save_sched(jobs)
    try:
        import asyncio
        loop = asyncio.new_event_loop()
        result = loop.run_until_complete(_do_post(job["user_id"], job["text"], job.get("image_url",""), job.get("url_share",""), job.get("visibility","PUBLIC")))
        loop.close()
        job["status"] = "done" if result else "error"
        job["error"] = "" if result else "Post failed"
    except Exception as e:
        job["status"] = "error"; job["error"] = str(e)
    _save_sched(jobs)

def restore_linkedin_scheduled_jobs():
    jobs = _load_sched()
    sched = _get_scheduler()
    now = datetime.now(timezone.utc)
    for job in jobs:
        if job.get("status") not in ("pending",): continue
        run_at = datetime.fromisoformat(job["scheduled_at"])
        if run_at.tzinfo is None: run_at = run_at.replace(tzinfo=timezone.utc)
        if run_at <= now:
            job["status"] = "error"; job["error"] = "Missed while offline"
        else:
            sched.add_job(_run_scheduled_post, "date", run_date=run_at, args=[job["job_id"]], id=job["job_id"], replace_existing=True)
    _save_sched(jobs)

# ── Core post logic ────────────────────────────────────────────────────
async def _do_post(user_id, text, image_url="", url_share="", visibility="PUBLIC"):
    data = _get(user_id)
    if not data: return False
    access_token = data["access_token"]
    sub = data["sub"]
    author = "urn:li:person:" + sub

    async with httpx.AsyncClient(timeout=30) as client:
        if image_url:
            # Step 1: Register upload
            reg = await client.post(
                "https://api.linkedin.com/v2/assets?action=registerUpload",
                headers={"Authorization":"Bearer "+access_token,"Content-Type":"application/json","X-Restli-Protocol-Version":"2.0.0"},
                json={"registerUploadRequest":{"recipes":["urn:li:digitalmediaRecipe:feedshare-image"],"owner":author,"serviceRelationships":[{"relationshipType":"OWNER","identifier":"urn:li:userGeneratedContent"}]}}
            )
            if reg.status_code != 200: return False
            reg_data = reg.json()
            upload_url = reg_data["value"]["uploadMechanism"]["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"]["uploadUrl"]
            asset = reg_data["value"]["asset"]
            # Step 2: Upload image bytes
            if image_url.startswith("https://sociomeeai.com/uploads/"):
                fname = image_url.split("/uploads/")[1]
                img_path = Path("/var/www/sociomee/uploads") / fname
                img_bytes = img_path.read_bytes()
            else:
                img_resp = await client.get(image_url)
                img_bytes = img_resp.content
            await client.put(upload_url, content=img_bytes, headers={"Authorization":"Bearer "+access_token})
            # Step 3: Post with image
            payload = {
                "author": author, "lifecycleState":"PUBLISHED",
                "specificContent":{"com.linkedin.ugc.ShareContent":{
                    "shareCommentary":{"text":text},
                    "shareMediaCategory":"IMAGE",
                    "media":[{"status":"READY","description":{"text":""},"media":asset,"title":{"text":""}}]
                }},
                "visibility":{"com.linkedin.ugc.MemberNetworkVisibility":visibility}
            }
        elif url_share:
            payload = {
                "author": author, "lifecycleState":"PUBLISHED",
                "specificContent":{"com.linkedin.ugc.ShareContent":{
                    "shareCommentary":{"text":text},
                    "shareMediaCategory":"ARTICLE",
                    "media":[{"status":"READY","originalUrl":url_share}]
                }},
                "visibility":{"com.linkedin.ugc.MemberNetworkVisibility":visibility}
            }
        else:
            payload = {
                "author": author, "lifecycleState":"PUBLISHED",
                "specificContent":{"com.linkedin.ugc.ShareContent":{
                    "shareCommentary":{"text":text},
                    "shareMediaCategory":"NONE"
                }},
                "visibility":{"com.linkedin.ugc.MemberNetworkVisibility":visibility}
            }

        resp = await client.post(
            "https://api.linkedin.com/v2/ugcPosts",
            headers={"Authorization":"Bearer "+access_token,"Content-Type":"application/json","X-Restli-Protocol-Version":"2.0.0"},
            json=payload
        )
    return resp.status_code in (200, 201)

# ── Routes ─────────────────────────────────────────────────────────────
@router.get("/connect")
async def linkedin_connect(user_id: str):
    state = user_id
    url = ("https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=" + CLIENT_ID + "&redirect_uri=" + REDIRECT_URI + "&scope=openid%20profile%20email%20w_member_social&state=" + state)
    return RedirectResponse(url)

@router.get("/callback")
async def linkedin_callback(request: Request, code: str = None, state: str = None, error: str = None):
    if error or not code:
        return RedirectResponse("https://sociomeeai.com/app/linkedin?error=access_denied")
    user_id = state
    async with httpx.AsyncClient() as client:
        token_resp = await client.post("https://www.linkedin.com/oauth/v2/accessToken",
            data={"grant_type":"authorization_code","code":code,"redirect_uri":REDIRECT_URI,"client_id":CLIENT_ID,"client_secret":CLIENT_SECRET},
            headers={"Content-Type":"application/x-www-form-urlencoded"})
        tokens = token_resp.json()
        access_token = tokens.get("access_token")
        if not access_token:
            return RedirectResponse("https://sociomeeai.com/app/linkedin?error=token_failed")
        profile_resp = await client.get("https://api.linkedin.com/v2/userinfo", headers={"Authorization":"Bearer "+access_token})
        profile = profile_resp.json()
    _set(user_id, {"access_token":access_token,"name":profile.get("name",""),"picture":profile.get("picture",""),"email":profile.get("email",""),"sub":profile.get("sub","")})
    return RedirectResponse("https://sociomeeai.com/app/linkedin?connected=true")

@router.get("/status")
async def linkedin_status(user_id: str):
    data = _get(user_id)
    if not data: return JSONResponse({"connected":False})
    return JSONResponse({"connected":True,"name":data.get("name"),"picture":data.get("picture"),"email":data.get("email")})

@router.post("/upload-media")
async def linkedin_upload_media(user_id: str, file: UploadFile = File(...)):
    allowed = ["image/jpeg","image/jpg","image/png","image/gif","image/webp"]
    if file.content_type not in allowed:
        return JSONResponse({"error":"Unsupported type"},status_code=400)
    ext = file.filename.rsplit(".",1)[-1].lower() if "." in file.filename else "jpg"
    fname = f"{uuid.uuid4().hex}.{ext}"
    dest = UPLOAD_DIR / fname
    with open(dest,"wb") as f_out: shutil.copyfileobj(file.file, f_out)
    return JSONResponse({"url":f"https://sociomeeai.com/uploads/linkedin/{fname}","filename":fname})

@router.post("/post")
async def linkedin_post(request: Request):
    body = await request.json()
    user_id   = body.get("user_id")
    text      = body.get("text","").strip()
    image_url = body.get("image_url","").strip()
    url_share = body.get("url_share","").strip()
    visibility = body.get("visibility","PUBLIC")
    if not text: return JSONResponse({"error":"text required"},status_code=400)
    ok = await _do_post(user_id, text, image_url, url_share, visibility)
    if ok:
        return JSONResponse({"success":True})
    return JSONResponse({"error":"Post failed"},status_code=400)

@router.post("/schedule")
async def linkedin_schedule(request: Request):
    body = await request.json()
    user_id      = body.get("user_id")
    text         = body.get("text","").strip()
    scheduled_at = body.get("scheduled_at","")
    image_url    = body.get("image_url","")
    url_share    = body.get("url_share","")
    visibility   = body.get("visibility","PUBLIC")
    if not text or not scheduled_at:
        return JSONResponse({"error":"text and scheduled_at required"},status_code=400)
    run_at = datetime.fromisoformat(scheduled_at)
    if run_at.tzinfo is None: run_at = run_at.replace(tzinfo=timezone.utc)
    job_id = uuid.uuid4().hex[:12]
    job = {"job_id":job_id,"user_id":user_id,"text":text,"image_url":image_url,"url_share":url_share,"visibility":visibility,"scheduled_at":scheduled_at,"status":"pending","error":""}
    jobs = _load_sched(); jobs.append(job); _save_sched(jobs)
    _get_scheduler().add_job(_run_scheduled_post,"date",run_date=run_at,args=[job_id],id=job_id,replace_existing=True)
    return JSONResponse({"ok":True,"job_id":job_id})

@router.get("/scheduled")
async def linkedin_scheduled(user_id: str):
    jobs = [j for j in _load_sched() if j["user_id"]==user_id]
    return JSONResponse({"jobs":jobs})

@router.post("/disconnect")
async def linkedin_disconnect(request: Request):
    body = await request.json()
    _del(body.get("user_id"))
    return JSONResponse({"success":True})
