import json
import math
import random
import re
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from statistics import mean
from typing import Any, Dict, List, Optional


def _now_utc() -> datetime:
    return datetime.utcnow()


def _slug(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", text.lower())


def _words(text: str) -> List[str]:
    return [w for w in re.findall(r"[a-z0-9']+", text.lower()) if len(w) > 2]


def _safe_int(value: Any, default: int = 0) -> int:
    try:
        return int(float(value))
    except Exception:
        return default


@dataclass
class TopicRow:
    topic: str
    views: int
    likes: int
    comments: int
    saves: int = 0
    shares: int = 0
    posts: int = 1
    days_old: int = 7
    source: str = "manual"
    audio: str = ""
    caption: str = ""


class InstagramEngine:
    def __init__(self, cache_file: Optional[Path] = None) -> None:
        base_dir = Path(__file__).resolve().parent
        self.cache_file = Path(cache_file) if cache_file else base_dir / "instagram_brain_cache.json"
        self.state = self._load_state()

    # ── State / cache ──────────────────────────────────────
    def _load_state(self) -> Dict[str, Any]:
        if not self.cache_file.exists():
            return {"snapshots": []}
        try:
            raw = self.cache_file.read_text(encoding="utf-8").strip()
            if not raw:
                return {"snapshots": []}
            data = json.loads(raw)
            if isinstance(data, dict):
                if "snapshots" not in data or not isinstance(data["snapshots"], list):
                    data["snapshots"] = []
                return data
        except Exception:
            pass
        return {"snapshots": []}

    def _save_state(self) -> None:
        self.cache_file.write_text(json.dumps(self.state, indent=2), encoding="utf-8")

    # ── Row normalisation ──────────────────────────────────
    def _normalize_row(self, row: Any) -> TopicRow:
        if isinstance(row, TopicRow):
            return row
        if isinstance(row, dict):
            return TopicRow(
                topic=str(row.get("topic") or row.get("keyword") or row.get("title") or "unknown topic"),
                views=_safe_int(row.get("views") or row.get("view_count") or row.get("avg_views") or 0),
                likes=_safe_int(row.get("likes") or row.get("like_count") or row.get("avg_likes") or 0),
                comments=_safe_int(row.get("comments") or row.get("comment_count") or row.get("avg_comments") or 0),
                saves=_safe_int(row.get("saves") or row.get("save_count") or 0),
                shares=_safe_int(row.get("shares") or row.get("share_count") or 0),
                posts=_safe_int(row.get("posts") or row.get("post_count") or 1, 1),
                days_old=_safe_int(row.get("days_old") or row.get("age_days") or 7, 7),
                source=str(row.get("source") or "manual"),
                audio=str(row.get("audio") or row.get("sound") or ""),
                caption=str(row.get("caption") or ""),
            )
        return TopicRow(topic=str(row), views=10000, likes=800, comments=120, source="fallback")

    def _seed_rows(self, keyword: str, niche: str) -> List[TopicRow]:
        topics = [
            f"{keyword} mistakes",
            f"{keyword} tips",
            f"{keyword} tutorial",
            f"how to grow with {keyword}",
            f"{keyword} content ideas",
            f"{keyword} strategy",
            f"{keyword} before after",
            f"why {keyword} works",
        ]
        rows: List[TopicRow] = []
        for index, topic in enumerate(topics):
            rng = random.Random(_slug(topic))
            views    = rng.randint(8000, 320000)
            likes    = int(views * rng.uniform(0.03, 0.12))
            comments = int(views * rng.uniform(0.003, 0.02))
            saves    = int(views * rng.uniform(0.002, 0.01))
            shares   = int(views * rng.uniform(0.001, 0.007))
            days_old = rng.randint(1, 28)
            posts    = rng.randint(2, 9)
            audio    = rng.choice(["soft voice over bed", "upbeat pop loop", "cinematic rise",
                                   "lo fi groove", "clean beat drop"])
            rows.append(TopicRow(
                topic=topic, views=views, likes=likes, comments=comments,
                saves=saves, shares=shares, posts=posts, days_old=days_old,
                source="seed", audio=audio, caption=f"{niche} idea {index + 1}",
            ))
        return rows

    def _normalize_rows(self, keyword: str, niche: str, topic_rows: Optional[List[Any]]) -> List[TopicRow]:
        if topic_rows:
            return [self._normalize_row(row) for row in topic_rows]
        return self._seed_rows(keyword=keyword, niche=niche)

    # ── Scoring helpers ────────────────────────────────────
    def _engagement_rate(self, row: TopicRow) -> float:
        base = row.views if row.views > 0 else 1
        weighted = row.likes + (row.comments * 2) + (row.saves * 1.4) + (row.shares * 1.7)
        return (weighted / base) * 100.0

    def _velocity(self, row: TopicRow) -> float:
        return row.views / max(1, row.days_old)

    def _tone_boost(self, tone: str) -> int:
        return {"bold": 5, "funny": 4, "emotional": 5, "informative": 4, "soft": 3, "luxury": 3}.get(tone.lower(), 3)

    def _label(self, score: int, growth: float) -> str:
        if score >= 85 or growth >= 0.35: return "VIRAL"
        if score >= 72 or growth >= 0.22: return "HOT"
        if score >= 60 or growth >= 0.10: return "RISING"
        return "LOW"

    def _score_topic(self, row: TopicRow, keyword: str, tone: str) -> Dict[str, Any]:
        kw = keyword.lower().strip()
        topic_lower = row.topic.lower()
        token_count = len(_words(row.topic))
        engagement_rate = self._engagement_rate(row)
        velocity = self._velocity(row)
        momentum = min(25.0, math.log10(velocity + 1.0) * 6.0)

        keyword_boost = 0
        if kw and kw in topic_lower:
            keyword_boost += 8
        if any(word in topic_lower for word in _words(kw)):
            keyword_boost += 5
        if any(flag in topic_lower for flag in ["how to", "mistake", "tips", "strategy", "guide", "before after", "vs"]):
            keyword_boost += 4

        recency_boost = max(0.0, 18.0 - float(row.days_old))
        tone_boost = self._tone_boost(tone)

        final_score = 35.0
        final_score += min(20.0, momentum)
        final_score += min(20.0, engagement_rate * 1.2)
        final_score += min(10.0, token_count * 0.8)
        final_score += min(12.0, recency_boost * 0.6)
        final_score += keyword_boost
        final_score += tone_boost

        rng = random.Random(_slug(row.topic))
        final_score = max(0.0, min(100.0, final_score + rng.uniform(-2.0, 2.0)))

        growth_rate = 0.06 + (engagement_rate / 220.0) + (momentum / 180.0) + (max(0, 18 - row.days_old) / 220.0)
        growth_rate = max(-0.08, min(0.60, growth_rate))

        next_7d_views    = int(row.views   * (1.0 + growth_rate * 1.15))
        next_7d_likes    = int(row.likes   * (1.0 + growth_rate * 0.95))
        next_7d_comments = int(row.comments * (1.0 + growth_rate * 0.90))
        label = self._label(int(final_score), growth_rate)

        return {
            "topic": row.topic, "views": row.views, "likes": row.likes,
            "comments": row.comments, "saves": row.saves, "shares": row.shares,
            "posts": row.posts, "days_old": row.days_old, "source": row.source,
            "audio": row.audio, "caption": row.caption,
            "engagement_rate": round(engagement_rate, 2),
            "velocity": int(velocity), "momentum": round(momentum, 2),
            "growth_rate": round(growth_rate, 3), "final_score": int(round(final_score)),
            "label": label,
            "reason": "Strong engagement and recency" if label in {"VIRAL", "HOT"} else "Needs stronger hook or packaging",
            "forecast": {"7d_views": next_7d_views, "7d_likes": next_7d_likes, "7d_comments": next_7d_comments},
        }

    def _rank_topics(self, rows: List[TopicRow], keyword: str, tone: str) -> List[Dict[str, Any]]:
        scored = [self._score_topic(row, keyword=keyword, tone=tone) for row in rows]
        scored.sort(key=lambda item: (item["final_score"], item["views"], item["engagement_rate"]), reverse=True)
        for index, item in enumerate(scored, start=1):
            item["rank"] = index
        return scored

    def _validate_topics(self, rows: List[TopicRow]) -> Dict[str, Any]:
        avg_views    = int(mean([row.views    for row in rows]))
        avg_likes    = int(mean([row.likes    for row in rows]))
        avg_comments = int(mean([row.comments for row in rows]))
        avg_posts    = int(mean([row.posts    for row in rows]))
        thresholds = [
            {"metric": "avg_views",    "value": avg_views,    "threshold": 50000, "passed": avg_views    >= 50000},
            {"metric": "avg_likes",    "value": avg_likes,    "threshold": 5000,  "passed": avg_likes    >= 5000},
            {"metric": "avg_comments", "value": avg_comments, "threshold": 500,   "passed": avg_comments >= 500},
            {"metric": "avg_posts",    "value": avg_posts,    "threshold": 5,     "passed": avg_posts    >= 5},
        ]
        confirmed = sum(1 for item in thresholds if item["passed"])
        return {"thresholds": thresholds, "confirmed": confirmed, "total": len(thresholds),
                "status": "VALIDATED" if confirmed >= 3 else "NEEDS_MORE_DATA"}

    def _predict_board(self, ranked: List[Dict[str, Any]]) -> Dict[str, Any]:
        topic_predictions: List[Dict[str, Any]] = []
        viral_count = 0

        for item in ranked:
            growth_rate      = item["growth_rate"]
            current_views    = item["views"]
            current_likes    = item["likes"]
            current_comments = item["comments"]
            day_forecast = []
            for day in range(1, 8):
                day_boost = 1.0 + (growth_rate * (day / 7.0))
                day_forecast.append({
                    "day_offset": day,
                    "views":    int(current_views    * day_boost),
                    "likes":    int(current_likes    * (1.0 + (growth_rate * 0.85 * (day / 7.0)))),
                    "comments": int(current_comments * (1.0 + (growth_rate * 0.75 * (day / 7.0)))),
                })
            label = "VIRAL" if item["label"] in {"VIRAL", "HOT"} else "RISING" if growth_rate >= 0.12 else "LOW"
            if label in {"VIRAL", "HOT"}:
                viral_count += 1
            topic_predictions.append({
                "topic": item["topic"], "rank": item["rank"],
                "avg_views": item["views"], "avg_likes": item["likes"], "avg_comments": item["comments"],
                "signal": label, "forecast": day_forecast,
            })

        top_performer  = ranked[0] if ranked else {}
        overall_score  = int(mean([item["final_score"] for item in ranked])) if ranked else 0
        trend_label    = "PEAKING" if overall_score >= 80 else "RISING" if overall_score >= 68 else "STABLE"
        next_7d_score  = min(100, overall_score + 7 if trend_label in {"PEAKING", "RISING"} else overall_score + 2)

        return {
            "trend_label": trend_label, "current_score": overall_score, "next_7d_score": next_7d_score,
            "viral_confirmed": viral_count, "top_performer": top_performer,
            "topic_rankings": topic_predictions,
        }

    # ── Content builders ───────────────────────────────────
    def _build_hooks(self, keyword: str, trend_label: str) -> List[Dict[str, str]]:
        k = keyword.strip()
        base = [
            f"Nobody talks about this in {k}",
            f"I wish someone told me this sooner about {k}",
            f"Have you ever noticed how {k} creators grow faster",
            f"Here is the hard truth about {k}",
            f"Let me save you time on {k}",
            f"You might disagree, but this works for {k}",
            f"I just realized something about {k}",
            f"Stop scrolling if you post {k}",
            f"This is why your {k} is not growing",
            f"The biggest mistake in {k}",
        ]
        if trend_label == "PEAKING":  base[0] = f"{k} is peaking right now and most people are late"
        elif trend_label == "RISING": base[0] = f"This {k} angle is rising fast"
        elif trend_label == "STABLE": base[3] = f"Here is the cleanest {k} truth"
        patterns = ["Pain to curiosity", "Secret to value", "Observation to insight", "Truth to tension",
                    "Problem to solution", "Contrarian angle", "Realization hook", "Scroll stopper",
                    "Mistake fix", "Challenge hook"]
        return [{"label": f"HOOK {i + 1:02d}", "text": text, "pattern": patterns[i]} for i, text in enumerate(base)]

    def _build_reel_ideas(self, keyword: str, trend_label: str) -> List[str]:
        k = keyword.strip()
        ideas = [
            f"POV: you start {k} the wrong way",
            f"Before versus after results of {k}",
            f"Three mistakes ruining your {k}",
            f"Day 1 versus Day 30 of {k}",
            f"Things I wish I knew before {k}",
            f"Reacting to bad {k} advice",
            f"Testing viral {k} hacks",
            f"Reality of {k} no one shows",
            f"{k} myths versus truth",
            f"Do this, not that in {k}",
        ]
        if trend_label == "PEAKING":  ideas.insert(0, f"Why {k} is blowing up right now")
        elif trend_label == "RISING": ideas.insert(0, f"Be early on this {k} format")
        return ideas[:10]

    def _build_post_ideas(self, keyword: str) -> List[str]:
        k = keyword.strip()
        return [
            f"Carousel post with five steps to improve {k}",
            f"Single image quote post on the hardest {k} lesson",
            f"Mini checklist post for {k} creators",
            f"Story style post with a personal {k} mistake",
            f"FAQ post answering the top {k} question",
            f"Saveable summary post for {k} beginners",
        ]

    def _build_story_ideas(self, keyword: str, tone: str) -> List[str]:
        k = keyword.strip()
        return [
            f"Poll story: which {k} version do you prefer",
            f"Quiz story: test your {k} knowledge",
            f"Slider story: rate this {k} idea",
            f"Behind the scenes story of creating {k} content",
            f"Question box story: ask me anything about {k}",
            f"Countdown story for the next {k} post",
            f"Close friends teaser story for your best {k} tip",
        ]

    def _build_sounds(self, trend_label: str) -> List[Dict[str, Any]]:
        sounds = [
            {"sound": "soft voice over bed",  "why": "Best for tutorial reels",              "score": 84},
            {"sound": "upbeat pop loop",       "why": "Best for fast cuts and transitions",   "score": 82},
            {"sound": "cinematic rise",        "why": "Best for before and after reveals",    "score": 80},
            {"sound": "lo fi groove",          "why": "Best for aesthetic breakdown posts",   "score": 77},
            {"sound": "clean beat drop",       "why": "Best for punchy hook reveals",         "score": 79},
        ]
        if trend_label == "PEAKING": sounds[0]["score"] += 4
        if trend_label == "RISING":  sounds[1]["score"] += 3
        return sounds

    def _build_aesthetic_profile(self, niche: str) -> Dict[str, Any]:
        n = niche.lower()
        if any(w in n for w in ["beauty", "skincare", "fashion", "makeup", "glam"]):
            return {"theme": "soft luxury", "primary_color": "#F4E6EA", "secondary_color": "#121212",
                    "accent_color": "#D78CA4", "background_color": "#FFF9FB",
                    "font_style": "clean serif and modern sans mix", "grid_style": "airy, bright, premium",
                    "highlight_covers": ["Tips", "Results", "BTS", "FAQ", "Tools"]}
        if any(w in n for w in ["fitness", "gym", "workout", "health"]):
            return {"theme": "bold performance", "primary_color": "#101820", "secondary_color": "#F2F2F2",
                    "accent_color": "#FF6B4A", "background_color": "#FFFFFF",
                    "font_style": "strong sans serif", "grid_style": "high contrast, energetic, clean",
                    "highlight_covers": ["Training", "Nutrition", "Progress", "FAQ", "Plans"]}
        if any(w in n for w in ["gaming", "free fire", "bgmi", "pubg", "valorant"]):
            return {"theme": "neon gaming", "primary_color": "#121212", "secondary_color": "#EDEDED",
                    "accent_color": "#7C4DFF", "background_color": "#0B0B0F",
                    "font_style": "blocky bold sans", "grid_style": "dark, punchy, high energy",
                    "highlight_covers": ["Clips", "Loadout", "Wins", "Settings", "FAQ"]}
        if any(w in n for w in ["business", "finance", "marketing", "startup"]):
            return {"theme": "minimal authority", "primary_color": "#0E1A2B", "secondary_color": "#F7F7F7",
                    "accent_color": "#4DA3FF", "background_color": "#FFFFFF",
                    "font_style": "modern clean sans", "grid_style": "minimal, sharp, trustworthy",
                    "highlight_covers": ["Insights", "Clients", "Proof", "FAQ", "Offers"]}
        return {"theme": "neutral creator", "primary_color": "#EFE7DF", "secondary_color": "#151515",
                "accent_color": "#B87BFF", "background_color": "#FAFAFA",
                "font_style": "balanced modern sans", "grid_style": "clean, flexible, creator friendly",
                "highlight_covers": ["Tips", "Proof", "BTS", "FAQ", "Start"]}

    def _build_profile_preview(self, keyword: str, niche: str, aesthetic: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "display_name": f"{keyword.title()} Studio",
            "username_style": _slug(niche)[:12] or "creator",
            "bio": f"Helping you grow with {keyword} in a simple and aesthetic way",
            "feed_style": aesthetic["grid_style"],
            "highlight_covers": aesthetic["highlight_covers"],
            "dummy_feed_cards": [
                {"slot": 1, "type": "value",       "title": f"Best {keyword} tips",   "accent": aesthetic["accent_color"]},
                {"slot": 2, "type": "proof",       "title": "Results and case studies","accent": aesthetic["primary_color"]},
                {"slot": 3, "type": "personality", "title": "Behind the scenes",       "accent": aesthetic["secondary_color"]},
            ],
            "grid_note": "Use one value post, one proof post, and one personality post in a repeating pattern",
        }

    # ── Script builders ────────────────────────────────────
    def _build_delivery_guide(self, tone: str, keyword: str, language: str = "english") -> List[Dict[str, Any]]:
        if language == "hinglish":
            return [
                {"part": "hook",  "tone": "high energy", "pause": "after line", "note": "shock ya curiosity create kar"},
                {"part": "intro", "tone": "medium",      "pause": "short",      "note": "relatable bana"},
                {"part": "beat1", "tone": "normal",      "pause": "micro",      "note": "problem feel karwa"},
                {"part": "beat2", "tone": "rising",      "pause": "short",      "note": "tension build kar"},
                {"part": "beat3", "tone": "confident",   "pause": "medium",     "note": "authority dikha"},
                {"part": "cta",   "tone": "strong",      "pause": "end",        "note": "clear bol kya karna hai"},
            ]
        return [
            {"part": "hook",  "tone": "high energy", "pause": "after line", "note": "grab attention fast"},
            {"part": "intro", "tone": "medium",      "pause": "short",      "note": "build connection"},
            {"part": "beat1", "tone": "normal",      "pause": "micro",      "note": "highlight problem"},
            {"part": "beat2", "tone": "rising",      "pause": "short",      "note": "build tension"},
            {"part": "beat3", "tone": "confident",   "pause": "medium",     "note": "deliver value"},
            {"part": "cta",   "tone": "strong",      "pause": "end",        "note": "clear action"},
        ]

    def _english_script(self, keyword: str, tone: str, trend_label: str, hooks: List[Dict[str, str]]) -> Dict[str, Any]:
        hook = hooks[0]["text"] if hooks else f"most people mess this up in {keyword}"
        intro  = f"if you're starting {keyword}\u2026 don't make this mistake"
        beat1  = f"honestly, most people get this wrong in the beginning"
        beat2  = f"it looks simple\u2026 but this is where everything falls apart"
        beat3  = f"and once you fix this\u2026 things actually start working"
        cta    = f"follow for more, this will help"
        outro  = f"save this, you'll need it later"
        full_script = "\n\n".join([hook, intro, beat1, beat2, beat3, cta])
        return {
            "language": "english",
            "hook": hook, "intro": intro,
            "beats": [{"beat": 1, "text": beat1, "emotion": "relatable"},
                      {"beat": 2, "text": beat2, "emotion": "tension"},
                      {"beat": 3, "text": beat3, "emotion": "relief"}],
            "cta": cta, "outro": outro, "full_script": full_script,
            "delivery_guide": self._build_delivery_guide(tone, keyword, "english"),
            "tone_notes": ["sound like you're talking, not reading",
                           "keep it slightly casual",
                           "pause before the key insight"],
            "length_seconds": 45 if trend_label in {"PEAKING", "RISING"} else 30,
        }

    def _hinglish_script(self, keyword: str, tone: str, trend_label: str, hooks: List[Dict[str, str]]) -> Dict[str, Any]:
        import random as _random
        hook = hooks[0]["text"] if hooks else f"you know what\u2026 {keyword} ke saath log yeh galti karte hain"
        starters = ["you know what", "yaar", "bro", ""]
        start = _random.choice(starters)
        intro  = f"{start} agar tu {keyword} start kar raha hai na\u2026 ek cheez samajh le".strip()
        beat1  = f"yaar honestly, sab log yeh galti karte hain"
        beat2  = f"yeh simple lagta hai na\u2026 but yahin log mess up kar dete hain"
        beat3  = f"aur jo log isko samajh jaate hain\u2026 wahi actually grow karte hain"
        cta    = f"follow kar, warna tu wahi stuck reh jayega"
        outro  = f"save kar le, baad mein kaam aayega"
        full_script = "\n\n".join([hook, intro, beat1, beat2, beat3, cta])
        return {
            "language": "hinglish",
            "hook": hook, "intro": intro,
            "beats": [{"beat": 1, "text": beat1, "emotion": "relatable"},
                      {"beat": 2, "text": beat2, "emotion": "tension"},
                      {"beat": 3, "text": beat3, "emotion": "confidence"}],
            "cta": cta, "outro": outro, "full_script": full_script,
            "delivery_guide": self._build_delivery_guide(tone, keyword, "hinglish"),
            "tone_notes": ["natural bol, over acting nahi",
                           "thoda Gen Z feel, but clean",
                           "pause le before important line"],
            "length_seconds": 45 if trend_label in {"PEAKING", "RISING"} else 30,
        }

    def _script_bundle(self, keyword: str, tone: str, trend_label: str,
                       hooks: List[Dict[str, str]], language: str) -> Dict[str, Any]:
        english  = self._english_script(keyword, tone, trend_label, hooks)
        hinglish = self._hinglish_script(keyword, tone, trend_label, hooks)
        normalized = (language or "english").lower().strip()
        if normalized not in {"english", "hinglish", "both"}:
            normalized = "english"
        if normalized == "english":
            selected = english
        elif normalized == "hinglish":
            selected = hinglish
        else:
            selected = {"english": english, "hinglish": hinglish}
        return {"selected_language": normalized, "selected_script": selected,
                "english": english, "hinglish": hinglish}

    # ── Timing & discovery ─────────────────────────────────
    def _best_time(self, trend_label: str) -> Dict[str, Any]:
        base_hour = 19 if trend_label in {"PEAKING", "RISING"} else 18
        return {
            "weekday":    "Tue to Thu",
            "hour_local": base_hour,
            "label":      f"{base_hour}:00",
            "reason":     "High intent evening window for short form engagement",
        }

    def _quality_notes(self, keyword: str) -> List[str]:
        return [
            "Put the hook on screen in the first second",
            "Keep the first frame close and bright",
            "Use subtitles with high contrast",
            "Make the ending loop back to the start",
            "Keep reels fast and visually clean",
        ]

    def _prompt_support(self, keyword: str, content_type: str, tone: str) -> List[str]:
        return [
            f"Use {keyword} in the opening hook",
            f"Keep the tone {tone}",
            f"Make the first frame readable without sound",
            f"Design for {content_type} retention first",
        ]

    def _trending_keywords(self, keyword: str) -> List[str]:
        variants = [keyword, f"{keyword} tips", f"{keyword} mistakes", f"{keyword} tutorial",
                    f"best {keyword}", f"{keyword} strategy", f"{keyword} for beginners",
                    f"{keyword} before after", f"{keyword} ideas", f"{keyword} guide"]
        extras   = ["viral", "reels", "story", "hook", "caption", "aesthetic"]
        combined = variants + [f"{keyword} {item}" for item in extras]
        seen, out = set(), []
        for item in combined:
            key = _slug(item)
            if key and key not in seen:
                seen.add(key)
                out.append(item)
        return out[:10]

    def _top_search_terms(self, keyword: str, ranked: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        terms     = self._trending_keywords(keyword)
        top_views = ranked[0]["views"] if ranked else 10000
        top = []
        for index, term in enumerate(terms[:8], start=1):
            score           = max(1, 100 - (index - 1) * 7)
            predicted_views = int(top_views * (1.0 - ((index - 1) * 0.08)))
            top.append({"term": term, "score": score, "predicted_views": predicted_views})
        return top

    # ── Main entry point ───────────────────────────────────
    def build_intelligence_pack(
        self,
        keyword: str,
        tone: str = "bold",
        content_type: str = "reel",
        niche: Optional[str] = None,
        topic_rows: Optional[List[Any]] = None,
        language: str = "english",
    ) -> Dict[str, Any]:
        niche_value     = niche or keyword
        rows            = self._normalize_rows(keyword=keyword, niche=niche_value, topic_rows=topic_rows)
        ranked          = self._rank_topics(rows=rows, keyword=keyword, tone=tone)
        validation      = self._validate_topics(rows)
        prediction      = self._predict_board(ranked)
        hooks           = self._build_hooks(keyword=keyword, trend_label=prediction["trend_label"])
        scripts         = self._script_bundle(keyword=keyword, tone=tone,
                                              trend_label=prediction["trend_label"],
                                              hooks=hooks, language=language)
        reel_ideas      = self._build_reel_ideas(keyword=keyword, trend_label=prediction["trend_label"])
        post_ideas      = self._build_post_ideas(keyword=keyword)
        story_ideas     = self._build_story_ideas(keyword=keyword, tone=tone)
        aesthetic_profile = self._build_aesthetic_profile(niche_value)
        profile_preview = self._build_profile_preview(keyword=keyword, niche=niche_value, aesthetic=aesthetic_profile)
        sounds          = self._build_sounds(prediction["trend_label"])
        top_search_terms  = self._top_search_terms(keyword, ranked)
        trending_keywords = [item["term"] for item in top_search_terms]
        best_time       = self._best_time(prediction["trend_label"])
        quality_notes   = self._quality_notes(keyword)
        prompt_support  = self._prompt_support(keyword, content_type, tone)

        engagement = {
            "avg_views":    int(mean([row.views    for row in rows])),
            "avg_likes":    int(mean([row.likes    for row in rows])),
            "avg_comments": int(mean([row.comments for row in rows])),
            "avg_saves":    int(mean([row.saves    for row in rows])),
            "avg_shares":   int(mean([row.shares   for row in rows])),
        }

        top_topic   = prediction["top_performer"].get("topic", keyword)
        final_score = prediction["current_score"]

        self.state["snapshots"].append({
            "day":         _now_utc().strftime("%Y-%m-%d"),
            "keyword":     keyword,
            "final_score": final_score,
            "top_topic":   top_topic,
            "trend_label": prediction["trend_label"],
        })
        self._save_state()

        return {
            "platform":        "instagram",
            "keyword":         keyword,
            "content_type":    content_type,
            "tone":            tone,
            "niche":           niche_value,
            "trending_topics": ranked,
            "viral_topics":    [item for item in ranked if item["label"] in {"VIRAL", "HOT"}][:5],
            "engagement":      engagement,
            "validation":      validation,
            "prediction":      prediction,
            "scripts":         scripts,
            "hooks":           hooks,
            "reel_ideas":      reel_ideas,
            "post_ideas":      post_ideas,
            "story_ideas":     story_ideas,
            "aesthetic_profile": aesthetic_profile,
            "profile_preview": profile_preview,
            "viral_sounds":    sounds,
            "best_time":       best_time,
            "trending_keywords": trending_keywords,
            "top_search_terms":  top_search_terms,
            "quality_notes":   quality_notes,
            "prompt_support":  prompt_support,
            "scores": {
                "final_score":    final_score,
                "content_score":  min(100, final_score - 6),
                "engagement_score": min(100, engagement["avg_likes"] // 100 if engagement["avg_likes"] else 0),
                "trend_score":    prediction["current_score"],
                "level": "HIGH" if final_score >= 85 else "MEDIUM" if final_score >= 65 else "LOW",
            },
            "description": f"Instagram intelligence pack for {keyword} with a {tone} tone.",
        }


# ── Convenient singleton ──────────────────────────────────
instagram_engine = InstagramEngine()