from fastapi import APIRouter
from datetime import datetime, timezone, timedelta
import json, os
from pathlib import Path

router = APIRouter(prefix="/festivals", tags=["festivals"])

# Festival dates by year - we update this file annually
# This is much better than hardcoding in frontend
FESTIVAL_DB = {
    2026: [
        {"name":"Holi",             "date":"2026-03-04", "emoji":"🎨", "color":"#ff6b35", "topics":["Holi celebration vlog","Holi makeup tutorial","Holi food recipes","Holi prank","Holi party ideas"]},
        {"name":"Eid ul-Fitr",      "date":"2026-03-30", "emoji":"🌙", "color":"#00c853", "topics":["Eid special vlog","Eid outfit ideas","Eid recipes","Eid Mubarak wishes","Eid celebration"]},
        {"name":"Ram Navami",       "date":"2026-03-26", "emoji":"🙏", "color":"#ff9500", "topics":["Ram Navami special","Bhajan compilation","Ram Navami recipes","Ram katha"]},
        {"name":"Akshaya Tritiya",  "date":"2026-04-19", "emoji":"🪙", "color":"#ffd700", "topics":["Gold buying guide India","Akshaya Tritiya tips","Best gold investment 2026","Dhanteras vs Akshaya Tritiya"]},
        {"name":"Mother's Day",     "date":"2026-05-10", "emoji":"💐", "color":"#ff69b4", "topics":["Mother's Day special vlog","Gift ideas for mom","Mom surprise video","Mother's Day cooking","Emotional mom video"]},
        {"name":"Bakra Eid",        "date":"2026-06-17", "emoji":"🌙", "color":"#00c853", "topics":["Eid ul-Adha vlog","Eid recipes","Bakra Eid celebration","Eid traditions India"]},
        {"name":"Independence Day", "date":"2026-08-15", "emoji":"🇮🇳", "color":"#ff9500", "topics":["Independence Day special","India 78 years","Desh bhakti songs","Freedom fighters story","15 August vlog"]},
        {"name":"Raksha Bandhan",   "date":"2026-08-28", "emoji":"🪢", "color":"#ff6b9d", "topics":["Rakhi gift ideas 2026","Raksha Bandhan vlog","DIY Rakhi making","Brother sister bond","Rakhi celebration"]},
        {"name":"Janmashtami",      "date":"2026-08-28", "emoji":"🦚", "color":"#4caf50", "topics":["Janmashtami special","Krishna bhajan","Dahi Handi vlog","Janmashtami decoration","Lord Krishna stories"]},
        {"name":"Ganesh Chaturthi", "date":"2026-09-14", "emoji":"🐘", "color":"#ff6b35", "topics":["Ganesh Chaturthi decoration","Eco-friendly Ganpati","Modak recipe","Ganpati visarjan","10 day celebration"]},
        {"name":"Navratri",         "date":"2026-10-11", "emoji":"🪔", "color":"#ff4081", "topics":["Navratri garba dance","Navratri outfit ideas","Navratri fasting recipes","Dandiya night vlog","9 days special"]},
        {"name":"Dussehra",         "date":"2026-10-20", "emoji":"🏹", "color":"#ff6b35", "topics":["Dussehra celebration vlog","Ravana dahan","Good over evil","Dussehra special","Ramlila highlights"]},
        {"name":"Karva Chauth",     "date":"2026-10-29", "emoji":"🌕", "color":"#ffd700", "topics":["Karva Chauth makeup","Karva Chauth outfit","Thali decoration ideas","Karva Chauth vlog","Sargi recipes"]},
        {"name":"Dhanteras",        "date":"2026-11-06", "emoji":"🪙", "color":"#ffd700", "topics":["Dhanteras shopping guide","What to buy on Dhanteras","Gold vs silver Dhanteras","Dhanteras puja vidhi"]},
        {"name":"Diwali",           "date":"2026-11-08", "emoji":"🪔", "color":"#ff9500", "topics":["Diwali decoration ideas","Diwali outfit 2026","Diwali sweets recipe","Diwali vlog","Diwali rangoli","Diwali puja"]},
        {"name":"Bhai Dooj",        "date":"2026-11-11", "emoji":"❤️", "color":"#e91e63", "topics":["Bhai Dooj gift ideas","Brother sister vlog","Bhai Dooj celebration","Tilak ceremony"]},
        {"name":"Chhath Puja",      "date":"2026-11-15", "emoji":"☀️", "color":"#ff9500", "topics":["Chhath Puja vlog","Thekua recipe","Arghya ghat celebration","Chhath Puja traditions","Sunrise prayer"]},
        {"name":"Guru Nanak Jayanti","date":"2026-11-05","emoji":"🙏", "color":"#ff9500", "topics":["Gurpurab special","Gurbani shabads","Langar recipes","Sikh traditions","Waheguru shabad"]},
        {"name":"Christmas",        "date":"2026-12-25", "emoji":"🎄", "color":"#00c853", "topics":["Christmas decoration India","Christmas gift ideas","Christmas recipes","Christmas vlog","Secret Santa ideas"]},
        {"name":"New Year 2027",    "date":"2027-01-01", "emoji":"🎆", "color":"#7c3aed", "topics":["New Year resolutions 2027","New Year party ideas","Best of 2026 recap","New Year countdown vlog","Goals 2027"]},
        {"name":"Republic Day",     "date":"2026-01-26", "emoji":"🇮🇳", "color":"#ff9500", "topics":["Republic Day special","India constitution facts","Patriotic songs","26 January parade","Republic Day speech"]},
        {"name":"Valentine's Day",  "date":"2026-02-14", "emoji":"❤️",  "color":"#e91e63", "topics":["Valentine's Day gifts India","Valentine's vlog","Date ideas India","Valentine's makeup","Couple goals"]},
    ],
    2027: [
        {"name":"Holi",             "date":"2027-03-22", "emoji":"🎨", "color":"#ff6b35", "topics":["Holi celebration vlog","Holi makeup tutorial","Holi food recipes","Holi prank","Holi party ideas"]},
        {"name":"Diwali",           "date":"2027-10-29", "emoji":"🪔", "color":"#ff9500", "topics":["Diwali decoration ideas","Diwali outfit 2027","Diwali sweets recipe","Diwali vlog","Diwali rangoli"]},
        {"name":"Independence Day", "date":"2027-08-15", "emoji":"🇮🇳", "color":"#ff9500", "topics":["Independence Day special","India facts","Desh bhakti songs","15 August vlog"]},
        {"name":"Christmas",        "date":"2027-12-25", "emoji":"🎄", "color":"#00c853", "topics":["Christmas decoration India","Christmas gift ideas","Christmas vlog"]},
        {"name":"Republic Day",     "date":"2027-01-26", "emoji":"🇮🇳", "color":"#ff9500", "topics":["Republic Day special","India constitution facts","26 January parade"]},
        {"name":"New Year 2028",    "date":"2028-01-01", "emoji":"🎆", "color":"#7c3aed", "topics":["New Year 2028 resolutions","New Year party","Best of 2027 recap"]},
    ]
}

@router.get("/upcoming")
def get_upcoming_festivals():
    now = datetime.now(timezone(timedelta(hours=5, minutes=30)))  # IST
    year = now.year
    all_festivals = FESTIVAL_DB.get(year, []) + FESTIVAL_DB.get(year + 1, [])
    result = []
    for f in all_festivals:
        fest_date = datetime.strptime(f["date"], "%Y-%m-%d").replace(tzinfo=timezone(timedelta(hours=5, minutes=30)))
        diff = (fest_date.date() - now.date()).days
        if diff >= -3:
            result.append({**f, "daysUntil": diff})
    result.sort(key=lambda x: x["daysUntil"])
    return result[:12]
