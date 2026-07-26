"""
instagram_routes.py — SocioMee Instagram Analytics
Handles OAuth (via Facebook Login), analytics, insights, viral prediction, and publishing.
Storage: JSON files (same pattern as threads_routes.py)
"""

import os, json, random, math, httpx
from datetime import datetime, timedelta
from pathlib import Path
import logging
from fastapi import APIRouter, HTTPException, Request, Query
log = logging.getLogger(__name__)
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/instagram", tags=["instagram"])
from plan_limits import check_connect_limit

IG_APP_ID       = os.getenv("IG_APP_ID", "")
IG_APP_SECRET   = os.getenv("IG_APP_SECRET", "")
IG_REDIRECT_URI = os.getenv("IG_REDIRECT_URI", "https://sociomeeai.com/instagram/callback")
IG_SCOPE        = "instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_comments,pages_show_list,pages_read_engagement,business_management"

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
    data = _load()
    current = 1 if data.get(str(user_id)) else 0
    chk = check_connect_limit(user_id, current, "Instagram")
    if not chk["allowed"]:
        raise HTTPException(403, chk["reason"])
    if not IG_APP_ID:
        raise HTTPException(500, "IG_APP_ID not configured")
    url = (
        f"https://www.facebook.com/v19.0/dialog/oauth"
        f"?client_id={IG_APP_ID}"
        f"&redirect_uri={IG_REDIRECT_URI}"
        f"&scope={IG_SCOPE}"
        f"&response_type=code"
        f"&state={user_id}"
        f"&config_id=1341878247385333"
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
    pages_json = pages_r.json()
    pages = pages_json.get("data", [])
    print(f"DEBUG ME_ACCOUNTS_COUNT: {len(pages)}", flush=True)
    print(f"DEBUG RAW_PAGES: {pages}", flush=True)

    # TEMP: also check known page IDs directly (Meta /me/accounts listing bug workaround)
    known_page_ids = ["1047416205120240"]
    for kpid in known_page_ids:
        if not any(p.get("id") == kpid for p in pages):
            async with httpx.AsyncClient() as client:
                kp_r = await client.get(
                    f"https://graph.facebook.com/v19.0/{kpid}",
                    params={"fields": "id,name,access_token", "access_token": long_token},
                )
            if kp_r.status_code == 200:
                pages.append(kp_r.json())

    if True:
        # Always also check Business Manager owned/client pages
        async with httpx.AsyncClient() as client:
            biz_r = await client.get(
                "https://graph.facebook.com/v19.0/me/businesses",
                params={"access_token": long_token},
            )
        businesses = biz_r.json().get("data", [])
        print(f"DEBUG BUSINESSES: {businesses}", flush=True)

        for biz in businesses:
            biz_id = biz.get("id")
            for endpoint in ["owned_pages", "client_pages"]:
                async with httpx.AsyncClient() as client:
                    bp_r = await client.get(
                        f"https://graph.facebook.com/v19.0/{biz_id}/{endpoint}",
                        params={"access_token": long_token, "fields": "id,name,access_token"},
                    )
                bp_data = bp_r.json().get("data", [])
                print(f"DEBUG {endpoint.upper()} for biz {biz_id}: {bp_data}", flush=True)
                pages.extend(bp_data)

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
        return RedirectResponse("https://sociomeeai.com?instagram=no_business_account")

    profile = await _fetch_profile(ig_account, page_token)
    _set_account(user_id, {
        "ig_user_id":   ig_account,
        "access_token": page_token,
        "connected_at": datetime.utcnow().isoformat(),
        **profile,
    })

    return RedirectResponse("https://sociomeeai.com?instagram=connected")


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
    # Always fetch fresh profile pic from API to avoid expired CDN URLs
    profile_pic = acc.get("profile_pic", "")
    try:
        token = acc.get("access_token", "")
        ig_id = acc.get("ig_user_id", "")
        if token and ig_id:
            async with httpx.AsyncClient(timeout=8) as client:
                r = await client.get(f"https://graph.facebook.com/v19.0/{ig_id}",
                    params={"fields": "profile_picture_url", "access_token": token})
                if r.status_code == 200:
                    fresh = r.json().get("profile_picture_url", "")
                    if fresh:
                        profile_pic = fresh
                        acc["profile_pic"] = fresh
                        _set_account(user_id, acc)
    except Exception:
        pass
    return {
        "connected":    True,
        "username":     acc.get("username"),
        "display_name": acc.get("display_name"),
        "profile_pic":  profile_pic,
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
                    "metric":       "reach,profile_views,accounts_engaged,total_interactions",
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
    reach_s    = metric_map.get("reach", [])
    pviews_s   = metric_map.get("profile_views", [])
    engaged_s  = metric_map.get("accounts_engaged", [])
    interact_s = metric_map.get("total_interactions", [])
    chart  = []
    totals = {"reach": 0, "profile_views": 0, "accounts_engaged": 0, "total_interactions": 0}
    base_s = reach_s or pviews_s or engaged_s
    for i, v in enumerate(base_s[-days:]):
        reach         = reach_s[i].get("value", 0)    if i < len(reach_s)    else 0
        profile_views = pviews_s[i].get("value", 0)   if i < len(pviews_s)   else 0
        engaged       = engaged_s[i].get("value", 0)  if i < len(engaged_s)  else 0
        interactions  = interact_s[i].get("value", 0) if i < len(interact_s) else 0
        chart.append({"date": v.get("end_time", "")[:10], "impressions": interactions, "reach": reach, "profile_views": profile_views})
        totals["reach"] += reach; totals["profile_views"] += profile_views
        totals["accounts_engaged"] += engaged; totals["total_interactions"] += interactions
    return {**totals, "chart_data": chart, "is_mock": False,
            "total_impressions": totals["total_interactions"], "total_reach": totals["reach"],
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
    from credits_manager import use_credit, get_credit_status
    if not use_credit(user_id, cost=5):
        status = get_credit_status(user_id)
        raise HTTPException(402, detail={"error":"no_credits","message":f"Not enough credits. {status.get('credits_remaining',0)} remaining."})

    acc = _get_account(user_id)
    followers = acc.get("followers", 1000) if acc else 1000
    fmt_info = CONTENT_FORMATS.get(content_format, CONTENT_FORMATS["reel"])

    try:
        from vertex_engine import generate
        prompt = f"""You are an Instagram viral content expert for Indian creators in 2026.
Analyze this {content_format} idea for viral potential: "{topic}"
Creator has {followers} followers.

Return ONLY valid JSON:
{{"virality_score":72,"content_format":"{fmt_info['label']}","format_tip":"{fmt_info['tip']}","recommendation":"one sentence on viral potential","hook_detected":["pov","question"],"hook_suggestions":["rewritten version 1 with stronger hook","rewritten version 2 with different angle","rewritten version 3 as personal story"],"estimated_reach":8500,"estimated_likes":640,"estimated_saves":180,"estimated_comments":45,"estimated_shares":28,"estimated_follows":22,"estimated_plays":null,"best_post_time":"7-9 PM IST (prime reels hour)","tip":"one actionable tip specific to THIS post","breakdown":{{"hook_strength":70,"audience_reach":50,"content_format":75,"timing_potential":80}},"next_milestone":{{"target":5000,"months":3}}}}

Rules:
- virality_score 0-100 based on hook quality, topic relevance, format fit
- hook_suggestions must be 3 rewritten versions of the exact idea, not generic advice
- estimated_plays only for reels, null for other formats
- estimates realistic for {followers} followers"""
        import re as _re, json as _json
        raw = generate(prompt, max_tokens=1500)
        m = _re.search(r'\{{[\s\S]*\}}', raw)
        data = _json.loads(m.group()) if m else {}
    except Exception:
        data = {}

    if not data.get("virality_score"):
        topic_lower = topic.lower()
        hook_bonus = min(sum(v for k,v in VIRAL_HOOKS.items() if k in topic_lower), 35)
        virality = min((32 if followers>=1000 else 22) + hook_bonus + (8 if 60<=len(topic)<=160 else 4), 98)
        reach_mult = fmt_info["multiplier"] * (1+(virality/100)*3.5)
        est_reach = int(followers * reach_mult * 2.0)
        data = {
            "virality_score": virality, "content_format": fmt_info["label"], "format_tip": fmt_info["tip"],
            "recommendation": "Add a strong hook and post at 7-9 PM IST for maximum reach.",
            "hook_detected": [k for k in VIRAL_HOOKS if k in topic_lower],
            "hook_suggestions": [f"POV: {topic}", f"Nobody talks about {topic}", f"Real talk: {topic}?"],
            "estimated_reach": est_reach, "estimated_likes": int(est_reach*0.07),
            "estimated_saves": int(est_reach*0.03), "estimated_comments": int(est_reach*0.015),
            "estimated_shares": int(est_reach*0.01), "estimated_follows": int(est_reach*0.007),
            "estimated_plays": int(est_reach*2.5) if content_format=="reel" else None,
            "best_post_time": random.choice(BEST_TIMES), "tip": random.choice(TIPS),
            "breakdown": {"hook_strength": min(hook_bonus*3,100), "audience_reach": min(int(followers/1000),100), "content_format": int(fmt_info["multiplier"]*75), "timing_potential": 75},
            "next_milestone": None,
        }

    if not data.get("next_milestone"):
        next_target = next((m for m in [500,1000,5000,10000,50000,100000,500000,1000000] if m > followers), None)
        if next_target:
            monthly = max(data.get("estimated_follows",10)*4, 10)
            data["next_milestone"] = {"target": next_target, "months": min(__import__("math").ceil((next_target-followers)/monthly),36)}

    return data

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
async def publish(user_id: str, request: Request):
    try:
        payload = await request.json()
    except Exception as e:
        print(f"DEBUG PUBLISH JSON PARSE ERROR: {e}", flush=True)
        raise HTTPException(400, f"Invalid JSON body: {e}")
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

@router.post("/deauthorize")
async def deauthorize(request: Request):
    """Meta calls this when a user removes the app."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    user_id = body.get("user_id", "unknown")
    log.info(f"Instagram deauthorize callback for user_id={user_id}")
    return {"success": True}

@router.get("/deauthorize")
async def deauthorize_get():
    return {"success": True}

@router.post("/delete")
async def delete_data(request: Request):
    """Meta GDPR data deletion callback."""
    try:
        body = await request.json()
    except Exception:
        body = {}
    user_id = body.get("user_id", "unknown")
    log.info(f"Instagram data deletion request for user_id={user_id}")
    confirmation_code = f"sociomee_del_{user_id}"
    return {
        "url": f"https://sociomeeai.com/instagram/deletion-status?id={confirmation_code}",
        "confirmation_code": confirmation_code
    }

@router.get("/delete")
async def delete_data_get():
    return {"success": True}

@router.get("/deletion-status")
async def deletion_status(id: str = ""):
    return {"status": "complete", "confirmation_code": id}


# ── SCHEDULING ──────────────────────────────────────────────────────
import threading, logging
from datetime import datetime, timezone
from pathlib import Path as _Path
import json as _json
from pydantic import BaseModel as _BaseModel
from limiter_shared import limiter

log = logging.getLogger("instagram_schedule")
_SCHED_FILE = _Path(__file__).parent / "data" / "instagram_scheduled.json"
_SCHED_FILE.parent.mkdir(exist_ok=True)

def _load_ig_sched():
    if _SCHED_FILE.exists():
        try: return _json.loads(_SCHED_FILE.read_text())
        except: return {}
    return {}

def _save_ig_sched(d):
    _SCHED_FILE.write_text(_json.dumps(d, indent=2))

def _new_ig_sched_job(job):
    import secrets
    jid = secrets.token_hex(8)
    jobs = _load_ig_sched()
    jobs[jid] = job
    _save_ig_sched(jobs)
    return jid

def _update_ig_sched_job(jid, **kw):
    jobs = _load_ig_sched()
    if jid in jobs:
        jobs[jid].update(kw)
        _save_ig_sched(jobs)

def _instagram_job_worker(jid, user_id, caption, image_url):
    try:
        _update_ig_sched_job(jid, status="sending")
        acc = _get_account(user_id)
        if not acc:
            raise Exception("Instagram not connected")
        token = acc["access_token"]
        ig_user_id = acc["ig_user_id"]
        with httpx.Client(timeout=30.0) as client:
            cr = client.post(
                f"https://graph.facebook.com/v19.0/{ig_user_id}/media",
                params={"image_url": image_url, "caption": caption, "access_token": token},
            )
            if cr.status_code != 200:
                raise Exception(f"Media container failed: {cr.text}")
            creation_id = cr.json().get("id")
            pr = client.post(
                f"https://graph.facebook.com/v19.0/{ig_user_id}/media_publish",
                params={"creation_id": creation_id, "access_token": token},
            )
            if pr.status_code != 200:
                raise Exception(f"Publish failed: {pr.text}")
        _update_ig_sched_job(jid, status="done", sent_at=datetime.now(timezone.utc).isoformat())
    except Exception as e:
        _update_ig_sched_job(jid, status="error", error=str(e))

def _schedule_instagram_post(jid, run_at, user_id, caption, image_url):
    from telegram_scheduler import _get_scheduler
    def job():
        _instagram_job_worker(jid, user_id, caption, image_url)
        try: _get_scheduler().remove_job(jid)
        except: pass
    _update_ig_sched_job(jid, status="scheduled", scheduled_at=run_at.isoformat())
    _get_scheduler().add_job(job, "date", run_date=run_at, id=jid, replace_existing=True)
    log.info("Scheduled Instagram job=%s at %s", jid, run_at.isoformat())

def restore_instagram_scheduled_jobs():
    try:
        jobs = _load_ig_sched()
        now = datetime.now(timezone.utc)
        restored = 0
        for jid, job in jobs.items():
            if job.get("status") != "scheduled": continue
            scheduled_at = job.get("scheduled_at")
            if not scheduled_at: continue
            run_at = datetime.fromisoformat(scheduled_at)
            if run_at <= now:
                threading.Thread(target=_instagram_job_worker, daemon=True, kwargs=dict(
                    jid=jid, user_id=job["user_id"], caption=job.get("caption",""), image_url=job.get("image_url","")
                )).start()
            else:
                _schedule_instagram_post(jid, run_at, job["user_id"], job.get("caption",""), job.get("image_url",""))
            restored += 1
        if restored: log.info("Restored %d scheduled Instagram jobs", restored)
    except Exception as e:
        log.warning("restore_instagram_scheduled_jobs failed: %s", e)

class InstagramSchedulePayload(_BaseModel):
    user_id: str
    caption: str
    image_url: str
    scheduled_at: str

@router.post("/schedule")
@limiter.limit("10/minute")
def instagram_schedule_post(request: Request, payload: InstagramSchedulePayload):
    if not payload.caption.strip():
        raise HTTPException(400, "caption required")
    if not payload.image_url.strip():
        raise HTTPException(400, "image_url required")
    if len(payload.caption) > 2200:
        raise HTTPException(400, "Max 2200 characters")
    try:
        sched_dt = datetime.fromisoformat(payload.scheduled_at.replace("Z", "+00:00"))
        if sched_dt.tzinfo is None:
            sched_dt = sched_dt.replace(tzinfo=timezone.utc)
    except Exception:
        raise HTTPException(400, "Invalid scheduled_at timestamp")
    if sched_dt <= datetime.now(timezone.utc):
        raise HTTPException(400, "scheduled_at must be in the future")
    jid = _new_ig_sched_job({
        "user_id": payload.user_id, "caption": payload.caption, "image_url": payload.image_url, "status": "pending",
    })
    _schedule_instagram_post(jid, sched_dt, payload.user_id, payload.caption, payload.image_url)
    return {"ok": True, "status": "scheduled", "job_id": jid, "scheduled_at": sched_dt.isoformat()}

@router.get("/scheduled")
def instagram_list_scheduled(user_id: str = Query(...)):
    jobs = _load_ig_sched()
    user_jobs = [{"job_id": jid, **job} for jid, job in jobs.items() if job.get("user_id") == user_id]
    user_jobs.sort(key=lambda j: j.get("scheduled_at",""), reverse=True)
    return {"jobs": user_jobs}
