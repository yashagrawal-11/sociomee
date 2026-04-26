from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Dict, List
import random
import re


@dataclass
class TelegramPack:
    topic: str
    niche: str
    tone: str
    objective: str
    destination_type: str
    post_style: str
    headline: str
    opening_line: str
    post_body: str
    short_version: str
    cta: str
    discussion_prompt: str
    hashtags: List[str]
    discoverability_keywords: List[str]
    business_angle: Dict[str, Any]
    audience_targeting: Dict[str, Any]
    content_blocks: List[Dict[str, Any]]
    formatting_notes: List[str]
    posting_window: Dict[str, Any]
    engagement_prediction: Dict[str, Any]
    variants: List[str]
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class TelegramEngine:
    """
    Telegram content intelligence engine.
    Built for channels and groups.
    Generates broadcast copy, discussion prompts, business angles,
    discoverability keywords, CTA, posting guidance, and engagement prediction.
    """

    NICHE_MAP: Dict[str, Dict[str, Any]] = {
        "business": {
            "keywords": ["business", "growth", "sales", "revenue", "lead generation", "offer"],
            "audience": ["founders", "small business owners", "marketers", "creators"],
            "angles": ["growth", "trust", "conversion", "authority"],
            "hooks": [
                "A simple move that can improve your business fast",
                "Most businesses ignore this one thing",
                "This is where many brands lose money",
                "A better way to build trust with your audience",
            ],
            "format": "channel broadcast",
        },
        "marketing": {
            "keywords": ["marketing", "content", "audience", "conversion", "copy", "branding"],
            "audience": ["marketers", "agency owners", "founders", "creators"],
            "angles": ["authority", "attention", "conversion", "retention"],
            "hooks": [
                "This marketing shift can change your results",
                "Most content fails because of this",
                "Your audience notices this more than you think",
                "A smarter way to market your offer",
            ],
            "format": "channel broadcast",
        },
        "finance": {
            "keywords": ["money", "income", "wealth", "saving", "investment", "cash flow"],
            "audience": ["young professionals", "founders", "students", "side hustlers"],
            "angles": ["freedom", "security", "clarity", "growth"],
            "hooks": [
                "This money habit matters more than people think",
                "Most people stay stuck because of this",
                "A simple finance rule that saves stress",
                "This is the difference between broke and building",
            ],
            "format": "channel broadcast",
        },
        "education": {
            "keywords": ["learning", "study", "skills", "focus", "guides", "notes"],
            "audience": ["students", "teachers", "learners", "parents"],
            "angles": ["clarity", "progress", "confidence", "results"],
            "hooks": [
                "This study method is more useful than people think",
                "If you are learning this, start here",
                "A cleaner way to understand the topic",
                "This is how smart learning feels",
            ],
            "format": "channel broadcast",
        },
        "technology": {
            "keywords": ["AI", "tools", "automation", "software", "productivity", "systems"],
            "audience": ["builders", "founders", "creators", "tech lovers"],
            "angles": ["speed", "efficiency", "future", "leverage"],
            "hooks": [
                "This tool can save hours every week",
                "Most people are not using this properly",
                "A smarter way to work with technology",
                "This is where the future is moving",
            ],
            "format": "channel broadcast",
        },
        "ecommerce": {
            "keywords": ["store", "sales", "product", "conversion", "checkout", "customer"],
            "audience": ["store owners", "dropshippers", "brand builders", "marketers"],
            "angles": ["sales", "trust", "offers", "retention"],
            "hooks": [
                "This can improve store performance fast",
                "Most ecommerce brands miss this",
                "A better way to turn traffic into buyers",
                "This is what customers actually notice",
            ],
            "format": "channel broadcast",
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
            "format": "channel broadcast",
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
            "format": "group discussion",
        },
        "personal growth": {
            "keywords": ["growth", "discipline", "mindset", "focus", "habits", "success"],
            "audience": ["students", "founders", "creators", "self improvement audience"],
            "angles": ["discipline", "clarity", "consistency", "progress"],
            "hooks": [
                "This is a simple way to grow faster",
                "Most people never build this habit",
                "A useful reminder for your future self",
                "This is where real progress starts",
            ],
            "format": "channel broadcast",
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
            "format": "channel broadcast",
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
            "cta": ["Reply if this makes sense", "Share this now", "Save this and come back to it"],
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
            "cta": ["Agree or disagree", "Reply with your take", "Share this if it made you think"],
        },
    }

    POST_STYLES = [
        "channel broadcast",
        "group discussion",
        "announcement",
        "lead magnet post",
        "educational update",
        "community prompt",
        "offer post",
    ]

    def __init__(self) -> None:
        pass

    # ── Main entry point ───────────────────────────────────────────────
    def generate(
        self,
        topic: str,
        niche: str = "business",
        tone: str = "default",
        objective: str = "engagement",
        destination_type: str = "channel",
    ) -> TelegramPack:
        topic            = self._clean(topic)
        niche            = self._clean(niche)
        tone             = self._clean(tone)
        objective        = self._clean(objective)
        destination_type = self._clean(destination_type)

        niche_data = self._resolve_niche(topic, niche)
        tone_data  = self.TONE_LIBRARY.get(tone, self.TONE_LIBRARY["default"])

        post_style               = self._choose_post_style(destination_type, objective, tone, niche_data)
        headline                 = self._build_headline(topic, niche_data, tone, objective, destination_type)
        opening_line             = self._build_opening_line(topic, niche_data, tone, destination_type)
        post_body                = self._build_post_body(topic, niche_data, tone_data, objective, destination_type)
        short_version            = self._build_short_version(topic, niche_data, tone_data, objective)
        cta                      = self._build_cta(tone_data, objective, destination_type)
        discussion_prompt        = self._build_discussion_prompt(topic, niche_data, objective, destination_type)
        hashtags                 = self._build_hashtags(topic, niche_data)
        discoverability_keywords = self._build_discoverability_keywords(topic, niche_data)
        business_angle           = self._build_business_angle(topic, niche_data, objective, tone)
        audience_targeting       = self._build_audience_targeting(niche_data, tone, objective, destination_type)
        content_blocks           = self._build_content_blocks(topic, niche_data, tone_data, objective, destination_type)
        formatting_notes         = self._build_formatting_notes(destination_type, objective, tone)
        posting_window           = self._best_posting_window(niche, objective, tone, destination_type)
        engagement_prediction    = self._predict_engagement(topic, niche_data, tone, objective, destination_type, hashtags)
        variants                 = self._build_variants(topic, niche_data, tone_data, cta, destination_type)

        return TelegramPack(
            topic=topic,
            niche=niche,
            tone=tone,
            objective=objective,
            destination_type=destination_type,
            post_style=post_style,
            headline=headline,
            opening_line=opening_line,
            post_body=post_body,
            short_version=short_version,
            cta=cta,
            discussion_prompt=discussion_prompt,
            hashtags=hashtags,
            discoverability_keywords=discoverability_keywords,
            business_angle=business_angle,
            audience_targeting=audience_targeting,
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
        return self.NICHE_MAP.get(niche, self.NICHE_MAP["business"])

    def _choose_post_style(self, destination_type: str, objective: str, tone: str, niche_data: Dict[str, Any]) -> str:
        if destination_type == "group":
            return "group discussion"
        if objective in {"leads", "sales", "conversion"}:
            return "lead magnet post"
        if tone in {"premium", "educational"}:
            return "educational update"
        return random.choice(self.POST_STYLES)

    def _build_headline(self, topic: str, niche_data: Dict[str, Any], tone: str, objective: str, destination_type: str) -> str:
        hook = random.choice(niche_data["hooks"])
        if destination_type == "group":
            return f"Discussion on {topic.title()}"
        if tone == "controversial":
            return f"Hot take on {topic.title()}"
        if objective in {"sales", "conversion"}:
            return f"How {topic.title()} can help your business grow"
        if objective == "leads":
            return f"A useful guide for {topic.title()}"
        return hook

    def _build_opening_line(self, topic: str, niche_data: Dict[str, Any], tone: str, destination_type: str) -> str:
        angle = random.choice(niche_data["angles"])
        if destination_type == "group":
            return f"Let us talk about {topic} and what actually works."
        if tone == "premium":
            return f"Here is a clean breakdown of {topic}, built for people who want better results."
        if tone == "bold":
            return f"If you care about {topic}, this is worth reading."
        return f"{topic.title()} gets easier when you focus on {angle}."

    def _build_post_body(self, topic: str, niche_data: Dict[str, Any], tone_data: Dict[str, Any], objective: str, destination_type: str) -> str:
        angle        = random.choice(niche_data["angles"])
        main_keyword = random.choice(niche_data["keywords"])
        if destination_type == "group":
            return (
                f"{topic.title()} is something many people think about, but not enough people discuss clearly. "
                f"If you are trying to improve results, the first thing to focus on is {angle}. "
                f"That is where the biggest difference usually happens. "
                f"Share your own experience below and let us learn from each other."
            )
        if objective in {"sales", "conversion"}:
            return (
                f"If your goal is to grow, {topic} should be part of your plan. "
                f"This works best when the message is simple, the offer is clear, and the next step is easy to follow. "
                f"People respond better when they can understand the value fast. "
                f"Focus on {main_keyword}, keep the copy clear, and make the action obvious."
            )
        if objective == "leads":
            return (
                f"This {topic} guide is built to help people move from interest to action. "
                f"Use one clear idea, one useful insight, and one direct next step. "
                f"That makes your post easier to trust and easier to respond to. "
                f"Add {angle} to make it more relevant."
            )
        return (
            f"{topic.title()} works better when the message is easy to trust and simple to act on. "
            f"Use a clear opening, one helpful point, and a direct next step. "
            f"That is the kind of post people save, reply to, and share. "
            f"Keep the focus on {angle} and make every line feel useful."
        )

    def _build_short_version(self, topic: str, niche_data: Dict[str, Any], tone_data: Dict[str, Any], objective: str) -> str:
        cta = random.choice(tone_data["cta"])
        return (
            f"{topic.title()} matters more than most people realize. "
            f"Keep it simple, make it useful, and give people a clear reason to care. "
            f"{cta}."
        )

    def _build_cta(self, tone_data: Dict[str, Any], objective: str, destination_type: str) -> str:
        base = list(tone_data["cta"])
        if destination_type == "group":
            base.append("Reply with your opinion")
        if objective == "comments":
            base.append("Leave your answer below")
        elif objective == "leads":
            base.append("Reply if you want the checklist")
        elif objective == "sales":
            base.append("Message us for details")
        elif objective == "community":
            base.append("Join the discussion in the comments")
        return random.choice(base)

    def _build_discussion_prompt(self, topic: str, niche_data: Dict[str, Any], objective: str, destination_type: str) -> str:
        prompts = [
            f"What is your biggest challenge with {topic}?",
            f"Which part of {topic} do you want to improve first?",
            f"What would you add to this {topic} idea?",
            f"Do you agree with this take on {topic}?",
        ]
        if destination_type == "group":
            prompts = [
                f"What has worked best for you with {topic}?",
                f"What is one mistake people make with {topic}?",
                f"What would you like us to cover next about {topic}?",
            ]
        if objective == "sales":
            prompts = [
                f"Would this help your business with {topic}?",
                f"Do you want a version of this built for your brand?",
                f"What is your biggest issue with {topic} right now?",
            ]
        return random.choice(prompts)

    def _build_hashtags(self, topic: str, niche_data: Dict[str, Any]) -> List[str]:
        raw = [
            topic,
            f"{topic} tips",
            f"{topic} guide",
            f"best {topic}",
            f"{topic} for beginners",
            random.choice(niche_data["keywords"]),
            random.choice(niche_data["keywords"]),
        ]
        result: List[str] = []
        for item in raw:
            clean = re.sub(r"[^a-z0-9 ]+", "", item.lower()).strip().replace(" ", "")
            if clean and f"#{clean}" not in result:
                result.append(f"#{clean}")
        return result[:8]

    def _build_discoverability_keywords(self, topic: str, niche_data: Dict[str, Any]) -> List[str]:
        base = [
            topic,
            f"{topic} tips",
            f"{topic} guide",
            f"{topic} for beginners",
            f"best {topic}",
            f"how to improve {topic}",
        ]
        merged = []
        for item in base + niche_data["keywords"][:5]:
            item = item.strip()
            if item and item not in merged:
                merged.append(item)
        return merged[:10]

    def _build_business_angle(self, topic: str, niche_data: Dict[str, Any], objective: str, tone: str) -> Dict[str, Any]:
        angle = random.choice(niche_data["angles"])
        return {
            "core_angle":       angle,
            "business_use":     "lead generation" if objective in {"leads", "sales", "conversion"} else "community growth",
            "content_priority": "trust and clarity",
            "message_goal":     "make the audience understand the value fast",
            "tone_fit":         tone,
            "why_it_works":     "Telegram users respond well to direct value and practical updates",
        }

    def _build_audience_targeting(self, niche_data: Dict[str, Any], tone: str, objective: str, destination_type: str) -> Dict[str, Any]:
        return {
            "audience_segments": niche_data["audience"],
            "tone":              tone,
            "objective":         objective,
            "destination_type":  destination_type,
            "best_behavior":     "read, reply, save, forward",
            "content_angle":     random.choice(niche_data["angles"]),
        }

    def _build_content_blocks(self, topic: str, niche_data: Dict[str, Any], tone_data: Dict[str, Any], objective: str, destination_type: str) -> List[Dict[str, Any]]:
        angle = random.choice(niche_data["angles"])
        return [
            {"block": 1, "type": "hook",  "text": self._build_headline(topic, niche_data, "default", objective, destination_type)},
            {"block": 2, "type": "value", "text": f"Focus on {angle} and keep the message simple."},
            {"block": 3, "type": "proof", "text": "This is useful because people trust clear and direct communication."},
            {"block": 4, "type": "cta",   "text": self._build_cta(tone_data, objective, destination_type)},
        ]

    def _build_formatting_notes(self, destination_type: str, objective: str, tone: str) -> List[str]:
        notes = [
            "Use short paragraphs",
            "Keep the first line strong",
            "Make the value obvious quickly",
            "Use one clear idea per paragraph",
            "Leave space between sections for easy reading",
        ]
        if destination_type == "group":
            notes.append("End with a question so people reply")
        if objective in {"sales", "conversion", "leads"}:
            notes.append("Keep the offer and next step very clear")
        if tone == "premium":
            notes.append("Use a calm and polished voice")
        return notes

    def _best_posting_window(self, niche: str, objective: str, tone: str, destination_type: str) -> Dict[str, Any]:
        if niche in {"business", "marketing", "finance", "technology"}:
            day, hour = "Tuesday",  "08:30 PM"
        elif niche in {"education", "personal growth", "health"}:
            day, hour = "Monday",   "07:30 AM"
        else:
            day, hour = "Thursday", "07:00 PM"
        if destination_type == "group":
            hour = "08:00 PM"
        if objective in {"sales", "conversion"}:
            hour = "09:00 PM"
        return {
            "best_day":  day,
            "best_time": hour,
            "reason":    "Telegram performs well when people are calm, available, and ready to read",
        }

    def _predict_engagement(self, topic: str, niche_data: Dict[str, Any], tone: str, objective: str, destination_type: str, hashtags: List[str]) -> Dict[str, Any]:
        score = 50
        if destination_type == "channel":
            score += 10
        if destination_type == "group":
            score += 8
        if objective in {"comments", "leads", "sales", "community"}:
            score += 10
        if tone in {"bold", "educational", "premium", "controversial"}:
            score += 8
        if len(hashtags) >= 6:
            score += 5
        if any(w in topic for w in ["how", "why", "best", "fix", "guide", "tips"]):
            score += 8
        score = max(0, min(100, score))
        return {
            "viral_score":    score,
            "share_potential":  min(100, score + random.randint(-3, 7)),
            "reply_potential":  min(100, score + random.randint(-2, 8)),
            "forward_potential":min(100, score + random.randint(-2, 8)),
            "lead_potential":   min(100, score + random.randint(-2, 10)),
            "reason":           "Strong clarity, trust focused structure, and useful business framing",
        }

    def _build_variants(self, topic: str, niche_data: Dict[str, Any], tone_data: Dict[str, Any], cta: str, destination_type: str) -> List[str]:
        angle = random.choice(niche_data["angles"])
        return [
            f"{topic.title()} can be explained in a much simpler way.",
            f"Here is a direct update on {topic}.",
            f"A clearer way to think about {topic} and why it matters.",
            f"If you want better results, start with {topic}.",
            f"{cta}. Focus on {angle} and keep the message easy to follow.",
        ]