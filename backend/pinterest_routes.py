"""
pinterest_routes.py — SocioMee Pinterest Analytics
Handles OAuth, analytics, pins, boards, viral prediction, and publishing.
Storage: JSON files (same pattern as threads_routes.py)
Pinterest API v5 — App ID: 1565248
"""

import os, json, random, math, httpx
from datetime import datetime, timedelta
from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from dotenv import load_dotenv

load_dotenv()

router = APIRouter(prefix="/pinterest", tags=["pinterest"])

PINTEREST_APP_ID       = os.getenv("PINTEREST_APP_ID", "")
PINTEREST_APP_SECRET   = os.getenv("PINTEREST_APP_SECRET", "")
PINTEREST_REDIRECT_URI = os.getenv("PINTEREST_REDIRECT_URI", "https://sociomee.in/pinterest/callback")
PINTEREST_SCOPE        = "boards:read,pins:read,user_accounts:read,pins:write"

# ── Storage helpers ────────────────────────────────────────────────
DATA_DIR       = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
PINTEREST_FILE = DATA_DIR / "pinterest_accounts.json"

def _load() -> dict:
    if PINTEREST_FILE.exists():
        try:
            return json.loads(PINTEREST_FILE.read_text())
        except Exception:
            pass
    return {}

def _save(data: dict):
    PINTEREST_FILE.write_text(json.dumps(data, indent=2))

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
    if not PINTEREST_APP_ID:
        raise HTTPException(500, "PINTEREST_APP_ID not configured")
    url = (
        f"https://www.pinterest.com/oauth/"
        f"?client_id={PINTEREST_APP_ID}"
        f"&redirect_uri={PINTEREST_REDIRECT_URI}"
        f"&response_type=code"
        f"&scope={PINTEREST_SCOPE}"
        f"&state={user_id}"
    )
    return {"url": url}


@router.get("/callback")
async def pinterest_callback(code: str, state: str = ""):
    user_id = state
    if not user_id:
        raise HTTPException(400, "Missing state (user_id)")

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.pinterest.com/v5/oauth/token",
            data={
                "grant_type":   "authorization_code",
                "code":         code,
                "redirect_uri": PINTEREST_REDIRECT_URI,
            },
            auth=(PINTEREST_APP_ID, PINTEREST_APP_SECRET),
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
    if r.status_code != 200:
        raise HTTPException(400, f"Token exchange failed: {r.text}")

    td          = r.json()
    access_token  = td.get("access_token")
    refresh_token = td.get("refresh_token", "")

    profile = await _fetch_profile(access_token)
    _set_account(user_id, {
        "access_token":  access_token,
        "refresh_token": refresh_token,
        "connected_at":  datetime.utcnow().isoformat(),
        **profile,
    })

    return RedirectResponse("https://sociomee.in?pinterest=connected")


async def _fetch_profile(token: str) -> dict:
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.pinterest.com/v5/user_account",
                headers={"Authorization": f"Bearer {token}"},
            )
        d = r.json()
        return {
            "username":     d.get("username", ""),
            "display_name": d.get("business_name") or d.get("username", ""),
            "profile_pic":  d.get("profile_image", ""),
            "followers":    d.get("follower_count", 0),
            "following":    d.get("following_count", 0),
            "pin_count":    d.get("pin_count", 0),
            "board_count":  d.get("board_count", 0),
            "profile_url":  f"https://www.pinterest.com/{d.get('username', '')}",
            "account_type": d.get("account_type", "PINNER"),
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
        "pin_count":    acc.get("pin_count", 0),
        "board_count":  acc.get("board_count", 0),
        "account_type": acc.get("account_type", "PINNER"),
    }


@router.post("/disconnect")
async def disconnect(user_id: str):
    _del_account(user_id)
    return {"success": True}


# ══════════════════════════════════════════════════════════════════════
# ANALYTICS / INSIGHTS
# ══════════════════════════════════════════════════════════════════════

@router.get("/insights")
async def get_insights(user_id: str, days: int = 30):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Pinterest not connected")

    token = acc["access_token"]
    start = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
    end   = datetime.utcnow().strftime("%Y-%m-%d")

    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.pinterest.com/v5/user_account/analytics",
                params={"start_date": start, "end_date": end,
                        "metric_types": "IMPRESSION,SAVE,PIN_CLICK,OUTBOUND_CLICK,PROFILE_VISIT"},
                headers={"Authorization": f"Bearer {token}"},
            )
        if r.status_code == 200:
            return _parse_insights(r.json(), days)
    except Exception:
        pass

    return _mock_insights(acc, days)


def _parse_insights(raw: dict, days: int) -> dict:
    daily = raw.get("all", {}).get("daily_metrics", [])
    chart = []
    totals = {"impressions": 0, "saves": 0, "pin_clicks": 0, "outbound_clicks": 0}
    for d in daily:
        date = d.get("date", "")
        impr = d.get("IMPRESSION", 0)
        saves = d.get("SAVE", 0)
        clicks = d.get("PIN_CLICK", 0)
        outbound = d.get("OUTBOUND_CLICK", 0)
        chart.append({"date": date, "impressions": impr, "saves": saves,
                      "pin_clicks": clicks, "outbound_clicks": outbound})
        totals["impressions"] += impr
        totals["saves"] += saves
        totals["pin_clicks"] += clicks
        totals["outbound_clicks"] += outbound
    eng_rate = round(totals["saves"] / max(totals["impressions"], 1) * 100, 2)
    return {**totals, "engagement_rate": eng_rate, "chart_data": chart, "is_mock": False,
            "total_impressions": totals["impressions"], "total_saves": totals["saves"],
            "total_pin_clicks": totals["pin_clicks"]}


def _mock_insights(acc: dict, days: int) -> dict:
    followers = acc.get("followers", 500)
    base      = max(followers * 5, 1000)
    seed      = hash(acc.get("username", "u")) % 1000
    chart     = []
    totals    = {"impressions": 0, "saves": 0, "pin_clicks": 0, "outbound_clicks": 0}

    for i in range(days):
        date      = (datetime.utcnow() - timedelta(days=days - i)).strftime("%Y-%m-%d")
        dow       = (datetime.utcnow() - timedelta(days=days - i)).weekday()
        boost     = 1.6 if dow in [5, 6] else 1.0  # Pinterest peaks on weekends
        noise     = 0.6 + (((seed * (i + 1) * 7321) % 1000) / 1000) * 0.8
        impr      = int(base / days * boost * noise * 3.0)
        saves     = int(impr * random.uniform(0.03, 0.08))
        clicks    = int(impr * random.uniform(0.02, 0.06))
        outbound  = int(impr * random.uniform(0.01, 0.03))
        chart.append({"date": date, "impressions": impr, "saves": saves,
                      "pin_clicks": clicks, "outbound_clicks": outbound})
        totals["impressions"]     += impr
        totals["saves"]           += saves
        totals["pin_clicks"]      += clicks
        totals["outbound_clicks"] += outbound

    eng_rate = round(totals["saves"] / max(totals["impressions"], 1) * 100, 2)
    return {
        "total_impressions":   totals["impressions"],
        "total_saves":         totals["saves"],
        "total_pin_clicks":    totals["pin_clicks"],
        "total_outbound":      totals["outbound_clicks"],
        "engagement_rate":     eng_rate,
        "chart_data":          chart,
        "is_mock":             True,
    }


# ══════════════════════════════════════════════════════════════════════
# PINS
# ══════════════════════════════════════════════════════════════════════

@router.get("/pins")
async def get_pins(user_id: str, limit: int = 12):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Pinterest not connected")

    token = acc["access_token"]
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.pinterest.com/v5/pins",
                params={"page_size": limit},
                headers={"Authorization": f"Bearer {token}"},
            )
        if r.status_code == 200:
            pins = []
            for p in r.json().get("items", []):
                media = p.get("media", {})
                pins.append({
                    "id":          p.get("id"),
                    "title":       p.get("title", ""),
                    "description": (p.get("description") or "")[:100],
                    "thumbnail":   media.get("images", {}).get("400x300", {}).get("url", ""),
                    "link":        p.get("link", ""),
                    "saves":       p.get("save_count", 0),
                    "clicks":      0,
                    "created_at":  p.get("created_at", "")[:10],
                    "board":       p.get("board_id", ""),
                })
            return {"pins": pins, "is_mock": False}
    except Exception:
        pass

    return {"pins": _mock_pins(acc, limit), "is_mock": True}


PIN_TOPICS = [
    ("Morning routine for productivity 🌅", "Lifestyle"),
    ("10 viral content ideas for creators 📱", "Marketing"),
    ("How to grow your YouTube channel fast 🚀", "YouTube"),
    ("Best apps for Indian content creators 📲", "Tech"),
    ("Content calendar template free download 📅", "Business"),
    ("Thumbnail design tips that get clicks 🎨", "Design"),
    ("Script writing formula for viral videos ✍️", "Writing"),
    ("Instagram Reels ideas for beginners 🎬", "Instagram"),
    ("How to make money as a creator in India 💰", "Finance"),
    ("SEO tips for YouTube 2025 📊", "SEO"),
    ("Best camera settings for YouTube videos 📷", "Photography"),
    ("Creator burnout — how to avoid it 🧠", "Wellness"),
]

def _mock_pins(acc: dict, limit: int) -> list:
    followers = acc.get("followers", 500)
    pins = []
    for i in range(min(limit, len(PIN_TOPICS))):
        title, category = PIN_TOPICS[i]
        saves   = int(followers * random.uniform(0.05, 0.25))
        clicks  = int(saves * random.uniform(0.3, 0.8))
        created = (datetime.utcnow() - timedelta(days=i * 3 + 1)).strftime("%Y-%m-%d")
        pins.append({
            "id":          f"mock_{i}",
            "title":       title,
            "description": f"Everything you need to know about {title.split()[0].lower()} for creators",
            "thumbnail":   "",
            "link":        "https://sociomee.in",
            "saves":       saves,
            "clicks":      clicks,
            "created_at":  created,
            "board":       category,
        })
    return pins


# ══════════════════════════════════════════════════════════════════════
# BOARDS
# ══════════════════════════════════════════════════════════════════════

@router.get("/boards")
async def get_boards(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Pinterest not connected")

    token = acc["access_token"]
    try:
        async with httpx.AsyncClient() as client:
            r = await client.get(
                "https://api.pinterest.com/v5/boards",
                params={"page_size": 20},
                headers={"Authorization": f"Bearer {token}"},
            )
        if r.status_code == 200:
            boards = []
            for b in r.json().get("items", []):
                boards.append({
                    "id":          b.get("id"),
                    "name":        b.get("name", ""),
                    "description": b.get("description", ""),
                    "pin_count":   b.get("pin_count", 0),
                    "follower_count": b.get("follower_count", 0),
                    "privacy":     b.get("privacy", "PUBLIC"),
                    "created_at":  b.get("created_at", "")[:10],
                })
            return {"boards": boards, "is_mock": False}
    except Exception:
        pass

    return {"boards": _mock_boards(acc), "is_mock": True}


def _mock_boards(acc: dict) -> list:
    followers = acc.get("followers", 500)
    board_names = [
        ("Content Creation Tips", 45, int(followers * 0.3)),
        ("YouTube Growth", 32, int(followers * 0.25)),
        ("Instagram Reels Ideas", 28, int(followers * 0.2)),
        ("SEO & Marketing", 19, int(followers * 0.15)),
        ("Creator Tools & Apps", 15, int(followers * 0.1)),
        ("Design Inspiration", 38, int(followers * 0.22)),
    ]
    boards = []
    for i, (name, pins, board_followers) in enumerate(board_names):
        boards.append({
            "id":             f"board_{i}",
            "name":           name,
            "description":    f"Best {name.lower()} for content creators",
            "pin_count":      pins,
            "follower_count": board_followers,
            "privacy":        "PUBLIC",
            "created_at":     (datetime.utcnow() - timedelta(days=i * 30 + 10)).strftime("%Y-%m-%d"),
        })
    return boards


# ══════════════════════════════════════════════════════════════════════
# VIRAL PREDICTOR
# ══════════════════════════════════════════════════════════════════════

VIRAL_HOOKS = {
    "how to": 14, "ideas": 12, "tips": 11, "free": 13, "easy": 10,
    "best": 11, "secret": 12, "diy": 13, "simple": 10, "quick": 9,
    "step by step": 13, "beginner": 10, "ultimate": 12, "guide": 10,
    "hack": 13, "trick": 11, "viral": 12, "aesthetic": 11, "inspo": 10,
    "template": 13, "checklist": 12, "download": 11, "free printable": 15,
    "recipe": 10, "tutorial": 11, "outfit": 10, "decor": 9,
}

PIN_TIPS = [
    "Vertical pins (2:3 ratio) get 60% more engagement than square pins.",
    "Add text overlay to your pin — pins with text get 2x more saves.",
    "Use warm colors (red, orange) — they perform 30% better on Pinterest.",
    "Post 5-15 pins per day for maximum reach — consistency is key.",
    "Add detailed descriptions with keywords for Pinterest SEO.",
    "Best time to pin: 8-11 PM IST when Indian users are most active.",
    "Create idea pins (video) — they get 9x more comments than static pins.",
    "Use board sections to organize pins — helps Pinterest understand your niche.",
    "Repin your top pins to multiple relevant boards for more exposure.",
    "Add your website URL to every pin — Pinterest drives real traffic.",
]

BEST_TIMES = [
    "8–10 PM IST (peak evening)",
    "2–4 PM IST (afternoon browse)",
    "Saturday 9–11 PM IST (weekend peak)",
    "Sunday 8–10 PM IST (planning mood)",
]

PIN_FORMATS = {
    "static":  {"multiplier": 1.0, "label": "Static Pin",   "tip": "Best for infographics and quotes."},
    "video":   {"multiplier": 2.2, "label": "Video Pin",    "tip": "Video pins get 9x more comments."},
    "idea":    {"multiplier": 2.8, "label": "Idea Pin",     "tip": "Idea pins get the most organic reach."},
    "carousel":{"multiplier": 1.8, "label": "Carousel Pin", "tip": "Carousels keep users engaged longer."},
}


@router.get("/predict")
async def predict_viral(user_id: str, topic: str = "", pin_format: str = "static"):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Pinterest not connected")

    followers   = acc.get("followers", 500)
    topic_lower = topic.lower()
    fmt         = PIN_FORMATS.get(pin_format, PIN_FORMATS["static"])

    if followers >= 50_000:  base = 50
    elif followers >= 10_000: base = 40
    elif followers >= 1_000:  base = 30
    elif followers >= 100:    base = 20
    else:                     base = 15

    hook_bonus     = min(sum(v for k, v in VIRAL_HOOKS.items() if k in topic_lower), 35)
    length_bonus   = 8 if 40 <= len(topic) <= 100 else (4 if len(topic) < 40 else 2)
    question_bonus = 5 if "?" in topic else 0
    number_bonus   = 6 if any(c.isdigit() for c in topic) else 0
    format_bonus   = int(fmt["multiplier"] * 8)
    virality       = min(base + hook_bonus + length_bonus + question_bonus + number_bonus + format_bonus, 98)

    reach_mult    = fmt["multiplier"] * (1 + (virality / 100) * 4)
    est_impressions = int(followers * reach_mult * random.uniform(3, 8))
    est_saves     = int(est_impressions * random.uniform(0.04, 0.10))
    est_clicks    = int(est_impressions * random.uniform(0.02, 0.06))
    est_outbound  = int(est_impressions * random.uniform(0.01, 0.03))
    est_follows   = int(est_impressions * random.uniform(0.002, 0.008))

    next_target = next((m for m in [100,500,1000,5000,10000,50000,100000] if m > followers), None)
    months_to   = None
    if next_target:
        monthly   = max(est_follows * 4, 5)
        months_to = min(math.ceil((next_target - followers) / monthly), 36)

    if virality >= 70:
        rec = "🔥 Strong viral potential! Post as an Idea Pin and add to your top 3 boards."
    elif virality >= 50:
        rec = f"📈 Good topic. Try as a {fmt['label']} with keyword-rich description."
    else:
        rec = "💡 Add 'How to', 'Free', or numbers to your title to boost saves."

    return {
        "virality_score":      virality,
        "pin_format":          fmt["label"],
        "format_tip":          fmt["tip"],
        "estimated_impressions": est_impressions,
        "estimated_saves":     est_saves,
        "estimated_clicks":    est_clicks,
        "estimated_outbound":  est_outbound,
        "estimated_follows":   est_follows,
        "next_milestone":      {"target": next_target, "months": months_to} if next_target else None,
        "recommendation":      rec,
        "best_post_time":      random.choice(BEST_TIMES),
        "tip":                 random.choice(PIN_TIPS),
        "breakdown": {
            "hook_strength":    min(hook_bonus * 3, 100),
            "audience_reach":   min(int(followers / 100), 100),
            "content_format":   min(format_bonus * 4, 100),
            "timing_potential": 80,
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
        raise HTTPException(404, "Pinterest not connected")

    followers = acc.get("followers", 500)
    seed      = hash(acc.get("username", "u")) % 100

    return {
        "top_locations": [
            {"city": "Mumbai",    "pct": 16 + seed % 5},
            {"city": "Delhi",     "pct": 14 + seed % 4},
            {"city": "Bangalore", "pct": 11 + seed % 3},
            {"city": "Pune",      "pct": 8},
            {"city": "Others",    "pct": max(51 - seed % 6, 15)},
        ],
        "age_groups": [
            {"group": "18–24", "pct": 32},
            {"group": "25–34", "pct": 35},
            {"group": "35–44", "pct": 20},
            {"group": "45+",   "pct": 13},
        ],
        "gender":      {"female": 78 + seed % 8, "male": 22 - seed % 8},
        "peak_hours": [
            {"hour": "2 PM",  "activity": 55},
            {"hour": "6 PM",  "activity": 72},
            {"hour": "8 PM",  "activity": 95},
            {"hour": "10 PM", "activity": 88},
            {"hour": "11 PM", "activity": 60},
        ],
        "top_interests":   ["DIY & Crafts", "Food & Recipes", "Fashion", "Home Decor", "Travel"],
        "follower_growth": [
            {"week": f"W{i+1}", "followers": max(0, followers - (7 - i) * int(followers * 0.03))}
            for i in range(8)
        ],
        "note": "Pinterest audience is 78% female globally — tailor content accordingly.",
        "is_mock": True,
    }


# ══════════════════════════════════════════════════════════════════════
# BEST TIME TO POST
# ══════════════════════════════════════════════════════════════════════

@router.get("/best-time")
async def get_best_time(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Pinterest not connected")

    seed   = hash(acc.get("username", "u")) % 100
    days_l = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    heatmap = []

    for di, day in enumerate(days_l):
        for hour in range(24):
            base = 12
            if 14 <= hour <= 16: base = 65 + seed % 15
            elif 19 <= hour <= 22: base = 90 + seed % 10
            elif 23 == hour:     base = 60 + seed % 15
            elif hour < 7:       base = 8
            # Pinterest peaks strongly on weekends
            if di >= 5: base = int(base * 1.35)
            heatmap.append({
                "day":   day,
                "hour":  hour,
                "score": min(max(base + random.randint(-8, 8), 5), 100),
            })

    return {
        "heatmap": heatmap,
        "top_slots": [
            {"day": "Saturday",  "time": "9:00 PM IST", "score": 97},
            {"day": "Sunday",    "time": "8:00 PM IST", "score": 94},
            {"day": "Friday",    "time": "9:00 PM IST", "score": 88},
            {"day": "Wednesday", "time": "8:00 PM IST", "score": 82},
        ],
        "timezone": "IST",
        "insight":  "Pinterest users browse most on Saturday evenings — ideal for Indian lifestyle/creator content.",
    }


# ══════════════════════════════════════════════════════════════════════
# BENCHMARK
# ══════════════════════════════════════════════════════════════════════

@router.get("/benchmark")
async def get_benchmark(user_id: str):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Pinterest not connected")

    followers = acc.get("followers", 500)

    def tier(f):
        if f < 500:    return "Nano"
        if f < 5000:   return "Micro"
        if f < 50000:  return "Mid"
        if f < 500000: return "Macro"
        return "Mega"

    t = tier(followers)
    benchmarks = {
        "Nano":  {"avg_monthly_impressions": 5000,    "avg_saves_per_pin": 8,   "avg_clicks_per_pin": 4,   "avg_eng_rate": 4.2},
        "Micro": {"avg_monthly_impressions": 45000,   "avg_saves_per_pin": 55,  "avg_clicks_per_pin": 28,  "avg_eng_rate": 3.8},
        "Mid":   {"avg_monthly_impressions": 380000,  "avg_saves_per_pin": 280, "avg_clicks_per_pin": 140, "avg_eng_rate": 2.9},
        "Macro": {"avg_monthly_impressions": 2800000, "avg_saves_per_pin": 1800,"avg_clicks_per_pin": 900, "avg_eng_rate": 2.1},
        "Mega":  {"avg_monthly_impressions": 15000000,"avg_saves_per_pin": 8500,"avg_clicks_per_pin": 4200,"avg_eng_rate": 1.5},
    }
    tier_max = {"Nano": 500, "Micro": 5000, "Mid": 50000, "Macro": 500000, "Mega": 5000000}

    return {
        "your_tier":       t,
        "your_followers":  followers,
        "benchmark":       benchmarks[t],
        "your_percentile": min(int((followers / tier_max[t]) * 100), 99),
        "growth_tip":      f"{t} Pinterest creators grow fastest by posting 10+ pins/day across multiple boards. Idea Pins drive the most new followers.",
    }


# ══════════════════════════════════════════════════════════════════════
# PUBLISH PIN
# ══════════════════════════════════════════════════════════════════════

@router.post("/publish")
async def publish(user_id: str, payload: dict):
    acc = _get_account(user_id)
    if not acc:
        raise HTTPException(404, "Pinterest not connected")

    title       = payload.get("title", "").strip()
    description = payload.get("description", "").strip()
    image_url   = payload.get("image_url", "").strip()
    board_id    = payload.get("board_id", "").strip()
    link        = payload.get("link", "https://sociomee.in").strip()

    if not title:
        raise HTTPException(400, "title is required")
    if not image_url:
        raise HTTPException(400, "image_url is required")
    if not board_id:
        raise HTTPException(400, "board_id is required")

    token = acc["access_token"]

    async with httpx.AsyncClient() as client:
        r = await client.post(
            "https://api.pinterest.com/v5/pins",
            json={
                "title":       title,
                "description": description,
                "link":        link,
                "board_id":    board_id,
                "media_source": {
                    "source_type": "image_url",
                    "url":         image_url,
                },
            },
            headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        )
    if r.status_code not in (200, 201):
        raise HTTPException(400, f"Pin creation failed: {r.text}")

    pin_id   = r.json().get("id", "")
    username = acc.get("username", "")
    return {
        "success": True,
        "pin_id":  pin_id,
        "url":     f"https://www.pinterest.com/pin/{pin_id}/",
        "message": "Pin published successfully!",
    }