"""
structure_engine.py — SocioMee Script Structure Engine
Converts research_data + youtube_data into a structured script outline.

Primary function:
    generate_structure(topic, research_data, youtube_data) -> dict

Uses DeepSeek when available, falls back to smart local builder
that produces specific, non-generic structure from topic keywords.

Returns:
{
    "hook":        str,
    "background":  str,
    "timeline":    [str, ...],
    "conflict":    str,
    "key_points":  [str, ...],
    "conclusion":  str,
}
"""

from __future__ import annotations

import json
import os
import re
from typing import Any, Dict, List, Optional

try:
    import requests as _requests
except ImportError:
    _requests = None

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


DEEPSEEK_API_KEY  = os.getenv("DEEPSEEK_API_KEY")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL    = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")


# ══════════════════════════════════════════════════════════════════════
# DEEPSEEK CLIENT
# ══════════════════════════════════════════════════════════════════════

def _deepseek_chat(messages: List[Dict[str, Any]], max_tokens: int = 1200) -> str:
    if not DEEPSEEK_API_KEY:
        raise RuntimeError("Missing DEEPSEEK_API_KEY")
    if _requests is None:
        raise RuntimeError("requests not installed")
    url = f"{DEEPSEEK_BASE_URL.rstrip('/')}/chat/completions"
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    payload = {"model": DEEPSEEK_MODEL, "messages": messages, "max_tokens": max_tokens, "temperature": 0.3}
    resp = _requests.post(url, headers=headers, json=payload, timeout=60)
    if resp.status_code != 200:
        raise RuntimeError(f"DeepSeek {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"]


def _extract_json(text: str) -> Dict[str, Any]:
    raw = re.sub(r"^```(?:json)?", "", (text or "").strip(), flags=re.MULTILINE).strip()
    raw = re.sub(r"```$", "", raw, flags=re.MULTILINE).strip()
    try:
        return json.loads(raw)
    except Exception:
        pass
    m = re.search(r"\{.*\}", raw, re.DOTALL)
    if m:
        try:
            return json.loads(m.group(0))
        except Exception:
            pass
    return {}


# ══════════════════════════════════════════════════════════════════════
# EVIDENCE FORMATTER
# ══════════════════════════════════════════════════════════════════════

def _format_evidence(topic: str, research_data: Dict, youtube_data: Dict) -> str:
    lines = [f"TOPIC: {topic}\n"]
    for item in research_data.get("timeline", [])[:5]:
        lines.append(f"TIMELINE: [{item.get('date','')[:10]}] {item.get('title','')} ({item.get('source','')})")
    for item in research_data.get("controversies", [])[:4]:
        lines.append(f"CONTROVERSY: {item.get('title','')} | {item.get('summary','')[:200]}")
    for item in research_data.get("key_events", [])[:4]:
        lines.append(f"KEY EVENT: {item.get('title','')} | {item.get('summary','')[:200]}")
    for item in research_data.get("insights", [])[:3]:
        lines.append(f"INSIGHT: {item.get('title','')} | {item.get('summary','')[:150]}")
    titles = youtube_data.get("titles", [])
    if titles:
        lines.append("\nYT TITLES: " + " | ".join(titles[:4]))
    kws = youtube_data.get("keywords", [])
    if kws:
        lines.append("YT KEYWORDS: " + ", ".join(kws[:12]))
    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════
# SMART LOCAL STRUCTURE BUILDER (no LLM needed)
# Produces specific, non-generic structure from topic + any available data
# ══════════════════════════════════════════════════════════════════════

def _smart_local_structure(topic: str, research_data: Dict, youtube_data: Dict) -> Dict[str, Any]:
    t              = topic.strip()
    tl             = t.lower()
    controversies  = research_data.get("controversies", [])
    key_events     = research_data.get("key_events",    [])
    timeline_items = research_data.get("timeline",      [])
    insights       = research_data.get("insights",      [])
    yt_keywords    = youtube_data.get("keywords",       [])
    yt_titles      = youtube_data.get("titles",         [])

    is_expose    = any(w in tl for w in ["exposed","scam","fraud","scandal","corrupt","leaked","banned","arrested","hindenburg"])
    is_business  = any(w in tl for w in ["business","startup","company","market","stock","ipo","deal","adani","ambani"])
    is_political = any(w in tl for w in ["politics","government","election","minister","policy","law","bjp","congress"])
    is_tech      = any(w in tl for w in ["ai","tech","app","software","gadget","phone","data","startup"])

    # ── Hook ──────────────────────────────────────────────────────────
    if controversies and controversies[0].get("title"):
        hook = controversies[0]["title"] + " — aur yeh sirf shuruat thi."
    elif yt_titles:
        hook = f"'{yt_titles[0]}' — yahi woh sawal hai jo log poochh rahe hain."
    elif is_expose:
        hook = f"Jab {t} ka sach saamne aaya, toh kaafi log chaunk gaye. Aaj woh poori picture dekhte hain."
    elif is_business:
        hook = f"{t} — ek aisi kahani jo numbers mein nahi, decisions mein likhi gayi hai."
    elif is_political:
        hook = f"{t} ne ek baar phir yeh sabit kar diya ki politics mein kuch bhi permanent nahi hota."
    else:
        hook = f"Aaj hum {t} ke us pehlu ko explore karenge jo zyaadatar coverage mein miss ho jaata hai."

    # ── Background ────────────────────────────────────────────────────
    if key_events and key_events[0].get("summary"):
        ev = key_events[0]
        background = f"{ev['title']}. {ev['summary'][:280]}. Yeh context {t} ko samajhne ke liye foundational hai."
    elif is_expose:
        background = (
            f"{t} ka background dekhein toh yeh ek aisa situation hai jahan surface pe sab normal lagta tha — "
            "lekin andar ki kahani bilkul alag thi. Jab investigators ne khodna shuru kiya, jo nikla woh unexpected tha. "
            "Is story ko chronologically samajhna zaroori hai taaki hum conclusions pe pahunchein."
        )
    elif is_business:
        background = (
            f"{t} ki shuruat ek simple idea se hui thi. Lekin jaise-jaise scale badha, complexity badhti gayi. "
            "Stakeholders badle, decisions zyada consequential ho gaye, aur yahi woh turning point tha "
            "jahan cheezein interesting — aur complicated — ho gayin."
        )
    else:
        background = (
            f"{t} ko samajhne ke liye hume context chahiye. "
            "Yeh topic sirf ek ghatna nahi hai — yeh ek pattern hai jo time ke saath develop hua. "
            "Iski roots trace karna zaroori hai taaki poori picture clear ho sake "
            "aur hum sahi conclusions tak pahunch sakein."
        )

    # ── Timeline ──────────────────────────────────────────────────────
    tl_items = []
    for item in timeline_items[:5]:
        date  = item.get("date", "")[:10]
        title = item.get("title", "")
        if title:
            tl_items.append(f"{date} — {title}" if date else title)
    if not tl_items and yt_titles:
        tl_items = [f"Context: {yt_titles[0]}"]
    if len(tl_items) < 4:
        if is_expose:
            extras = [
                f"Initial allegations surface regarding {t}",
                f"Investigation formally launched — {t} comes under scrutiny",
                f"Key evidence comes to light, changing public narrative",
                f"Regulatory and legal response begins",
                f"Long-term consequences start unfolding",
            ]
        else:
            extras = [
                f"Early developments in the {t} story",
                f"Major turning point that changed the direction of {t}",
                f"Key milestone or controversy shapes {t} trajectory",
                f"Public and stakeholder response escalates",
                f"Current status and ongoing implications of {t}",
            ]
        for e in extras:
            if len(tl_items) >= 5: break
            tl_items.append(e)

    # ── Conflict ──────────────────────────────────────────────────────
    if controversies and controversies[0].get("summary"):
        c = controversies[0]
        conflict = f"{c['title']}. {c['summary'][:280]}. Yahi woh core issue hai jisne {t} ko major talking point banaya."
    elif is_expose:
        conflict = (
            f"{t} mein sabse bada sawal yeh hai: kya jo dikhaya gaya, woh sach tha? "
            "Available reports ke mutabiq, kai aisa evidence mila jo original claims ko challenge karta hai. "
            "Regulatory bodies ne bhi interest liya — jo is situation ki seriousness ka indicator hai. "
            "Yeh conflict sirf ek news story nahi — yeh accountability ka ek deeper question hai."
        )
    elif is_business:
        conflict = (
            f"{t} ka core conflict yeh hai ki jo promises ki gayi theen aur jo deliver hua — dono mein gap tha. "
            "Investors, customers, aur employees — sabko is gap ka asar mehsoos hua. "
            "Yeh tension is story ka central thread hai jise hum iss video mein unpack karenge."
        )
    else:
        conflict = (
            f"{t} ke baare mein ek fundamental tension hai: log isse jo samajhte hain aur jo actually hota hai — dono alag hain. "
            "Yeh perception-reality gap hi is poori discussion ka core problem hai. "
            "Isko address kiye bina {t} ka honest analysis possible nahi hai."
        )

    # ── Key points ────────────────────────────────────────────────────
    key_points = []
    for item in insights[:3]:
        kp = item.get("title") or item.get("summary","")[:100]
        if kp:
            key_points.append(kp)
    useful_kw = [kw for kw in yt_keywords[:8] if len(kw) > 4 and kw.lower() not in tl][:2]
    for kw in useful_kw:
        key_points.append(f"{t} aur {kw} ka connection: ek important angle")
    defaults = [
        f"Evidence vs allegation: {t} mein kya prove hua, kya nahi — ek honest assessment",
        f"{t} ka public perception vs actual documented reality — comparison aur analysis",
        f"Key stakeholders aur unka role: decision-makers ki accountability",
        f"Regulatory aur systemic dimension: {t} ne existing structures ko kaise challenge kiya",
        f"Long-term impact: {t} ne industry, society, ya public discourse ko kaise shape kiya",
    ]
    for d in defaults:
        if len(key_points) >= 5: break
        key_points.append(d)

    # ── Conclusion ────────────────────────────────────────────────────
    conclusion = (
        f"{t} se jo lesson milta hai woh yeh hai ki information ka verification kabhi ignore nahi karna chahiye. "
        "Chahe yeh corporate controversy ho, political issue ho, ya social movement — har kahani ke multiple angles hain. "
        "Hum sab ki zimmedari hai ki hum sirf headlines pe nahi, balki evidence pe apni raay banayein. "
        f"Isliye {t} ek case study se zyada hai — yeh ek reminder hai ki critical thinking kitni zaroori hai."
    )

    return {
        "hook":       hook,
        "background": background,
        "timeline":   tl_items[:6],
        "conflict":   conflict,
        "key_points": key_points[:5],
        "conclusion": conclusion,
        "_source":    "smart_local_builder",
    }


# Keep alias
_offline_fallback = _smart_local_structure


# ══════════════════════════════════════════════════════════════════════
# MAIN FUNCTION
# ══════════════════════════════════════════════════════════════════════

def generate_structure(topic: str, research_data: Dict, youtube_data: Dict) -> Dict[str, Any]:
    topic = (topic or "").strip()
    if not topic:
        return {"hook":"","background":"","timeline":[],"conflict":"","key_points":[],"conclusion":""}

    evidence = _format_evidence(topic, research_data, youtube_data)

    # Use DeepSeek when available, otherwise smart local
    if not DEEPSEEK_API_KEY or _requests is None:
        return _smart_local_structure(topic, research_data, youtube_data)

    system_prompt = (
        "You are a senior investigative YouTube script strategist. "
        "Convert raw research data into a tight, logical, non-generic script outline. "
        "Every point must be fact-based and sourced from the evidence provided. "
        "Do not invent facts. Do not use generic filler. Output ONLY valid JSON."
    )
    user_prompt = f"""Convert this research into a structured YouTube script outline.

{evidence}

Rules:
- Use ONLY the evidence above for factual claims
- Hook: one specific, striking statement (not generic)
- Timeline: chronological events from evidence with dates
- Conflict: name the actual controversy with specifics
- Key points: each must introduce a NEW fact or angle
- Conclusion: real implication, not a vague moral
- No repetition across sections
- Uncertain facts: "according to reports"

Return ONLY this JSON schema (no markdown):
{{
  "hook":        "one strong opening statement",
  "background":  "2-3 sentences of context",
  "timeline":    ["event 1 with date", "event 2", "event 3", "event 4"],
  "conflict":    "2-3 sentences on the main controversy with specifics",
  "key_points":  ["point 1", "point 2", "point 3", "point 4", "point 5"],
  "conclusion":  "2-3 sentences on implications and takeaway"
}}"""

    try:
        raw    = _deepseek_chat([{"role":"system","content":system_prompt},{"role":"user","content":user_prompt}], max_tokens=1200)
        result = _extract_json(raw)
    except Exception:
        return _smart_local_structure(topic, research_data, youtube_data)

    # Validate and fill missing keys with smart local
    smart = _smart_local_structure(topic, research_data, youtube_data)
    output = {
        "hook":       result.get("hook")       or smart["hook"],
        "background": result.get("background") or smart["background"],
        "timeline":   result.get("timeline")   or smart["timeline"],
        "conflict":   result.get("conflict")   or smart["conflict"],
        "key_points": result.get("key_points") or smart["key_points"],
        "conclusion": result.get("conclusion") or smart["conclusion"],
    }
    if not isinstance(output["timeline"],   list): output["timeline"]   = [str(output["timeline"])]
    if not isinstance(output["key_points"], list): output["key_points"] = [str(output["key_points"])]
    output["timeline"]   = [str(x) for x in output["timeline"]   if x][:8]
    output["key_points"] = [str(x) for x in output["key_points"] if x][:6]
    return output