from __future__ import annotations

from dataclasses import dataclass, asdict
from datetime import datetime
from typing import Any, Dict, List, Optional
import random
import re


@dataclass
class FacebookPostPack:
    topic: str
    niche: str
    tone: str
    objective: str
    post_type: str
    primary_keyword: str
    secondary_keywords: List[str]
    title_hook: str
    short_copy: str
    long_copy: str
    cta: str
    first_comment: str
    hashtags: List[str]
    visual_direction: Dict[str, Any]
    audience_targeting: Dict[str, Any]
    engagement_prediction: Dict[str, Any]
    posting_window: Dict[str, Any]
    variants: List[str]
    generated_at: str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class FacebookEngine:
    """
    Facebook post intelligence engine.

    Generates share focused Facebook post kits with:
    caption variants, keyword targeting, CTA, comment bait,
    visual direction, and posting window suggestions.
    """

    NICHE_MAP: Dict[str, Dict[str, Any]] = {
        "fitness": {
            "keywords": ["fitness", "workout", "fat loss", "healthy routine", "body transformation"],
            "audience": ["fitness beginners", "home workout users", "weight loss audience"],
            "angles": ["transformation", "discipline", "results", "simple routine"],
        },
        "finance": {
            "keywords": ["money", "income", "side hustle", "wealth", "financial freedom"],
            "audience": ["students", "young professionals", "entrepreneurs"],
            "angles": ["earning", "saving", "growth", "practical money tips"],
        },
        "technology": {
            "keywords": ["AI", "tools", "automation", "software", "tech tips"],
            "audience": ["creators", "founders", "builders"],
            "angles": ["productivity", "future tech", "automation", "speed"],
        },
        "self improvement": {
            "keywords": ["discipline", "habits", "productivity", "mindset", "growth"],
            "audience": ["students", "founders", "creators"],
            "angles": ["clarity", "consistency", "focus", "better habits"],
        },
        "lifestyle": {
            "keywords": ["routine", "daily habits", "life tips", "balance", "wellness"],
            "audience": ["general audience", "women", "young adults"],
            "angles": ["simple living", "better days", "daily upgrade", "relatable"],
        },
        "travel": {
            "keywords": ["travel", "trip ideas", "budget travel", "places to visit", "hidden gems"],
            "audience": ["travel lovers", "couples", "students"],
            "angles": ["dreamy", "useful", "inspiring", "save worthy"],
        },
        "beauty": {
            "keywords": ["skincare", "makeup", "beauty tips", "glow up", "routine"],
            "audience": ["women", "beauty enthusiasts", "self care audience"],
            "angles": ["before and after", "routine", "quick tips", "glow"],
        },
        "fashion": {
            "keywords": ["outfit ideas", "style tips", "fashion", "aesthetic", "lookbook"],
            "audience": ["women", "students", "style focused audience"],
            "angles": ["aesthetic", "simple styling", "trend aware", "save worthy"],
        },
        "gaming": {
            "keywords": ["gaming", "rank up", "tips", "strategy", "pro play"],
            "audience": ["gamers", "mobile gamers", "competitive players"],
            "angles": ["skill", "wins", "tricks", "rank push"],
        },
        "education": {
            "keywords": ["study tips", "learning", "exam prep", "students", "smart study"],
            "audience": ["students", "parents", "learners"],
            "angles": ["clear steps", "better scores", "less stress", "study smart"],
        },
        "comedy": {
            "keywords": ["funny", "relatable", "meme", "humor", "life moments"],
            "audience": ["general audience", "gen z", "social media users"],
            "angles": ["relatable", "shareable", "light", "comment bait"],
        },
    }

    TONE_LIBRARY: Dict[str, Dict[str, Any]] = {
        "default": {
            "energy": "medium",
            "style": "clear, friendly, natural",
            "cta": ["Share this with someone who needs it", "Save this for later", "Comment your thoughts"],
        },
        "bold": {
            "energy": "high",
            "style": "direct, punchy, confident",
            "cta": ["Drop a comment if you agree", "Share this now", "Save this and come back later"],
        },
        "educational": {
            "energy": "medium",
            "style": "informative, structured, useful",
            "cta": ["Save this guide", "Follow for more practical tips", "Share this with your team"],
        },
        "funny": {
            "energy": "high",
            "style": "relatable, witty, light",
            "cta": ["Tag a friend who gets this", "Comment the funniest part", "Share if this is too real"],
        },
        "emotional": {
            "energy": "medium",
            "style": "warm, reflective, human",
            "cta": ["Share this with someone close", "Save this for a tough day", "Tell me if this hit home"],
        },
        "controversial": {
            "energy": "high",
            "style": "sharp, opinionated, conversation starting",
            "cta": ["Do you agree or not", "Drop your take in the comments", "Share this if it made you think"],
        },
    }

    POST_TYPES = ["single post", "carousel style post", "story style post", "community discussion post", "quote post"]

    def __init__(self) -> None:
        pass

    def generate(
        self,
        topic: str,
        niche: str = "lifestyle",
        tone: str = "default",
        objective: str = "engagement"
    ) -> FacebookPostPack:
        topic = self._clean(topic)
        niche = self._clean(niche)
        tone = self._clean(tone)
        objective = self._clean(objective)

        niche_data = self._resolve_niche(topic, niche)
        tone_data = self.TONE_LIBRARY.get(tone, self.TONE_LIBRARY["default"])

        primary_keyword = self._choose_primary_keyword(topic, niche_data)
        secondary_keywords = self._build_secondary_keywords(topic, niche_data)

        post_type = self._choose_post_type(objective, tone, topic)
        title_hook = self._build_title_hook(topic, primary_keyword, niche_data, tone, objective)
        short_copy = self._build_short_copy(topic, primary_keyword, niche_data, tone_data, objective)
        long_copy = self._build_long_copy(topic, primary_keyword, secondary_keywords, niche_data, tone_data, objective)
        cta = self._build_cta(tone_data, objective)
        first_comment = self._build_first_comment(topic, niche_data, objective)
        hashtags = self._build_hashtags(primary_keyword, secondary_keywords, niche_data)
        visual_direction = self._build_visual_direction(topic, niche_data, tone, post_type)
        audience_targeting = self._build_audience_targeting(niche_data, tone, objective)
        engagement_prediction = self._predict_engagement(topic, niche_data, tone, objective, hashtags, post_type)
        posting_window = self._best_posting_window(niche, objective, tone)
        variants = self._build_variants(topic, primary_keyword, niche_data, tone_data, cta)

        return FacebookPostPack(
            topic=topic,
            niche=niche,
            tone=tone,
            objective=objective,
            post_type=post_type,
            primary_keyword=primary_keyword,
            secondary_keywords=secondary_keywords,
            title_hook=title_hook,
            short_copy=short_copy,
            long_copy=long_copy,
            cta=cta,
            first_comment=first_comment,
            hashtags=hashtags,
            visual_direction=visual_direction,
            audience_targeting=audience_targeting,
            engagement_prediction=engagement_prediction,
            posting_window=posting_window,
            variants=variants,
            generated_at=datetime.utcnow().isoformat()
        )

    def _clean(self, text: str) -> str:
        text = text.strip().lower()
        text = re.sub(r"\s+", " ", text)
        return text

    def _resolve_niche(self, topic: str, niche: str) -> Dict[str, Any]:
        for key, data in self.NICHE_MAP.items():
            if key in topic:
                return data
        return self.NICHE_MAP.get(niche, self.NICHE_MAP["lifestyle"])

    def _choose_primary_keyword(self, topic: str, niche_data: Dict[str, Any]) -> str:
        candidates = [topic] + niche_data["keywords"]
        return random.choice(candidates)

    def _build_secondary_keywords(self, topic: str, niche_data: Dict[str, Any]) -> List[str]:
        base = [
            f"{topic} tips",
            f"best {topic}",
            f"how to {topic}",
            f"{topic} ideas",
            f"{topic} guide",
            f"{topic} for beginners",
        ]
        extras = niche_data["keywords"][:4]
        merged = []
        for item in base + extras:
            normalized = item.strip()
            if normalized and normalized not in merged:
                merged.append(normalized)
        return merged[:10]

    def _choose_post_type(self, objective: str, tone: str, topic: str) -> str:
        if "comment" in objective or tone in {"funny", "controversial"}:
            return "community discussion post"
        if "save" in objective or "educational" in tone:
            return "carousel style post"
        if "share" in objective:
            return "quote post"
        return random.choice(self.POST_TYPES)

    def _build_title_hook(
        self,
        topic: str,
        primary_keyword: str,
        niche_data: Dict[str, Any],
        tone: str,
        objective: str
    ) -> str:
        angle = random.choice(niche_data["angles"])
        templates = [
            f"Why {topic} actually matters more than people think",
            f"The smartest way to improve {topic} right now",
            f"Stop ignoring this part of {topic}",
            f"This {topic} strategy gets real attention",
            f"Most people do {topic} wrong",
            f"A simple {topic} shift that changes everything",
        ]
        chosen = random.choice(templates)
        if tone == "controversial":
            chosen = f"Hot take: {chosen}"
        elif tone == "educational":
            chosen = f"Guide: {chosen}"
        elif tone == "funny":
            chosen = f"Real talk: {chosen}"
        return f"{chosen} | {angle.title()}"

    def _build_short_copy(
        self,
        topic: str,
        primary_keyword: str,
        niche_data: Dict[str, Any],
        tone_data: Dict[str, Any],
        objective: str
    ) -> str:
        emotion = random.choice(niche_data["angles"])
        cta_line = random.choice(tone_data["cta"])
        return (
            f"If you care about {topic}, this is worth your time. "
            f"Use this {primary_keyword} strategy to get better results, more clarity, and stronger engagement. "
            f"This is built for {emotion} and practical action. "
            f"{cta_line}."
        )

    def _build_long_copy(
        self,
        topic: str,
        primary_keyword: str,
        secondary_keywords: List[str],
        niche_data: Dict[str, Any],
        tone_data: Dict[str, Any],
        objective: str
    ) -> str:
        keyword_line = ", ".join(secondary_keywords[:6])
        angle = random.choice(niche_data["angles"])
        style = tone_data["style"]
        return (
            f"{topic.title()} works best when it is clear, useful, and easy to act on. "
            f"This post uses a {style} approach with a strong {angle} angle so people stop scrolling and actually read. "
            f"Focus on one main idea, one strong visual, and one clear action. "
            f"That combination increases saves, shares, and comments on Facebook. "
            f"Keywords: {keyword_line}."
        )

    def _build_cta(self, tone_data: Dict[str, Any], objective: str) -> str:
        base = list(tone_data["cta"])
        if objective == "engagement":
            base.append("Comment your opinion below")
        elif objective == "shares":
            base.append("Share this with someone who needs it")
        elif objective == "saves":
            base.append("Save this post for later")
        return random.choice(base)

    def _build_first_comment(self, topic: str, niche_data: Dict[str, Any], objective: str) -> str:
        prompt = random.choice([
            f"What is your biggest challenge with {topic}?",
            f"Which of these {topic} ideas would you try first?",
            f"Do you want a part 2 for this {topic} breakdown?",
            f"What would you add to this {topic} list?"
        ])
        if objective == "comments":
            prompt = random.choice([
                f"Be honest, what do you think about {topic}?",
                f"Drop your opinion on {topic} below",
                f"Which one matters most to you in {topic}?"
            ])
        return prompt

    def _build_hashtags(self, primary_keyword: str, secondary_keywords: List[str], niche_data: Dict[str, Any]) -> List[str]:
        tags = [primary_keyword] + secondary_keywords[:6] + niche_data["keywords"][:4]
        result: List[str] = []
        for tag in tags:
            clean = re.sub(r"[^a-z0-9 ]+", "", tag.lower()).strip()
            clean = clean.replace(" ", "")
            if clean and clean not in result:
                result.append(f"#{clean}")
        return result[:12]

    def _build_visual_direction(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        tone: str,
        post_type: str
    ) -> Dict[str, Any]:
        return {
            "format": post_type,
            "image_style": "clean, bright, high contrast, easy to read",
            "text_overlay": topic.title(),
            "layout": "strong headline at top, supporting visual in center, small CTA at bottom",
            "color_direction": "use one main brand color with white text and dark contrast",
            "visual_goal": "make the first second easy to understand",
            "emotion": random.choice(niche_data["angles"]),
            "tone_alignment": tone,
        }

    def _build_audience_targeting(
        self,
        niche_data: Dict[str, Any],
        tone: str,
        objective: str
    ) -> Dict[str, Any]:
        return {
            "audience_segments": niche_data["audience"],
            "tone": tone,
            "objective": objective,
            "best_behavior": "share, comment, save, discuss",
            "content_angle": random.choice(niche_data["angles"]),
        }

    def _predict_engagement(
        self,
        topic: str,
        niche_data: Dict[str, Any],
        tone: str,
        objective: str,
        hashtags: List[str],
        post_type: str
    ) -> Dict[str, Any]:
        score = 50
        if len(hashtags) >= 8:
            score += 10
        if post_type in {"carousel style post", "community discussion post"}:
            score += 10
        if tone in {"educational", "controversial", "funny"}:
            score += 10
        if any(word in topic for word in ["how", "why", "best", "stop", "guide"]):
            score += 10
        if objective in {"engagement", "shares", "saves", "comments"}:
            score += 10
        score = max(0, min(100, score))
        return {
            "viral_score": score,
            "share_potential": min(100, score + random.randint(-5, 8)),
            "comment_potential": min(100, score + random.randint(-5, 8)),
            "save_potential": min(100, score + random.randint(-2, 10)),
            "reach_potential": min(100, score + random.randint(-5, 5)),
            "reason": "Strong topic match, clear hook, and audience friendly framing"
        }

    def _best_posting_window(self, niche: str, objective: str, tone: str) -> Dict[str, Any]:
        if niche in {"fitness", "self improvement", "education"}:
            day = "Tuesday"
            hour = "07:30 AM"
        elif niche in {"finance", "technology"}:
            day = "Wednesday"
            hour = "08:30 PM"
        elif niche in {"comedy", "lifestyle", "fashion", "beauty"}:
            day = "Friday"
            hour = "06:30 PM"
        else:
            day = "Thursday"
            hour = "07:00 PM"
        if objective in {"comments", "shares"}:
            hour = "08:00 PM"
        return {
            "best_day": day,
            "best_time": hour,
            "reason": "Facebook engagement often improves when audience is relaxed and active"
        }

    def _build_variants(
        self,
        topic: str,
        primary_keyword: str,
        niche_data: Dict[str, Any],
        tone_data: Dict[str, Any],
        cta: str
    ) -> List[str]:
        angle = random.choice(niche_data["angles"])
        return [
            f"Here is a smarter way to think about {topic}.",
            f"Most people miss this part of {topic}, and that is why results stay low.",
            f"This {topic} approach is simple, but it works because it is clear.",
            f"Use this {topic} idea if you want more engagement and better reach.",
            f"{topic.title()} gets easier once you stop overcomplicating it.",
            f"Save this {topic} post if you want to come back to it later.",
            f"{cta}.",
            f"Focus on {angle} and keep the message simple."
        ]