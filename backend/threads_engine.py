from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Dict, List
import random
import re


@dataclass
class ThreadsPack:
    topic: str
    niche: str
    tone: str
    objective: str
    thread_type: str
    hook: str
    opening_line: str
    full_thread: str
    segments: List[Dict[str, Any]]
    discussion_prompt: str
    cta: str
    hashtags: List[str]
    discoverability_keywords: List[str]
    audience_targeting: Dict[str, Any]
    emotional_arc: List[str]
    content_blocks: List[Dict[str, Any]]
    formatting_notes: List[str]
    posting_window: Dict[str, Any]
    engagement_prediction: Dict[str, Any]
    variants: List[str]
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class ThreadsEngine:
    """
    Threads content intelligence engine.
    Built for conversation-first posts.
    """

    NICHE_MAP: Dict[str, Dict[str, Any]] = {
        "business": {
            "keywords": ["business", "growth", "sales", "lead generation", "offer", "audience"],
            "audience": ["founders", "marketers", "creators", "small business owners"],
            "angles": ["authority", "conversion", "trust", "clarity"],
            "hooks": [
                "Most businesses ignore this one thing",
                "This can improve your business fast",
                "Here is where many brands lose money",
                "A smarter way to build trust",
            ],
        },
        "marketing": {
            "keywords": ["marketing", "content", "copy", "branding", "conversion", "attention"],
            "audience": ["marketers", "agency owners", "founders", "creators"],
            "angles": ["attention", "conversion", "retention", "positioning"],
            "hooks": [
                "Most content fails because of this",
                "This marketing shift can change your results",
                "A smarter way to market your offer",
                "Your audience notices this more than you think",
            ],
        },
        "finance": {
            "keywords": ["money", "income", "wealth", "saving", "investment", "cash flow"],
            "audience": ["students", "young professionals", "side hustlers", "founders"],
            "angles": ["freedom", "security", "clarity", "growth"],
            "hooks": [
                "Most people stay stuck because of this",
                "This money habit matters more than people think",
                "A simple finance rule that saves stress",
                "This is the difference between broke and building",
            ],
        },
        "education": {
            "keywords": ["learning", "study", "skills", "focus", "guides", "notes"],
            "audience": ["students", "teachers", "learners", "parents"],
            "angles": ["clarity", "progress", "confidence", "results"],
            "hooks": [
                "If you are learning this, start here",
                "This study method is more useful than people think",
                "A cleaner way to understand the topic",
                "This is how smart learning feels",
            ],
        },
        "technology": {
            "keywords": ["AI", "tools", "automation", "software", "productivity", "systems"],
            "audience": ["builders", "founders", "creators", "tech lovers"],
            "angles": ["speed", "efficiency", "future", "leverage"],
            "hooks": [
                "Most people are not using this properly",
                "This tool can save hours every week",
                "A smarter way to work with technology",
                "This is where the future is moving",
            ],
        },
        "lifestyle": {
            "keywords": ["routine", "habits", "balance", "wellness", "life", "daily"],
            "audience": ["general audience", "young adults", "women", "creators"],
            "angles": ["balance", "comfort", "better living", "consistency"],
            "hooks": [
                "A small habit that improves daily life",
                "This lifestyle change feels simple but works",
                "Most people forget this part of life",
                "This can make your day feel lighter",
            ],
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
        },
        "gaming": {
            "keywords": ["gaming", "rank up", "win streak", "strategy", "pro tips", "mobile gaming"],
            "audience": ["gamers", "mobile gamers", "competitive players"],
            "angles": ["challenge", "skill gap", "rank push", "mistake fix"],
            "hooks": [
                "You are losing games because of this one mistake",
                "Stop playing like this if you want to rank up",
                "99 percent players do this wrong",
                "This will instantly improve your gameplay",
            ],
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
        },
        "personal growth": {
            "keywords": ["growth", "discipline", "mindset", "focus", "habits", "success"],
            "audience": ["students", "founders", "creators", "self improvement audience"],
            "angles": ["discipline", "clarity", "consistency", "progress"],
            "hooks": [
                "Most people never build this habit",
                "This is a simple way to grow faster",
                "A useful reminder for your future self",
                "This is where real progress starts",
            ],
        },
        "community": {
            "keywords": ["community", "discussion", "support", "group", "update", "announcement"],
            "audience": ["members", "customers", "fans", "followers"],
            "angles": ["belonging", "interaction", "feedback", "trust"],
            "hooks": [
                "Let us talk about something important",
                "I want your honest opinion on this",
                "This question matters for the whole community",
                "Your input can shape what happens next",
            ],
        },
        "health": {
            "keywords": ["health", "wellness", "routine", "energy", "sleep", "fitness"],
            "audience": ["health conscious users", "fitness beginners", "busy adults"],
            "angles": ["energy", "routine", "wellbeing", "prevention"],
            "hooks": [
                "This health habit is easy to ignore",
                "A small change that helps a lot",
                "Your routine affects this more than you think",
                "This is worth paying attention to",
            ],
        },
    }

    TONE_LIBRARY: Dict[str, Dict[str, Any]] = {
        "default": {
            "energy": "medium",
            "style": "clear, natural, direct",
            "cta": ["Reply with your thoughts", "Save this for later", "Share this with someone who needs it"],
        },
        "bold": {
            "energy": "high",
            "style": "direct, strong, confident",
            "cta": ["Reply if you agree", "Share this now", "Save this and come back to it"],
        },
        "educational": {
            "energy": "medium",
            "style": "structured, useful, informative",
            "cta": ["Save this guide", "Share this with your team", "Reply if you want part 2"],
        },
        "friendly": {
            "energy": "medium",
            "style": "warm, simple, human",
            "cta": ["Let me know what you think", "Send this to a friend", "Save this for later"],
        },
        "premium": {
            "energy": "medium",
            "style": "polished, expert, trustworthy",
            "cta": ["Reply if you want the full checklist", "Save this premium tip", "Share this with your team"],
        },
        "promotional": {
            "energy": "high",
            "style": "clear, persuasive, conversion focused",
            "cta": ["Tap the link if this helps", "Reply if you want details", "Share this with someone who needs it"],
        },
        "controversial": {
            "energy": "high",
            "style": "sharp, opinionated, conversation starting",
            "cta": ["Agree or disagree", "Drop your take", "Share this if it made you think"],
        },
        "funny": {
            "energy": "high",
            "style": "relatable, witty, fast",
            "cta": ["Reply if this is too real", "Share this with a friend", "Save this for later"],
        },
        "emotional": {
            "energy": "medium",
            "style": "warm, honest, reflective",
            "cta": ["Reply if this hit home", "Share this with someone close", "Save this for later"],
        },
    }

    def __init__(self) -> None:
        pass

    # ── Main entry point ───────────────────────────────────────────────
    def generate(
        self,
        topic: str,
        niche: str = "business",
        tone: str = "default",
        objective: str = "engagement",
        segment_count: int = 5,
    ) -> ThreadsPack:
        topic         = self._clean(topic)
        niche         = self._clean(niche)
        tone          = self._clean(tone)
        objective     = self._clean(objective)
        segment_count = max(2, min(7, segment_count))

        niche_data = self._resolve_niche(topic, niche)
        tone_data  = self.TONE_LIBRARY.get(tone, self.TONE_LIBRARY["default"])

        thread_type              = self._choose_thread_type(segment_count, objective, tone)
        hook                     = self._build_hook(topic, niche_data, tone, objective)
        opening_line             = self._build_opening_line(topic, niche_data, tone, objective)
        segments                 = self._build_segments(topic, niche_data, tone_data, objective, segment_count)
        discussion_prompt        = self._build_discussion_prompt(topic, niche_data, objective)
        cta                      = self._build_cta(tone_data, objective)
        hashtags                 = self._build_hashtags(topic, niche_data)
        discoverability_keywords = self._build_discoverability_keywords(topic, niche_data)
        audience_targeting       = self._build_audience_targeting(niche_data, tone, objective)
        emotional_arc            = self._build_emotional_arc(tone, objective)
        content_blocks           = self._build_content_blocks(hook, opening_line, segments, discussion_prompt, cta)
        formatting_notes         = self._build_formatting_notes(tone, objective)
        posting_window           = self._best_posting_window(niche, objective, tone)
        engagement_prediction    = self._predict_engagement(topic, niche_data, tone, objective, segment_count, hashtags)
        variants                 = self._build_variants(topic, niche_data, tone_data, cta, objective)
        full_thread              = self._compose_full_thread(hook, opening_line, segments, discussion_prompt, cta)

        return ThreadsPack(
            topic=topic,
            niche=niche,
            tone=tone,
            objective=objective,
            thread_type=thread_type,
            hook=hook,
            opening_line=opening_line,
            full_thread=full_thread,
            segments=segments,
            discussion_prompt=discussion_prompt,
            cta=cta,
            hashtags=hashtags,
            discoverability_keywords=discoverability_keywords,
            audience_targeting=audience_targeting,
            emotional_arc=emotional_arc,
            content_blocks=content_blocks,
            formatting_notes=formatting_notes,
            posting_window=posting_window,
            engagement_prediction=engagement_prediction,
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

    def _choose_thread_type(self, segment_count: int, objective: str, tone: str) -> str:
        if segment_count <= 2:
            return "single post"
        if objective in {"discussion", "comments"} or tone in {"controversial", "funny"}:
            return "discussion thread"
        return "thread"

    def _build_hook(self, topic: str, niche_data: Dict[str, Any], tone: str, objective: str) -> str:
        hook_pool = niche_data["hooks"][:]
        if tone == "controversial":
            hook_pool += [
                f"Hot take: most people are doing {topic} wrong",
                f"Unpopular opinion: {topic} is being overcomplicated",
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
        elif tone == "emotional":
            hook_pool += [
                f"{topic.title()} hits differently when you finally see the pattern",
                f"Some things about {topic} take time to sink in",
            ]
        return random.choice(hook_pool)

    def _build_opening_line(self, topic: str, niche_data: Dict[str, Any], tone: str, objective: str) -> str:
        angle = random.choice(niche_data["angles"])
        if objective == "comments":
            return f"Let us be real about {topic}, because people have strong opinions on it."
        if tone == "premium":
            return f"Here is a clean breakdown of {topic}, built for people who want better results."
        if tone == "bold":
            return f"If you care about {topic}, this is worth reading."
        if tone == "emotional":
            return f"{topic.title()} gets easier when you focus on {angle} and stop fighting the obvious."
        return f"{topic.title()} works better when you focus on {angle}."

    def _build_segments(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        tone_data: Dict[str, Any],
        objective: str,
        segment_count: int,
    ) -> List[Dict[str, Any]]:
        angle = random.choice(niche_data["angles"])
        base_lines = [
            f"The main thing people miss about {topic} is {angle}.",
            f"If you want better results, keep the message simple and direct.",
            f"A clear post gets more replies because it is easier to react to.",
            f"That is why {topic} works better when the idea is easy to follow.",
            f"End with one question so people actually respond.",
        ]
        if tone_data["energy"] == "high":
            base_lines = [
                f"The biggest mistake with {topic} is overcomplicating it.",
                f"People reply when the message feels sharp and obvious.",
                f"If the first line is weak, the thread dies fast.",
                f"Keep the core point simple or nobody will care enough to reply.",
                f"End with a question that makes people want to answer.",
            ]
        if "warm" in tone_data["style"] or objective == "emotional":
            base_lines = [
                f"Sometimes {topic} feels more personal than people admit.",
                f"When the message feels human, people stay a little longer.",
                f"A clear thought plus a little honesty goes a long way.",
                f"That is usually what makes a thread feel memorable.",
                f"Finish with a real question so the conversation continues.",
            ]
        selected = base_lines[:segment_count]
        segments: List[Dict[str, Any]] = []
        for index, line in enumerate(selected, start=1):
            segments.append({
                "step":    index,
                "purpose": self._segment_purpose(index, segment_count),
                "emotion": self._segment_emotion(index, segment_count, objective),
                "text":    line,
            })
        return segments

    def _segment_purpose(self, index: int, total: int) -> str:
        if index == 1:          return "hook support"
        if index == total:      return "close"
        if index == total - 1:  return "conversation prompt"
        if index == 2:          return "main point"
        return "supporting insight"

    def _segment_emotion(self, index: int, total: int, objective: str) -> str:
        if index == 1: return "curiosity"
        if index == total: return "invitation"
        if objective in {"comments", "discussion"} and index == total - 1:
            return "engagement"
        return random.choice(["clarity", "confidence", "thoughtfulness", "realness"])

    def _build_discussion_prompt(self, topic: str, niche_data: Dict[str, Any], objective: str) -> str:
        prompts = [
            f"What is your biggest challenge with {topic}?",
            f"Which part of {topic} do you want to improve first?",
            f"What would you add to this {topic} idea?",
            f"Do you agree with this take on {topic}?",
        ]
        if objective == "comments":
            prompts = [
                f"What is your honest opinion on {topic}?",
                f"What is the one thing people get wrong about {topic}?",
                f"What has worked best for you with {topic}?",
            ]
        if objective == "discussion":
            prompts = [
                f"What should people understand better about {topic}?",
                f"What is your real take on {topic}?",
                f"What would change your opinion on {topic}?",
            ]
        return random.choice(prompts)

    def _build_cta(self, tone_data: Dict[str, Any], objective: str) -> str:
        choices = list(tone_data["cta"])
        if objective == "comments":
            choices.append("Reply with your opinion")
        elif objective == "discussion":
            choices.append("Join the conversation below")
        elif objective == "saves":
            choices.append("Save this for later")
        return random.choice(choices)

    def _build_hashtags(self, topic: str, niche_data: Dict[str, Any]) -> List[str]:
        raw = [
            topic,
            f"{topic} tips",
            f"{topic} ideas",
            f"best {topic}",
            random.choice(niche_data["keywords"]),
            random.choice(["threads", "community", "discussion", "creator"]),
        ]
        result: List[str] = []
        for item in raw:
            clean = re.sub(r"[^a-z0-9 ]+", "", item.lower()).strip().replace(" ", "")
            if clean and f"#{clean}" not in result:
                result.append(f"#{clean}")
        return result[:6]

    def _build_discoverability_keywords(self, topic: str, niche_data: Dict[str, Any]) -> List[str]:
        base = [
            topic,
            f"{topic} tips",
            f"{topic} guide",
            f"best {topic}",
            f"how to improve {topic}",
            f"{topic} for beginners",
        ]
        merged: List[str] = []
        for item in base + niche_data["keywords"][:5]:
            item = item.strip()
            if item and item not in merged:
                merged.append(item)
        return merged[:10]

    def _build_audience_targeting(self, niche_data: Dict[str, Any], tone: str, objective: str) -> Dict[str, Any]:
        return {
            "audience_segments": niche_data["audience"],
            "tone":              tone,
            "objective":         objective,
            "best_behavior":     "read, reply, repost, follow",
            "content_angle":     random.choice(niche_data["angles"]),
        }

    def _build_emotional_arc(self, tone: str, objective: str) -> List[str]:
        if tone == "funny":
            return ["curiosity", "relief", "humor", "engagement"]
        if tone == "controversial":
            return ["curiosity", "tension", "opinion", "discussion"]
        if tone == "emotional":
            return ["reflection", "realization", "connection", "response"]
        if objective in {"comments", "discussion"}:
            return ["attention", "opinion", "reaction", "reply"]
        return ["hook", "clarity", "value", "conversation"]

    def _build_content_blocks(
        self,
        hook: str,
        opening_line: str,
        segments: List[Dict[str, Any]],
        discussion_prompt: str,
        cta: str,
    ) -> List[Dict[str, Any]]:
        blocks: List[Dict[str, Any]] = [
            {"block": 1, "type": "hook",    "text": hook},
            {"block": 2, "type": "opening", "text": opening_line},
        ]
        for segment in segments:
            blocks.append({
                "block":   segment["step"] + 2,
                "type":    segment["purpose"],
                "emotion": segment["emotion"],
                "text":    segment["text"],
            })
        blocks.append({"block": len(blocks) + 1, "type": "discussion", "text": discussion_prompt})
        blocks.append({"block": len(blocks) + 1, "type": "cta",        "text": cta})
        return blocks

    def _build_formatting_notes(self, tone: str, objective: str) -> List[str]:
        notes = [
            "Keep paragraphs short",
            "Make the first line strong",
            "Use simple language",
            "Leave space between ideas",
            "End with a reply worthy question",
        ]
        if tone == "funny":
            notes.append("Let the punchline breathe a little")
        if tone == "controversial":
            notes.append("Make the opinion clearer")
        if objective in {"comments", "discussion"}:
            notes.append("Focus on question driven engagement")
        return notes

    def _best_posting_window(self, niche: str, objective: str, tone: str) -> Dict[str, Any]:
        if niche in {"business", "marketing", "finance", "technology"}:
            day, hour = "Tuesday", "08:00 PM"
        elif niche in {"education", "personal growth", "health"}:
            day, hour = "Monday",  "07:30 AM"
        elif niche in {"comedy", "lifestyle", "fashion", "beauty"}:
            day, hour = "Friday",  "06:30 PM"
        else:
            day, hour = "Thursday","07:00 PM"
        if objective in {"comments", "discussion"}:
            hour = "08:30 PM"
        return {
            "best_day":  day,
            "best_time": hour,
            "reason":    "Threads performs well when the audience has time to read and reply",
        }

    def _predict_engagement(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        tone: str,
        objective: str,
        segment_count: int,
        hashtags: List[str],
    ) -> Dict[str, Any]:
        score = 50
        if objective in {"comments", "discussion", "engagement"}:
            score += 10
        if tone in {"bold", "controversial", "funny", "emotional"}:
            score += 10
        if segment_count >= 4:
            score += 5
        if len(hashtags) >= 4:
            score += 4
        if any(w in topic for w in ["how", "why", "best", "stop", "mistake", "fix", "guide"]):
            score += 10
        if any(k in niche_data["keywords"] for k in ["business", "marketing", "finance", "technology", "education"]):
            score += 5
        score = max(0, min(100, score))
        return {
            "viral_score":            score,
            "reply_potential":        min(100, score + random.randint(-2, 8)),
            "share_potential":        min(100, score + random.randint(-2, 7)),
            "profile_visit_potential":min(100, score + random.randint(-2, 6)),
            "save_potential":         min(100, score + random.randint(-2, 5)),
            "reason":                 "Strong conversational clarity, topic relevance, and reply-first formatting",
        }

    def _build_variants(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        tone_data: Dict[str, Any],
        cta: str,
        objective: str,
    ) -> List[str]:
        angle = random.choice(niche_data["angles"])
        return [
            f"{topic.title()} is worth discussing because {angle} matters.",
            f"Here is a cleaner way to think about {topic}.",
            f"Most people miss this part of {topic}, and that is the issue.",
            f"If you want more replies, keep {topic} simple and honest.",
            f"{cta}. Focus on {angle} and keep the point easy to follow.",
        ]

    def _compose_full_thread(
        self,
        hook: str,
        opening_line: str,
        segments: List[Dict[str, Any]],
        discussion_prompt: str,
        cta: str,
    ) -> str:
        parts: List[str] = [hook, opening_line]
        for segment in segments:
            parts.append(f"{segment['step']}. {segment['text']}")
        parts.append(discussion_prompt)
        parts.append(cta)
        return "\n\n".join(parts)