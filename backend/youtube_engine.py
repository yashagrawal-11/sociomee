from __future__ import annotations

import os
import re
import json
import math
import time
import random
import hashlib
import statistics
from dataclasses import dataclass, asdict
from pathlib import Path
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple
from collections import Counter, defaultdict

import requests
from dotenv import load_dotenv

load_dotenv()


# ============================================================
# SocioMee YouTube Intelligence Engine
# Current public data + pattern extraction + scoring + rewrite
# ============================================================

YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

CACHE_FILE = Path(__file__).with_name(".youtube_cache.json")
CACHE_TTL_SECONDS = 6 * 60 * 60  # 6 hours

DEFAULT_QUERIES_PER_REQUEST = 3
DEFAULT_RESULTS_PER_QUERY = 6


YOUTUBE_TEMPLATES = {
    "title": [
        "I tried {keyword} for 30 days and this happened",
        "Top 5 {keyword} mistakes killing your results",
        "How to get better at {keyword} fast",
        "Nobody tells you this about {keyword}",
        "The truth about {keyword} you need to hear",
        "{keyword}: what works and what does not",
        "Why your {keyword} is not growing",
        "{keyword} explained in the simplest way",
        "I fixed my {keyword} strategy with this one change",
        "The complete {keyword} breakdown",
        "This is the smartest {keyword} strategy right now",
        "Stop doing {keyword} like this",
        "What actually works for {keyword} in 2026",
        "I used this {keyword} method and it changed everything",
        "The fastest way to understand {keyword}",
    ],
    "hook": [
        "You are probably doing this wrong.",
        "Nobody tells you this part.",
        "This changes everything.",
        "Stop scrolling if you care about {keyword}.",
        "I wish I knew this earlier.",
        "This is the exact mistake most people make.",
        "Stay till the end because this gets better.",
        "Here is the part nobody explains about {keyword}.",
        "You can save hours if you understand this.",
        "If you are struggling with {keyword}, watch this.",
    ],
    "cta": [
        "Subscribe for more practical content.",
        "Comment your biggest struggle below.",
        "Like this video if this helped.",
        "Save this and come back later.",
        "Share this with someone who needs it.",
        "Follow for more content like this.",
    ],
    "description_intro": [
        "In this video, we break down {keyword} in a clear and practical way.",
        "This is a full breakdown of {keyword} with no fluff.",
        "If you want to understand {keyword} properly, start here.",
    ],
}


STOPWORDS = {
    "the", "and", "for", "that", "this", "with", "you", "your", "are", "not",
    "from", "what", "when", "where", "why", "how", "why", "who", "will",
    "into", "our", "their", "they", "them", "was", "were", "been", "can",
    "could", "should", "would", "about", "over", "under", "after", "before",
    "like", "just", "more", "than", "some", "most", "many", "very", "also",
    "best", "top", "new", "old", "vs", "vs.", "out", "all", "one", "two",
    "three", "four", "five"
}


@dataclass
class VideoItem:
    video_id: str
    title: str
    description: str
    channel_title: str
    published_at: str
    thumbnail: str = ""
    view_count: int = 0
    like_count: int = 0
    comment_count: int = 0
    tags: Optional[List[str]] = None

    @property
    def age_hours(self) -> float:
        try:
            dt = datetime.fromisoformat(self.published_at.replace("Z", "+00:00"))
            now = datetime.now(timezone.utc)
            return max(0.0, (now - dt).total_seconds() / 3600.0)
        except Exception:
            return 0.0


# ============================================================
# Persona Profiles — inline (no external import needed)
# ============================================================

PERSONA_PROFILES: Dict[str, Dict[str, Any]] = {
    "carryminati": {
        "voice":       "high energy roast, Hinglish",
        "style_notes": "aggressive, chaotic, punchy",
        "pacing":      "fast",
        "energy":      "very high",
        "language_rules": {
            "hinglish_density": 0.9,
            "english_words_allowed": ["trend","content","video","reel","subscribe","comment","creator","scam","fake"],
            "avoid_formal_openers": True,
            "use_censored_slang":   True,
        },
        "topic_buckets": [
            "people following trends without thinking",
            "fake influencers selling courses",
            "cringe creator culture",
            "gym motivation scams",
            "overhyped AI tools",
            "fake experts and shortcut sellers",
            "reaction culture and internet hypocrisy",
            "people who copy content without a brain",
            "fake success flexing",
            "trending nonsense on social media",
        ],
        "hook_templates": [
            "Bhai, {topic} ka scene simple hai, log bina soche chal padte hain.",
            "Sun, {topic} mein sabse badi problem yahi hai.",
            "Seedhi baat, {topic} ko follow karne se pehle dimaag use karna chahiye.",
            "Bhai, yeh jo {topic} wala scene hai na, yahin pe sab gadbad hoti hai.",
            "Dekho, is type ki cheezon mein log overhype mein phas jaate hain.",
            "Ek baat poochh, tune kabhi socha kyun {topic} bar bar same result deta hai?",
            "Honestly bhai, {topic} ka real scene koi nahi batata.",
            "Yaar, {topic} ko lekar jo drama chal raha hai, woh seedha dikhata hai ki log sochte nahi.",
        ],
        "intro_templates": [
            "Ab dhyan se sun, {topic} ka pura scene main seedha explain karta hoon.",
            "Log isko ignore karte hain, lekin {topic} mein jo chakkar hai woh samajhna zaroori hai.",
            "Dekh bhai, {topic} pe itna nonsense phela hua hai ki real baat koi karta hi nahi.",
            "Main bata deta hoon kya hota hai jab log {topic} ko bina dimag ke follow karte hain.",
            "Sun, simple hai, {topic} ek trap hai aur log khud isme chal dete hain.",
        ],
        "cta_templates": [
            "Like kar aur subscribe kar, warna phir mat bolna ki kuch nahi pata.",
            "Comment kar bhai, batao kitne log yeh galti kar rahe ho.",
            "Share kar de jis dost ko yeh sunna chahiye, warna phir mat rona.",
            "Subscribe kar le, free hai, aur content actual mein kaam ka hai.",
            "Ek comment maar de neeche, sach bolna, kitna relatable laga.",
        ],
        "cta": [
            "Like kar aur subscribe kar, warna phir mat bolna ki kuch nahi pata.",
            "Comment kar bhai, batao kitne log yeh galti kar rahe ho.",
            "Share kar de jis dost ko yeh sunna chahiye.",
        ],
    },
    "samayraina": {
        "voice":       "dry wit, dark comedy, Hinglish",
        "style_notes": "deadpan, slow build, self-aware",
        "pacing":      "slow",
        "energy":      "low to medium",
        "language_rules": {
            "hinglish_density": 0.85,
            "english_words_allowed": ["trend","content","video","reel","subscribe","comment","creator"],
            "avoid_formal_openers": True,
            "use_censored_slang":   False,
        },
        "topic_buckets": [
            "cancel culture overreactions",
            "fake rich behavior",
            "comedy scene struggles",
            "awkward social situations",
            "internet hypocrisy",
            "dark everyday failures",
            "people pretending to be deep",
            "life problems nobody admits",
            "weird online opinions",
            "the funny side of human stupidity",
        ],
        "hook_templates": [
            "Matlab, {topic} ka pattern kaafi funny hai.",
            "Haan toh, {topic} mein sab log same galti repeat karte hain.",
            "Basically, {topic} ka scene thoda depressing bhi hai aur funny bhi.",
            "Socho, yeh cheez sabko dikh rahi hai, phir bhi koi kuch nahi karta.",
            "Yeh bhi ek ajeeb human habit hai, bas wahi repeat hota rehta hai.",
            "{topic} pe log bahut serious ho jaate hain, jabki asli scene thoda alag hai.",
            "Sach bolun toh, {topic} ka jo cycle hai woh dekh ke thoda funny lagta hai.",
            "Haan, {topic}. Sab jaante hain. Koi kuch nahi karta. Classic.",
        ],
        "intro_templates": [
            "Toh basically yeh {topic} wali cheez... ek pattern hai. Aur pattern boring hota hai. Lekin yeh hai.",
            "Main zyada dramatic nahi karunga, {topic} ka scene seedha yeh hai.",
            "Dekho, {topic} ko lekar log jo sochte hain aur jo actually hota hai, dono alag hain.",
            "Yeh jo {topic} hai, iska issue sirf ek nahi hai, thode hain. Main batata hoon.",
            "Honestly, {topic} pe koi zyada openly baat nahi karta. Toh main karta hoon.",
        ],
        "cta_templates": [
            "Comment kar do... agar feel hua toh.",
            "Save kar lo, baad mein kaam aayega, ya nahi aayega, pata nahi.",
            "Share kar do kisi ko jise yeh sunna chahiye. Woh jaante ho tum.",
            "Subscribe... agar laga ki worth tha. Nahi laga toh bhi theek hai.",
            "Batana kya lagta hai neeche comment mein. Seriously.",
        ],
        "cta": [
            "Comment kar do... agar feel hua toh.",
            "Save kar lo, baad mein kaam aayega.",
            "Subscribe... agar worth laga.",
        ],
    },
    "dhruvrathee": {
        "voice":       "educational, serious, Hinglish",
        "style_notes": "structured, data-driven, calm",
        "pacing":      "medium",
        "energy":      "calm",
        "cta": ["Agar ye useful laga toh channel subscribe karein.", "Share karein jo log sach jaanna chahte hain.", "Comment mein apna take zarur likhen."],
    },
    "rebelkid": {
        "voice":       "bold, unapologetic, Gen Z Hinglish",
        "style_notes": "sharp, feminist, sarcastic",
        "pacing":      "fast",
        "energy":      "high",
        "cta": ["Follow kar le, kyunki real conversations matter.", "Share this with someone who needs to hear it.", "Save this. Come back when it hits."],
    },
    "shahrukhkhan": {
        "voice":       "poetic, romantic, cinematic Hinglish",
        "style_notes": "warm, philosophical, emotional",
        "pacing":      "slow",
        "energy":      "medium",
        "cta": ["Agar dil ko chhu gaya ho toh subscribe karna.", "Share karo jo feel karta ho yahi.", "Like karo agar yeh baat dil tak pahunchi."],
    },
    "mrbeast": {
        "voice":       "high energy challenge style English",
        "style_notes": "huge, dramatic, payoff-driven",
        "pacing":      "fast",
        "energy":      "very high",
        "cta": ["Subscribe right now or you will miss the next one.", "Share this with a friend who needs to see it.", "Like if this was insane."],
    },
    "alexhormozi": {
        "voice":       "direct, business, value-dense English",
        "style_notes": "sharp, framework-driven, no fluff",
        "pacing":      "fast",
        "energy":      "medium",
        "cta": ["Subscribe and stop guessing.", "Save this and use the framework.", "Share this with someone who is wasting time."],
    },
    "joerogan": {
        "voice":       "curious, long-form, exploratory English",
        "style_notes": "philosophical, open-minded, conversational",
        "pacing":      "slow",
        "energy":      "medium",
        "cta": ["If this got you thinking, subscribe.", "Share this with someone worth talking to.", "Comment your take — let us keep the conversation going."],
    },
    "default": {
        "voice":       "clear, natural, direct",
        "style_notes": "balanced, friendly, useful",
        "pacing":      "medium",
        "energy":      "medium",
        "cta": ["Subscribe for more practical content.", "Comment your biggest struggle below.", "Share this with someone who needs it."],
    },
}
def get_persona(personality: str) -> Dict[str, Any]:
    """Return persona profile dict. Falls back to default if not found."""
    return PERSONA_PROFILES.get(personality.lower().strip(), PERSONA_PROFILES["default"])



class YouTubeIntelligenceEngine:
    def __init__(
        self,
        api_key: Optional[str] = None,
        cache_file: Path = CACHE_FILE,
        cache_ttl_seconds: int = CACHE_TTL_SECONDS,
        session: Optional[requests.Session] = None,
    ) -> None:
        self.api_key = api_key or YOUTUBE_API_KEY
        self.cache_file = cache_file
        self.cache_ttl_seconds = cache_ttl_seconds
        self.session = session or requests.Session()
        self.session.headers.update({
            "User-Agent": "SocioMee/1.0"
        })
        self._cache: Dict[str, Any] = self._load_cache()

    # ----------------------------
    # Cache
    # ----------------------------
    def _load_cache(self) -> Dict[str, Any]:
        if not self.cache_file.exists():
            return {}
        try:
            return json.loads(self.cache_file.read_text(encoding="utf-8"))
        except Exception:
            return {}

    def _save_cache(self) -> None:
        try:
            self.cache_file.write_text(json.dumps(self._cache, indent=2), encoding="utf-8")
        except Exception:
            pass

    def _cache_key(self, *parts: Any) -> str:
        raw = "|".join(str(p) for p in parts)
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def _cache_get(self, key: str) -> Optional[Any]:
        item = self._cache.get(key)
        if not item:
            return None
        if time.time() - item["ts"] > self.cache_ttl_seconds:
            return None
        return item["value"]

    def _cache_set(self, key: str, value: Any) -> None:
        self._cache[key] = {"ts": time.time(), "value": value}
        self._save_cache()

    # ----------------------------
    # HTTP helpers
    # ----------------------------
    def _get_json(self, url: str, params: Dict[str, Any]) -> Dict[str, Any]:
        r = self.session.get(url, params=params, timeout=25)
        r.raise_for_status()
        return r.json()

    def _ensure_key(self) -> None:
        if not self.api_key:
            raise ValueError("YOUTUBE_API_KEY is missing in .env")

    # ----------------------------
    # Public YouTube API
    # ----------------------------
    def search_videos(
        self,
        query: str,
        max_results: int = DEFAULT_RESULTS_PER_QUERY,
        order: str = "viewCount",
        region_code: str = "US",
        relevance_language: str = "en",
        published_after: Optional[str] = None,
    ) -> List[Dict[str, Any]]:
        """
        Uses YouTube search.list.
        This is current public search data, not a historical warehouse.
        """
        self._ensure_key()

        cache_key = self._cache_key(
            "search", query, max_results, order,
            region_code, relevance_language, published_after
        )
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        url = "https://www.googleapis.com/youtube/v3/search"
        params: Dict[str, Any] = {
            "part": "snippet",
            "q": query,
            "type": "video",
            "maxResults": max_results,
            "order": order,
            "regionCode": region_code,
            "relevanceLanguage": relevance_language,
            "safeSearch": "none",
            "key": self.api_key,
        }
        if published_after:
            params["publishedAfter"] = published_after

        data = self._get_json(url, params)
        items = data.get("items", [])

        results: List[Dict[str, Any]] = []
        for item in items:
            snippet = item.get("snippet", {})
            vid = item.get("id", {}).get("videoId", "")
            results.append({
                "video_id": vid,
                "title": snippet.get("title", ""),
                "description": snippet.get("description", ""),
                "channel_title": snippet.get("channelTitle", ""),
                "published_at": snippet.get("publishedAt", ""),
                "thumbnail": (
                    snippet.get("thumbnails", {}).get("high", {}).get("url", "")
                    or snippet.get("thumbnails", {}).get("medium", {}).get("url", "")
                    or snippet.get("thumbnails", {}).get("default", {}).get("url", "")
                ),
            })

        self._cache_set(cache_key, results)
        return results

    def fetch_video_details(self, video_ids: List[str]) -> List[Dict[str, Any]]:
        """
        Uses YouTube videos.list. Gives snippet and statistics.
        """
        self._ensure_key()

        cleaned = [v for v in video_ids if v]
        if not cleaned:
            return []

        cache_key = self._cache_key("details", ",".join(sorted(cleaned)))
        cached = self._cache_get(cache_key)
        if cached is not None:
            return cached

        out: List[Dict[str, Any]] = []
        batches = [cleaned[i:i + 50] for i in range(0, len(cleaned), 50)]

        for batch in batches:
            url = "https://www.googleapis.com/youtube/v3/videos"
            params = {
                "part": "snippet,statistics,contentDetails",
                "id": ",".join(batch),
                "key": self.api_key,
            }
            data = self._get_json(url, params)
            for item in data.get("items", []):
                snippet = item.get("snippet", {})
                stats = item.get("statistics", {})
                out.append({
                    "video_id": item.get("id", ""),
                    "title": snippet.get("title", ""),
                    "description": snippet.get("description", ""),
                    "channel_title": snippet.get("channelTitle", ""),
                    "published_at": snippet.get("publishedAt", ""),
                    "tags": snippet.get("tags", []),
                    "category_id": snippet.get("categoryId", ""),
                    "view_count": int(stats.get("viewCount", 0) or 0),
                    "like_count": int(stats.get("likeCount", 0) or 0),
                    "comment_count": int(stats.get("commentCount", 0) or 0),
                })

        self._cache_set(cache_key, out)
        return out

    # ----------------------------
    # Pattern extraction
    # ----------------------------
    @staticmethod
    def _normalize(text: str) -> str:
        return re.sub(r"\s+", " ", (text or "")).strip().lower()

    @staticmethod
    def _tokenize(text: str) -> List[str]:
        return re.findall(r"[a-zA-Z0-9']+", (text or "").lower())

    @staticmethod
    def _has_number(text: str) -> bool:
        return any(ch.isdigit() for ch in text or "")

    @staticmethod
    def _contains_any(text: str, phrases: List[str]) -> bool:
        t = YouTubeIntelligenceEngine._normalize(text)
        return any(p.lower() in t for p in phrases)

    @staticmethod
    def _title_length_score(title: str) -> int:
        n = len(title or "")
        if 40 <= n <= 65:
            return 10
        if 30 <= n <= 75:
            return 8
        if 20 <= n <= 85:
            return 5
        return 2

    @staticmethod
    def _parse_dt(value: str) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except Exception:
            return None

    def extract_patterns(
        self,
        search_results: List[Dict[str, Any]],
        details: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        all_titles = (
            [x.get("title", "") for x in search_results]
            + [x.get("title", "") for x in details]
        )
        all_desc = (
            [x.get("description", "") for x in search_results]
            + [x.get("description", "") for x in details]
        )
        all_tags = []
        for d in details:
            all_tags.extend(d.get("tags", []) or [])

        token_counter: Counter = Counter()
        bigram_counter: Counter = Counter()

        for text in all_titles + all_desc + all_tags:
            tokens = [
                t for t in self._tokenize(text)
                if t not in STOPWORDS and len(t) > 2
            ]
            token_counter.update(tokens)
            bigram_counter.update(zip(tokens, tokens[1:]))

        title_stats = {
            "count": len(all_titles),
            "questions": sum(1 for t in all_titles if "?" in t),
            "numbers": sum(1 for t in all_titles if self._has_number(t)),
            "how_to": sum(1 for t in all_titles if self._contains_any(t, ["how to", "how i", "how we"])),
            "mistakes": sum(1 for t in all_titles if self._contains_any(t, ["mistake", "mistakes", "wrong"])),
            "curiosity": sum(1 for t in all_titles if self._contains_any(t, ["secret", "truth", "nobody tells", "what happened", "this changed"])),
            "compare": sum(1 for t in all_titles if self._contains_any(t, [" vs ", " versus "])),
            "retention": sum(1 for t in all_titles if self._contains_any(t, ["watch till", "stay till", "full breakdown", "step by step", "complete guide"])),
        }

        avg_len = statistics.mean([len(t) for t in all_titles]) if all_titles else 0.0
        best_day_hour = self._infer_best_posting_window(details)
        common_ngrams = [" ".join(bg) for bg, _ in bigram_counter.most_common(12)]

        return {
            "title_stats": title_stats,
            "avg_title_length": round(avg_len, 1),
            "top_words": token_counter.most_common(20),
            "top_bigrams": common_ngrams,
            "best_posting_window": best_day_hour,
            "sample_titles": all_titles[:10],
            "sample_tags": list(dict.fromkeys(all_tags))[:20],
        }

    def _infer_best_posting_window(self, details: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Inferred posting window based on the current public video set
        fetched for the keyword. Not a guaranteed best time.
        """
        if not details:
            return {"weekday": None, "hour_utc": None, "count": 0}

        buckets: Counter = Counter()
        for d in details:
            dt = self._parse_dt(d.get("published_at", ""))
            if not dt:
                continue
            buckets[(dt.weekday(), dt.hour)] += 1

        if not buckets:
            return {"weekday": None, "hour_utc": None, "count": 0}

        (weekday, hour), count = buckets.most_common(1)[0]
        weekday_name = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][weekday]
        return {"weekday": weekday_name, "hour_utc": hour, "count": count}

    def score_youtube_quality(
        self,
        keyword: str,
        titles: List[str],
        patterns: Dict[str, Any],
    ) -> Dict[str, Any]:
        keyword_n = self._normalize(keyword)

        kw_hits        = sum(1 for t in titles if keyword_n in self._normalize(t))
        number_hits    = sum(1 for t in titles if self._has_number(t))
        how_to_hits    = sum(1 for t in titles if self._contains_any(t, ["how to", "how i", "how we"]))
        curiosity_hits = sum(1 for t in titles if self._contains_any(t, ["secret", "truth", "nobody tells", "this changed"]))
        retention_hits = sum(1 for t in titles if self._contains_any(t, ["watch till", "stay till", "full breakdown", "step by step"]))
        question_hits  = sum(1 for t in titles if "?" in t)

        avg_len = patterns.get("avg_title_length", 0)
        if 40 <= avg_len <= 65:
            length_score = 15
        elif 30 <= avg_len <= 75:
            length_score = 10
        else:
            length_score = 5

        score = 0
        score += min(20, kw_hits * 4)
        score += min(15, number_hits * 3)
        score += min(15, how_to_hits * 3)
        score += min(15, curiosity_hits * 3)
        score += min(10, retention_hits * 2)
        score += min(5,  question_hits * 1)
        score += length_score
        score = max(0, min(100, score + 15))  # baseline boost

        level = "HIGH" if score >= 80 else "MEDIUM" if score >= 55 else "LOW"

        return {
            "final_score": score,
            "level": level,
            "breakdown": {
                "keyword_hits":    kw_hits,
                "number_hits":     number_hits,
                "how_to_hits":     how_to_hits,
                "curiosity_hits":  curiosity_hits,
                "retention_hits":  retention_hits,
                "question_hits":   question_hits,
                "avg_title_length": avg_len,
            },
        }

    # ----------------------------
    # Smart generation
    # ----------------------------
    def generate_title_candidates(
        self,
        keyword: str,
        patterns: Dict[str, Any],
        limit: int = 8,
    ) -> List[str]:
        keyword = keyword.strip()
        candidates: List[str] = []

        for tpl in YOUTUBE_TEMPLATES["title"]:
            candidates.append(tpl.format(keyword=keyword))

        ts = patterns["title_stats"]
        if ts["numbers"] > 0:
            candidates.append(f"5 {keyword} mistakes you need to stop today")
            candidates.append(f"7 {keyword} tips that actually work")
        if ts["how_to"] > 0:
            candidates.append(f"How to master {keyword} step by step")
        if ts["mistakes"] > 0:
            candidates.append(f"The biggest {keyword} mistake most people make")
        if ts["curiosity"] > 0:
            candidates.append(f"I tried {keyword} and this changed everything")
        if ts["compare"] > 0:
            candidates.append(f"{keyword} vs the old way: what actually works")
        if ts["retention"] > 0:
            candidates.append(f"The complete {keyword} breakdown")

        # Deduplicate preserving order
        seen: set = set()
        unique: List[str] = []
        for c in candidates:
            s = c.lower().strip()
            if s not in seen:
                seen.add(s)
                unique.append(c)

        ranked = sorted(
            unique,
            key=lambda t: self._score_title_candidate(t, keyword),
            reverse=True,
        )
        return ranked[:limit]

    def _score_title_candidate(self, title: str, keyword: str) -> int:
        score = 0
        t = self._normalize(title)
        k = self._normalize(keyword)

        if k in t:
            score += 25
        if any(x in t for x in ["how to", "mistake", "secret", "truth", "best", "top", "why"]):
            score += 20
        if self._has_number(title):
            score += 15
        if "?" in title:
            score += 5
        score += self._title_length_score(title)
        if len(title) <= 70:
            score += 5
        if len(title) >= 35:
            score += 5
        return score

    def generate_hooks(self, keyword: str, limit: int = 6) -> List[str]:
        keyword = keyword.strip()
        hooks = [tpl.format(keyword=keyword) for tpl in YOUTUBE_TEMPLATES["hook"]]

        hooks.extend([
            f"Here is the one thing nobody explains about {keyword}.",
            f"You can save hours if you understand this {keyword} idea.",
            f"If you are struggling with {keyword}, this is for you.",
            f"This is the fastest way to get better at {keyword}.",
            f"Before you do anything else, understand this about {keyword}.",
        ])

        seen: set = set()
        unique: List[str] = []
        for h in hooks:
            s = h.lower().strip()
            if s not in seen:
                seen.add(s)
                unique.append(h)
        return unique[:limit]

    def generate_description(
        self,
        keyword: str,
        titles: List[str],
        patterns: Dict[str, Any],
    ) -> str:
        intro = random.choice(YOUTUBE_TEMPLATES["description_intro"]).format(keyword=keyword)
        title_ref = titles[0] if titles else f"{keyword} explained"

        top_words = [word for word, _ in patterns["top_words"][:8]]
        top_words_text = ", ".join(top_words) if top_words else keyword

        return f"""
{intro}

In this video, we break down {keyword} in a practical, no fluff way.

What you will learn:
- What is working right now
- Common mistakes to avoid
- A simple step by step framework
- How to make your content more clickable

Top title direction:
{title_ref}

Pattern signals we found:
{top_words_text}

If this helped you, leave a comment and subscribe for more practical growth content.

#youtube #{re.sub(r'[^a-zA-Z0-9]+', '', keyword).lower()} #contentcreator #growth #seo
""".strip()

    def generate_cta(self, keyword: str) -> List[str]:
        ctas = [tpl.format(keyword=keyword) for tpl in YOUTUBE_TEMPLATES["cta"]]
        return ctas[:5]

    def generate_tags(
        self,
        keyword: str,
        patterns: Dict[str, Any],
    ) -> Dict[str, List[Tuple[str, int]]]:
        slug = re.sub(r"[^a-zA-Z0-9]+", "", keyword).lower()

        high: List[Tuple[str, int]] = [
            (f"#{slug}", 97),
            ("#youtube", 92),
            ("#youtubechannel", 88),
            ("#contentcreator", 86),
            ("#growth", 82),
        ]
        medium: List[Tuple[str, int]] = [
            ("#videoideas", 74),
            ("#creator", 70),
            ("#seo", 68),
            ("#viral", 66),
            ("#shorts", 64),
        ]
        low: List[Tuple[str, int]] = [
            ("#beginner", 52),
            ("#tips", 50),
            ("#strategy", 48),
            ("#tutorial", 46),
            ("#howto", 44),
        ]

        ts = patterns["title_stats"]
        if ts["how_to"] > 0:
            medium.insert(0, ("#howto", 78))
        if ts["mistakes"] > 0:
            medium.insert(0, ("#mistakes", 76))
        if ts["curiosity"] > 0:
            high.insert(1, ("#watchtillend", 84))
        if ts["retention"] > 0:
            medium.insert(0, ("#retention", 74))

        return {
            "high":   high[:5],
            "medium": medium[:5],
            "low":    low[:5],
        }

    def _dedupe_videos(self, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        seen: set = set()
        out: List[Dict[str, Any]] = []
        for item in items:
            vid = item.get("video_id", "")
            if not vid or vid in seen:
                continue
            seen.add(vid)
            out.append(item)
        return out

    # ----------------------------
    # New helper methods (GPT additions)
    # ----------------------------

    def fetch_top_videos(self, keyword: str) -> List[Dict[str, Any]]:
        """Fetch top 15 videos by view count for a keyword."""
        url = "https://www.googleapis.com/youtube/v3/search"
        params = {
            "part": "snippet",
            "q": keyword,
            "type": "video",
            "order": "viewCount",
            "maxResults": 15,
            "key": self.api_key,
        }
        res = self.session.get(url, params=params, timeout=25).json()
        videos: List[Dict[str, Any]] = []
        for item in res.get("items", []):
            snippet = item.get("snippet", {})
            videos.append({
                "title":     snippet.get("title", ""),
                "channel":   snippet.get("channelTitle", ""),
                "published": snippet.get("publishedAt", ""),
            })
        return videos

    def get_trending_keywords(self, keyword: str) -> List[str]:
        """Extract top trending words from video titles for the keyword."""
        videos = self.fetch_top_videos(keyword)
        words: List[str] = []
        for v in videos:
            words.extend(v["title"].lower().split())
        common = Counter(words).most_common(15)
        return [w[0] for w in common if len(w[0]) > 3][:10]

    def get_top_search_terms(self, keyword: str) -> List[Dict[str, Any]]:
        """Return top search terms with semi-intelligent viral scoring and estimated views."""
        viral_keywords = [
            "toxic", "money", "rich", "dark", "truth",
            "mistakes", "secrets", "exposed", "scam",
            "relationship", "mindset", "psychology",
            "viral", "hack", "warning", "banned", "hidden",
            "nobody", "actually", "real", "proof", "shocking",
        ]

        videos = self.fetch_top_videos(keyword)
        words: List[str] = []
        for v in videos:
            words.extend(v["title"].lower().split())
        common = Counter(words).most_common(10)

        results: List[Dict[str, Any]] = []
        for w in common:
            if len(w[0]) > 3:
                base_score = 60
                for vk in viral_keywords:
                    if vk in w[0].lower():
                        base_score += 5
                viral_score     = min(base_score + random.randint(0, 20), 100)
                estimated_views = viral_score * random.randint(2500, 5000)
                results.append({
                    "term":            w[0],
                    "viral_score":     viral_score,
                    "estimated_views": estimated_views,
                    "note":            "AI estimated potential, not actual data",
                })
        return results

    def get_best_upload_time(self, videos: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Infer best upload hour from published timestamps of fetched videos."""
        hours: List[int] = []
        for v in videos:
            try:
                dt = datetime.fromisoformat(v["published"].replace("Z", "+00:00"))
                hours.append(dt.hour)
            except Exception:
                continue
        if not hours:
            return {"hour": 18, "label": "6 PM"}
        best_hour = Counter(hours).most_common(1)[0][0]
        suffix = "AM" if best_hour < 12 else "PM"
        display = best_hour if best_hour <= 12 else best_hour - 12
        display = 12 if display == 0 else display
        return {"hour": best_hour, "label": f"{display} {suffix}"}

    # ----------------------------
    # Main intelligence entry point
    # ----------------------------

    def build_intelligence_pack(
        self,
        keyword: str,
        max_results_per_query: int = DEFAULT_RESULTS_PER_QUERY,
        region_code: str = "US",
        relevance_language: str = "en",
    ) -> Dict[str, Any]:
        """
        Main YouTube intelligence method.
        Combines real API data, pattern extraction, scoring, and smart generation.
        Includes trending keywords, top search terms, and smart upload time.
        """
        if not self.api_key:
            raise ValueError("Missing YOUTUBE_API_KEY in .env")

        keyword = keyword.strip()

        # ── Fetch & merge ──────────────────────────────────────────────
        queries = [
            {"q": keyword,               "order": "viewCount"},
            {"q": f"{keyword} tips",     "order": "viewCount"},
            {"q": f"{keyword} tutorial", "order": "relevance"},
        ]

        all_search_results: List[Dict[str, Any]] = []
        for q in queries:
            rows = self.search_videos(
                query=q["q"],
                max_results=max_results_per_query,
                order=q["order"],
                region_code=region_code,
                relevance_language=relevance_language,
            )
            all_search_results.extend(rows)

        all_search_results = self._dedupe_videos(all_search_results)
        video_ids = [x["video_id"] for x in all_search_results if x.get("video_id")]
        details = self.fetch_video_details(video_ids)

        detail_map = {d["video_id"]: d for d in details}
        merged: List[Dict[str, Any]] = []
        for s in all_search_results:
            d = detail_map.get(s["video_id"], {})
            merged.append({
                **s,
                "view_count":    d.get("view_count", 0),
                "like_count":    d.get("like_count", 0),
                "comment_count": d.get("comment_count", 0),
                "tags":          d.get("tags", []) or [],
            })

        # ── Pattern analysis & scoring ─────────────────────────────────
        patterns = self.extract_patterns(merged, details)
        score    = self.score_youtube_quality(keyword, [x["title"] for x in merged], patterns)

        # ── Content generation ─────────────────────────────────────────
        title_candidates = self.generate_title_candidates(keyword, patterns, limit=8)
        hooks            = self.generate_hooks(keyword, limit=6)
        description      = self.generate_description(keyword, title_candidates, patterns)
        ctas             = self.generate_cta(keyword)
        tags             = self.generate_tags(keyword, patterns)

        # ── New enrichment signals ─────────────────────────────────────
        top_videos    = self.fetch_top_videos(keyword)
        trending_kw   = self.get_trending_keywords(keyword)
        search_terms  = self.get_top_search_terms(keyword)
        best_time     = self.get_best_upload_time(top_videos)

        # ── GPT-style captions, hashtags, ideas ───────────────────────
        slug = re.sub(r"[^a-zA-Z0-9]+", "", keyword).lower()
        gpt_captions = [
            f"Best {keyword} guide in 2026 🔥",
            f"Stop wasting time on {keyword} ❌",
            f"{keyword} secrets revealed 💀",
        ]
        gpt_hashtags = [f"#{slug}", "#viral", "#trending"]
        gpt_ideas    = [
            f"{keyword} vs old method",
            f"Beginner to pro {keyword}",
            f"Reacting to worst {keyword} mistakes",
        ]

        # ── Channel analysis ───────────────────────────────────────────
        channel_counter = Counter(
            x.get("channel_title", "") for x in merged if x.get("channel_title")
        )
        top_channels  = [ch for ch, _ in channel_counter.most_common(5)]
        quality_notes = self._quality_notes(patterns, score)

        # Merge title_candidates with gpt_captions (deduplicated)
        all_captions = list(dict.fromkeys(title_candidates + gpt_captions))
        # Merge ideas (deduplicated)
        all_ideas = list(dict.fromkeys(
            self._idea_brainstorm(keyword, patterns, title_candidates) + gpt_ideas
        ))

        return {
            # ── Identity ─────────────────────────────────────────────
            "platform":           "youtube",
            "keyword":            keyword,
            "source":             "youtube_data_api",
            "queries_used":       queries,

            # ── Raw data ─────────────────────────────────────────────
            "search_results":     merged,
            "video_details":      details,
            "patterns":           patterns,

            # ── Scores ───────────────────────────────────────────────
            "scores": {
                "final_score": score["final_score"],
                "level":       score["level"],
                "breakdown":   score["breakdown"],
            },

            # ── Content output ────────────────────────────────────────
            "hooks":              hooks,
            "captions":           all_captions,
            "description":        description,
            "cta":                ctas,
            "hashtags":           tags,
            "ideas":              all_ideas,

            # ── Timing & trending signals ─────────────────────────────
            "best_time":          best_time,
            "trending_keywords":  trending_kw,
            "top_search_terms":   search_terms,

            # ── Discovery metadata ────────────────────────────────────
            "top_current_titles": [x["title"] for x in merged[:10]],
            "top_channels":       top_channels,
            "quality_notes":      quality_notes,
            "prompt_support":     self._prompt_support_from_patterns(keyword, patterns, score),
        }

    def _quality_notes(
        self,
        patterns: Dict[str, Any],
        score: Dict[str, Any],
    ) -> List[str]:
        notes: List[str] = []
        ts = patterns["title_stats"]

        if ts["numbers"] > 0:
            notes.append("Current public titles often include numbers. That usually improves scanability.")
        if ts["how_to"] > 0:
            notes.append("How-to framing is already common. Strong for instructional content.")
        if ts["mistakes"] > 0:
            notes.append("Mistake-based titles are present. Good for pain-point driven clicks.")
        if ts["curiosity"] > 0:
            notes.append("Curiosity hooks are common. Good for retention and CTR.")
        if score["level"] == "HIGH":
            notes.append("This keyword shows a strong YouTube content pattern fit.")
        elif score["level"] == "MEDIUM":
            notes.append("This keyword has a usable but mixed pattern set. Test multiple angles.")
        else:
            notes.append("This keyword needs stronger framing before publishing.")

        return notes[:5]

    def _idea_brainstorm(
        self,
        keyword: str,
        patterns: Dict[str, Any],
        title_candidates: List[str],
    ) -> List[str]:
        ideas: List[str] = []
        keyword = keyword.strip()

        ideas.append(f"Create a comparison video around {keyword} vs the old way.")
        ideas.append(f"Make a step by step breakdown video for {keyword}.")
        ideas.append(f"Use a mistake-focused angle for {keyword}.")
        ideas.append(f"Turn {keyword} into a result-based story with before and after.")

        if title_candidates:
            ideas.append(f"Try this title angle first: {title_candidates[0]}")
        if patterns["title_stats"]["curiosity"] > 0:
            ideas.append(
                f"Open with a curiosity hook for {keyword} because current public titles already lean that way."
            )
        if patterns["title_stats"]["how_to"] > 0:
            ideas.append(
                f"Use a tutorial structure for {keyword} because how-to titles are common in the current sample."
            )

        return ideas[:6]

    def _prompt_support_from_patterns(
        self,
        keyword: str,
        patterns: Dict[str, Any],
        score: Dict[str, Any],
    ) -> Dict[str, Any]:
        return {
            "keyword":          keyword,
            "title_stats":      patterns["title_stats"],
            "avg_title_length": patterns["avg_title_length"],
            "score":            score["final_score"],
            "level":            score["level"],
        }



    # ── NICHE MAP for persona-aware beats ─────────────────────────────
    NICHE_MAP: Dict[str, Dict[str, Any]] = {
        "gaming":          {"angles": ["skill gap", "mistake fix", "rank push", "challenge"]},
        "fitness":         {"angles": ["discipline", "consistency", "transformation", "results"]},
        "beauty":          {"angles": ["glow", "confidence", "routine", "before after"]},
        "finance":         {"angles": ["freedom", "security", "clarity", "growth"]},
        "technology":      {"angles": ["speed", "efficiency", "future", "leverage"]},
        "lifestyle":       {"angles": ["balance", "comfort", "daily upgrade", "consistency"]},
        "travel":          {"angles": ["explore", "freedom", "hidden gems", "budget"]},
        "education":       {"angles": ["clarity", "progress", "confidence", "results"]},
        "marketing":       {"angles": ["authority", "attention", "conversion", "retention"]},
        "business":        {"angles": ["growth", "trust", "conversion", "clarity"]},
        "personal growth": {"angles": ["discipline", "clarity", "consistency", "progress"]},
        "comedy":          {"angles": ["relatable", "chaotic", "shareable", "comment bait"]},
        "general":         {"angles": ["clarity", "growth", "results", "consistency"]},
    }

    @staticmethod
    def _clean(text: str) -> str:
        import re as _re
        return _re.sub(r"\s+", " ", (text or "").strip().lower())

    def _refine_topic_for_persona(self, topic: str, personality: str) -> str:
        """Maps a raw topic to persona-specific framing."""
        topic = topic.strip().lower()
        persona_topic_map = {
            "carryminati": {
                "people following trends": "people following trends without thinking",
                "fake influencers": "fake influencers selling courses",
                "courses": "fake gurus selling shortcut courses",
                "gym": "gym motivation scams and fake transformations",
                "ai tools": "overhyped AI tools that promise everything",
                "trending": "trending nonsense on social media",
                "success": "fake success flexing on social media",
            },
            "samayraina": {
                "cancel culture": "cancel culture overreactions",
                "fake rich": "fake rich behavior and internet pretending",
                "comedy": "comedy scene struggles and dark humor",
                "social media": "internet hypocrisy and weird opinions",
                "life": "dark everyday failures nobody admits",
                "people": "people pretending to be deep",
            },
        }
        rules = persona_topic_map.get(personality, {})
        for key, value in rules.items():
            if key in topic:
                return value
        return topic

    def _resolve_niche_data(self, niche: str, topic: str) -> Dict[str, Any]:
        for key in self.NICHE_MAP:
            if key in topic.lower():
                return self.NICHE_MAP[key]
        return self.NICHE_MAP.get(niche, self.NICHE_MAP["general"])

    @staticmethod
    def _target_word_count(duration_seconds: int, format_type: str) -> int:
        if format_type == "short":
            return max(110, min(150, int(duration_seconds * 2.4)))
        return max(180, int((duration_seconds / 60) * 130))

    @staticmethod
    def _beat_emotion(beat_num: int, total: int, voice: str) -> str:
        if beat_num == 1:          return "curiosity"
        if beat_num == total:      return "motivation"
        if beat_num == total - 1:  return "clarity"
        if beat_num == 2:          return "tension"
        return "insight"

    def _build_hook(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        persona: Dict[str, Any],
        format_type: str,
        language: str,
    ) -> str:
        voice = persona["voice"]
        angle = random.choice(niche_data["angles"])

        if language == "hinglish":
            banks: Dict[str, list] = {
                "carryminati": [
                    f"Bhai, {topic} mein sabse badi problem yahi hai, log sochne se pehle hi follow kar lete hain.",
                    f"Sun, {topic} ka scene yahi hai, dimaag band aur trend on.",
                    f"Aur yeh jo {topic} wala scene hai na, yahin pe sabse zyada gadbad hoti hai.",
                ],
                "samayraina": [
                    f"Matlab, {topic} ka pattern kaafi funny hai, sabko problem pata hai par solve koi nahi karta.",
                    f"Sochne wali baat yeh hai ki {topic} mein issue thoda obvious hai.",
                    f"Yeh woh situation hai jahan {topic} dekh ke bas ek awkward silence aata hai.",
                ],
                "dhruvrathee": [
                    f"Aaj hum {topic} ko facts aur logic ke saath samjhenge.",
                    f"{topic} ka real issue samajhna hai toh numbers aur reasoning dekhni padegi.",
                    f"Seedhi baat hai, {topic} ko emotion se nahi, clarity se samajhna padega.",
                ],
                "rebelkid": [
                    f"Cute little red flag moment, {topic} par seedhi baat karni padegi.",
                    f"Honestly, {topic} ko ignore karna band karna chahiye.",
                    f"Let us be real, {topic} par soft rehne ka time nahi hai.",
                ],
                "shahrukhkhan": [
                    f"{topic} sirf ek topic nahi, ek feeling bhi hai.",
                    f"Kabhi kabhi {topic} ko dil se dekhna padta hai, sirf logic se nahi.",
                    f"{topic} ki sachchai thodi simple bhi hai aur thodi gehri bhi.",
                ],
                "mrbeast": [
                    f"We had to test {topic} because the result looked insane.",
                    f"{topic} ke saath jo hua, woh honestly crazy tha.",
                    f"We found something wild in {topic}.",
                ],
                "alexhormozi": [
                    f"Here is the thing about {topic} that most people miss.",
                    f"{topic} ko simple tarike se samajhna hai toh yeh point dekh lo.",
                    f"Most people get {topic} wrong for one simple reason.",
                ],
                "joerogan": [
                    f"Think about {topic} for a second, the real issue is deeper.",
                    f"{topic} ka scene thoda deeper jaake samajhna padta hai.",
                    f"Sometimes {topic} looks simple, but it is not.",
                ],
            }
            pool = banks.get(voice, [
                f"Bhai, {topic} ka real point yahi hai.",
                f"Seedhi baat, {topic} mein asli issue {angle} hai.",
                f"Sach bolun, {topic} ko log zyada complicated bana dete hain.",
            ])
            return random.choice(pool)

        # English
        banks_en: Dict[str, list] = {
            "carryminati": [
                f"Bhai, {topic} is where people mess up the most.",
                f"Listen carefully, {topic} is not complicated, people make it complicated.",
            ],
            "samayraina": [
                f"Funny how {topic} keeps repeating itself.",
                f"Matlab, {topic} ka pattern pretty clear hai.",
            ],
            "dhruvrathee": [
                f"Today we will break down {topic} properly.",
                f"If you look at {topic} carefully, the picture becomes much clearer.",
            ],
            "rebelkid": [
                f"Okay, let us be honest, {topic} needs a real conversation.",
                f"This needs to be said about {topic}.",
            ],
            "shahrukhkhan": [
                f"{topic.title()} has a certain charm when you look at it closely.",
                f"Sometimes {topic} is simpler than our own fear.",
            ],
            "mrbeast": [
                f"We tested {topic} and the result was insane.",
                f"{topic} honestly surprised us.",
            ],
            "alexhormozi": [
                f"Here is the thing most people miss about {topic}.",
                f"Let me break down {topic} simply.",
            ],
            "joerogan": [
                f"Think about {topic} for a second.",
                f"{topic} gets interesting once you slow down and look deeper.",
            ],
        }
        pool_en = banks_en.get(voice, [
            f"Most people get {topic} wrong at first.",
            f"{topic.title()} is easier once you see the right angle.",
        ])
        return random.choice(pool_en)

    def _build_intro(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        persona: Dict[str, Any],
        format_type: str,
        language: str,
    ) -> str:
        angle = random.choice(niche_data["angles"])
        voice = persona["voice"]

        if language == "hinglish":
            if format_type == "short":
                shorts = {
                    "carryminati": f"Short version yeh hai, {topic} mein asli game {angle} ka hai.",
                    "samayraina":  f"Basically, {topic} ka issue ek simple pattern follow karta hai.",
                    "dhruvrathee": f"Short answer, {topic} ko simple framework se samjha ja sakta hai.",
                    "rebelkid":    f"Let us keep it real, {topic} par honey coated version kaam nahi karega.",
                    "shahrukhkhan":f"Kabhi kabhi {topic} ki sachchai bahut simple hoti hai.",
                }
                return shorts.get(voice, f"Seedhi baat yeh hai, {topic} ka main point {angle} hai.")
            longs = {
                "carryminati": f"Ab dhyaan se sun, {topic} ka scene yahi se samajh aata hai.",
                "samayraina":  f"Matlab, {topic} ka issue mostly {angle} ke around ghoomta hai.",
                "dhruvrathee": f"Aaj {topic} ko simple aur logical way mein todte hain.",
                "rebelkid":    f"Honest version yeh hai, {topic} par clearly baat karni padegi.",
                "shahrukhkhan":f"Sometimes {topic} feels complex, but the answer is actually very simple.",
                "mrbeast":     f"We are going to break down {topic} in a way that actually makes sense.",
                "alexhormozi": f"Let me break this down simply. The core of {topic} is {angle}.",
                "joerogan":    f"Think about this properly, {topic} ka deeper point {angle} hai.",
            }
            return longs.get(voice, f"Seedhi baat yeh hai, {topic} mein sabse important cheez {angle} hai.")

        if format_type == "short":
            return f"Let us keep this quick. The main point is {angle}."
        return f"The biggest thing people miss is {angle}, and that changes the whole conversation."

    def _build_beats(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        persona: Dict[str, Any],
        format_type: str,
        duration_seconds: int,
        language: str,
    ) -> List[Dict[str, Any]]:
        voice  = persona["voice"]
        angles = niche_data["angles"]

        if format_type == "short":
            kinds = [
                "problem", "why it happens", "example",
                "mistake", "solution", "build", "payoff",
            ]
        else:
            kinds = ["problem", "why it happens", "mistake", "solution", "example", "build", "payoff"]

        beat_count   = len(kinds)
        timing_step  = max(6, duration_seconds // max(1, beat_count))
        beats: List[Dict[str, Any]] = []

        for index, kind in enumerate(kinds):
            angle = random.choice(angles)

            if language == "hinglish":
                banks_hi: Dict[str, Dict[str, str]] = {
                    "carryminati": {
                        "problem":         f"Sabse badi galti yeh hoti hai ki log {topic} ko casually le lete hain.",
                        "why it happens":  f"Kyuki sabko lagta hai trend follow karna hi enough hai.",
                        "mistake":         f"Yahin pe log asli point miss kar dete hain, aur result zero jaisa ho jata hai.",
                        "solution":        f"Better approach yeh hai ki pehle basic samjho, phir action lo.",
                        "example":         f"Simple example, agar {topic} mein clarity nahi hai toh poora output weak lagta hai.",
                        "build":           f"Aur jab sahi direction mila toh sab kuch alag lag ne lagta hai, bhai seedha maan lo.",
                        "payoff":          f"Isliye {topic} mein {angle} sabse important part ban jata hai.",
                    },
                    "samayraina": {
                        "problem":         f"Matlab, {topic} ka issue usually yahi se start hota hai.",
                        "why it happens":  f"Log overthink karte hain aur simple cheez ko complicated bana dete hain.",
                        "mistake":         f"Phir wahi loop, phir wahi confusion.",
                        "solution":        f"Thoda seedha socho, phir {topic} ka scene samajh aayega.",
                        "example":         f"Example bhi simple hai, jab message clear hota hai toh reaction better aata hai.",
                        "build":           f"Aur slowly cheezein thodi better hoti hain. Thodi. [pause] Matlab, progress toh hai.",
                        "payoff":          f"Basically, {topic} mein {angle} samajhna game changer hai.",
                    },
                    "dhruvrathee": {
                        "problem":         f"Sabse pehle {topic} mein core issue ko identify karna zaroori hai.",
                        "why it happens":  f"Kyuki bina structure ke log random conclusions nikal lete hain.",
                        "mistake":         f"Yeh approach misleading ho sakti hai.",
                        "solution":        f"Better yeh hai ki hum step by step sochen.",
                        "example":         f"Jab aap {topic} ko practical example se dekhte ho, picture clear hoti hai.",
                        "payoff":          f"Isi liye {angle} ko ignore nahi karna chahiye.",
                    },
                    "rebelkid": {
                        "problem":         f"Honestly, {topic} ko log unnecessarily soft bana dete hain.",
                        "why it happens":  f"Kyuki direct bolne se sabko discomfort hota hai.",
                        "mistake":         f"Phir asli issue address hi nahi hota.",
                        "solution":        f"Seedhi baat karni padegi, warna kuch change nahi hota.",
                        "example":         f"Real life mein bhi, clear boundaries hi respect build karti hain.",
                        "payoff":          f"That is why {angle} matters more than fake politeness.",
                    },
                    "shahrukhkhan": {
                        "problem":         f"{topic} ko samajhne ke liye thoda dil aur thodi clarity dono chahiye.",
                        "why it happens":  f"Kyuki kabhi kabhi hum cheezon ko unse zyada heavy bana dete hain.",
                        "mistake":         f"Phir sach saamne hone ke baad bhi hum usse dekhte nahi.",
                        "solution":        f"Thoda rukh ke socho, answer khud saamne aa jayega.",
                        "example":         f"Jaise ek achchi kahani, {topic} bhi tabhi yaad rehta hai jab woh simple ho.",
                        "payoff":          f"Isliye {angle} ko dil se samajhna padta hai.",
                    },
                    "mrbeast": {
                        "problem":         f"We had to test {topic} because people keep getting it wrong.",
                        "why it happens":  f"Because everyone copies the same bad approach.",
                        "mistake":         f"And that kills the result every single time.",
                        "solution":        f"Once you fix the main thing, everything gets easier.",
                        "example":         f"For example, this one change can completely improve the output.",
                        "payoff":          f"That is why {angle} makes such a huge difference.",
                    },
                    "alexhormozi": {
                        "problem":         f"The problem with {topic} is usually not effort, it is direction.",
                        "why it happens":  f"Most people confuse activity with progress.",
                        "mistake":         f"That is why they stay busy but do not get results.",
                        "solution":        f"The fix is to simplify the process and focus on leverage.",
                        "example":         f"For example, clear messaging performs better than noisy messaging every time.",
                        "payoff":          f"That is the real value of {angle}.",
                    },
                    "joerogan": {
                        "problem":         f"The weird part about {topic} is how obvious it looks after the fact.",
                        "why it happens":  f"People get lost in the noise and miss the simple truth.",
                        "mistake":         f"Then the conversation gets completely off track.",
                        "solution":        f"If you slow down, the pattern becomes much clearer.",
                        "example":         f"That is what usually happens in real life too.",
                        "payoff":          f"And that is where {angle} becomes the main point.",
                    },
                }
                default_bank = {
                    "problem":        f"{topic} mein sabse common issue yahi hota hai.\nLog bina soche aage badh jaate hain.\nAur phir same problem baar baar aati hai.",
                    "why it happens": f"Log simple cheez ko unnecessarily complicated bana dete hain.\nOverthinking hoti hai, action nahi hota.\nAur wahi loop continue hota rehta hai.",
                    "mistake":        f"Phir actual result weak ho jata hai.\nSab mehnat hoti hai, direction galat hoti hai.\nAur yahi sabse badi galti hai.",
                    "solution":       f"Better hai ki aap core point pe focus karo.\n{topic} mein {angle} sabse pehle samajhna zaroori hai.\nBaaki sab uske baad naturally aata hai.",
                    "example":        f"Jab message clear hota hai, people connect faster.\nSimple language, direct point, strong result.\nYahi formula kaam karta hai.",
                    "build":          f"Aur jab sahi foundation ban jaata hai, sab kuch faster hota hai.\n{angle} ko center mein rakh ke kaam karo.\nResults compound karne lagte hain.",
                    "payoff":         f"Isi liye {angle} itna important hai.\nYeh ek chota step hai lekin sabse important hai.\nYahan se hi sab kuch change hota hai.",
                }
                bank = banks_hi.get(voice, default_bank)
            else:
                bank = {
                    "problem":        f"The main issue with {topic} is usually that people skip {angle}.",
                    "why it happens": f"Most people overcomplicate what should be simple.",
                    "mistake":        f"That is why the result stays weak.",
                    "solution":       f"The better move is to focus on clarity and execution.",
                    "example":        f"For example, clear messaging usually performs better than noise.",
                    "build":          f"Once that clarity lands, the whole thing starts to compound naturally.",
                    "payoff":         f"That is why {angle} matters so much.",
                }

            beats.append({
                "beat":         index + 1,
                "time_seconds": index * timing_step,
                "emotion":      self._beat_emotion(index + 1, beat_count, voice),
                "text":         bank.get(kind, bank["payoff"]),
            })

        return beats

    def _build_outro(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        persona: Dict[str, Any],
        format_type: str,
        language: str,
    ) -> str:
        voice = persona["voice"]
        if language == "hinglish":
            outros_hi = {
                "carryminati":  f"Bas bhai, {topic} ka scene itna hi hai. Ab samajh ke apply kar.",
                "samayraina":   f"Toh haan, {topic} ka conclusion yeh hai. Simple hai, but useful hai.",
                "dhruvrathee":  f"So, the real conclusion is simple. {topic} improves when you focus on the right fundamentals.",
                "rebelkid":     f"Bottom line, {topic} mein honesty aur clarity dono zaroori hain.",
                "shahrukhkhan": f"At the end, {topic} reminds us that clarity feels beautiful.",
                "mrbeast":      f"That is the crazy part about {topic}. Once you fix it, everything changes.",
                "alexhormozi":  f"That is the framework for {topic}. Keep it simple and execute.",
                "joerogan":     f"That is the part about {topic} worth thinking about a little longer.",
            }
            return outros_hi.get(voice, f"Bas itna yaad rakh, {topic} mein clarity hi game changer hai.")

        outros_en = {
            "carryminati":  f"That is the real deal with {topic}. Now go and do the work.",
            "samayraina":   f"So yes, {topic} ka final thought yahi hai. Simple, but not easy.",
            "dhruvrathee":  f"The conclusion is straightforward. Focus on the fundamentals of {topic}.",
            "rebelkid":     f"Bottom line, {topic} needs honesty and clarity.",
            "shahrukhkhan": f"At the end, {topic} feels meaningful when you keep it real.",
            "mrbeast":      f"That is what makes {topic} so crazy. Fix the core and everything changes.",
            "alexhormozi":  f"That is the framework. Keep it simple and execute.",
            "joerogan":     f"That is the part worth sitting with a little longer.",
        }
        return outros_en.get(voice, f"That is the simple truth about {topic}.")

    def _compose_script(
        self,
        hook: str,
        intro: str,
        beats: List[Dict[str, Any]],
        cta: str,
        outro: str,
        format_type: str,
    ) -> str:
        parts = [hook, intro]
        parts.extend(b["text"] for b in beats)
        parts.append(cta)
        parts.append(outro)
        return "\n\n".join(parts)

    def _pick_cta(self, persona: Dict[str, Any], topic: str) -> str:
        """Pick CTA from persona-specific cta_templates if available, else cta list."""
        cta_templates = persona.get("cta_templates")
        if cta_templates:
            return random.choice(cta_templates).format(topic=topic)
        cta_list = persona.get("cta", [])
        if cta_list:
            return random.choice(cta_list)
        return "Subscribe for more content."

    def generate(
        self,
        topic: str,
        niche: str = "general",
        personality: str = "default",
        format_type: str = "long",
        duration_seconds: int = 180,
        language: str = "hinglish",
        tone: str = "default",
    ) -> Dict[str, Any]:
        """
        Smart persona-aware YouTube content generator.
        Supports 9 personalities, 2 languages, 2 format types.
        No API key needed — fully offline.
        """
        topic        = (topic or "").strip()
        personality  = self._clean(personality or "default")
        format_type  = self._clean(format_type or "long")
        language     = self._clean(language or "hinglish")
        niche        = self._clean(niche or "general")

        if format_type not in {"short", "long"}:
            format_type = "long"
        if language not in {"english", "hinglish"}:
            language = "hinglish"

        topic      = self._refine_topic_for_persona(topic, personality)
        persona    = get_persona(personality)
        niche_data = self._resolve_niche_data(niche, topic)

        word_target  = self._target_word_count(duration_seconds, format_type)
        hook         = self._build_hook(topic, niche_data, persona, format_type, language)
        intro        = self._build_intro(topic, niche_data, persona, format_type, language)
        beats        = self._build_beats(topic, niche_data, persona, format_type, duration_seconds, language)
        beats        = enforce_exact_beats(beats, target=7)
        cta          = self._pick_cta(persona, topic)
        outro        = self._build_outro(topic, niche_data, persona, format_type, language)
        script_text  = self._compose_script(hook, intro, beats, cta, outro, format_type)

        seo_pack     = build_youtube_seo_pack(topic, format_type)
        viral_titles = generate_viral_titles(topic, personality, tone if tone else "default",
                                             language, niche)
        content_mode = detect_content_type(topic)

        # Deep research mode — upgrade beats to documentary arc
        if content_mode == "deep_research":
            deep = generate_deep_research_script(
                topic, personality, tone if tone else "default",
                language, niche, beats, persona
            )
            beats        = deep["beats"]
            arc_structure = deep["arc_structure"]
            script_text  = "\n\n".join(b["text"] for b in beats)
        else:
            arc_structure = None

        return {
            "platform":         "youtube",
            "topic":            topic,
            "niche":            niche,
            "language":         language,
            "personality":      personality,
            "format_type":      format_type,
            "duration_seconds": duration_seconds,
            "word_target":      word_target,
            "word_count":       len(script_text.split()),
            "hook":             hook,
            "intro":            intro,
            "beats":            beats,
            "cta":              cta,
            "outro":            outro,
            "script_text":      script_text,
            "personality_used": persona["voice"],
            "tone_style":       persona["style_notes"],
            "pacing":           persona["pacing"],
            "energy":           persona["energy"],
            # ── SEO pack ─────────────────────────────────────────────
            "seo_description":      seo_pack["description"],
            "search_queries":       seo_pack["search_queries"],
            "seo_hashtags":         seo_pack["hashtags"],
            "copyright_disclaimer": seo_pack["copyright_disclaimer"],
            # ── Intelligence layer ────────────────────────────────────
            "titles":               [t["title"] for t in viral_titles],
            "titles_with_score":    viral_titles,
            "content_mode":         content_mode,
            "arc_structure":        arc_structure,
        }



def build_youtube_seo_pack(keyword: str, format_type: str = "long") -> dict:
    """
    Build a full YouTube SEO pack: search queries, hashtags,
    copyright disclaimer, and a ready-to-paste description.
    """
    keyword  = (keyword or "").strip()
    base     = keyword or "this topic"
    slug     = "".join(ch for ch in base.lower() if ch.isalnum()) or "youtube"

    search_queries = [
        base,
        f"{base} tips",
        f"{base} guide",
        f"how to {base}",
        f"best {base}",
        f"{base} tutorial",
        f"{base} for beginners",
        f"{base} ideas",
        f"{base} strategy",
        f"{base} seo",
        f"{base} explained",
        f"{base} mistakes",
        f"{base} examples",
        f"{base} checklist",
        f"{base} best practices",
    ]

    if (format_type or "").lower() == "short":
        hashtags = [
            f"#{slug}",
            f"#{slug}shorts",
            "#shorts",
            "#youtubeshorts",
            "#youtube",
            "#viral",
            "#contentcreator",
            "#youtubeseo",
        ]
    else:
        hashtags = [
            f"#{slug}",
            f"#{slug}video",
            "#youtube",
            "#youtubevideo",
            "#tutorial",
            "#contentcreator",
            "#videoseo",
            "#creator",
        ]

    copyright_disclaimer = (
        "Copyright Disclaimer under Section 107 of the Copyright Act 1976: "
        "This video is for criticism, comment, news reporting, teaching, scholarship, and research. "
        "Fair use depends on the full context of the use and is not legal advice."
    )

    description = (
        "Don't Forget To Like, Comment, Share & Subscribe\n\n"
        "🔎 Your Queries:\n\n"
        + "\n".join(search_queries)
        + "\n\n"
        + "\n".join(hashtags)
        + "\n\n"
        + copyright_disclaimer
    )

    return {
        "keyword":              keyword,
        "search_queries":       search_queries,
        "hashtags":             hashtags,
        "copyright_disclaimer": copyright_disclaimer,
        "description":          description,
    }



# ──────────────────────────────────────────────────────────────────────
# CONTENT INTELLIGENCE LAYER
# ──────────────────────────────────────────────────────────────────────

def detect_content_type(keyword: str) -> str:
    """
    Detect if the topic needs deep-research documentary mode
    or standard content mode.
    """
    deep_keywords = [
        "exposed", "scam", "truth", "case study", "documentary",
        "dark side", "hidden", "real story", "untold", "leaked",
        "controversy", "fraud", "rise and fall", "arrested", "banned",
        "secrets", "mystery", "betrayal", "criminal", "lawsuit",
    ]
    kw = keyword.lower()
    for word in deep_keywords:
        if word in kw:
            return "deep_research"
    return "normal"


def seo_score(title: str, keyword: str) -> int:
    """
    Real SEO scoring for a YouTube title.
    Max 100. Based on keyword presence, length, power words.
    """
    score = 0
    t = title.lower()
    k = keyword.lower().strip()

    # Keyword present
    if k and k in t:
        score += 40

    # Partial keyword words match
    elif k:
        words = k.split()
        matches = sum(1 for w in words if w in t)
        score += int((matches / max(len(words), 1)) * 20)

    # Ideal title length (40–60 chars)
    n = len(title)
    if 40 <= n <= 60:
        score += 20
    elif 30 <= n <= 70:
        score += 12
    elif n <= 80:
        score += 6

    # Power / viral words
    power_words = [
        "exposed", "truth", "secret", "real", "hidden", "shocking",
        "never", "nobody", "dark", "scam", "leaked", "banned",
        "controversial", "untold", "mistake", "why", "how", "best",
    ]
    for word in power_words:
        if word in t:
            score += 8
            break  # only bonus once

    # Number in title
    if any(ch.isdigit() for ch in title):
        score += 8

    # Question hook
    if "?" in title:
        score += 4

    return min(score, 100)


def generate_viral_titles(topic: str, personality: str, tone: str,
                          language: str, niche: str) -> List[Dict[str, Any]]:
    """
    Generate 3 viral YouTube title candidates with SEO scores.
    Each title follows a different proven viral frame.
    """
    topic   = topic.strip()
    slug    = topic.lower()
    p       = personality.lower()
    is_hi   = language == "hinglish"

    # Frame templates — 3 distinct viral angles
    if is_hi:
        frames = [
            # Frame 1 — Expose / dark truth
            f"{'Bhai, ' if p == 'carryminati' else ''}{topic} ka dark truth jo koi nahi batata 😱",
            # Frame 2 — Mistake / learning
            f"{topic} mein log yeh {3} galtiyan karte hain — avoid karo",
            # Frame 3 — Curiosity / reveal
            f"Maine {topic} try kiya aur jo hua woh sochta bhi nahi tha",
        ]
    else:
        frames = [
            f"The dark truth about {topic} nobody talks about",
            f"3 biggest mistakes people make with {topic} (avoid these)",
            f"I tried {topic} for 30 days — here is what actually happened",
        ]

    # Persona twist adjustments
    tweaks = {
        "carryminati":  ["💀", "🔥", "😤"],
        "samayraina":   ["😶", "💀", "😐"],
        "dhruvrathee":  ["📊", "🧵", "🔍"],
        "mrbeast":      ["🤯", "😱", "💥"],
        "alexhormozi":  ["📈", "⚡", "🎯"],
        "default":      ["🔥", "💡", "📌"],
    }
    emojis = tweaks.get(p, tweaks["default"])

    titles = []
    for i, (frame, emoji) in enumerate(zip(frames, emojis)):
        # Append emoji if not already present
        title = frame if any(ord(c) > 127 for c in frame) else f"{frame} {emoji}"
        titles.append({
            "title":      title,
            "seo_score":  seo_score(title, topic),
            "frame":      ["dark_truth", "mistakes", "personal_story"][i],
        })

    # Sort best first
    titles.sort(key=lambda x: x["seo_score"], reverse=True)
    return titles


def generate_deep_research_script(
    topic:       str,
    personality: str,
    tone:        str,
    language:    str,
    niche:       str,
    beats:       List[Dict[str, Any]],
    persona:     Dict[str, Any],
) -> Dict[str, Any]:
    """
    Upgrade beats to deep-research / documentary structure when
    detect_content_type() returns 'deep_research'.

    7 beats → mapped to documentary arc:
    intro → background → rise → problem/expose → evidence → impact → conclusion
    """
    voice  = persona["voice"]
    is_hi  = language == "hinglish"
    t      = topic

    arc_labels = [
        "introduction",
        "background_history",
        "rise_success",
        "problem_expose",
        "evidence_facts",
        "impact",
        "conclusion",
    ]

    if is_hi:
        arc_texts = {
            "carryminati": [
                f"Bhai, {t} ka scene sunke tere hosh ud jaenge. Seedha bolta hoon kya hua.",
                f"Pehle samajh {t} ka background kya tha. Sab kuch normal lag raha tha, tab tak...",
                f"Phir {t} ne ek peak pakdi. Log deewane ho gaye, paisa aaya, fame aaya.",
                f"Lekin yahin se gadbad shuru hui. Jo cheez chal rahi thi, uski asli sach saamne aayi.",
                f"Evidence ki baat karein toh — real events, real numbers, real consequences. Ignore mat karna.",
                f"Iska impact? Log barbad hue, trust tuta, aur ek puri industry ka scene badal gaya.",
                f"Conclusion simple hai bhai. {t} se sabak yeh hai ki shortcut aur hype hamesha khatam hote hain.",
            ],
            "samayraina": [
                f"Toh basically {t} ki kahani shuru hoti hai ek simple cheez se. Aur phir... haan.",
                f"History dekhein toh {t} ek pattern follow karta hai. Har baar wahi hota hai.",
                f"Ek point tha jab {t} bilkul top pe tha. Sab log involved the. Sab khush the.",
                f"Phir woh moment aaya. The problem. The thing nobody talked about openly.",
                f"Facts yeh hain. Real events. Real damage. Aur phir bhi log surprised hote hain.",
                f"Impact massive tha. Logon ki zindagiyan, businesses, trust — sab affect hua.",
                f"Conclusion? {t} ek reminder hai ki hype aur reality mein gap hota hai. Classic.",
            ],
        }
        default_arc = [
            f"{t} ek aisa topic hai jo bahut serious hai. Aaj seedha baat karte hain.",
            f"Background samajhna zaroori hai. {t} ka history batata hai kahan se shuru hua.",
            f"Ek time tha jab {t} top pe tha — logon ne invest kiya, trust kiya, follow kiya.",
            f"Phir problem saamne aayi. Jo dikhaya gaya aur jo tha, woh alag tha.",
            f"Evidence clear hai. Numbers, events, aur testimonials sab point karte hain usi taraf.",
            f"Impact widespread tha. Common log sabse zyada affected hue.",
            f"Takeaway: {t} se samajh aata hai ki research aur awareness kitni important hai.",
        ]
        texts = arc_texts.get(voice.split(",")[0].strip().lower(), None)
        if not texts:
            texts = default_arc
    else:
        texts = [
            f"Today we are talking about {t} — and what you are about to hear might surprise you.",
            f"To understand what happened, we need to go back to where {t} started.",
            f"At its peak, {t} seemed unstoppable. Everyone was on board.",
            f"Then the cracks started showing. The real story behind {t} was very different.",
            f"The evidence is clear — facts, events, and consequences that were ignored.",
            f"The impact on real people was significant. Trust was broken at scale.",
            f"The lesson from {t} is straightforward: hype fades, fundamentals remain.",
        ]

    emotions = [
        "curiosity", "context", "excitement", "tension",
        "clarity", "impact", "motivation",
    ]

    upgraded_beats = []
    for i, (label, text, emotion) in enumerate(zip(arc_labels, texts, emotions)):
        upgraded_beats.append({
            "beat":         i + 1,
            "time_seconds": beats[i]["time_seconds"] if i < len(beats) else i * 15,
            "emotion":      emotion,
            "arc_label":    label,
            "text":         text,
        })

    return {
        "mode":          "deep_research",
        "beats":         upgraded_beats,
        "arc_structure": arc_labels,
    }


def enforce_exact_beats(beats: list, target: int = 7) -> list:
    """
    Guarantee the output has exactly `target` beats.
    - Too many  → merge extras into the last beat.
    - Too few   → split the longest beat.
    - Same word budget, more beats, smaller chunks per beat.
    """
    if not beats:
        return beats

    beats = [b for b in beats if isinstance(b, dict) and b.get("text")]

    if len(beats) == target:
        for i, beat in enumerate(beats, 1):
            beat["beat"] = i
        return beats

    # Too many → merge excess into last beat
    if len(beats) > target:
        fixed      = beats[: target - 1]
        extra_text = " ".join(b["text"] for b in beats[target - 1 :])
        last       = dict(beats[target - 1])
        last["beat"] = target
        last["text"] = f"{last.get('text', '')} {extra_text}".strip()
        fixed.append(last)
        for i, beat in enumerate(fixed, 1):
            beat["beat"] = i
        return fixed

    # Too few → split longest beat until we hit target
    while len(beats) < target:
        longest_index = max(range(len(beats)), key=lambda i: len(beats[i].get("text", "")))
        text  = beats[longest_index]["text"]
        parts = [p.strip() for p in text.replace("।", ".").split(".") if p.strip()]

        if len(parts) >= 2:
            first = parts[0]
            rest  = ". ".join(parts[1:])
        else:
            words = text.split()
            mid   = max(1, len(words) // 2)
            first = " ".join(words[:mid]).strip()
            rest  = " ".join(words[mid:]).strip() or first

        beats[longest_index]["text"] = first
        new_beat = dict(beats[longest_index])
        new_beat["text"] = rest
        beats.insert(longest_index + 1, new_beat)

    for i, beat in enumerate(beats[:target], 1):
        beat["beat"] = i
    return beats[:target]


# ── Convenient singleton ──────────────────────────────────
youtube_engine = YouTubeIntelligenceEngine()