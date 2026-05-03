"""
youtube_upload.py — SocioMee YouTube Auto-Upload + AI SEO + Thumbnail
"""
from __future__ import annotations
import io, json, logging, os, re, threading, uuid, traceback
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Dict, List, Optional
from fastapi import APIRouter, File, Form, HTTPException, UploadFile

log = logging.getLogger("youtube_upload")
router = APIRouter(prefix="/youtube/upload", tags=["youtube-upload"])

UPLOAD_QUOTA = {"free":0,"pro_monthly":4,"pro_annual":4,"premium_monthly":15,"premium_annual":15}
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
QUOTA_FILE = DATA_DIR / "upload_quota.json"
JOBS_FILE  = DATA_DIR / "upload_jobs.json"
_lock = threading.Lock()
_jlock = threading.Lock()

def _ljobs():
    try: return json.loads(JOBS_FILE.read_text()) if JOBS_FILE.exists() else {}
    except: return {}
def _sjobs(d):
    JOBS_FILE.write_text(json.dumps(d))
def _new_job(uid):
    jid = str(uuid.uuid4())
    with _jlock:
        d = _ljobs(); d[jid] = {"job_id":jid,"user_id":uid,"status":"queued","progress":0,"message":"Starting…","result":None,"error":None}; _sjobs(d)
    return jid
def _ujob(jid, **kw):
    with _jlock:
        d = _ljobs()
        if jid in d:
            d[jid].update(kw)
            _sjobs(d)
def _gjob(jid):
    with _jlock: return _ljobs().get(jid)

def _lquota():
    try: return json.loads(QUOTA_FILE.read_text()) if QUOTA_FILE.exists() else {}
    except: return {}
def _squota(d): QUOTA_FILE.write_text(json.dumps(d,indent=2))
def _nreset():
    now=datetime.now(timezone.utc)
    return datetime(now.year+(1 if now.month==12 else 0),1 if now.month==12 else now.month+1,1,tzinfo=timezone.utc).isoformat()
def _gqrec_nolock(uid,plan):
    d=_lquota(); now=datetime.now(timezone.utc)
    if uid not in d: d[uid]={"plan":plan,"used":0,"reset_date":_nreset()}; _squota(d)
    else:
        r=d[uid]
        if now>=datetime.fromisoformat(r.get("reset_date",now.isoformat())): r.update({"used":0,"reset_date":_nreset(),"plan":plan}); d[uid]=r; _squota(d)
    return d[uid]
def _gqrec(uid,plan):
    with _lock: return _gqrec_nolock(uid,plan)
def _uquota(uid,plan):
    with _lock:
        d=_lquota(); r=_gqrec_nolock(uid,plan); l=UPLOAD_QUOTA.get(plan,0)
        if l==0 or r["used"]>=l: return False
        r["used"]+=1; d[uid]=r; _squota(d); return True
def get_upload_status(uid,plan):
    r=_gqrec(uid,plan); l=UPLOAD_QUOTA.get(plan,0); u=r["used"]
    return {"plan":plan,"used":u,"limit":l,"remaining":max(0,l-u),"reset_date":r["reset_date"],"can_upload":u<l and l>0}

def _gplan(uid):
    try:
        import credits_manager as cm; return cm.get_credit_status(uid).get("plan","free")
    except: return "free"

BEST_TIMES={0:("19:00","Monday 7PM IST"),1:("20:00","Tuesday 8PM IST"),2:("19:00","Wednesday 7PM IST"),3:("20:00","Thursday 8PM IST"),4:("18:00","Friday 6PM IST"),5:("11:00","Saturday 11AM IST"),6:("11:00","Sunday 11AM IST")}
def get_best_upload_time():
    IST=timezone(timedelta(hours=5,minutes=30)); now=datetime.now(IST); wd=now.weekday(); ts,lb=BEST_TIMES[wd]; h,m=map(int,ts.split(":")); b=now.replace(hour=h,minute=m,second=0,microsecond=0)
    if b<=now: b+=timedelta(days=1); wd=b.weekday(); ts,lb=BEST_TIMES[wd]; h,m=map(int,ts.split(":")); b=b.replace(hour=h,minute=m)
    return {"utc_iso":b.astimezone(timezone.utc).isoformat(),"ist_label":lb,"weekday":b.strftime("%A")}

def _gemini_text(prompt, max_tokens=2048):
    try:
        import google.generativeai as genai
        k=os.getenv("GOOGLE_AI_API_KEY","")
        if not k: return ""
        genai.configure(api_key=k)
        return genai.GenerativeModel("gemini-2.0-flash").generate_content(prompt,generation_config={"max_output_tokens":max_tokens,"temperature":0.8}).text.strip()
    except Exception as e:
        log.warning("Gemini: %s",e); return ""

def _gemini_vision(prompt, images):
    try:
        import google.generativeai as genai
        k=os.getenv("GOOGLE_AI_API_KEY","")
        if not k: return ""
        genai.configure(api_key=k)
        parts=[{"mime_type":"image/jpeg","data":img} for img in images]
        parts.append(prompt)
        return genai.GenerativeModel("gemini-2.0-flash").generate_content(parts).text.strip()
    except Exception as e:
        log.warning("Gemini vision: %s",e); return ""

def _pj(raw):
    try:
        m=re.search(r'\{[\s\S]*\}',raw)
        if m: return json.loads(m.group())
    except: pass
    return {}

def _build_desc(title,about,keyword,queries,hashtags):
    qt="\n".join(queries) if queries else f"{keyword}\n{keyword} tips"
    ht=" ".join(hashtags[:3]) if hashtags else f"#{keyword.replace(' ','')} #india"
    return f"""{title}

{about}

━━━━━━━━━━━━━━━━━━━━
📌 CHAPTERS
━━━━━━━━━━━━━━━━━━━━
00:00 Intro
00:30 Main Content
02:00 Key Points
04:00 Conclusion

━━━━━━━━━━━━━━━━━━━━
🔗 CONNECT WITH ME
━━━━━━━━━━━━━━━━━━━━
Instagram:
Facebook:
Twitter / X:
Telegram:
WhatsApp Channel:
Snapchat:
Pinterest:
LinkedIn:
Website:

━━━━━━━━━━━━━━━━━━━━
❓ YOUR QUERIES
━━━━━━━━━━━━━━━━━━━━
{qt}

{ht}

{about}

⚠️ Copyright Disclaimer under Section 107 of the copyright act 1976, allowance is made for fair use.

🤖 Uploaded by SocioMee AI · sociomee.in"""

def gen_seo(kw,vt="video",lang="Hindi/English",prem=False):
    extra = ',\n  "hook":"15 sec script",\n  "thumbnail_idea":"thumbnail concept",\n  "best_title_alternatives":["a","b","c"]' if prem else ""
    prompt=f"""YouTube SEO expert for Indian creators. Video about: "{kw}" | Type: {vt} | Language: {lang}
Return ONLY valid JSON:
{{"title":"viral title under 60 chars","about":"3 sentence description","queries":["q1","q2","q3","q4","q5","q6","q7","q8","q9","q10"],"tags":["t1","t2","t3","t4","t5","t6","t7","t8","t9","t10","t11","t12","t13","t14","t15","t16","t17","t18","t19","t20"],"hashtags":["#h1","#h2","#h3"],"category":"Education","seo_score":85,"why_viral":"reason"{extra}}}"""
    r=_pj(_gemini_text(prompt,1500))
    if not r.get("title"):
        r={"title":f"{kw} | Must Watch 2025","about":f"Everything about {kw}. Must watch!","queries":[kw,f"{kw} tips",f"{kw} tutorial",f"how to {kw}",f"best {kw}",f"{kw} 2025",f"{kw} hindi",f"{kw} guide",f"learn {kw}",f"{kw} beginners"],"tags":[kw,"india","youtube","viral","trending","2025","hindi","tips","tutorial","guide","howto","indian","creator","content",kw.replace(" ",""),"sociomee","shorts","ytindia","youtubeindia","ytshorts"],"hashtags":[f"#{kw.replace(' ','')}","#india","#youtube"],"category":"People & Blogs","seo_score":65,"why_viral":"Trending topic"}
    r["description"]=_build_desc(r.get("title",kw),r.get("about",""),kw,r.get("queries",[]),r.get("hashtags",[]))
    return r

CATMAP={"film & animation":"1","music":"10","pets & animals":"15","sports":"17","travel":"19","gaming":"20","people & blogs":"22","comedy":"23","entertainment":"24","news & politics":"25","howto & style":"26","education":"27","science & technology":"28"}
def _catid(n):
    nl=n.lower()
    for k,v in CATMAP.items():
        if k in nl: return v
    return "22"

def _upload_worker(jid,uid,plan,vbytes,kw,vt,lang,priv,sched,isshort,btime):
    try:
        log.info("Worker start job=%s",jid)
        _ujob(jid,status="uploading",progress=10,message="Generating AI SEO…")
        seo=gen_seo(kw,vt,lang,"premium" in plan)
        title=seo.get("title",kw)[:100]
        desc=seo.get("description","")[:5000]
        tags=seo.get("tags",[kw])[:30]
        catid=_catid(seo.get("category","People & Blogs"))
        score=seo.get("seo_score",75)

        _ujob(jid,progress=40,message="Uploading to YouTube…")
        log.info("Getting credentials for uid=%s", uid)
        import youtube_connect as ytc
        from googleapiclient.http import MediaIoBaseUpload
        creds=ytc._get_credentials(uid)
        log.info("Building YouTube client")
        yt=ytc._build_youtube_client(creds)
        log.info("YouTube client built OK")

        if isshort:
            if "#Shorts" not in title: title=(title[:52]+" #Shorts") if len(title)>52 else title+" #Shorts"
            desc="#Shorts\n\n"+desc

        body={"snippet":{"title":title,"description":desc,"tags":tags,"categoryId":catid},"status":{"privacyStatus":"private" if sched else priv,"selfDeclaredMadeForKids":False}}
        if sched: body["status"]["publishAt"]=sched

        import socket
        socket.setdefaulttimeout(300)
        log.info("Starting video upload size=%d bytes", len(vbytes))
        media=MediaIoBaseUpload(io.BytesIO(vbytes),mimetype="video/*",chunksize=-1,resumable=False)
        log.info("Executing YouTube insert")
        resp=yt.videos().insert(part="snippet,status",body=body,media_body=media).execute()
        log.info("YouTube insert done resp=%s", str(resp)[:100])
        vid=resp["id"]
        url=f"https://youtube.com/shorts/{vid}" if isshort else f"https://youtube.com/watch?v={vid}"
        log.info("YouTube upload success vid=%s",vid)

        # Quota + prediction - NO external API calls here
        _uquota(uid,plan)
        nq=get_upload_status(uid,plan)
        base=125; mult=1.0+(score-50)/100
        pred={"views_7_days":int(base*2*mult),"views_30_days":int(base*6*mult),"views_90_days":int(base*15*mult),"new_subscribers":max(5,int(20*mult)),"estimated_ctr":f"{2.5+(score/100)*3:.1f}%","revenue_estimate":f"₹{int(base*15*mult*0.003)} - ₹{int(base*15*mult*0.008)}","viral_probability":"high" if score>=85 else "medium" if score>=65 else "low","growth_tip":"Share on WhatsApp groups and Instagram stories in first 24 hours for max reach."}

        result={"success":True,"video_id":vid,"video_url":url,"title":title,"scheduled":sched,"best_time":btime,"quota":nq,"plan":plan,"seo":seo,"prediction":pred}
        log.info("Setting job done job=%s",jid)
        _ujob(jid,status="done",progress=100,message="Upload complete!",result=result)
        log.info("Job marked done job=%s",jid)

    except Exception as e:
        tb=traceback.format_exc()
        log.error("Worker FAILED job=%s error=%s\n%s",jid,e,tb)
        _ujob(jid,status="error",progress=0,message="Upload failed",error=str(e))

def analyze_thumbnails(t1,t2=None):
    if t2:
        p="""Analyze 2 YouTube thumbnails (A=first, B=second) for Indian YouTube.
Return ONLY valid JSON:
{"winner":"A","winner_reason":"why","thumbnail_a":{"ctr_score":75,"strengths":["s1","s2","s3"],"weaknesses":["w1","w2"],"color_analysis":"colors","text_analysis":"text","face_emotion":"face","improvements":["i1","i2","i3"]},"thumbnail_b":{"ctr_score":82,"strengths":["s1","s2","s3"],"weaknesses":["w1","w2"],"color_analysis":"colors","text_analysis":"text","face_emotion":"face","improvements":["i1","i2","i3"]},"general_tips":["t1","t2","t3"]}"""
        raw=_gemini_vision(p,[t1,t2])
    else:
        p="""Analyze this YouTube thumbnail for Indian YouTube CTR.
Return ONLY valid JSON:
{"ctr_score":75,"grade":"B+","strengths":["s1","s2","s3"],"weaknesses":["w1","w2"],"color_analysis":"colors","text_analysis":"text","face_emotion":"face","background":"bg","improvements":["i1","i2","i3","i4"],"viral_potential":"medium","overall":"2 sentence summary"}"""
        raw=_gemini_vision(p,[t1])
    r=_pj(raw)
    log.info("Thumbnail result: %s", str(r)[:200])
    return r if r else {"error":"Analysis failed. Try again.","ctr_score":0}

# ── Routes ────────────────────────────────────────────────────────────
@router.get("/quota")
async def rquota(user_id:str): return get_upload_status(user_id,_gplan(user_id))

@router.get("/best-time")
async def rbt(): return get_best_upload_time()

@router.get("/job/{job_id}")
async def rjob(job_id:str):
    j=_gjob(job_id)
    if not j: raise HTTPException(404,"Job not found")
    return j

@router.post("/seo")
async def rseo(user_id:str=Form(...),keyword:str=Form(...),video_type:str=Form(default="video"),language:str=Form(default="Hindi/English")):
    plan=_gplan(user_id)
    if plan=="free": raise HTTPException(403,"Requires Pro plan")
    return {"seo":gen_seo(keyword,video_type,language,"premium" in plan),"plan":plan}

@router.post("/thumbnail")
async def rthumb(user_id:str=Form(...),thumbnail1:UploadFile=File(...),thumbnail2:Optional[UploadFile]=File(default=None)):
    plan=_gplan(user_id)
    if plan=="free": raise HTTPException(403,"Requires Pro plan")
    t1=await thumbnail1.read()
    t2=None
    if thumbnail2 is not None:
        t2=await thumbnail2.read()
        if len(t2)==0: t2=None
    log.info("Thumbnail analyze: t1=%d bytes, t2=%s bytes", len(t1), len(t2) if t2 else "none")
    r=analyze_thumbnails(t1,t2)
    return {"analysis":r,"plan":plan,"mode":"compare" if t2 else "single"}

@router.post("/auto")
async def rauto(user_id:str=Form(...),keyword:str=Form(...),video_type:str=Form(default="video"),schedule_type:str=Form(default="now"),custom_time:str=Form(default=""),privacy:str=Form(default="public"),language:str=Form(default="Hindi/English"),video:UploadFile=File(...)):
    plan=_gplan(user_id)
    if plan=="free": raise HTTPException(403,detail={"error":"upgrade_required","message":"Requires Pro or Premium"})
    q=get_upload_status(user_id,plan)
    if not q["can_upload"]: raise HTTPException(429,detail={"error":"quota_exceeded","message":"Monthly limit reached"})
    vb=await video.read()
    if len(vb)>256*1024*1024: raise HTTPException(413,"Max 256 MB")
    isshort=video_type.lower()=="short"
    su=bt=None
    if schedule_type=="best": bt=get_best_upload_time(); su=bt["utc_iso"]
    elif schedule_type=="custom" and custom_time:
        try:
            dt=datetime.fromisoformat(custom_time)
            if dt.tzinfo is None: dt=dt.replace(tzinfo=timezone(timedelta(hours=5,minutes=30)))
            su=dt.astimezone(timezone.utc).isoformat()
        except: raise HTTPException(400,"Invalid time format")
    jid=_new_job(user_id)
    threading.Thread(target=_upload_worker,daemon=True,kwargs=dict(jid=jid,uid=user_id,plan=plan,vbytes=vb,kw=keyword,vt=video_type,lang=language,priv=privacy,sched=su,isshort=isshort,btime=bt)).start()
    return {"job_id":jid,"status":"queued","message":"Upload started!","quota":q,"plan":plan}
