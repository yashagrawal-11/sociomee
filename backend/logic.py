"""
SocioMee — Pure Logic Backend
==============================
Extracted logic: scoring, content generation, hooks, captions, hashtags.
No Tkinter. No UI. Pure functions only.
"""

import os, re, json, random, threading
from dataclasses import dataclass
from openai import OpenAI
from dotenv import load_dotenv
from youtube_engine import YouTubeIntelligenceEngine
from instagram_engine import InstagramEngine

# ──────────────────────────────────────────────────────────
# API
# ──────────────────────────────────────────────────────────
load_dotenv()
NVIDIA_KEY = os.getenv("NVIDIA_API_KEY")
ai_client  = OpenAI(base_url="https://integrate.api.nvidia.com/v1", api_key=NVIDIA_KEY)
AI_MODEL   = "google/gemma-3n-e2b-it"

PLATFORMS = ["youtube", "instagram", "facebook", "x", "tiktok", "telegram", "pinterest", "threads"]

P_LABEL = {
    "youtube": "YouTube", "instagram": "Instagram", "facebook": "Facebook",
    "x": "X", "tiktok": "TikTok", "telegram": "Telegram",
    "pinterest": "Pinterest", "threads": "Threads"
}

# ──────────────────────────────────────────────────────────
# SCORING RULES
# ──────────────────────────────────────────────────────────
PLATFORM_RULES = {
    "youtube":   {"weights": {"title": 0.30, "description": 0.25, "tags": 0.20, "hook": 0.15, "cta": 0.10},
                  "label": "SEO Score"},
    "instagram": {"weights": {"hook": 0.30, "caption": 0.20, "hashtags": 0.25, "cta": 0.10, "trend": 0.15},
                  "label": "Viral Score"},
    "facebook":  {"weights": {"hook": 0.25, "caption": 0.30, "cta": 0.20, "story": 0.25},
                  "label": "Reach Score"},
    "x":         {"weights": {"hook": 0.35, "brevity": 0.25, "replyability": 0.25, "topic": 0.15},
                  "label": "Virality Score"},
    "tiktok":    {"weights": {"hook": 0.40, "caption": 0.15, "trend": 0.30, "cta": 0.15},
                  "label": "Viral Score"},
    "telegram":  {"weights": {"clarity": 0.40, "structure": 0.40, "cta": 0.20},
                  "label": "Clarity Score"},
    "pinterest": {"weights": {"title": 0.30, "description": 0.25, "keywords": 0.30, "saveability": 0.15},
                  "label": "SEO Score"},
    "threads":   {"weights": {"hook": 0.30, "conversation": 0.30, "brevity": 0.20, "opinion": 0.20},
                  "label": "Conversation Score"},
}

# ──────────────────────────────────────────────────────────
# CONTENT INPUTS
# ──────────────────────────────────────────────────────────
@dataclass
class ContentInputs:
    platform:    str
    keyword:     str
    title:       str = ""
    caption:     str = ""
    description: str = ""
    hashtags:    str = ""
    hook:        str = ""
    cta:         str = ""
    ideas:       str = ""

# ──────────────────────────────────────────────────────────
# SCORE HELPERS
# ──────────────────────────────────────────────────────────
def score_color(score: int) -> str:
    if score >= 80: return "#22c55e"
    if score >= 55: return "#f59e0b"
    return "#ef4444"


def combine_scores(ai_score: int, content_score: int):
    final = round((ai_score + content_score) / 2)
    if final >= 80:   level = "HIGH"
    elif final >= 55: level = "MEDIUM"
    else:             level = "LOW"
    return final, level


def _ct(t): return re.sub(r"\s+", " ", t or "").strip().lower()
def _kh(t, k): return sum(1 for p in _ct(k).split() if p and p in _ct(t))
def _has_cta(t):
    return any(w in _ct(t) for w in ["follow", "save", "share", "comment", "subscribe", "join", "click", "watch", "reply"])
def _has_hook(t):
    return any(w in _ct(t) for w in ["pov", "stop", "wait", "nobody", "here is", "this is why", "unpopular", "what if", "no one"])
def _has_struct(t):
    return any(m in (t or "") for m in ["1.", "2.", "3.", "•", "→", "\n"])

# ──────────────────────────────────────────────────────────
# CONTENT SCORE ENGINE
# ──────────────────────────────────────────────────────────
def calculate_score(inp: ContentInputs) -> dict:
    rule = PLATFORM_RULES.get(inp.platform, PLATFORM_RULES["instagram"])
    all_text = " ".join([inp.title, inp.caption, inp.description, inp.hashtags, inp.hook, inp.cta, inp.ideas])
    s = {}
    p = inp.platform

    if p in ("youtube", "pinterest"):
        s["title"]       = min(100, (_kh(inp.title, inp.keyword) * 25) + (10 if len(inp.title.split()) > 3 else 0))
        s["description"] = min(100, (_kh(inp.description, inp.keyword) * 20) + (15 if len(inp.description) > 120 else 0))
        s["tags"]        = min(100, len(re.findall(r"#\w+", inp.hashtags)) * 15)
        s["hook"]        = 100 if _has_hook(inp.hook or inp.caption or inp.title) else 40
        s["cta"]         = 100 if _has_cta(inp.description or inp.caption) else 45
        s["keywords"]    = min(100, _kh(all_text, inp.keyword) * 20)
        s["saveability"] = min(100, 60 + (_kh(all_text, inp.keyword) * 15))
    elif p == "instagram":
        s["hook"]     = 100 if _has_hook(inp.hook or inp.caption) else 45
        s["caption"]  = min(100, (15 if len(inp.caption) > 80 else 0) + (20 if inp.keyword.lower() in inp.caption.lower() else 0) + (10 if _has_struct(inp.caption) else 0))
        s["hashtags"] = min(100, len(re.findall(r"#\w+", inp.hashtags)) * 12)
        s["cta"]      = 100 if _has_cta(inp.caption) or _has_cta(inp.cta) else 50
        s["trend"]    = 100 if any(k in _ct(all_text) for k in ["pov", "save", "share", "reel", "aesthetic"]) else 55
    elif p == "facebook":
        s["hook"]    = 100 if _has_hook(inp.hook or inp.caption) else 50
        s["caption"] = min(100, 30 if len(inp.caption) > 100 else 15)
        s["cta"]     = 100 if _has_cta(inp.cta or inp.caption) else 55
        s["story"]   = 100 if any(w in _ct(all_text) for w in ["story", "because", "when", "then"]) else 60
    elif p == "x":
        s["hook"]         = 100 if _has_hook(inp.hook or inp.caption) else 50
        s["brevity"]      = 100 if len(inp.caption) <= 280 else max(20, 100 - (len(inp.caption) - 280) // 4)
        s["replyability"] = 100 if "?" in inp.caption or _has_cta(inp.caption) else 55
        s["topic"]        = min(100, 15 if _kh(all_text, inp.keyword) else 50)
    elif p == "tiktok":
        s["hook"]    = 100 if _has_hook(inp.hook or inp.caption) else 55
        s["caption"] = min(100, 20 if len(inp.caption) > 40 else 10)
        s["trend"]   = 100 if any(k in _ct(all_text) for k in ["stop scrolling", "wait", "pov", "viral", "quick"]) else 60
        s["cta"]     = 100 if _has_cta(inp.cta or inp.caption) else 50
    elif p == "telegram":
        s["clarity"]   = 100 if len(inp.caption) > 40 else 60
        s["structure"] = 100 if _has_struct(inp.caption or inp.description or inp.ideas) else 55
        s["cta"]       = 100 if _has_cta(inp.cta or inp.caption) else 50
    elif p == "threads":
        s["hook"]         = 100 if _has_hook(inp.hook or inp.caption) else 55
        s["conversation"] = 100 if "?" in inp.caption or "thoughts" in inp.caption else 60
        s["brevity"]      = 100 if len(inp.caption) < 220 else max(30, 100 - (len(inp.caption) - 220) // 3)
        s["opinion"]      = 100 if any(w in _ct(all_text) for w in ["opinion", "think", "unpopular"]) else 60

    weighted = sum(s.get(k, 0) * w for k, w in rule["weights"].items())
    score = round(min(100, max(0, weighted)))
    level = "HIGH" if score >= 80 else "MEDIUM" if score >= 55 else "LOW"

    tips = []
    if score < 80:
        if not _has_hook(inp.hook or inp.caption or inp.title):
            tips.append("Add a stronger hook in the first line.")
        if not _has_cta(inp.cta or inp.caption or inp.description):
            tips.append("Add a clear CTA: save, share, comment, or follow.")
        if p in ("instagram", "youtube", "pinterest") and _kh(all_text, inp.keyword) == 0:
            tips.append("Place your keyword naturally in the title or opening line.")
        if p in ("instagram", "tiktok") and len(re.findall(r"#\w+", inp.hashtags)) < 3:
            tips.append("Add a better hashtag mix: 2 HIGH + 2 MEDIUM + 1 LOW.")
    else:
        tips.append("This content is strong for the selected platform. Ready to post.")

    return {"score": score, "level": level, "tips": tips, "label": rule["label"]}


def build_tag_scores(keyword: str, platform: str) -> list:
    base = {
        "youtube":   [keyword, "youtube seo", "video ideas", "content strategy", "creator tips", "watch time", "retention"],
        "instagram": [keyword, "reels", "instagram tips", "content creator", "viral post", "aesthetic", "hashtags"],
        "facebook":  [keyword, "facebook tips", "community post", "shareable", "discussion", "story post"],
        "x":         [keyword, "x tips", "short post", "opinion post", "reply bait", "thread starter"],
        "tiktok":    [keyword, "tiktok tips", "viral hook", "short form", "trend format", "fyp"],
        "telegram":  [keyword, "broadcast", "channel post", "updates", "community", "daily tips"],
        "pinterest": [keyword, "pinterest seo", "pin title", "evergreen", "saveable", "visual guide"],
        "threads":   [keyword, "threads tips", "conversation starter", "hot take", "discussion", "personal post"],
    }
    items = base.get(platform, [keyword])
    score_map = {0: 95, 1: 78, 2: 78, 3: 62, 4: 62, 5: 42, 6: 42}
    return [(tag, score_map.get(i, 42)) for i, tag in enumerate(items) if tag]

# ──────────────────────────────────────────────────────────
# AI CALL
# ──────────────────────────────────────────────────────────
def ai(prompt: str, temp: float = 0.5, tokens: int = 280) -> str:
    try:
        r = ai_client.chat.completions.create(
            model=AI_MODEL,
            messages=[{"role": "user", "content": prompt}],
            temperature=temp,
            max_tokens=tokens
        )
        if r.choices:
            return r.choices[0].message.content.strip()
    except:
        pass
    return ""

# ──────────────────────────────────────────────────────────
# TEXT UTILITIES
# ──────────────────────────────────────────────────────────
def clean_lines(txt: str, n: int = 5) -> list:
    out = []
    for raw in txt.splitlines():
        l = raw.strip()
        if not l:
            continue
        l = re.sub(r"^\s*(?:\d+[\.\)]\s*|[-•*]\s*)", "", l).strip()
        if l.lower().startswith(("here are", "sure", "of course", "absolutely")):
            continue
        if l:
            out.append(l)
    return out[:n]


def dedupe(items: list) -> list:
    seen, out = set(), []
    for x in items:
        k = x.strip().lower()
        if k and k not in seen:
            seen.add(k)
            out.append(x.strip())
    return out


def parse_tags(out: str) -> list:
    tags = []
    for raw in re.split(r"[\n,;]+", out):
        it = raw.strip()
        if not it:
            continue
        it = re.sub(r"^\s*(?:\d+[\.\)]\s*|[-*]\s*)", "", it).strip()
        it = re.sub(r"^\s*(?:tags?:|hashtags?:)\s*", "", it, flags=re.I).strip()
        it = it.strip("\"'").lstrip("#").strip()
        it = re.sub(r"\s+", " ", it)
        if it:
            tags.append(it)
    return dedupe(tags)

# ──────────────────────────────────────────────────────────
# CONTENT IDEA GENERATOR
# ──────────────────────────────────────────────────────────
def generate_ideas(topic: str, platform: str, n: int = 5) -> list:
    prompt = (
        f"Create {n} content ideas for {platform}.\nNiche: {topic}\n"
        f"Rules: use the niche directly, platform-native, no generic filler.\n"
        f"Return one idea per line. No numbering. No preamble."
    )
    out = ai(prompt, 0.7, 260)
    lines = clean_lines(out, n)
    if len(lines) >= 2:
        return lines
    fallbacks = {
        "instagram": ["before and after", "mistake to avoid", "quick tips carousel", "myth versus truth", "transformation reel"],
        "facebook":  ["story post", "discussion post", "myth versus truth", "list post", "shareable tip"],
        "tiktok":    ["before versus after", "quick tip 30 sec", "mistake to avoid", "transformation video", "trend edit"],
        "telegram":  ["daily update", "checklist", "quick guide", "useful tips", "resource roundup"],
        "threads":   ["hot take", "personal story", "simple truth", "discussion starter", "relatable post"],
        "x":         ["hot take", "one line truth", "opinion post", "reply bait question", "thread starter"],
        "youtube":   ["complete breakdown", "beginner guide", "mistakes to avoid", "step by step tutorial", "review and analysis"],
        "pinterest": ["pin title idea", "evergreen guide", "searchable pin", "saveable inspiration", "visual checklist"],
    }
    return [f"{topic} {s}" for s in fallbacks.get(platform, fallbacks["instagram"])[:n]]

# ──────────────────────────────────────────────────────────
# HASHTAG BUILDER
# ──────────────────────────────────────────────────────────
def build_hashtag_groups(platform: str, keyword: str) -> list:
    """Returns list of (band, tag) tuples."""
    slug = keyword.replace(" ", "")
    groups = {
        "instagram": [("HIGH", f"#{slug}"), ("HIGH", "#reels"), ("MEDIUM", "#contentcreator"), ("MEDIUM", "#viral"), ("LOW", "#newcreator")],
        "facebook":  [("HIGH", "#facebook"), ("MEDIUM", "#contentcreator"), ("MEDIUM", "#shareable"), ("LOW", "#community")],
        "tiktok":    [("HIGH", "#tiktok"), ("HIGH", "#fyp"), ("MEDIUM", "#viral"), ("MEDIUM", "#creator"), ("LOW", "#trending")],
        "telegram":  [("HIGH", "#telegram"), ("MEDIUM", "#community"), ("MEDIUM", "#updates"), ("LOW", "#broadcast")],
        "threads":   [("HIGH", "#threads"), ("HIGH", f"#{slug}"), ("MEDIUM", "#conversation"), ("LOW", "#community")],
        "x":         [("HIGH", "#x"), ("MEDIUM", f"#{slug}"), ("MEDIUM", "#conversation"), ("LOW", "#reply")],
        "youtube":   [("HIGH", "#youtube"), ("HIGH", f"#{slug}"), ("MEDIUM", "#tutorial"), ("LOW", "#howto")],
        "pinterest": [("HIGH", f"#{slug}"), ("HIGH", "#pinterest"), ("MEDIUM", "#aesthetic"), ("LOW", "#inspo")],
    }
    return groups.get(platform, [("HIGH", f"#{slug}")])

# ──────────────────────────────────────────────────────────
# PLATFORM CONTENT GENERATORS
# ──────────────────────────────────────────────────────────
def generate_instagram(topic: str) -> dict:
    ideas = generate_ideas(topic, "instagram", 5)
    ai_score = min(100, 84 + len(topic) // 3)
    return {
        "platform": "instagram",
        "ai_score": ai_score,
        "hooks": [
            f"POV: you finally fixed your {topic}",
            f"Stop making this {topic} mistake",
            f"Nobody tells you this about {topic}",
            f"Your {topic} glow up starts here",
            f"Here is the real {topic} formula",
        ],
        "cta": ["Follow for more tips", "Save this for later", "Comment your favorite tip", "Share this with your bestie", "Which one are you trying first"],
        "ideas": ideas,
        "hashtags": build_hashtag_groups("instagram", topic),
        "best_time": "6:00 PM – 9:00 PM",
    }


def generate_facebook(topic: str) -> dict:
    ideas = generate_ideas(topic, "facebook", 5)
    return {
        "platform": "facebook",
        "ai_score": 66,
        "hooks": [
            f"Here is what actually works in {topic}.",
            f"Nobody tells you this about {topic}, but it matters.",
            f"If you care about {topic}, read this first.",
            f"Most people get {topic} completely wrong.",
            f"I wish someone told me this about {topic}.",
        ],
        "cta": [f"Let's talk about {topic} the simple way.", "Keep it useful and shareable.", "Save this and come back later.", "Drop a comment if this helped."],
        "ideas": ideas,
        "hashtags": build_hashtag_groups("facebook", topic),
        "best_time": "1:00 PM – 4:00 PM",
    }


def generate_tiktok(topic: str) -> dict:
    ideas = generate_ideas(topic, "tiktok", 5)
    return {
        "platform": "tiktok",
        "ai_score": 73,
        "hooks": [
            f"Stop scrolling if you care about {topic}.",
            f"This changes everything about {topic}.",
            f"You are probably doing {topic} wrong.",
            f"Nobody told you this about {topic}.",
            f"Watch this before you try {topic}.",
        ],
        "cta": ["Watch till the end", "Save this", "Follow for more", "Duet this if you agree"],
        "ideas": ideas,
        "hashtags": build_hashtag_groups("tiktok", topic),
        "best_time": "6:00 PM – 10:00 PM",
    }


def generate_telegram(topic: str) -> dict:
    ideas = generate_ideas(topic, "telegram", 5)
    return {
        "platform": "telegram",
        "ai_score": 58,
        "hooks": [f"{topic} simplified:\n\n1. What it is\n2. Why it matters\n3. How to use it\n\nThat is all you need."],
        "cta": ["Join for updates", "Save this post", "Forward to a friend"],
        "ideas": ideas,
        "hashtags": build_hashtag_groups("telegram", topic),
        "best_time": "9:00 AM – 12:00 PM",
    }


def generate_threads(topic: str) -> dict:
    ideas = generate_ideas(topic, "threads", 5)
    ai_score = random.randint(72, 88)
    style = random.choice(["story", "controversial", "educational"])
    post_variants = {
        "story":         f"I struggled with {topic} for months.\n\nNothing worked.\n\nUntil one shift changed everything.\n\nHave you experienced this?",
        "controversial": f"{topic} is overrated.\n\nEveryone follows the same advice.\n\nBut it doesn't work for most people.\n\nAgree or disagree?",
        "educational":   f"How to actually improve {topic}:\n\n1. Stop overthinking\n2. Stay consistent\n3. Track progress\n\nSave this 🔥",
    }
    return {
        "platform": "threads",
        "ai_score": ai_score,
        "style": style,
        "hooks": [post_variants[style]],
        "cta": [f"Style: {style.capitalize()}", "Ask a question at the end", "Keep it conversational", "No hashtags needed"],
        "ideas": ideas,
        "hashtags": build_hashtag_groups("threads", topic),
        "best_time": "8:00 AM – 11:00 AM",
    }


def generate_x(topic: str) -> dict:
    ideas = generate_ideas(topic, "x", 5)
    return {
        "platform": "x",
        "ai_score": 62,
        "hooks": [f"Hot take: {topic} is still misunderstood."],
        "cta": ["Reply with your take", "Quote with your opinion", "Share if you agree", "Thread incoming 🧵"],
        "ideas": ideas,
        "hashtags": build_hashtag_groups("x", topic),
        "best_time": "8:00 AM – 11:00 AM",
    }


def generate_youtube_basic(topic: str) -> dict:
    ideas = generate_ideas(topic, "youtube", 5)
    return {
        "platform": "youtube",
        "ai_score": 81,
        "hooks": [f"{topic} — Complete Breakdown"],
        "cta": ["Subscribe for more", "Like if this helped", "Comment your question", "Share with a friend"],
        "ideas": ideas,
        "hashtags": build_hashtag_groups("youtube", topic),
        "best_time": "2:00 PM – 4:00 PM",
    }


def generate_pinterest(topic: str) -> dict:
    ideas = generate_ideas(topic, "pinterest", 5)
    return {
        "platform": "pinterest",
        "ai_score": 69,
        "hooks": [f"{topic} — Pin Title Ideas"],
        "cta": ["Save this pin", "Click through for more", "Follow the board"],
        "ideas": ideas,
        "hashtags": build_hashtag_groups("pinterest", topic),
        "best_time": "8:00 PM – 11:00 PM",
    }


PLATFORM_GENERATORS = {
    "instagram": generate_instagram,
    "facebook":  generate_facebook,
    "tiktok":    generate_tiktok,
    "telegram":  generate_telegram,
    "threads":   generate_threads,
    "x":         generate_x,
    "youtube":   generate_youtube_basic,
    "pinterest": generate_pinterest,
}


def _get_platform_data(topic: str, platform: str) -> dict:
    """Internal helper — returns raw platform dict (no tone logic)."""
    fn = PLATFORM_GENERATORS.get(platform.lower())
    if not fn:
        raise ValueError(f"Unknown platform: {platform}")
    return fn(topic)

# ──────────────────────────────────────────────────────────
# AI-POWERED GENERATORS
# ──────────────────────────────────────────────────────────
def ai_instagram_hooks(keyword: str) -> list:
    out = ai(f"Write 5 viral Instagram hooks for: {keyword}. Max 12 words each. One per line. No numbering.", 0.6, 160)
    return clean_lines(out, 5) or [f"POV: you finally mastered {keyword}"]


def ai_facebook_hooks(keyword: str) -> list:
    out = ai(f"Write 3 Facebook storytelling hooks for: {keyword}. Emotional, shareable. One per line.", 0.5, 200)
    return clean_lines(out, 3) or [f"Nobody talks about {keyword} but it matters."]


def ai_tiktok_hooks(keyword: str) -> list:
    out = ai(f"Write 5 ultra-short TikTok hooks for: {keyword}. Max 10 words. One per line.", 0.6, 140)
    return clean_lines(out, 5) or [f"Stop scrolling — {keyword} changes everything."]


def ai_telegram_post(keyword: str) -> str:
    out = ai(f"Write a Telegram channel post about: {keyword}. Arrows, numbered steps, CTA at end. Max 160 words.", 0.4, 240)
    return out.strip() or f"{keyword} simplified:\n\n1. Start\n2. Learn\n3. Apply\n\nThat is it."


def ai_threads_post(keyword: str) -> str:
    out = ai(f"Write 3 short Threads posts for: {keyword}. Mix story, controversial, educational. Hook+body+CTA. Separate with ---.", 0.6, 300)
    parts = [p.strip() for p in out.split("---") if p.strip()]
    return max(parts, key=len) if parts else f"{keyword} is still misunderstood.\n\nMost people never ask why.\n\nYou should. 👇"


def ai_x_posts(topic: str, style: str = "Hot take") -> list:
    out = ai(f"Write 5 high performing X posts about: {topic}\nStyle: {style}\nReturn only 5 posts, one per line.", 0.45, 240)
    lines = [re.sub(r"^\s*(?:\d+[\.\)]\s*|[-*]\s*)", "", l).strip() for l in out.splitlines() if l.strip()]
    lines = [l for l in lines if l]
    if not lines:
        lines = [topic]
    while len(lines) < 5:
        lines.append(lines[-1])
    return lines[:5]


def ai_x_thread(topic: str) -> list:
    out = ai(
        f"Write a 6 post X thread about: {topic}\n"
        f"Structure: 1.hook 2.setup 3.value 4.value 5.insight 6.CTA\n"
        f"Return 6 posts, one per line.", 0.5, 300
    )
    lines = [re.sub(r"^\s*(?:\d+[\.\)]\s*|[-*]\s*)", "", l).strip() for l in out.splitlines() if l.strip()]
    lines = [l for l in lines if l]
    if not lines:
        lines = [
            f"1/6 {topic} is misunderstood.", "2/6 Here's what people miss.",
            "3/6 Not about effort.", "4/6 Positioning.",
            "5/6 This changed my thinking.", "6/6 What's your take?"
        ]
    while len(lines) < 6:
        lines.append(lines[-1])
    return lines[:6]


def ai_x_replies(comment: str) -> list:
    out = ai(f"Write 5 natural reply options to this X post:\n{comment}\nHuman, sharp. One per line.", 0.45, 200)
    lines = [l.strip() for l in out.splitlines() if l.strip()]
    if not lines:
        lines = ["Interesting.", "Tell me more.", "Fair point.", "I see.", "Good question."]
    while len(lines) < 5:
        lines.append(lines[-1])
    return lines[:5]


def ai_youtube_titles(keyword: str) -> list:
    out = ai(f"Generate 5 high quality YouTube titles for: {keyword}. Return only titles, one per line.", 0.35, 220)
    lines = clean_lines(out, 5) or [keyword]
    while len(lines) < 5:
        lines.append(lines[-1])
    return lines[:5]


def ai_youtube_description(keyword: str, title: str = "") -> str:
    out = ai(f"Write a YouTube description for: {keyword}. Title: {title or keyword}. Hook, SEO, CTA, 5 hashtags.", 0.5, 360)
    return out or (
        f"{title or keyword} explained clearly.\n\nIn this video:\n1. What {keyword} means\n2. Why it matters\n"
        f"3. The biggest mistakes\n4. How to apply step by step\n\nLike, comment, subscribe.\n\n"
        f"#{keyword.replace(' ','')} #youtube #contentcreator"
    )


def ai_youtube_tags(keyword: str) -> list:
    out = ai(f"Generate 12 YouTube tags for: {keyword}. Return only tags, one per line.", 0.25, 180)
    tags = parse_tags(out)
    fallback = [keyword, f"{keyword} tutorial", f"{keyword} guide", f"{keyword} tips",
                f"best {keyword}", f"how to {keyword}", f"{keyword} for beginners", f"{keyword} explained"]
    return dedupe(tags + fallback)[:12] or fallback[:8]


def ai_pinterest_pack(topic: str) -> dict:
    tp = ai(f'Generate 5 Pinterest Pin Titles for: "{topic}". No numbering. Max 100 chars. One per line.', 0.4, 200)
    dp = ai(f'Write a Pinterest Pin Description for: "{topic}". 2-3 lines. 3-5 hashtags at end.', 0.4, 180)
    kp = ai(f'Generate 8 Pinterest SEO keywords for: "{topic}". One per line.', 0.3, 160)
    titles = clean_lines(tp, 5) or [f"{topic} ideas", f"How to {topic}", f"Best {topic} tips", f"{topic} inspiration", f"Ultimate {topic} guide"]
    desc   = dp.strip() or f"Discover the best {topic} ideas.\n\n#{topic.replace(' ','')} #aesthetic #viral"
    kws    = clean_lines(kp, 8) or [topic, f"{topic} ideas", f"best {topic}", f"{topic} tips"]
    return {"titles": titles, "description": desc, "keywords": kws}

# ──────────────────────────────────────────────────────────
# X POST QUALITY SCORER
# ──────────────────────────────────────────────────────────
def score_x_post(text: str) -> dict:
    s = 0
    tx = text.lower()
    if any(k in tx for k in ["hot take", "unpopular", "nobody talks", "stop", "overrated"]): s += 25
    if "?" in text or "thoughts?" in tx: s += 15
    if any(k in tx for k in ["1/", "thread"]): s += 20
    if any(k in tx for k in ["ago", "today", "before", "after"]): s += 15
    if any(c.isdigit() for c in text): s += 10
    if 60 <= len(text) <= 220: s += 5
    score = min(s, 100)
    band = "High" if score >= 80 else "Medium" if score >= 55 else "Low"
    return {"score": score, "band": band}

# ──────────────────────────────────────────────────────────
# FULL CONTENT INSIGHT (AI + CONTENT COMBINED)
# ──────────────────────────────────────────────────────────
def get_content_insight(platform: str, keyword: str, hook: str = "", cta: str = "",
                        hashtags: str = "", ideas: str = "", ai_score: int = 70) -> dict:
    inp = ContentInputs(
        platform=platform, keyword=keyword,
        hook=hook, cta=cta, ideas=ideas,
        hashtags=hashtags, caption=hook, title=hook, description=cta
    )
    result = calculate_score(inp)
    content_score = result["score"]
    final_score, level = combine_scores(ai_score, content_score)
    tag_scores = build_tag_scores(keyword, platform)
    return {
        "ai_score":      ai_score,
        "content_score": content_score,
        "final_score":   final_score,
        "level":         level,
        "tips":          result["tips"],
        "label":         result["label"],
        "tag_scores":    tag_scores,
        "colors": {
            "ai":      score_color(ai_score),
            "content": score_color(content_score),
            "final":   score_color(final_score),
        }
    }

# ──────────────────────────────────────────────────────────
# TONE-BASED HOOK GENERATOR
# ──────────────────────────────────────────────────────────
def generate_hooks(keyword: str, tone: str) -> list:
    tone = tone.lower().strip()
    if tone == "bold":
        return [
            f"Stop doing {keyword} like this",
            f"You are ruining your {keyword} growth",
            f"This mistake is killing your {keyword}",
        ]
    elif tone == "funny":
        return [
            f"When you try {keyword} and fail 😂",
            f"{keyword} but make it chaotic 🤡",
            f"POV: You thought {keyword} was easy",
        ]
    elif tone == "emotional":
        return [
            f"No one talks about this in {keyword}",
            f"This {keyword} journey is not easy",
            f"You deserve better in {keyword}",
        ]
    else:  # default / informative
        return [
            f"Best {keyword} tips you need",
            f"Learn {keyword} step by step",
            f"{keyword} guide for beginners",
        ]

# ──────────────────────────────────────────────────────────
# TONE-BASED CAPTION GENERATOR
# ──────────────────────────────────────────────────────────
def generate_captions(keyword: str, tone: str, content_type: str) -> list:
    tone = tone.lower().strip()
    if tone == "bold":
        return [
            f"No excuses. Start {keyword} today.",
            f"If you are serious about {keyword}, act now.",
        ]
    elif tone == "funny":
        return [
            f"{keyword} but make it funny 😂",
            f"This {keyword} fail is too real 🤡",
        ]
    elif tone == "emotional":
        return [
            f"You are not late. Start {keyword} today 💖",
            f"This is your sign to begin {keyword}",
        ]
    else:
        return [
            f"Best {keyword} strategy that works",
            f"Save this for your {keyword} journey",
        ]

# ──────────────────────────────────────────────────────────
# TONE-BASED CTA GENERATOR
# ──────────────────────────────────────────────────────────
def generate_cta(tone: str) -> list:
    tone = tone.lower().strip()
    if tone == "bold":
        return ["Follow now", "Stop scrolling and act"]
    elif tone == "funny":
        return ["Share with your bestie 😂", "Tag someone"]
    elif tone == "emotional":
        return ["Save this 💖", "You need this"]
    else:
        return ["Follow for more", "Save this post"]

# ──────────────────────────────────────────────────────────
# KEYWORD-BASED HASHTAG GENERATOR (TIERED)
# ──────────────────────────────────────────────────────────
def generate_hashtags(keyword: str) -> dict:
    return {
        "high":   [f"#{keyword.replace(' ', '')}", "#viral", "#trending"],
        "medium": ["#contentcreator", "#growth", "#tips"],
        "low":    ["#newcreator", "#starttoday", "#explore"],
    }

# ──────────────────────────────────────────────────────────
# UNIFIED CONTENT GENERATOR (UI-READY)
# Connects scoring engine + YouTube Intelligence + tone/type
# ──────────────────────────────────────────────────────────
def generate_content(
    keyword:      str,
    platform:     str,
    content_type: str,
    tone:         str,
    language:     str = "english",
) -> dict:
    """
    Main unified entry point for UI-facing calls.

    - YouTube  → uses YouTubeIntelligenceEngine (real API data + patterns)
    - All else → uses SocioMee scoring engine + tone/content_type support

    Args:
        keyword      : niche or topic (e.g. "skincare routine")
        platform     : one of PLATFORMS list
        content_type : e.g. "reel", "post", "story", "thread", "pin"
        tone         : "bold" | "funny" | "emotional" | "informative"
        language     : "english" | "hinglish" | "both" (default: "english")

    Returns:
        Full content dict ready for the frontend / API response.
    """

    # ── Sanitise inputs ───────────────────────────────────────────────────
    platform     = (platform     or "").lower().strip()
    keyword      = (keyword      or "").strip()
    content_type = (content_type or "").strip()
    tone         = (tone         or "bold").strip()
    language     = (language     or "english").strip().lower()

    # ── Instagram branch — powered by InstagramEngine ─────────────────
    if platform == "instagram":
        engine = InstagramEngine()
        data = engine.build_intelligence_pack(
            keyword=keyword,
            tone=tone,
            content_type=content_type,
            niche=keyword,
            language=language,
        )
        return {
            "platform":          "instagram",
            "keyword":           keyword,
            "content_type":      content_type,
            "tone":              tone,
            "hooks":             data.get("hooks", []),
            "captions":          data.get("captions", []),
            "cta":               data.get("cta", "Follow for more 🔥"),
            "hashtags":          data.get("hashtags", {}),
            "reel_ideas":        data.get("reel_ideas", []),
            "post_ideas":        data.get("post_ideas", []),
            "story_ideas":       data.get("story_ideas", []),
            "best_time":         data.get("best_time", {}),
            "trend_prediction":  data.get("trend_prediction", {}),
            "trending_keywords": data.get("trend_keywords", []),
            "top_search_terms":  data.get("top_search_terms", []),
            "viral_sounds":      data.get("viral_sounds", []),
            "aesthetic_profile": data.get("aesthetic_profile", {}),
            "profile_preview":   data.get("profile_preview", {}),
            "quality_notes":     data.get("quality_notes", []),
            "prompt_support":    data.get("prompt_support", []),
            "scores":            data.get("scores", {}),
            "description":       data.get("description", ""),
        }

    # ── YouTube branch — powered by YouTubeIntelligenceEngine ──────────
    if platform == "youtube":
        engine = YouTubeIntelligenceEngine()
        yt = engine.build_intelligence_pack(keyword=keyword)
        return {
            "platform":           "youtube",
            "keyword":            keyword,
            "content_type":       content_type,
            "tone":               tone,
            "hooks":              yt["hooks"],
            "captions":           yt["captions"],
            "cta":                "Follow for more 🚀",
            "hashtags":           yt["hashtags"],
            "ideas":              yt["ideas"],
            "best_time":          yt["best_time"],
            "trending_keywords":  yt["trending_keywords"],
            "top_search_terms":   yt["top_search_terms"],
            "scores":             yt["scores"],
            "description":        yt["description"],
            "search_results":     yt["search_results"][:10],
            "top_current_titles": yt["top_current_titles"],
            "top_channels":       yt["top_channels"],
            "quality_notes":      yt["quality_notes"],
            "prompt_support":     yt["prompt_support"],
        }

    # ── All other platforms ────────────────────────────────────────────
    # ── All other platforms ────────────────────────────────────────────────
    insight = get_content_insight(platform=platform, keyword=keyword)

    ai_score      = insight.get("ai_score", 75)
    content_score = insight.get("content_score", 75)
    final_score   = insight.get("final_score", 80)

    # Hooks: prefer platform-native hooks, fall back to tone-based
    platform_data  = _get_platform_data(keyword, platform)
    existing_hooks = platform_data.get("hooks", [])
    hooks          = existing_hooks if existing_hooks else generate_hooks(keyword, tone)

    # Captions: always tone-aware
    captions = generate_captions(keyword, tone, content_type)

    # CTA: tone-aware
    cta = generate_cta(tone)

    # Hashtags: prefer platform groups, fall back to tiered generator
    raw_hashtags = platform_data.get("hashtags", [])
    if raw_hashtags:
        hashtags: dict | list = {"high": [], "medium": [], "low": []}
        for band, tag in raw_hashtags:
            hashtags[band.lower()].append(tag)
    else:
        hashtags = generate_hashtags(keyword)

    return {
        "platform":     platform,
        "keyword":      keyword,
        "content_type": content_type,
        "tone":         tone,
        "hooks":        hooks,
        "captions":     captions,
        "cta":          cta,
        "hashtags":     hashtags,
        "best_time":    platform_data.get("best_time", ""),
        "ideas":        platform_data.get("ideas", []),
        "scores": {
            "ai_score":      ai_score,
            "content_score": content_score,
            "final_score":   final_score,
            "level":         insight.get("level", "MEDIUM"),
            "label":         insight.get("label", ""),
            "tag_scores":    insight.get("tag_scores", []),
            "colors":        insight.get("colors", {}),
        },
        "tips": insight.get("tips", []),
    }

# ──────────────────────────────────────────────────────────
# SMART CHATBOT — FAQ REPLY ENGINE
# ──────────────────────────────────────────────────────────
FAQ = {
    "best time":   "Post between 6 PM - 9 PM for max reach.",
    "hashtags":    "Use 3-5 strong keywords, avoid spam.",
    "thumbnail":   "Use emotion + bold text + contrast.",
    "hook":        "Open with a question, bold claim, or relatable moment.",
    "cta":         "Always end with: save, share, comment, or follow.",
    "viral":       "Short hook + value + strong CTA = viral formula.",
    "reel":        "Keep reels under 30 seconds. Hook in first 2 seconds.",
    "caption":     "Lead with the hook. Add value. Close with CTA.",
    "engagement":  "Ask a question at the end to boost comments.",
    "youtube":     "Title + thumbnail = 80% of clicks. Optimize both.",
    "tiktok":      "First 3 seconds decide everything. Start strong.",
    "instagram":   "Use 3-5 targeted hashtags, not 30 generic ones.",
    "seo":         "Use your main keyword in the first line and title.",
    "frequency":   "Post 3-5 times a week for steady growth.",
    "story":       "Stories get 2x reach. Use polls and question boxes.",
}


def chatbot_reply(query: str) -> str:
    """
    Simple FAQ chatbot for SocioMee.
    Matches query keywords against FAQ dict and returns the best answer.

    Args:
        query: User's question as a string.

    Returns:
        A helpful string answer, or a fallback prompt.
    """
    q = query.lower().strip()
    for key, answer in FAQ.items():
        if key in q:
            return answer
    return "Ask me about thumbnails, hashtags, best time to post, hooks, or CTAs."