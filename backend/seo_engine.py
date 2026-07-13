"""
seo_engine.py - AI-powered title generation and SEO scoring for SocioMee.
Uses Gemini to generate topic-aware, genuinely varied title candidates.
Falls back to templates only if Gemini is unavailable.
"""
import re, os, json, requests
from typing import Any, Dict, List

POWER_WORDS = {
    "secret","shocking","truth","nobody","mistake","never","always","exposed",
    "revealed","banned","warning","real","actually","finally","stop","wrong",
    "proof","facts","why","how","best","worst","ultimate","insane","crazy",
}

FALLBACK_TEMPLATES = [
    "{topic}: The Real Story",
    "Why {topic} Is Not What You Think",
    "The Truth About {topic}",
    "What Nobody Tells You About {topic}",
    "{topic}: What Actually Happened",
]

def _score_title(title: str, topic: str, trending_keywords: List[str]) -> Dict[str, Any]:
    t = title.lower()
    topic_words = set(re.findall(r"[a-z0-9']+", topic.lower()))
    signals = {
        "good_length": 40 <= len(title) <= 70,
        "has_number": bool(re.search(r"\d", title)),
        "has_topic_keyword": any(w in t for w in topic_words if len(w) > 2),
        "has_power_word": any(pw in t for pw in POWER_WORDS),
        "not_spammy_caps": title != title.upper(),
        "strong_opener": not t.startswith(("the ", "a ", "an ")) or bool(re.match(r"^(the|a|an)\s+\d", t)),
        "trending_overlap": any(kw in t for kw in trending_keywords),
        "reasonable_word_count": 5 <= len(title.split()) <= 14,
    }
    score = round(100 * sum(signals.values()) / len(signals))
    tips = [k.replace("_", " ") for k, v in signals.items() if not v]
    grade = "A" if score >= 80 else "B" if score >= 60 else "C" if score >= 40 else "D"
    return {"title": title, "score": score, "grade": grade, "tips": tips, "signals": signals}


def _gemini_titles(topic: str, persona: Dict[str, Any] = None, trending_keywords: List[str] = None) -> List[str]:
    gemini_key = os.getenv("GOOGLE_API_KEY", os.getenv("GOOGLE_AI_API_KEY", ""))
    if not gemini_key:
        return []
    persona_name = (persona or {}).get("name", "default") if persona else "default"
    trending_str = ", ".join((trending_keywords or [])[:5]) or "none"
    prompt = f"""Generate 8 YouTube video title candidates for this topic: "{topic}"

Creator persona: {persona_name}
Trending keywords to consider: {trending_str}

Rules for titles:
- Each title must be genuinely specific to THIS exact topic — not a generic template
- Titles should reflect what the video is actually about, not just wrap the topic in filler words
- Vary the approach: use curiosity gaps, specific claims, surprising angles, contrast, bold statements
- Mix formats: some with numbers (use specific relevant numbers, not just 3/5/7), some without
- 45-70 characters each ideally
- NO generic filler like "Facts Nobody Talks About" or "Mistakes Everyone Makes" unless truly relevant
- Make each title feel like it was written specifically for this topic by someone who understands it
- Titles should make someone who knows the topic say "yes that is exactly what this is about"

Return ONLY a JSON array of 8 title strings, nothing else. Example format:
["Title one here", "Title two here", ...]"""

    try:
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={gemini_key}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"maxOutputTokens": 800, "temperature": 0.9, "thinkingConfig": {"thinkingBudget": 0}}
            },
            timeout=20
        )
        data = resp.json()
        if "candidates" not in data:
            return []
        raw = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        raw = raw.replace("```json", "").replace("```", "").strip()
        titles = json.loads(raw)
        if isinstance(titles, list):
            return [str(t).strip() for t in titles if t and len(str(t).strip()) > 10][:8]
    except Exception as e:
        import logging
        logging.getLogger("seo_engine").warning("Gemini title generation failed: %s", e)
    return []


def generate_seo(topic: str, youtube_data: Dict[str, Any] = None, persona: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Generates and scores candidate titles for a topic.
    Uses Gemini for topic-aware titles, falls back to templates if unavailable.
    """
    try:
        youtube_data = youtube_data or {}
        trending_keywords = [k.lower() for k in youtube_data.get("keywords", [])][:10]
        topic_clean = topic.strip()

        # Try Gemini first for real topic-aware titles
        candidates = _gemini_titles(topic_clean, persona, trending_keywords)

        # Fall back to templates only if Gemini failed
        if not candidates:
            for tpl in FALLBACK_TEMPLATES:
                candidates.append(tpl.format(topic=topic_clean))

        seen = set()
        unique_candidates = []
        for c in candidates:
            if c not in seen:
                seen.add(c)
                unique_candidates.append(c)

        scored = [_score_title(c, topic_clean, trending_keywords) for c in unique_candidates]
        scored.sort(key=lambda x: -x["score"])
        top = scored[:5]

        return {
            "titles": [s["title"] for s in top],
            "scores": top,
            "best_title": top[0]["title"] if top else topic_clean,
            "best_score": top[0]["score"] if top else 0,
            "yt_keywords": trending_keywords,
        }
    except Exception:
        return {"titles": [topic], "scores": [], "best_title": topic, "best_score": 0, "yt_keywords": []}
