"""
instagram_routes.py — SocioMee Instagram Analytics
Handles OAuth (via Facebook Login), analytics, insights, viral prediction, and publishing.
Storage: JSON files (same pattern as threads_routes.py)
"""

import os, json, random, math, httpx
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/instagram", tags=["instagram"])

IG_APP_ID       = os.getenv("IG_APP_ID", "")
IG_APP_SECRET   = os.getenv("IG_APP_SECRET", "")
IG_REDIRECT_URI = os.getenv("IG_REDIRECT_URI", "https://sociomee.in/instagram/callback")
IG_SCOPE        = "instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_comments,pages_show_list,pages_read_engagement"

# ── Storage helpers ────────────────────────────────────────────────
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
IG_FILE  = DATA_DIR / "instagram_accounts.json"

def _load() -> dict:
    if IG_FILE.exists():
        try:
            return json.loads(IG_FILE.read_text())
        except Exception:
            pass
    return {}

def _save(data: dict):
    IG_FILE.write_text(json.dumps(data, indent=2))

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
    if not IG_APP_ID:
        raise HTTPException(500, "IG_APP_ID not configured")
    url = (
        f"https://www.facebook.com/v19.0/dialog/oauth"
        f"?client_id={IG_APP_ID}"
        f"&redirect_uri={IG_REDIRECT_URI}"
        f"&scope={IG_SCOPE}"
        f"&response_type=code"
        f"&state={user_id}"
    )
    return {"url": url}


@router.get("/callback")
async def instagram_callback(code: str, state: str = ""):
    user_id = state
    if not user_id:
        raise HTTPException(400, "Missing state (user_id)")

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            data={
                "client_id":     IG_APP_ID,
                "client_secret": IG_APP_SECRET,
                "grant_type":    "authorization_code",
                "redirect_uri":  IG_REDIRECT_URI,
                "code":          code,
            },
        )
    if r.status_code != 200:
        raise HTTPException(400, f"Token exchange failed: {r.text}")

    short_token = r.json().get("access_token")

    async with httpx.AsyncClient() as client:
        lr = await client.get(
            "https://graph.facebook.com/v19.0/oauth/access_token",
            params={
                "grant_type":        "fb_exchange_token",
                "client_id":         IG_APP_ID,
                "client_secret":     IG_APP_SECRET,
                "fb_exchange_token": short_token,
            },
        )
    long_token = lr.json().get("access_token", short_token)

    async with httpx.AsyncClient() as client:
        me = await client.get(
            "https://graph.facebook.com/v19.0/me",
            params={"access_token": long_token, "fields": "id,name"},
        )
    fb_user_id = me.json().get("id", "")

    async with httpx.AsyncClient() as client:
        pages_r = await client.get(
            f"https://graph.facebook.com/v19.0/{fb_user_id}/accounts",
            params={"access_token": long_token},
        )
    pages = pages_r.json().get("data", [])

    ig_account = None
    page_token = long_token
    for page in pages:
        pid  = page.get("id")
        ptok = page.get("access_token", long_token)
        async with httpx.AsyncClient() as client:
            ig_r = await client.get(
                f"https://graph.facebook.com/v19.0/{pid}",
                params={"fields": "instagram_business_account", "access_token": ptok},
            )
        ig_data = ig_r.json().get("instagram_business_account")
        if ig_data:
            ig_account = ig_data.get("id")
            page_token = ptok
            break

    if not ig_account:
        return RedirectResponse("https://sociomee.in?instagram=no_business_account")

    profile = await _fetch_profile(ig_account, page_token)
    _set_account(user_id, {
        "ig_user_id":   ig_account,
        "access_token": page_token,
        "connected_at": datetime.utcnow().isoformat(),
        **profile,
    })

    return RedirectResponse("https://sociomee.in?instagram=connected")


async def _fetch_profile(ig_user_id: str, token: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://graph.facebook.com/v19.0/{ig_user_id}",
                params={
                    "fields":       "id,username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website",
                    "access_token": token,
                },
            )
        d = r.json()
        return {
            "username":     d.get("username", ""),
            "display_name": d.get("name", ""),
            "bio":          d.get("biography", ""),
            "profile_pic":  d.get("profile_picture_url", ""),
            "followers":    d.get("followers_count", 0),
            "following":    d.get("follows_count", 0),
            "media_count":  d.get("media_count", 0),
            "website":      d.get("website", ""),
            "profile_url":  f"https://www.instagram.com/{d.get('username', '')}",
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
        "media_count":  acc.get("media_count", 0),
        "bio":          acc.get("bio", ""),
        "website":      acc.get("website", ""),
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
        raise HTTPException(404, "Instagram not connected")

    token      = acc["access_token"]
    ig_user_id = acc["ig_user_id"]
    since      = int((datetime.utcnow() - timedelta(days=days)).timestamp())
    until      = int(datetime.utcnow().timestamp())

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://graph.facebook.com/v19.0/{ig_user_id}/insights",
                params={
                    "metric":       "impressions,reach,profile_views,follower_count",
                    "period":       "day",
                    "since":        since,
                    "until":        until,
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
    impressions_s = metric_map.get("impressions", [])
    reach_s       = metric_map.get("reach", [])
    pviews_s      = metric_map.get("profile_views", [])
    chart  = []
    totals = {"impressions": 0, "reach": 0, "profile_views": 0}
    for i, v in enumerate(impressions_s[-days:]):
        impressions   = v.get("value", 0)
        reach         = reach_s[i]["value"]  if i < len(reach_s)  else 0
        profile_views = pviews_s[i]["value"] if i < len(pviews_s) else 0
        chart.append({"date": v.get("end_time", "")[:10], "impressions": impressions, "reach": reach, "profile_views": profile_views})
        totals["impressions"] += impressions; totals["reach"] += reach; totals["profile_views"] += profile_views
    return {**totals, "chart_data": chart, "is_mock": False,
            "total_impressions": totals["impressions"], "total_reach": totals["reach"],
            "total_profile_views": totals["profile_views"]}


def _mock_insights(acc: dict, days: int) -> dict:
    followers = acc.get("followers", 1000)
    base      = max(followers * 3, 800)
    seed      = hash(acc.get("username", "u")) % 1000
    chart     = []
    totals    = {"impressions": 0, "reach": 0, "profile_views": 0, "likes": 0, "comments": 0, "saves": 0}
    for i in range(days):
        date    = (datetime.utcnow() - timedelta(days=days - i)).strftime("%Y-%m-%d")
        dow     = (datetime.utcnow() - timedelta(days=days - i)).weekday()
        boost   = 1.5 if dow in [1, 3, 5] else 1.0
        noise   = 0.65 + (((seed * (i + 1) * 6271) % 1000) / 1000) * 0.7
        impr    = int(base / days * boost * noise * 2.2)
        reach   = int(impr * 0.72)
        pviews  = int(impr * 0.08)
        likes   = int(impr * 0.055 * noise)
        comments = int(impr * 0.012 * noise)
        saves   = int(impr * 0.018 * noise)
        chart.append({"date": date, "impressions": impr, "reach": reach, "profile_views": pviews,
                      "likes": likes, "comments": comments, "saves": saves})
        totals["impressions"] += impr; totals["reach"] += reach; totals["profile_views"] += pviews
        totals["likes"] += likes; totals["comments"] += comments; totals["saves"] += saves
    eng_rate = round((totals["likes"] + totals["comments"] + totals["saves"]) / max(totals["reach"], 1) * 100, 2)
    return {
        "total_impressions": totals["impressions"], "total_reach": totals["reach"],
        "total_profile_views": totals["profile_views"], "total_likes": totals["likes"],
        "total_comments": totals["comments"], "total_saves": totals["saves"],
        "engagement_rate": eng_rate, "chart_data": chart, "is_mock": True,
    }


# ══════════════════════════════════════════════════════════════════════
# POSTS
# ══════════════════════════════════════════════════════════════════════

@router.get("/posts")
async def get_posts(user_id: str, limit: int = 12):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Instagram not connected")
    token      = acc["access_token"]
    ig_user_id = acc["ig_user_id"]
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                f"https://graph.facebook.com/v19.0/{ig_user_id}/media",
                params={"fields": "id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink", "limit": limit, "access_token": token},
            )
        if r.status_code == 200:
            posts = []
            for p in r.json().get("data", []):
                posts.append({"id": p.get("id"), "caption": (p.get("caption") or "")[:120], "type": p.get("media_type", "IMAGE"),
                              "thumbnail": p.get("thumbnail_url") or p.get("media_url", ""), "timestamp": p.get("timestamp", "")[:10],
                              "likes": p.get("like_count", 0), "comments": p.get("comments_count", 0), "saves": 0, "url": p.get("permalink", "")})
            return {"posts": posts, "is_mock": False}
    except Exception:
        pass
    return {"posts": _mock_posts(acc, limit), "is_mock": True}


CAPTIONS = [
    "Drop everything and try this ✨ Save this for later!",
    "POV: You finally cracked the algorithm 📈 Here's what worked for me",
    "Hot take: most creators are doing this wrong 🔥",
    "Real talk — consistency beats viral every single time 💪",
    "This reel took me 20 mins and got 10x my normal reach 🚀",
    "Sharing my exact strategy that grew me to {} followers 📊",
    "Stop sleeping on carousels. They get 3x more saves 💾",
    "Unpopular opinion: your niche doesn't matter as much as your energy ⚡",
    "Day in my life as a content creator in India 🇮🇳",
    "The Instagram algorithm in 2025: what's actually working",
    "Collab dropping soon 👀 Comment 'yes' if you want in",
    "Results after 30 days of posting daily. Honest breakdown 👇",
]

def _mock_posts(acc: dict, limit: int) -> list:
    followers = acc.get("followers", 1000)
    types     = ["IMAGE", "IMAGE", "VIDEO", "CAROUSEL_ALBUM", "VIDEO", "IMAGE"]
    posts     = []
    for i in range(min(limit, len(CAPTIONS))):
        t        = types[i % len(types)]
        likes    = int(followers * random.uniform(0.03, 0.12))
        comments = int(followers * random.uniform(0.005, 0.025))
        saves    = int(followers * random.uniform(0.01, 0.04))
        date     = (datetime.utcnow() - timedelta(days=i * 2 + 1)).strftime("%Y-%m-%d")
        caption  = CAPTIONS[i].format(followers) if "{}" in CAPTIONS[i] else CAPTIONS[i]
        posts.append({"id": f"mock_{i}", "caption": caption, "type": t, "thumbnail": "", "timestamp": date,
                      "likes": likes, "comments": comments, "saves": saves, "url": ""})
    return posts


# ══════════════════════════════════════════════════════════════════════
# STORIES ANALYTICS
# ══════════════════════════════════════════════════════════════════════

@router.get("/stories")
async def get_stories(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Instagram not connected")
    followers   = acc.get("followers", 1000)
    story_types = ["Poll", "Question", "Slider", "Quiz", "Countdown", "Plain", "Link"]
    stories     = []
    for i in range(7):
        views   = int(followers * random.uniform(0.12, 0.35))
        replies = int(views * random.uniform(0.02, 0.07))
        exits   = int(views * random.uniform(0.05, 0.18))
        stories.append({
            "day":       (datetime.utcnow() - timedelta(days=6 - i)).strftime("%a"),
            "type":      story_types[i % len(story_types)],
            "views":     views,
            "replies":   replies,
            "exits":     exits,
            "exit_rate": round(exits / max(views, 1) * 100, 1),
        })
    return {
        "stories":       stories,
        "avg_views":     int(sum(s["views"] for s in stories) / len(stories)),
        "avg_exit_rate": round(sum(s["exit_rate"] for s in stories) / len(stories), 1),
        "best_type":     "Poll",
        "tip":           "Polls and Questions get 2-3x more replies. Use interactive stickers every day.",
        "is_mock":       True,
    }


# ══════════════════════════════════════════════════════════════════════
# REELS ANALYTICS
# ══════════════════════════════════════════════════════════════════════

@router.get("/reels")
async def get_reels(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Instagram not connected")
    followers = acc.get("followers", 1000)
    topics    = ["Morning routine 🌅", "Content strategy 📈", "Day in my life 🎬",
                 "Mistakes I made 💡", "Growth hack 🚀", "Behind the scenes 🎥"]
    reels = []
    for i in range(6):
        plays    = int(followers * random.uniform(1.5, 8.0))
        likes    = int(plays * random.uniform(0.04, 0.10))
        comments = int(plays * random.uniform(0.008, 0.025))
        shares   = int(plays * random.uniform(0.01, 0.04))
        saves    = int(plays * random.uniform(0.015, 0.05))
        reach    = int(plays * random.uniform(0.6, 0.9))
        reels.append({
            "topic":    topics[i],
            "date":     (datetime.utcnow() - timedelta(days=i * 5 + 2)).strftime("%Y-%m-%d"),
            "plays":    plays,
            "likes":    likes,
            "comments": comments,
            "shares":   shares,
            "saves":    saves,
            "reach":    reach,
            "eng_rate": round((likes + comments + saves) / max(reach, 1) * 100, 2),
        })
    best = max(reels, key=lambda r: r["plays"])
    return {
        "reels":     reels,
        "best_reel": best,
        "avg_plays": int(sum(r["plays"] for r in reels) / len(reels)),
        "avg_eng":   round(sum(r["eng_rate"] for r in reels) / len(reels), 2),
        "tip":       "Reels under 15s get 40% more replays. Hook in first 2 seconds is everything.",
        "is_mock":   True,
    }


# ══════════════════════════════════════════════════════════════════════
# VIRAL PREDICTOR
# ══════════════════════════════════════════════════════════════════════

VIRAL_HOOKS = {
    "pov:": 15, "hot take": 14, "nobody talks about": 13, "real talk": 12,
    "unpopular opinion": 13, "secret": 11, "how i": 10, "why i": 9,
    "mistake": 10, "stop doing": 11, "growth": 8, "tips": 7, "truth": 11,
    "exposed": 10, "this changed": 12, "save this": 10, "results": 9,
    "nobody tells you": 13, "honest": 9, "day in": 8, "watch till end": 8,
}

CONTENT_FORMATS = {
    "reel":     {"multiplier": 2.8, "label": "Reel",        "tip": "Reels get 4x organic reach vs static posts."},
    "carousel": {"multiplier": 2.2, "label": "Carousel",    "tip": "Carousels get 3x more saves and 2x shares."},
    "story":    {"multiplier": 0.8, "label": "Story",        "tip": "Stories are great for engagement but low reach."},
    "post":     {"multiplier": 1.2, "label": "Single Post",  "tip": "Single posts work best with strong visuals."},
}

IG_TIPS = [
    "First frame of your Reel decides if people watch — make it unmissable.",
    "Add closed captions — 85% of Instagram videos are watched without sound.",
    "Post at 6-9 PM IST when your Indian audience is most active.",
    "Carousels with 7-10 slides consistently outperform shorter ones.",
    "Reply to every comment in the first hour — it signals quality to the algorithm.",
    "Use 3-5 very specific hashtags instead of 30 generic ones.",
    "Collab posts reach both audiences — ideal for 2-5x follower growth.",
    "Save count is Instagram's biggest quality signal — create save-worthy content.",
    "Stories with polls see 3x more profile visits than plain stories.",
    "Your bio link gets 80% more clicks if your CTA is in your last 3 posts.",
]


@router.get("/predict")
async def predict_viral(user_id: str, topic: str = "", content_format: str = "reel"):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Instagram not connected")
    followers   = acc.get("followers", 1000)
    topic_lower = topic.lower()
    fmt         = CONTENT_FORMATS.get(content_format, CONTENT_FORMATS["reel"])

    if followers >= 100_000: base = 52
    elif followers >= 10_000: base = 42
    elif followers >= 1_000:  base = 32
    else:                     base = 22

    hook_bonus     = min(sum(v for k, v in VIRAL_HOOKS.items() if k in topic_lower), 35)
    length_bonus   = 8 if 60 <= len(topic) <= 160 else (4 if len(topic) < 60 else 2)
    question_bonus = 6 if "?" in topic else 0
    emoji_bonus    = 6 if any(ord(c) > 127 for c in topic) else 0
    format_bonus   = int(fmt["multiplier"] * 8)
    virality       = min(base + hook_bonus + length_bonus + question_bonus + emoji_bonus + format_bonus, 98)

    reach_mult      = fmt["multiplier"] * (1 + (virality / 100) * 3.5)
    est_reach       = int(followers * reach_mult * random.uniform(1.5, 2.5))
    est_impressions = int(est_reach * 1.4)
    est_likes       = int(est_reach * random.uniform(0.05, 0.12))
    est_comments    = int(est_reach * random.uniform(0.01, 0.03))
    est_saves       = int(est_reach * random.uniform(0.02, 0.06))
    est_shares      = int(est_reach * random.uniform(0.008, 0.025))
    est_follows     = int(est_reach * random.uniform(0.004, 0.015))
    est_plays       = int(est_reach * random.uniform(1.8, 3.2)) if content_format == "reel" else None

    next_target = next((m for m in [500,1000,5000,10000,50000,100000,500000,1000000] if m > followers), None)
    months_to   = None
    if next_target:
        monthly   = max(est_follows * 4, 10)
        months_to = min(math.ceil((next_target - followers) / monthly), 36)

    if virality >= 70:
        rec = "🔥 High viral potential! Post at peak hours and reply to every comment in the first 30 min."
    elif virality >= 50:
        rec = f"📈 Good topic. Posting as a {fmt['label']} will maximize reach. Add a stronger hook."
    else:
        rec = "💡 Add 'POV:', 'Real talk:' or 'Nobody talks about' to boost discoverability."

    return {
        "virality_score":        virality,
        "content_format":        fmt["label"],
        "format_tip":            fmt["tip"],
        "estimated_reach":       est_reach,
        "estimated_impressions": est_impressions,
        "estimated_likes":       est_likes,
        "estimated_comments":    est_comments,
        "estimated_saves":       est_saves,
        "estimated_shares":      est_shares,
        "estimated_follows":     est_follows,
        "estimated_plays":       est_plays,
        "next_milestone":        {"target": next_target, "months": months_to} if next_target else None,
        "recommendation":        rec,
        "best_post_time":        random.choice(["6–8 PM IST", "7–9 PM IST", "12–2 PM IST", "8–10 AM IST"]),
        "tip":                   random.choice(IG_TIPS),
        "breakdown": {
            "hook_strength":    min(hook_bonus * 3, 100),
            "audience_reach":   min(int(followers / 1000), 100),
            "content_format":   min(format_bonus * 4, 100),
            "timing_potential": 78,
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
        raise HTTPException(404, "Instagram not connected")
    followers = acc.get("followers", 1000)
    seed      = hash(acc.get("username", "u")) % 100
    return {
        "top_locations": [
            {"city": "Mumbai",    "pct": 18 + seed % 5},
            {"city": "Delhi",     "pct": 15 + seed % 4},
            {"city": "Bangalore", "pct": 12 + seed % 3},
            {"city": "Hyderabad", "pct": 9},
            {"city": "Others",    "pct": max(46 - seed % 6, 10)},
        ],
        "age_groups": [
            {"group": "13–17", "pct": 8},
            {"group": "18–24", "pct": 34},
            {"group": "25–34", "pct": 30},
            {"group": "35–44", "pct": 18},
            {"group": "45+",   "pct": 10},
        ],
        "gender":      {"male": 52 + seed % 10, "female": 48 - seed % 10},
        "peak_hours": [
            {"hour": "7 AM",  "activity": 42},
            {"hour": "12 PM", "activity": 68},
            {"hour": "6 PM",  "activity": 85},
            {"hour": "9 PM",  "activity": 98},
            {"hour": "11 PM", "activity": 55},
        ],
        "top_interests":   ["Fashion", "Lifestyle", "Tech", "Food", "Travel"],
        "follower_growth": [
            {"week": f"W{i+1}", "followers": max(0, followers - (7 - i) * int(followers * 0.025))}
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
        raise HTTPException(404, "Instagram not connected")
    seed   = hash(acc.get("username", "u")) % 100
    days_l = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    heatmap = []
    for di, day in enumerate(days_l):
        for hour in range(24):
            base = 15
            if 7  <= hour <= 9:    base = 60 + seed % 20
            elif 12 <= hour <= 14: base = 70 + seed % 15
            elif 18 <= hour <= 21: base = 92 + seed % 8
            elif 22 <= hour <= 23: base = 58 + seed % 15
            elif hour < 6:         base = 8
            if di >= 5:            base = int(base * 1.18)
            heatmap.append({"day": day, "hour": hour, "score": min(max(base + random.randint(-8, 8), 5), 100)})
    return {
        "heatmap": heatmap,
        "top_slots": [
            {"day": "Wednesday", "time": "9:00 PM IST", "score": 96},
            {"day": "Thursday",  "time": "8:00 PM IST", "score": 93},
            {"day": "Tuesday",   "time": "7:00 PM IST", "score": 90},
            {"day": "Saturday",  "time": "9:00 PM IST", "score": 88},
        ],
        "timezone": "IST",
        "insight":  "Wednesday–Thursday evenings (8–10 PM IST) consistently outperform all other slots for Indian audiences.",
    }


# ══════════════════════════════════════════════════════════════════════
# BENCHMARK
# ══════════════════════════════════════════════════════════════════════

@router.get("/benchmark")
async def get_benchmark(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Instagram not connected")
    followers = acc.get("followers", 1000)

    def tier(f):
        if f < 1_000:     return "Nano"
        if f < 10_000:    return "Micro"
        if f < 100_000:   return "Mid"
        if f < 1_000_000: return "Macro"
        return "Mega"

    t = tier(followers)
    benchmarks = {
        "Nano":  {"avg_eng_rate": 5.8, "avg_reach_per_post": 380,    "avg_likes": 24,   "avg_saves": 12,   "avg_reel_plays": 1200},
        "Micro": {"avg_eng_rate": 4.2, "avg_reach_per_post": 2600,   "avg_likes": 130,  "avg_saves": 68,   "avg_reel_plays": 8500},
        "Mid":   {"avg_eng_rate": 2.8, "avg_reach_per_post": 16000,  "avg_likes": 560,  "avg_saves": 320,  "avg_reel_plays": 55000},
        "Macro": {"avg_eng_rate": 1.8, "avg_reach_per_post": 110000, "avg_likes": 2800, "avg_saves": 1800, "avg_reel_plays": 420000},
        "Mega":  {"avg_eng_rate": 1.2, "avg_reach_per_post": 800000, "avg_likes": 18000,"avg_saves": 12000,"avg_reel_plays": 3200000},
    }
    tier_max = {"Nano": 1000, "Micro": 10000, "Mid": 100000, "Macro": 1000000, "Mega": 10000000}
    return {
        "your_tier":       t,
        "your_followers":  followers,
        "benchmark":       benchmarks[t],
        "your_percentile": min(int((followers / tier_max[t]) * 100), 99),
        "growth_tip":      f"{t} creators grow fastest by posting 1 Reel + 3 Stories daily. Collabs are the #1 growth hack at this tier.",
    }


# ══════════════════════════════════════════════════════════════════════
# PUBLISH
# ══════════════════════════════════════════════════════════════════════

@router.post("/publish")
async def publish(user_id: str, payload: dict):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Instagram not connected")
    caption   = payload.get("caption", "").strip()
    image_url = payload.get("image_url", "").strip()
    if not caption:
        raise HTTPException(400, "caption is required")
    if not image_url:
        raise HTTPException(400, "image_url is required (publicly accessible URL)")
    if len(caption) > 2200:
        raise HTTPException(400, "Max 2200 characters")

    token      = acc["access_token"]
    ig_user_id = acc["ig_user_id"]

    async with httpx.AsyncClient() as client:
        cr = await client.post(
            f"https://graph.facebook.com/v19.0/{ig_user_id}/media",
            params={"image_url": image_url, "caption": caption, "access_token": token},
        )
    if cr.status_code != 200:
        raise HTTPException(400, f"Media container failed: {cr.text}")
    creation_id = cr.json().get("id")

    async with httpx.AsyncClient() as client:
        pr = await client.post(
            f"https://graph.facebook.com/v19.0/{ig_user_id}/media_publish",
            params={"creation_id": creation_id, "access_token": token},
        )
    if pr.status_code != 200:
        raise HTTPException(400, f"Publish failed: {pr.text}")

    post_id = pr.json().get("id", "")
    return {
        "success": True,
        "post_id": post_id,
        "url":     f"https://www.instagram.com/p/{post_id}/",
        "message": "Posted successfully to Instagram!",
    }