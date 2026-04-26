from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Dict, List
import random
import re


@dataclass
class TikTokPack:
    topic: str
    niche: str
    tone: str
    objective: str
    video_style: str
    hook: str
    cover_text: str
    caption: str
    hashtags: List[str]
    on_screen_text: List[str]
    beat_plan: List[Dict[str, Any]]
    shot_plan: List[Dict[str, Any]]
    cta: str
    comment_bait: str
    editing_notes: List[str]
    audience_targeting: Dict[str, Any]
    engagement_prediction: Dict[str, Any]
    posting_window: Dict[str, Any]
    variants: List[str]
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TikTokEngine:
    """
    TikTok short form intelligence engine.

    Produces: hook, cover text, caption, hashtags, on screen text,
    beat plan, shot plan, CTA, comment bait, editing notes,
    audience targeting, engagement prediction, posting window, variants.
    """

    NICHE_MAP: Dict[str, Dict[str, Any]] = {
        "gaming": {
            "keywords": ["gaming", "rank up", "win streak", "strategy", "pro tips", "mobile gaming"],
            "audience": ["gamers", "mobile gamers", "competitive players"],
            "angles": ["challenge", "skill gap", "rank push", "mistake fix"],
            "hooks": [
                "You are losing games because of this one mistake",
                "Stop playing like this if you want to rank up",
                "99% players do this wrong",
                "This will instantly improve your gameplay",
            ],
            "visual_style": "fast cuts, reaction shots, gameplay overlays",
        },
        "fitness": {
            "keywords": ["fitness", "workout", "fat loss", "muscle", "home workout", "training"],
            "audience": ["fitness beginners", "gym users", "weight loss audience"],
            "angles": ["transformation", "discipline", "results", "consistency"],
            "hooks": [
                "Your workout is failing because of this",
                "Do this for better results",
                "Stop wasting time in the gym",
                "This is the fastest way to build consistency",
            ],
            "visual_style": "before after visuals, energetic cuts, rep overlays",
        },
        "beauty": {
            "keywords": ["beauty", "skincare", "glow up", "makeup", "routine", "aesthetic"],
            "audience": ["women", "beauty lovers", "self care audience"],
            "angles": ["glow", "confidence", "routine", "before after"],
            "hooks": [
                "This glow up trick is actually worth it",
                "Stop doing this to your skin",
                "Your routine is missing this",
                "This changed my look completely",
            ],
            "visual_style": "soft light, close ups, clean transitions",
        },
        "fashion": {
            "keywords": ["fashion", "outfit", "style", "aesthetic", "lookbook", "dress ideas"],
            "audience": ["women", "students", "style focused users"],
            "angles": ["aesthetic", "confidence", "simple styling", "trend driven"],
            "hooks": [
                "These outfit ideas never fail",
                "Stop wearing clothes this way",
                "This style instantly looks better",
                "Save this for your next fit check",
            ],
            "visual_style": "mirror shots, outfit transitions, aesthetic frames",
        },
        "finance": {
            "keywords": ["money", "income", "side hustle", "wealth", "budget", "financial freedom"],
            "audience": ["students", "young professionals", "entrepreneurs"],
            "angles": ["money mindset", "earning", "saving", "freedom"],
            "hooks": [
                "You are not broke because of luck",
                "This money mistake is killing your growth",
                "Most people stay broke because of this",
                "Here is the fastest way to think about money better",
            ],
            "visual_style": "text heavy, clean charts, direct to camera",
        },
        "technology": {
            "keywords": ["AI", "tools", "automation", "app", "tech tips", "productivity"],
            "audience": ["creators", "founders", "students", "builders"],
            "angles": ["speed", "future", "efficiency", "smart work"],
            "hooks": [
                "This AI tool saves hours",
                "You are not using tech properly",
                "This workflow changes everything",
                "Most people do not know this tool exists",
            ],
            "visual_style": "screen recordings, overlays, clean edits",
        },
        "lifestyle": {
            "keywords": ["lifestyle", "routine", "habits", "daily life", "balance", "wellness"],
            "audience": ["general audience", "young adults", "women"],
            "angles": ["relatable", "better life", "simple habits", "daily upgrade"],
            "hooks": [
                "Your daily routine is quietly ruining you",
                "Try this if you want a better life",
                "This small habit changes everything",
                "Nobody tells you this about lifestyle change",
            ],
            "visual_style": "aesthetic b roll, clean home shots, soft cuts",
        },
        "travel": {
            "keywords": ["travel", "trip", "budget travel", "hidden gems", "places to visit", "adventure"],
            "audience": ["travel lovers", "students", "couples"],
            "angles": ["explore", "freedom", "hidden gems", "save worthy"],
            "hooks": [
                "This place looks unreal",
                "Stop visiting crowded tourist spots",
                "Hidden gems you need to see",
                "This travel hack saves money",
            ],
            "visual_style": "cinematic clips, map overlays, scenic cuts",
        },
        "education": {
            "keywords": ["study tips", "learning", "exam prep", "students", "smart study", "focus"],
            "audience": ["students", "parents", "learners"],
            "angles": ["clarity", "better scores", "study smart", "less stress"],
            "hooks": [
                "You are studying the wrong way",
                "This study method actually works",
                "Stop wasting time while studying",
                "Do this if you want better scores",
            ],
            "visual_style": "whiteboard style, notes, screen text, clean pacing",
        },
        "comedy": {
            "keywords": ["funny", "relatable", "meme", "humor", "life", "gen z"],
            "audience": ["general audience", "gen z", "social users"],
            "angles": ["relatable", "chaotic", "shareable", "comment bait"],
            "hooks": [
                "This is too real",
                "Why is this literally my life",
                "We all do this and pretend we do not",
                "This one is painfully accurate",
            ],
            "visual_style": "reaction cuts, text jokes, quick punchlines",
        },
        "personal growth": {
            "keywords": ["growth", "discipline", "mindset", "habits", "success", "focus"],
            "audience": ["students", "creators", "founders", "self improvement audience"],
            "angles": ["discipline", "consistency", "clarity", "version upgrade"],
            "hooks": [
                "Your life changes when you stop doing this",
                "This habit is killing your potential",
                "Most people never fix this",
                "Start here if you want real growth",
            ],
            "visual_style": "strong text overlays, calm confident delivery",
        },
    }

    TONE_LIBRARY: Dict[str, Dict[str, Any]] = {
        "default": {
            "energy": "medium",
            "style": "clear, natural, direct",
            "cta": ["Comment your take", "Save this", "Follow for more"],
        },
        "bold": {
            "energy": "high",
            "style": "punchy, confident, direct",
            "cta": ["Comment if you agree", "Save this now", "Share this with a friend"],
        },
        "funny": {
            "energy": "high",
            "style": "relatable, witty, fast",
            "cta": ["Tag a friend", "Comment the funniest part", "Share if this is too real"],
        },
        "educational": {
            "energy": "medium",
            "style": "clear, structured, useful",
            "cta": ["Save this for later", "Follow for more tips", "Comment if you want part 2"],
        },
        "emotional": {
            "energy": "medium",
            "style": "warm, honest, reflective",
            "cta": ["Share this with someone", "Save this for later", "Tell me if this hit home"],
        },
        "controversial": {
            "energy": "high",
            "style": "sharp, opinionated, conversation starter",
            "cta": ["Agree or disagree", "Drop your opinion", "Share this if it made you think"],
        },
    }

    VIDEO_STYLES = [
        "talking head",
        "voiceover with b roll",
        "screen recording",
        "reaction style",
        "trend remix",
        "listicle style",
        "storytime style",
    ]

    def __init__(self) -> None:
        pass

    # ── Main entry point ───────────────────────────────────────────────
    def generate(
        self,
        topic: str,
        niche: str = "lifestyle",
        tone: str = "default",
        objective: str = "watch_time",
        duration_seconds: int = 30,
    ) -> TikTokPack:
        topic     = self._clean(topic)
        niche     = self._clean(niche)
        tone      = self._clean(tone)
        objective = self._clean(objective)

        niche_data   = self._resolve_niche(topic, niche)
        tone_data    = self.TONE_LIBRARY.get(tone, self.TONE_LIBRARY["default"])
        video_style  = self._choose_video_style(objective, tone, niche_data)

        hook            = self._build_hook(topic, niche_data, tone, objective)
        cover_text      = self._build_cover_text(topic, niche_data, tone)
        caption         = self._build_caption(topic, niche_data, tone_data, objective)
        hashtags        = self._build_hashtags(topic, niche_data, tone)
        on_screen_text  = self._build_on_screen_text(topic, niche_data, tone, duration_seconds)
        beat_plan       = self._build_beat_plan(topic, niche_data, tone, duration_seconds)
        shot_plan       = self._build_shot_plan(topic, niche_data, video_style, duration_seconds)
        cta             = self._build_cta(tone_data, objective)
        comment_bait    = self._build_comment_bait(topic, niche_data, objective)
        editing_notes   = self._build_editing_notes(video_style, tone, objective)
        audience_targeting    = self._build_audience_targeting(niche_data, tone, objective)
        engagement_prediction = self._predict_engagement(topic, niche_data, tone, objective, hashtags, duration_seconds)
        posting_window  = self._best_posting_window(niche, objective, tone)
        variants        = self._build_variants(topic, niche_data, tone_data, hook, cta)

        return TikTokPack(
            topic=topic,
            niche=niche,
            tone=tone,
            objective=objective,
            video_style=video_style,
            hook=hook,
            cover_text=cover_text,
            caption=caption,
            hashtags=hashtags,
            on_screen_text=on_screen_text,
            beat_plan=beat_plan,
            shot_plan=shot_plan,
            cta=cta,
            comment_bait=comment_bait,
            editing_notes=editing_notes,
            audience_targeting=audience_targeting,
            engagement_prediction=engagement_prediction,
            posting_window=posting_window,
            variants=variants,
            generated_at=datetime.utcnow().isoformat(),
        )

    # ── Helpers ────────────────────────────────────────────────────────
    def _clean(self, text: str) -> str:
        return re.sub(r"\s+", " ", text.strip().lower())

    def _resolve_niche(self, topic: str, niche: str) -> Dict[str, Any]:
        for key, data in self.NICHE_MAP.items():
            if key in topic:
                return data
        return self.NICHE_MAP.get(niche, self.NICHE_MAP["lifestyle"])

    def _choose_video_style(self, objective: str, tone: str, niche_data: Dict[str, Any]) -> str:
        if tone == "funny":
            return "reaction style"
        if tone == "educational":
            return "voiceover with b roll"
        if objective in {"watch_time", "retention"}:
            return random.choice(["talking head", "voiceover with b roll", "storytime style"])
        return random.choice(self.VIDEO_STYLES)

    def _build_hook(self, topic: str, niche_data: Dict[str, Any], tone: str, objective: str) -> str:
        hook_pool = niche_data["hooks"][:]
        if tone == "controversial":
            hook_pool += [
                f"Hot take: {topic} is not working for most people",
                f"Unpopular opinion: most people are doing {topic} wrong",
            ]
        elif tone == "educational":
            hook_pool += [
                f"Here is the fastest way to understand {topic}",
                f"If you want {topic}, start here",
            ]
        elif tone == "funny":
            hook_pool += [
                f"Be honest, we all mess up {topic}",
                f"This is painfully accurate if you deal with {topic}",
            ]
        return random.choice(hook_pool)

    def _build_cover_text(self, topic: str, niche_data: Dict[str, Any], tone: str) -> str:
        options = [
            "STOP DOING THIS",
            f"{topic.upper()}",
            f"BEST {topic.upper()} TIPS",
            "THIS WILL HELP",
            "FIX THIS NOW",
        ]
        if tone == "funny":
            options.append("THIS IS TOO REAL")
        if tone == "controversial":
            options.append("HOT TAKE")
        return random.choice(options)

    def _build_caption(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        tone_data: Dict[str, Any],
        objective: str,
    ) -> str:
        angle = random.choice(niche_data["angles"])
        cta   = random.choice(tone_data["cta"])
        return (
            f"{topic.title()} is easier when you keep it simple. "
            f"Use this {angle} approach, keep the first 3 seconds strong, and make the message easy to follow. "
            f"{cta}. "
            f"Save this for later if you want to come back to it."
        )

    def _build_hashtags(self, topic: str, niche_data: Dict[str, Any], tone: str) -> List[str]:
        raw = [
            topic,
            f"{topic} tips",
            f"{topic} ideas",
            f"{topic} for beginners",
            f"best {topic}",
            random.choice(niche_data["keywords"]),
            random.choice(niche_data["keywords"]),
            random.choice(["viral", "fyp", "tiktok", "shortform", "trending"]),
        ]
        result: List[str] = []
        for item in raw:
            clean = re.sub(r"[^a-z0-9 ]+", "", item.lower()).strip().replace(" ", "")
            if clean and f"#{clean}" not in result:
                result.append(f"#{clean}")
        return result[:10]

    def _build_on_screen_text(
        self, topic: str, niche_data: Dict[str, Any], tone: str, duration_seconds: int
    ) -> List[str]:
        base = [
            "Stop scrolling",
            random.choice(niche_data["hooks"]),
            f"{topic.title()}",
            "Here is the fix",
            "Save this",
        ]
        if duration_seconds <= 20:
            base = base[:4]
        if tone == "funny":
            base.insert(1, "Be honest")
        if tone == "controversial":
            base.insert(1, "Hot take")
        return base

    def _build_beat_plan(
        self, topic: str, niche_data: Dict[str, Any], tone: str, duration_seconds: int
    ) -> List[Dict[str, Any]]:
        total_beats = 4 if duration_seconds <= 20 else 5
        beat_templates = [
            "Hook the viewer immediately",
            "State the core idea",
            "Add proof, contrast, or example",
            "Push the payoff",
            "End with CTA",
        ]
        beats: List[Dict[str, Any]] = []
        timing = 0
        for i in range(total_beats):
            beats.append({
                "beat":         i + 1,
                "time_seconds": timing,
                "purpose":      beat_templates[i],
                "energy":       "high" if i == 0 or tone in {"bold", "controversial"} else "medium",
            })
            timing += max(3, duration_seconds // total_beats)
        return beats

    def _build_shot_plan(
        self, topic: str, niche_data: Dict[str, Any], video_style: str, duration_seconds: int
    ) -> List[Dict[str, Any]]:
        shots = [
            {"shot": 1, "visual": "strong hook face camera",           "purpose": "first 2 seconds"},
            {"shot": 2, "visual": "supporting b roll or screen text",   "purpose": "context"},
            {"shot": 3, "visual": "main explanation",                   "purpose": "value delivery"},
            {"shot": 4, "visual": "proof, result, or example",          "purpose": "credibility"},
            {"shot": 5, "visual": "CTA frame",                          "purpose": "comment, share, follow"},
        ]
        if duration_seconds <= 20:
            shots = shots[:4]
        for shot in shots:
            shot["style"] = video_style
        return shots

    def _build_cta(self, tone_data: Dict[str, Any], objective: str) -> str:
        base = list(tone_data["cta"])
        if objective == "comments":
            base.append("Tell me your take below")
        elif objective == "shares":
            base.append("Send this to a friend")
        elif objective == "saves":
            base.append("Save this for later")
        elif objective == "watch_time":
            base.append("Watch till the end")
        return random.choice(base)

    def _build_comment_bait(self, topic: str, niche_data: Dict[str, Any], objective: str) -> str:
        options = [
            f"Do you agree with this {topic} take?",
            f"What would you change about {topic}?",
            f"Which part of {topic} matters most to you?",
            f"Be honest, is this true for you too?",
        ]
        if objective == "comments":
            options = [
                f"Comment your opinion on {topic}",
                f"Which side are you on when it comes to {topic}?",
                f"Tell me the truth about your {topic} experience",
            ]
        return random.choice(options)

    def _build_editing_notes(self, video_style: str, tone: str, objective: str) -> List[str]:
        notes = [
            "Cut every pause that does not add tension",
            "Use big readable text on screen",
            "Keep the hook in the first second",
            "Use visual changes every 1 to 2 seconds",
            "End on a loop friendly frame",
        ]
        if video_style == "voiceover with b roll":
            notes.append("Match b roll to every key phrase")
        if tone == "funny":
            notes.append("Let punchlines breathe for half a second")
        if tone == "controversial":
            notes.append("Use sharper cuts and stronger emphasis")
        if objective == "watch_time":
            notes.append("Create curiosity gap between beat 1 and beat 2")
        return notes

    def _build_audience_targeting(
        self, niche_data: Dict[str, Any], tone: str, objective: str
    ) -> Dict[str, Any]:
        return {
            "audience_segments": niche_data["audience"],
            "tone":              tone,
            "objective":         objective,
            "best_behavior":     "watch, comment, share, follow",
            "content_angle":     random.choice(niche_data["angles"]),
        }

    def _predict_engagement(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        tone: str,
        objective: str,
        hashtags: List[str],
        duration_seconds: int,
    ) -> Dict[str, Any]:
        score = 50
        if len(hashtags) >= 8:
            score += 10
        if tone in {"bold", "funny", "controversial"}:
            score += 10
        if objective in {"watch_time", "comments", "shares"}:
            score += 10
        if duration_seconds <= 35:
            score += 10
        if any(w in topic for w in ["how", "why", "best", "stop", "mistake", "fix"]):
            score += 10
        score = max(0, min(100, score))
        return {
            "viral_score":      score,
            "retention_score":  min(100, score + random.randint(-5, 8)),
            "comment_potential":min(100, score + random.randint(-5, 8)),
            "share_potential":  min(100, score + random.randint(-5, 8)),
            "save_potential":   min(100, score + random.randint(-5, 8)),
            "reason":           "Strong hook, short structure, and clear viewer payoff",
        }

    def _best_posting_window(self, niche: str, objective: str, tone: str) -> Dict[str, Any]:
        if niche in {"fitness", "education", "personal growth"}:
            day, hour = "Monday",    "07:00 AM"
        elif niche in {"finance", "technology"}:
            day, hour = "Wednesday", "08:00 PM"
        elif niche in {"comedy", "lifestyle", "beauty", "fashion"}:
            day, hour = "Friday",    "06:30 PM"
        else:
            day, hour = "Thursday",  "07:30 PM"
        if objective in {"comments", "shares"}:
            hour = "08:30 PM"
        return {
            "best_day":  day,
            "best_time": hour,
            "reason":    "TikTok often performs well when the audience is active and likely to engage",
        }

    def _build_variants(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        tone_data: Dict[str, Any],
        hook: str,
        cta: str,
    ) -> List[str]:
        angle = random.choice(niche_data["angles"])
        return [
            hook,
            f"{topic.title()} in 3 simple steps",
            f"Why most people get {topic} wrong",
            f"Try this {angle} version of {topic}",
            f"{cta}. {topic.title()} gets easier after this",
        ]