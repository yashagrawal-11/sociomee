import random
from typing import Any, Dict, List


# ── Niche Intelligence Brain ───────────────────────────────────────────────
NICHE_INTELLIGENCE: Dict[str, Dict[str, Any]] = {
    "gaming": {
        "emotions":    ["excitement", "competition", "achievement"],
        "power_words": ["insane", "pro tips", "rank up", "secret trick"],
        "hooks": [
            "This will change your gameplay forever",
            "99% players don't know this",
            "Stop playing like this",
            "You're making this mistake in every match",
        ],
    },
    "fitness": {
        "emotions":    ["discipline", "motivation", "transformation"],
        "power_words": ["fat loss", "burn", "routine", "no excuses"],
        "hooks": [
            "This routine actually works",
            "Stop wasting time in gym",
            "Do this daily for results",
            "You don't need hours for this",
        ],
    },
    "beauty": {
        "emotions":    ["confidence", "glow", "self-love"],
        "power_words": ["glow up", "flawless", "routine", "secret"],
        "hooks": [
            "This changed my skin completely",
            "Stop doing this to your skin",
            "Your glow up starts here",
            "No one talks about this",
        ],
    },
    "finance": {
        "emotions":    ["fear", "freedom", "security"],
        "power_words": ["passive income", "money", "rich", "income"],
        "hooks": [
            "Stop being broke in 2026",
            "This is why you're not rich",
            "Your money habits are wrong",
            "Fix this before it's too late",
        ],
    },
    "technology": {
        "emotions":    ["curiosity", "innovation"],
        "power_words": ["AI", "future", "automation", "tools"],
        "hooks": [
            "This AI will replace your job",
            "You're not using this tech properly",
            "Future is already here",
            "This tool will save you hours",
        ],
    },
    "lifestyle": {
        "emotions":    ["aspiration", "comfort"],
        "power_words": ["routine", "habits", "balance", "life"],
        "hooks": [
            "This will improve your life instantly",
            "Your daily habits are ruining you",
            "Try this for a better life",
            "Small changes, big impact",
        ],
    },
    "travel": {
        "emotions":    ["freedom", "adventure"],
        "power_words": ["hidden gems", "budget", "luxury", "explore"],
        "hooks": [
            "This place feels unreal",
            "Stop visiting crowded places",
            "Hidden gems you must visit",
            "Travel smarter, not harder",
        ],
    },
    "education": {
        "emotions":    ["growth", "clarity"],
        "power_words": ["learn", "skills", "study", "focus"],
        "hooks": [
            "Study smarter, not harder",
            "This method works every time",
            "Stop studying like this",
            "You're doing this wrong",
        ],
    },
    "comedy": {
        "emotions":    ["relatable", "fun"],
        "power_words": ["funny", "relatable", "truth"],
        "hooks": [
            "This is too real",
            "Why is this so accurate",
            "We all do this",
            "This is literally me",
        ],
    },
    "self improvement": {
        "emotions":    ["growth", "discipline", "focus"],
        "power_words": ["better", "growth", "discipline", "success"],
        "hooks": [
            "Your life will change after this",
            "Start this today",
            "Stop wasting your potential",
            "Become your best version",
        ],
    },
}

_FALLBACK_NICHE = NICHE_INTELLIGENCE["lifestyle"]


class PinterestEngine:

    def __init__(self) -> None:
        pass

    # ── Niche detector ─────────────────────────────────────────────────
    def detect_niche(self, topic: str, niche: str) -> Dict[str, Any]:
        topic_lower = topic.lower()
        for key in NICHE_INTELLIGENCE:
            if key in topic_lower:
                return NICHE_INTELLIGENCE[key]
        return NICHE_INTELLIGENCE.get(niche.lower(), _FALLBACK_NICHE)

    # ── Main entry point ───────────────────────────────────────────────
    def generate(self, topic: str, niche: str = "general") -> Dict[str, Any]:
        niche_data  = self.detect_niche(topic, niche)
        hook        = random.choice(niche_data["hooks"])
        power_word  = random.choice(niche_data["power_words"])
        emotion     = random.choice(niche_data["emotions"])

        title       = f"{hook} | {power_word.title()} Guide"
        description = self._description(topic, hook, emotion)
        keywords    = self._keywords(topic, niche_data)
        hashtags    = self._hashtags(keywords, niche_data)
        score       = self._viral_score(title, description, keywords, hashtags)

        return {
            "platform":   "pinterest",
            "topic":      topic,
            "niche":      niche,
            "niche_data": {
                "detected_emotions": niche_data["emotions"],
                "power_words":       niche_data["power_words"],
            },
            "pin_titles":  self._pin_titles(topic, hook, power_word),
            "description": description,
            "keywords":    keywords,
            "hashtags":    hashtags,
            "board_names": self._board_names(topic, niche),
            "best_time":   self._best_time(),
            "pin_ideas":   self._pin_ideas(topic, niche_data),
            "cta":         self._cta(niche),
            "scores": {
                "viral_score": score,
                "level":       "HIGH" if score >= 80 else "MEDIUM" if score >= 60 else "LOW",
                "label":       "Pinterest Viral Score",
            },
        }

    # ── Pin titles ─────────────────────────────────────────────────────
    def _pin_titles(self, topic: str, hook: str, power_word: str) -> List[str]:
        t = topic.title()
        return [
            f"{hook} | {power_word.title()} Guide",
            f"{t} — Complete Guide for Beginners",
            f"How to Master {t} (Step by Step)",
            f"Best {t} Tips That Actually Work",
            f"The Ultimate {t} Checklist",
        ]

    # ── Description ────────────────────────────────────────────────────
    def _description(self, topic: str, hook: str, emotion: str) -> str:
        return (
            f"{hook}. This {topic} guide is designed to help you with "
            f"{emotion} and real results. "
            f"Save this pin now so you don't forget these tips. "
            f"If you're serious about {topic}, you'll want to come back to this again."
        )

    # ── Keywords (niche-aware) ─────────────────────────────────────────
    def _keywords(self, topic: str, niche_data: Dict[str, Any]) -> List[str]:
        base = topic.lower()
        raw  = [
            f"{base} tips", f"{base} guide", f"best {base}",
            f"{base} ideas", f"{base} for beginners", f"{base} strategy",
        ] + [f"{w} {base}" for w in niche_data["power_words"]]
        seen, out = set(), []
        for k in raw:
            if k not in seen:
                seen.add(k)
                out.append(k)
        return out

    # ── Hashtags (niche-aware) ─────────────────────────────────────────
    def _hashtags(self, keywords: List[str], niche_data: Dict[str, Any]) -> List[str]:
        raw = (
            [f"#{k.replace(' ', '')}" for k in keywords[:8]]
            + [f"#{w.replace(' ', '')}" for w in niche_data["power_words"][:4]]
            + ["#savethispin", "#pinterestmarketing", "#viral", "#pinoftheday"]
        )
        seen, out = set(), []
        for h in raw:
            if h not in seen:
                seen.add(h)
                out.append(h)
        return out

    # ── Board names ────────────────────────────────────────────────────
    def _board_names(self, topic: str, niche: str) -> List[str]:
        t, n = topic.title(), niche.title()
        return [
            f"{t} Tips & Ideas",
            f"{n} Inspiration",
            f"Best of {t}",
            f"{n} Growth Hacks",
            f"{t} Aesthetic",
        ]

    # ── Best time ──────────────────────────────────────────────────────
    def _best_time(self) -> Dict[str, str]:
        return {
            "days":   "Saturday and Sunday",
            "time":   "8:00 PM – 11:00 PM",
            "reason": "Pinterest traffic peaks on weekends during evening hours.",
        }

    # ── Pin ideas (niche-aware hooks injected) ─────────────────────────
    def _pin_ideas(self, topic: str, niche_data: Dict[str, Any]) -> List[str]:
        hook = random.choice(niche_data["hooks"])
        return [
            f"Infographic: {hook} — applied to {topic}",
            f"Before and after results of {topic}",
            f"Top 10 {topic} mistakes to avoid",
            f"Beginner's checklist for {topic}",
            f"Quote pin: '{hook}' with aesthetic background",
            f"Tutorial pin: how to start {topic} from scratch",
        ]

    # ── CTA ────────────────────────────────────────────────────────────
    def _cta(self, niche: str) -> List[str]:
        return [
            "Save this pin for later!",
            "Click through for the full guide.",
            f"Follow our {niche} board for more tips.",
            "Tag a friend who needs this!",
        ]

    # ── Smart viral score ──────────────────────────────────────────────
    def _viral_score(
        self,
        title: str,
        description: str,
        keywords: List[str],
        hashtags: List[str],
    ) -> int:
        score = 50
        if "save" in description.lower():
            score += 20
        if len(keywords) > 8:
            score += 10
        if any(w in title.lower() for w in ["stop", "why", "secret", "this", "don't"]):
            score += 10
        if len(hashtags) >= 8:
            score += 10
        score += random.randint(0, 10)
        return min(score, 100)