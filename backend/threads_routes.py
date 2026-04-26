"""
threads_routes.py — SocioMee Threads API
Handles OAuth, analytics, insights, viral prediction, and publishing.
Storage: JSON files (same pattern as youtube_routes.py)
"""

import os, json, random, math, httpx
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/threads", tags=["threads"])

THREADS_APP_ID       = os.getenv("THREADS_APP_ID")
THREADS_APP_SECRET   = os.getenv("THREADS_APP_SECRET")
THREADS_REDIRECT_URI = os.getenv("THREADS_REDIRECT_URI", "https://sociomee.in/threads/callback")
THREADS_SCOPE        = "threads_basic,threads_content_publish,threads_manage_insights,threads_read_replies"

# ── Storage helpers ────────────────────────────────────────────────────
DATA_DIR     = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
THREADS_FILE = DATA_DIR / "threads_accounts.json"

def _load() -> dict:
    if THREADS_FILE.exists():
        try:
            return json.loads(THREADS_FILE.read_text())
        except Exception:
            pass
    return {}

def _save(data: dict):
    THREADS_FILE.write_text(json.dumps(data, indent=2))

def _get_account(user_id: str):
    return _load().get(str(user_id))

def _set_account(user_id: str, account: dict):
    data = _load()
    data[str(user_id)] = account
    _save(data)

def _del_account(user_id: str):
    data = _load()
    data.pop(str(user_id), None)
    _save(data)


# ══════════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════════

@router.get("/auth-url")
async def get_auth_url(user_id: str):
    if not THREADS_APP_ID:
        raise HTTPException(500, "THREADS_APP_ID not configured")
    url = (
        f"https://threads.net/oauth/authorize"
        f"?client_id={THREADS_APP_ID}"
        f"&redirect_uri={THREADS_REDIRECT_URI}"
        f"&scope={THREADS_SCOPE}"
        f"&response_type=code"
        f"&state={user_id}"
    )
    return {"url": url}


@router.get("/callback")
async def threads_callback(code: str, state: str = ""):
    user_id = state
    if not user_id:
        raise HTTPException(400, "Missing state (user_id)")

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://graph.threads.net/oauth/access_token",
            data={
                "client_id":     THREADS_APP_ID,
                "client_secret": THREADS_APP_SECRET,
                "grant_type":    "authorization_code",
                "redirect_uri":  THREADS_REDIRECT_URI,
                "code":          code,
            },
        )
    if r.status_code != 200:
        raise HTTPException(400, f"Token exchange failed: {r.text}")

    td          = r.json()
    short_token = td.get("access_token")
    threads_uid = str(td.get("user_id", ""))

    # Exchange for long-lived token
    async with httpx.AsyncClient() as client:
        lr = await client.get(
            "https://graph.threads.net/access_token",
            params={
                "grant_type":    "th_exchange_token",
                "client_secret": THREADS_APP_SECRET,
                "access_token":  short_token,
            },
        )
    long_token = lr.json().get("access_token", short_token)

    profile = await _fetch_profile(threads_uid, long_token)
    _set_account(user_id, {
        "threads_uid":  threads_uid,
        "access_token": long_token,
        "connected_at": datetime.utcnow().isoformat(),
        **profile,
    })

    from fastapi.responses import RedirectResponse
    return RedirectResponse("https://sociomee.in?threads=connected")


async def _fetch_profile(threads_uid: str, token: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://graph.threads.net/v1.0/{threads_uid}",
                params={
                    "fields":       "id,username,name,threads_profile_picture_url,threads_biography,follower_count,following_count",
                    "access_token": token,
                },
            )
        d = r.json()
        return {
            "username":     d.get("username", ""),
            "display_name": d.get("name", ""),
            "bio":          d.get("threads_biography", ""),
            "profile_pic":  d.get("threads_profile_picture_url", ""),
            "followers":    d.get("follower_count", 0),
            "following":    d.get("following_count", 0),
            "profile_url":  f"https://www.threads.net/@{d.get('username', '')}",
        }
    except Exception:
        return {}


# ══════════════════════════════════════════════════════════════════════
# STATUS & DISCONNECT
# ══════════════════════════════════════════════════════════════════════

@router.get("/status")
async def get_status(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        return {"connected": False}
    return {
        "connected":    True,
        "username":     acc.get("username"),
        "display_name": acc.get("display_name"),
        "profile_pic":  acc.get("profile_pic"),
        "profile_url":  acc.get("profile_url"),
        "followers":    acc.get("followers", 0),
        "following":    acc.get("following", 0),
        "bio":          acc.get("bio", ""),
    }


@router.post("/disconnect")
async def disconnect(user_id: str):
    _del_account(user_id)
    return {"success": True}


# ══════════════════════════════════════════════════════════════════════
# INSIGHTS / ANALYTICS
# ══════════════════════════════════════════════════════════════════════

@router.get("/insights")
async def get_insights(user_id: str, days: int = 30):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Threads not connected")

    token       = acc["access_token"]
    threads_uid = acc["threads_uid"]
    since       = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://graph.threads.net/v1.0/{threads_uid}/threads_insights",
                params={
                    "metric":       "views,likes,replies,reposts,quotes,followers_count",
                    "period":       "day",
                    "since":        since,
                    "access_token": token,
                },
            )
        if r.status_code == 200:
            return _parse_insights(r.json(), days)
    except Exception:
        pass

    return _mock_insights(acc, days)


def _parse_insights(raw: dict, days: int) -> dict:
    data       = raw.get("data", [])
    metric_map = {item["name"]: item.get("values", []) for item in data}

    views_s   = metric_map.get("views", [])
    likes_s   = metric_map.get("likes", [])
    replies_s = metric_map.get("replies", [])
    reposts_s = metric_map.get("reposts", [])

    chart  = []
    totals = {"views": 0, "likes": 0, "replies": 0, "reposts": 0}

    for i, v in enumerate(views_s[-days:]):
        views   = v.get("value", 0)
        likes   = likes_s[i]["value"]   if i < len(likes_s)   else 0
        replies = replies_s[i]["value"] if i < len(replies_s) else 0
        reposts = reposts_s[i]["value"] if i < len(reposts_s) else 0
        chart.append({"date": v.get("end_time", "")[:10], "views": views, "likes": likes, "replies": replies, "reposts": reposts})
        totals["views"] += views; totals["likes"] += likes
        totals["replies"] += replies; totals["reposts"] += reposts

    eng_rate = round((totals["likes"] + totals["replies"]) / max(totals["views"], 1) * 100, 2)
    return {**totals, "engagement_rate": eng_rate, "chart_data": chart, "is_mock": False,
            "total_views": totals["views"], "total_likes": totals["likes"],
            "total_replies": totals["replies"], "total_reposts": totals["reposts"]}


def _mock_insights(acc: dict, days: int) -> dict:
    followers  = acc.get("followers", 1000)
    base_views = max(followers * 2, 500)
    seed       = hash(acc.get("username", "u")) % 1000
    chart      = []
    totals     = {"views": 0, "likes": 0, "replies": 0, "reposts": 0}

    for i in range(days):
        date    = (datetime.utcnow() - timedelta(days=days - i)).strftime("%Y-%m-%d")
        dow     = (datetime.utcnow() - timedelta(days=days - i)).weekday()
        boost   = 1.4 if dow in [1, 2, 3] else 1.0
        noise   = 0.7 + (((seed * (i + 1) * 7919) % 1000) / 1000) * 0.6
        views   = int(base_views / days * boost * noise * 1.8)
        likes   = int(views * 0.045 * noise)
        replies = int(views * 0.012 * noise)
        reposts = int(views * 0.008 * noise)
        chart.append({"date": date, "views": views, "likes": likes, "replies": replies, "reposts": reposts})
        totals["views"] += views; totals["likes"] += likes
        totals["replies"] += replies; totals["reposts"] += reposts

    eng_rate = round((totals["likes"] + totals["replies"]) / max(totals["views"], 1) * 100, 2)
    return {
        "total_views": totals["views"], "total_likes": totals["likes"],
        "total_replies": totals["replies"], "total_reposts": totals["reposts"],
        "engagement_rate": eng_rate, "chart_data": chart, "is_mock": True,
    }


# ══════════════════════════════════════════════════════════════════════
# POSTS
# ══════════════════════════════════════════════════════════════════════

@router.get("/posts")
async def get_posts(user_id: str, limit: int = 10):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Threads not connected")

    token       = acc["access_token"]
    threads_uid = acc["threads_uid"]

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://graph.threads.net/v1.0/{threads_uid}/threads",
                params={"fields": "id,text,timestamp,like_count,replies_count,repost_count,permalink", "limit": limit, "access_token": token},
            )
        if r.status_code == 200:
            posts = [{"id": p.get("id"), "text": p.get("text", ""), "timestamp": p.get("timestamp", "")[:10],
                      "likes": p.get("like_count", 0), "replies": p.get("replies_count", 0),
                      "reposts": p.get("repost_count", 0), "url": p.get("permalink", "")}
                     for p in r.json().get("data", [])]
            return {"posts": posts, "is_mock": False}
    except Exception:
        pass

    return {"posts": _mock_posts(acc, limit), "is_mock": True}


def _mock_posts(acc: dict, limit: int) -> list:
    followers = acc.get("followers", 1000)
    templates = [
        "Just dropped something new 🔥 What do you think?",
        "The secret to growing on Threads? Consistency and authenticity 💡",
        "Hot take: engagement > follower count every single time",
        "POV: You finally figured out your content strategy 📈",
        "Real talk — the algorithm rewards those who show up daily",
        "Sharing my process for creating viral content 🧵",
        f"Day 7 of posting every day. Here's what I've learned 👇",
        "Unpopular opinion: less is more when it comes to hashtags",
        "The best time to post? When your audience is online 📅",
        f"Growth update: from {followers-100} to {followers} followers this month 🚀",
    ]
    posts = []
    for i in range(min(limit, len(templates))):
        likes   = int(followers * random.uniform(0.02, 0.08))
        replies = int(followers * random.uniform(0.005, 0.02))
        reposts = int(followers * random.uniform(0.003, 0.01))
        date    = (datetime.utcnow() - timedelta(days=i * 3)).strftime("%Y-%m-%d")
        posts.append({"id": f"mock_{i}", "text": templates[i], "timestamp": date,
                      "likes": likes, "replies": replies, "reposts": reposts, "url": ""})
    return posts


# ══════════════════════════════════════════════════════════════════════
# VIRAL PREDICTION
# ══════════════════════════════════════════════════════════════════════

VIRAL_HOOKS = {
    "hot take": 15, "unpopular opinion": 14, "pov:": 13, "real talk": 12,
    "thread:": 11, "nobody talks about": 13, "secret": 10, "honest": 9,
    "controversial": 12, "day ": 8, "how i": 10, "why i": 9, "mistake": 9,
    "growth": 8, "tips": 7, "truth": 11, "exposed": 10, "confess": 9,
    "brutal": 8, "nobody tells you": 13, "stop doing": 11,
}

BEST_TIMES = [
    "7–9 AM IST (morning commute)",
    "12–2 PM IST (lunch break)",
    "6–9 PM IST (evening wind-down)",
    "10–11 PM IST (late-night scroll)",
]

TIPS = [
    "Start with a bold first line — users decide in 0.3s whether to keep reading.",
    "Use line breaks every 1–2 sentences. White space = readability = shares.",
    "End with a question to trigger replies — replies boost reach more than likes.",
    "Personal stories outperform generic advice by 3–5x on Threads.",
    "Numbers in your opening ('5 things', '10x') increase stops by 40%.",
    "Use 'you' and 'your' — make it about the reader, not yourself.",
    "Controversy drives reach. Take a clear stance rather than sitting on the fence.",
    "Tag 1–2 relevant creators (not more) to get into their audience's feed.",
    "Post 3–5 replies to trending threads before posting your own — warms the algorithm.",
    "First 30 minutes after posting are critical. Reply to every comment immediately.",
]


@router.get("/predict")
async def predict_viral(user_id: str, topic: str = ""):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Threads not connected")

    followers   = acc.get("followers", 1000)
    topic_lower = topic.lower()

    # Base from follower tier
    if followers >= 100_000: base = 55
    elif followers >= 10_000: base = 45
    elif followers >= 1_000:  base = 35
    else:                     base = 25

    hook_bonus     = min(sum(v for k, v in VIRAL_HOOKS.items() if k in topic_lower), 35)
    length_bonus   = 8 if 80 <= len(topic) <= 180 else (4 if len(topic) < 80 else 2)
    question_bonus = 7 if "?" in topic else 0
    emoji_bonus    = 5 if any(ord(c) > 127 for c in topic) else 0
    virality       = min(base + hook_bonus + length_bonus + question_bonus + emoji_bonus, 98)

    reach_mult  = 1 + (virality / 100) * 4
    est_views   = int(followers * reach_mult * random.uniform(1.8, 2.8))
    est_likes   = int(est_views * random.uniform(0.04, 0.09))
    est_replies = int(est_views * random.uniform(0.01, 0.025))
    est_reposts = int(est_views * random.uniform(0.006, 0.015))
    est_quotes  = int(est_views * random.uniform(0.002, 0.008))
    est_follows = int(est_views * random.uniform(0.003, 0.012))

    next_target = next((m for m in [500,1000,5000,10000,50000,100000,500000,1000000] if m > followers), None)
    months_to   = None
    if next_target:
        monthly = max(est_follows * 4, 10)
        months_to = min(math.ceil((next_target - followers) / monthly), 36)

    if virality >= 70:
        rec = "🔥 Strong viral potential. Post during peak hours and reply to every comment in the first 30 min."
    elif virality >= 50:
        rec = "📈 Solid topic. Add a personal story or strong opinion to boost engagement."
    else:
        rec = "💡 Add a hook ('Hot take:', 'POV:', 'Real talk:') and end with a question to drive replies."

    return {
        "virality_score":    virality,
        "estimated_views":   est_views,
        "estimated_likes":   est_likes,
        "estimated_replies": est_replies,
        "estimated_reposts": est_reposts,
        "estimated_quotes":  est_quotes,
        "estimated_follows": est_follows,
        "next_milestone":    {"target": next_target, "months": months_to} if next_target else None,
        "recommendation":    rec,
        "best_post_time":    random.choice(BEST_TIMES),
        "tip":               random.choice(TIPS),
        "breakdown": {
            "hook_strength":    min(hook_bonus * 3, 100),
            "audience_reach":   min(int(followers / 1000), 100),
            "content_format":   min((length_bonus + question_bonus + emoji_bonus) * 5, 100),
            "timing_potential": 75,
        },
        "hook_detected": [k for k in VIRAL_HOOKS if k in topic_lower],
    }


# ══════════════════════════════════════════════════════════════════════
# AUDIENCE INSIGHTS
# ══════════════════════════════════════════════════════════════════════

@router.get("/audience")
async def get_audience(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Threads not connected")

    followers = acc.get("followers", 1000)
    seed      = hash(acc.get("username", "u")) % 100

    return {
        "top_locations": [
            {"city": "Mumbai",    "pct": 18 + seed % 5},
            {"city": "Delhi",     "pct": 15 + seed % 4},
            {"city": "Bangalore", "pct": 12 + seed % 3},
            {"city": "Hyderabad", "pct": 8},
            {"city": "Others",    "pct": max(47 - seed % 5, 10)},
        ],
        "age_groups": [
            {"group": "18–24", "pct": 38},
            {"group": "25–34", "pct": 32},
            {"group": "35–44", "pct": 16},
            {"group": "45+",   "pct": 14},
        ],
        "gender": {"male": 58 + seed % 10, "female": 42 - seed % 10},
        "peak_hours": [
            {"hour": "7 AM",  "activity": 45},
            {"hour": "12 PM", "activity": 72},
            {"hour": "6 PM",  "activity": 88},
            {"hour": "9 PM",  "activity": 95},
            {"hour": "11 PM", "activity": 60},
        ],
        "top_interests":   ["Tech", "Startups", "Finance", "Fitness", "Entertainment"],
        "follower_growth": [
            {"week": f"W{i+1}", "followers": max(0, followers - (7 - i) * int(followers * 0.02))}
            for i in range(8)
        ],
        "is_mock": True,
    }


# ══════════════════════════════════════════════════════════════════════
# BEST TIME TO POST
# ══════════════════════════════════════════════════════════════════════

@router.get("/best-time")
async def get_best_time(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Threads not connected")

    seed    = hash(acc.get("username", "u")) % 100
    days_l  = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    heatmap = []

    for di, day in enumerate(days_l):
        for hour in range(24):
            base = 20
            if 7 <= hour <= 9:    base = 65 + seed % 20
            elif 12 <= hour <= 14: base = 72 + seed % 15
            elif 18 <= hour <= 21: base = 90 + seed % 10
            elif 22 <= hour <= 23: base = 55 + seed % 15
            elif hour < 6:         base = 10
            if di >= 5: base = int(base * 1.15)
            heatmap.append({"day": day, "hour": hour, "score": min(max(base + random.randint(-8, 8), 5), 100)})

    return {
        "heatmap": heatmap,
        "top_slots": [
            {"day": "Tuesday",   "time": "8:00 PM IST", "score": 94},
            {"day": "Wednesday", "time": "9:00 PM IST", "score": 91},
            {"day": "Thursday",  "time": "7:00 PM IST", "score": 89},
            {"day": "Sunday",    "time": "8:00 PM IST", "score": 87},
        ],
        "timezone": "IST",
    }


# ══════════════════════════════════════════════════════════════════════
# BENCHMARK
# ══════════════════════════════════════════════════════════════════════

@router.get("/benchmark")
async def get_benchmark(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Threads not connected")

    followers = acc.get("followers", 1000)

    def tier(f):
        if f < 1000:    return "Nano"
        if f < 10000:   return "Micro"
        if f < 100000:  return "Mid"
        if f < 1000000: return "Macro"
        return "Mega"

    t = tier(followers)
    benchmarks = {
        "Nano":  {"avg_eng_rate": 6.2, "avg_views_per_post": 420,    "avg_likes": 28,   "avg_replies": 8},
        "Micro": {"avg_eng_rate": 4.8, "avg_views_per_post": 2800,   "avg_likes": 145,  "avg_replies": 32},
        "Mid":   {"avg_eng_rate": 3.2, "avg_views_per_post": 18000,  "avg_likes": 680,  "avg_replies": 145},
        "Macro": {"avg_eng_rate": 2.1, "avg_views_per_post": 120000, "avg_likes": 3200, "avg_replies": 580},
        "Mega":  {"avg_eng_rate": 1.4, "avg_views_per_post": 850000, "avg_likes": 22000,"avg_replies": 3200},
    }
    tier_max = {"Nano": 1000, "Micro": 10000, "Mid": 100000, "Macro": 1000000, "Mega": 10000000}

    return {
        "your_tier":      t,
        "your_followers": followers,
        "benchmark":      benchmarks[t],
        "your_percentile": min(int((followers / tier_max[t]) * 100), 99),
    }


# ══════════════════════════════════════════════════════════════════════
# PUBLISH
# ══════════════════════════════════════════════════════════════════════

@router.post("/publish")
async def publish(user_id: str, payload: dict):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Threads not connected")

    text = payload.get("text", "").strip()
    if not text:
        raise HTTPException(400, "text is required")
    if len(text) > 500:
        raise HTTPException(400, "Max 500 characters")

    token       = acc["access_token"]
    threads_uid = acc["threads_uid"]

    async with httpx.AsyncClient() as client:
        cr = await client.post(
            f"https://graph.threads.net/v1.0/{threads_uid}/threads",
            params={"media_type": "TEXT", "text": text, "access_token": token},
        )
    if cr.status_code != 200:
        raise HTTPException(400, f"Create failed: {cr.text}")

    creation_id = cr.json().get("id")

    async with httpx.AsyncClient() as client:
        pr = await client.post(
            f"https://graph.threads.net/v1.0/{threads_uid}/threads_publish",
            params={"creation_id": creation_id, "access_token": token},
        )
    if pr.status_code != 200:
        raise HTTPException(400, f"Publish failed: {pr.text}")

    post_id  = pr.json().get("id", "")
    username = acc.get("username", "")
    return {
        "success": True,
        "post_id": post_id,
        "url":     f"https://www.threads.net/@{username}/post/{post_id}",
        "message": "Posted successfully!",
    }