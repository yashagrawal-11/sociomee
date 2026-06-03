from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
import os, httpx

router = APIRouter(prefix="/festivals", tags=["festivals"])

IST = timezone(timedelta(hours=5, minutes=30))

FESTIVAL_META = {
    "Holi":               {"emoji":"🎨","color":"#ff6b35","topics":["Holi celebration vlog","Holi makeup tutorial","Holi food recipes","Holi prank","Holi party ideas"]},
    "Eid ul-Fitr":        {"emoji":"🌙","color":"#00c853","topics":["Eid special vlog","Eid outfit ideas","Eid recipes","Eid Mubarak wishes","Eid celebration"]},
    "Eid al-Fitr":        {"emoji":"🌙","color":"#00c853","topics":["Eid special vlog","Eid outfit ideas","Eid recipes","Eid Mubarak wishes","Eid celebration"]},
    "Ram Navami":         {"emoji":"🙏","color":"#ff9500","topics":["Ram Navami special","Bhajan compilation","Ram Navami recipes","Ram katha"]},
    "Akshaya Tritiya":    {"emoji":"🪙","color":"#ffd700","topics":["Gold buying guide India","Akshaya Tritiya tips","Best gold investment","Dhanteras vs Akshaya Tritiya"]},
    "Mother's Day":       {"emoji":"💐","color":"#ff69b4","topics":["Mother's Day special vlog","Gift ideas for mom","Mom surprise video","Mother's Day cooking","Emotional mom video"]},
    "Eid ul-Adha":        {"emoji":"🌙","color":"#00c853","topics":["Eid ul-Adha vlog","Eid recipes","Bakra Eid celebration","Eid traditions India"]},
    "Eid al-Adha":        {"emoji":"🌙","color":"#00c853","topics":["Eid ul-Adha vlog","Eid recipes","Bakra Eid celebration","Eid traditions India"]},
    "Independence Day":   {"emoji":"🇮🇳","color":"#ff9500","topics":["Independence Day special","Desh bhakti songs","Freedom fighters story","15 August vlog"]},
    "Raksha Bandhan":     {"emoji":"🪢","color":"#ff6b9d","topics":["Rakhi gift ideas","Raksha Bandhan vlog","DIY Rakhi making","Brother sister bond","Rakhi celebration"]},
    "Janmashtami":        {"emoji":"🦚","color":"#4caf50","topics":["Janmashtami special","Krishna bhajan","Dahi Handi vlog","Janmashtami decoration","Lord Krishna stories"]},
    "Ganesh Chaturthi":   {"emoji":"🐘","color":"#ff6b35","topics":["Ganesh Chaturthi decoration","Eco-friendly Ganpati","Modak recipe","Ganpati visarjan","10 day celebration"]},
    "Navratri":           {"emoji":"🪔","color":"#ff4081","topics":["Navratri garba dance","Navratri outfit ideas","Navratri fasting recipes","Dandiya night vlog","9 days special"]},
    "Dussehra":           {"emoji":"🏹","color":"#ff6b35","topics":["Dussehra celebration vlog","Ravana dahan","Good over evil","Dussehra special","Ramlila highlights"]},
    "Karva Chauth":       {"emoji":"🌕","color":"#ffd700","topics":["Karva Chauth makeup","Karva Chauth outfit","Thali decoration ideas","Karva Chauth vlog","Sargi recipes"]},
    "Dhanteras":          {"emoji":"🪙","color":"#ffd700","topics":["Dhanteras shopping guide","What to buy on Dhanteras","Gold vs silver Dhanteras","Dhanteras puja vidhi"]},
    "Diwali":             {"emoji":"🪔","color":"#ff9500","topics":["Diwali decoration ideas","Diwali outfit","Diwali sweets recipe","Diwali vlog","Diwali rangoli","Diwali puja"]},
    "Diwali/Deepavali":   {"emoji":"🪔","color":"#ff9500","topics":["Diwali decoration ideas","Diwali outfit","Diwali sweets recipe","Diwali vlog","Diwali rangoli"]},
    "Bhai Dooj":          {"emoji":"❤️","color":"#e91e63","topics":["Bhai Dooj gift ideas","Brother sister vlog","Bhai Dooj celebration","Tilak ceremony"]},
    "Chhath Puja":        {"emoji":"☀️","color":"#ff9500","topics":["Chhath Puja vlog","Thekua recipe","Arghya ghat celebration","Chhath Puja traditions","Sunrise prayer"]},
    "Guru Nanak Jayanti": {"emoji":"🙏","color":"#ff9500","topics":["Gurpurab special","Gurbani shabads","Langar recipes","Sikh traditions","Waheguru shabad"]},
    "Guru Nanak's Birthday":{"emoji":"🙏","color":"#ff9500","topics":["Gurpurab special","Gurbani shabads","Langar recipes","Sikh traditions"]},
    "Christmas":          {"emoji":"🎄","color":"#00c853","topics":["Christmas decoration India","Christmas gift ideas","Christmas recipes","Christmas vlog","Secret Santa ideas"]},
    "Christmas Day":      {"emoji":"🎄","color":"#00c853","topics":["Christmas decoration India","Christmas gift ideas","Christmas recipes","Christmas vlog","Secret Santa ideas"]},
    "New Year's Day":     {"emoji":"🎆","color":"#7c3aed","topics":["New Year resolutions","New Year party ideas","Best of last year recap","New Year countdown vlog","Goals"]},
    "Republic Day":       {"emoji":"🇮🇳","color":"#ff9500","topics":["Republic Day special","India constitution facts","Patriotic songs","26 January parade","Republic Day speech"]},
    "Valentine's Day":    {"emoji":"❤️","color":"#e91e63","topics":["Valentine's Day gifts India","Valentine's vlog","Date ideas India","Valentine's makeup","Couple goals"]},
    "Makar Sankranti":    {"emoji":"🪁","color":"#ffd700","topics":["Makar Sankranti kite flying","Tilgul recipe","Sankranti vlog","Pongal special","Lohri celebration"]},
    "Pongal":             {"emoji":"🌾","color":"#ff9500","topics":["Pongal recipe","Pongal celebration vlog","South Indian festival","Pongal decoration","Harvest festival"]},
    "Lohri":              {"emoji":"🔥","color":"#ff6b35","topics":["Lohri celebration vlog","Lohri bonfire","Punjabi festival","Lohri songs","Lohri food"]},
    "Maha Shivratri":     {"emoji":"🔱","color":"#7c3aed","topics":["Maha Shivratri special","Shiv bhajan","Shivratri fasting","Bholenath special","Shivratri vlog"]},
    "Ugadi":              {"emoji":"🌸","color":"#4caf50","topics":["Ugadi celebration","Ugadi pachadi recipe","Telugu New Year","Kannada New Year","Ugadi vlog"]},
    "Gudi Padwa":         {"emoji":"🏳️","color":"#ff9500","topics":["Gudi Padwa celebration","Marathi New Year","Gudi Padwa decoration","Shrikhand recipe","Maharashtrian festival"]},
    "Baisakhi":           {"emoji":"🌾","color":"#ffd700","topics":["Baisakhi celebration","Punjabi harvest festival","Baisakhi dance","Baisakhi vlog","Sikh New Year"]},
    "Onam":               {"emoji":"🌺","color":"#4caf50","topics":["Onam celebration","Onam sadhya recipe","Kerala festival","Onam pookalam","Thrikkakara special"]},
    "Durga Puja":         {"emoji":"🙏","color":"#ff4081","topics":["Durga Puja pandal","Bengali festival","Durga Puja vlog","Sindur khela","Ashtami special"]},
    "Muharram":           {"emoji":"🌙","color":"#1a1a2e","topics":["Muharram procession","Islamic New Year","Muharram significance","Ashura special"]},
    "Ambedkar Jayanti":   {"emoji":"📚","color":"#1565c0","topics":["Ambedkar Jayanti special","Dr BR Ambedkar life","Constitution of India","Social justice vlog"]},
    "Gandhi Jayanti":     {"emoji":"🕊️","color":"#ff9500","topics":["Gandhi Jayanti special","Mahatma Gandhi life","Non-violence message","October 2 special"]},
    "Rath Yatra":              {"emoji":"🎡","color":"#ff6b35","topics":["Rath Yatra Puri","Jagannath special","Rath Yatra vlog","Chariot festival","Odisha festival"]},
    "Rabindranath Tagore Jayanti": {"emoji":"✍️","color":"#7c4f9e","topics":["Rabindranath Tagore Jayanti special","Tagore poems","Bengali culture","Rabindra Sangeet","Tagore philosophy"]},
    "Milad un-Nabi":           {"emoji":"🌙","color":"#00c853","topics":["Milad un-Nabi special","Prophet birthday","Islamic celebration","Eid Milad vlog"]},
    "Bakrid":                  {"emoji":"🌙","color":"#00c853","topics":["Eid ul-Adha vlog","Eid recipes","Bakra Eid celebration","Eid traditions India"]},
    "Mahatma Gandhi Jayanti":  {"emoji":"🕊️","color":"#ff9500","topics":["Gandhi Jayanti special","Mahatma Gandhi life","Non-violence message","October 2 special"]},
}

DEFAULT_META = {"emoji":"🎉","color":"#7c3aed","topics":["Festival special vlog","Celebration ideas","Festival traditions","Festival food","Festival decoration"]}

FALLBACK_FESTIVALS = [
    {"name":"Republic Day",      "date":"2026-01-26"},
    {"name":"Valentine's Day",   "date":"2026-02-14"},
    {"name":"Holi",              "date":"2026-03-04"},
    {"name":"Ram Navami",        "date":"2026-03-26"},
    {"name":"Eid al-Fitr",       "date":"2026-03-30"},
    {"name":"Akshaya Tritiya",   "date":"2026-04-19"},
    {"name":"Mother's Day",      "date":"2026-05-10"},
    {"name":"Eid al-Adha",       "date":"2026-06-17"},
    {"name":"Independence Day",  "date":"2026-08-15"},
    {"name":"Raksha Bandhan",    "date":"2026-08-28"},
    {"name":"Janmashtami",       "date":"2026-09-04"},
    {"name":"Ganesh Chaturthi",  "date":"2026-09-14"},
    {"name":"Navratri",          "date":"2026-10-11"},
    {"name":"Dussehra",          "date":"2026-10-20"},
    {"name":"Karva Chauth",      "date":"2026-10-29"},
    {"name":"Guru Nanak Jayanti","date":"2026-11-05"},
    {"name":"Dhanteras",         "date":"2026-11-06"},
    {"name":"Diwali",            "date":"2026-11-08"},
    {"name":"Bhai Dooj",         "date":"2026-11-11"},
    {"name":"Chhath Puja",       "date":"2026-11-15"},
    {"name":"Christmas",         "date":"2026-12-25"},
    {"name":"New Year's Day",    "date":"2027-01-01"},
]

_cache = {"data": None, "fetched_at": None}
CACHE_TTL_HOURS = 24

# Override wrong Google Calendar names/dates with correct ones
FESTIVAL_OVERRIDES = {
    "Birthday of Rabindranath": {
        "name": "Rabindranath Tagore Jayanti",
        "date": "2026-05-07",
    },
}

def _enrich(name: str, date_str: str) -> dict:
    # Apply overrides for wrong Google Calendar data
    override = FESTIVAL_OVERRIDES.get(name, {})
    name = override.get("name", name)
    date_str = override.get("date", date_str)

    # Strip common suffixes Google Calendar adds
    clean = name.replace("(tentative)", "").replace("(regional holiday)", "").strip()
    meta = FESTIVAL_META.get(clean) or FESTIVAL_META.get(name)
    if not meta:
        for key in FESTIVAL_META:
            if key.lower() in clean.lower() or clean.lower() in key.lower():
                meta = FESTIVAL_META[key]
                break
    if not meta:
        meta = DEFAULT_META
    return {"name": name, "date": date_str, **meta}

def _fetch_from_google(api_key: str, year: int) -> list:
    calendar_id = "en.indian%23holiday%40group.v.calendar.google.com"
    url = (
        f"https://www.googleapis.com/calendar/v3/calendars/{calendar_id}/events"
        f"?key={api_key}"
        f"&timeMin={year}-01-01T00:00:00Z"
        f"&timeMax={year}-12-31T23:59:59Z"
        f"&singleEvents=true&orderBy=startTime&maxResults=100"
    )
    with httpx.Client(timeout=10) as client:
        resp = client.get(url)
        resp.raise_for_status()
        data = resp.json()

    festivals = []
    for item in data.get("items", []):
        name = item.get("summary", "").strip()
        start = item.get("start", {})
        date_str = start.get("date") or start.get("dateTime", "")[:10]
        if name and date_str:
            festivals.append(_enrich(name, date_str))
    return festivals


def _get_festivals_cached() -> list:
    now = datetime.now(IST)
    api_key = os.getenv("GOOGLE_CALENDAR_API_KEY", "")

    if (
        _cache["data"] is not None
        and _cache["fetched_at"] is not None
        and (now - _cache["fetched_at"]).total_seconds() < CACHE_TTL_HOURS * 3600
    ):
        return _cache["data"]

    if not api_key:
        print("[festivals] WARNING: No GOOGLE_CALENDAR_API_KEY — using fallback data")
        return [_enrich(f["name"], f["date"]) for f in FALLBACK_FESTIVALS]

    try:
        year = now.year
        festivals = _fetch_from_google(api_key, year)
        if now.month >= 11:
            festivals += _fetch_from_google(api_key, year + 1)
        print(f"[festivals] Fetched {len(festivals)} festivals from Google Calendar")
        _cache["data"] = festivals
        _cache["fetched_at"] = now
        return festivals
    except Exception as e:
        print(f"[festivals] Google Calendar API error: {e} — using fallback")
        fallback = [_enrich(f["name"], f["date"]) for f in FALLBACK_FESTIVALS]
        _cache["data"] = fallback
        _cache["fetched_at"] = now
        return fallback


@router.get("/upcoming")
def get_upcoming_festivals():
    now = datetime.now(IST)
    all_festivals = _get_festivals_cached()

    result = []
    for f in all_festivals:
        try:
            fest_date = datetime.strptime(f["date"], "%Y-%m-%d").replace(tzinfo=IST)
            diff = (fest_date.date() - now.date()).days
            if diff >= -3:
                result.append({**f, "daysUntil": diff})
        except ValueError:
            continue

    result.sort(key=lambda x: x["daysUntil"])
    return result[:12]
