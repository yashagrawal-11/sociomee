"""
seo_engine.py - Title generation and SEO scoring for SocioMee content.
Works fully offline (template-based) with no API calls required; if Gemini
is available, it's used to generate richer title candidates on top of the
template ones before scoring.
"""
import re
from typing import Any, Dict, List

POWER_WORDS = {
    "secret","shocking","truth","nobody","mistake","never","always","exposed",
    "revealed","banned","warning","real","actually","finally","stop","wrong",
    "proof","facts","why","how","best","worst","ultimate","insane","crazy",
}

TEMPLATES = [
    "{n} {topic} Facts Nobody Talks About",
    "The Truth About {topic} Nobody Tells You",
    "Why {topic} Is Not What You Think",
    "{n} {topic} Mistakes Everyone Makes",
    "I Was Wrong About {topic} - Here Is Why",
    "{topic}: What Actually Happened",
    "The {topic} Secret Everyone Is Missing",
    "{n} Things About {topic} That Will Surprise You",
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


def generate_seo(topic: str, youtube_data: Dict[str, Any] = None, persona: Dict[str, Any] = None) -> Dict[str, Any]:
    """
    Generates and scores candidate titles for a topic. Never raises - falls
    back to a single basic title if anything goes wrong.
    """
    try:
        youtube_data = youtube_data or {}
        trending_keywords = [k.lower() for k in youtube_data.get("keywords", [])][:10]
        topic_clean = topic.strip()

        candidates = []
        for tpl in TEMPLATES:
            for n in (3, 5, 7):
                if "{n}" in tpl:
                    candidates.append(tpl.format(n=n, topic=topic_clean))
                else:
                    candidates.append(tpl.format(topic=topic_clean))
                    break

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
