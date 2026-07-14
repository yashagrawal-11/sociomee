"""
seo_engine.py - AI-powered title generation and SEO scoring for SocioMee.
Uses Gemini to generate topic-aware, genuinely varied title candidates.
Falls back to templates only if Gemini is unavailable.
"""
import re, os, json, requests, warnings, hashlib
from typing import Any, Dict, List
from functools import lru_cache

# Simple title cache to avoid repeated API calls for same topic
_title_cache = {}

# Initialize Vertex AI once at module load
os.environ.setdefault('GOOGLE_APPLICATION_CREDENTIALS', '/var/www/sociomee/backend/sociomee-auth-key.json')
try:
    import vertexai as _VERTEXAI
    _VERTEXAI.init(project='sociomee-auth', location='us-central1')
    from vertexai.generative_models import GenerativeModel as _VertexModel, GenerationConfig as _VertexConfig
    _VERTEX_READY = True
except Exception as _ve:
    _VERTEX_READY = False

POWER_WORDS = {
    "secret","shocking","truth","nobody","mistake","never","always","exposed",
    "revealed","banned","warning","real","actually","finally","stop","wrong",
    "proof","facts","why","how","best","worst","ultimate","insane","crazy",
}

FALLBACK_TEMPLATES = [
    "{topic}: What Actually Matters",
    "The Reality Behind {topic}",
    "Everything You Need to Know About {topic}",
    "{topic}: A Complete Breakdown",
    "Understanding {topic} Better",
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
    if not _VERTEX_READY:
        return []
    # Check cache first
    _cache_key = hashlib.md5(f"{topic}".encode()).hexdigest()
    if _cache_key in _title_cache:
        return _title_cache[_cache_key]
    persona_name = (persona or {}).get("name", "default") if persona else "default"
    trending_str = ", ".join((trending_keywords or [])[:5]) or "none"
    prompt = f"""You are a YouTube title expert. Write 8 DISTINCT title options for this video topic.

VIDEO TOPIC: "{topic}"

STRICT RULES:
1. Every title must be UNIQUE in structure and angle — no two titles should use the same formula
2. Titles must reflect genuine understanding of the topic — not just wrap the keywords in filler
3. NEVER repeat the topic keyword more than once in a title
4. NEVER start two titles with the same word
5. Use specific angles: economic comparison, historical context, policy difference, surprising stat, etc.
6. Mix formats naturally: question, bold claim, contrast, number (only if genuinely relevant), statement
7. Each title 45 to 65 characters
8. NO templates like "X Facts Nobody Talks About", "What You Think", "What Actually Happened" unless the topic genuinely warrants them
9. Titles should feel like they were written by someone who deeply understands this specific topic

Return ONLY a valid JSON array of 8 short strings. Max 55 characters per title. No markdown, no backticks, no explanation. Start your response with [ and end with ]:
["title 1", "title 2", "title 3", "title 4", "title 5", "title 6", "title 7", "title 8"]"""

    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            _m = _VertexModel('gemini-2.5-flash')
            _resp = _m.generate_content(prompt, generation_config=_VertexConfig(max_output_tokens=4000, temperature=0.9))
            raw = _resp.text.strip()
        raw = raw.replace("```json","").replace("```","").strip()
        start = raw.find("[")
        end = raw.rfind("]") + 1
        if start >= 0 and end > start:
            raw = raw[start:end]
        titles = json.loads(raw)
        if isinstance(titles, list):
            result = [str(t).strip() for t in titles if t and len(str(t).strip()) > 10][:8]
            if result:
                _title_cache[_cache_key] = result
            return result
    except Exception as e:
        import logging
        logging.getLogger("seo_engine").warning("Title generation failed: %s", e, exc_info=True)
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
