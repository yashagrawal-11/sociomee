"""
ai_scriptwriter.py — SocioMee AI Script Writer
Fixed: generate_script() now accepts optional 'platform' parameter.
"""

from __future__ import annotations

import hashlib
import json
import os
import random
import re
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from textwrap import dedent
from typing import Any, Dict, List, Optional


try:
    import requests as _requests
except ImportError:
    _requests = None

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass


# ── ENV ────────────────────────────────────────────────────────────────
NVIDIA_API_KEY  = os.getenv("NVIDIA_API_KEY")
NVIDIA_BASE_URL = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL    = os.getenv("NVIDIA_MODEL", "google/gemma-3-27b-it")

WORDS_PER_MINUTE    = 130
SUPPORTED_LANGUAGES = {"english", "hinglish"}
SUPPORTED_PLATFORMS = {
    "youtube", "instagram", "tiktok", "x",
    "threads", "facebook", "linkedin",
}


# ══════════════════════════════════════════════════════════════════════
# NVIDIA CLIENT
# ══════════════════════════════════════════════════════════════════════

def _nvidia_chat(
    messages:    List[Dict[str, Any]],
    max_tokens:  int   = 4096,
    temperature: float = 0.7,
) -> str:
    if not NVIDIA_API_KEY:
        raise RuntimeError("Missing NVIDIA_API_KEY in .env")
    if _requests is None:
        raise RuntimeError("requests library not installed")

    url = f"{NVIDIA_BASE_URL.rstrip('/')}/chat/completions"
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type":  "application/json",
    }
    payload = {
        "model":       NVIDIA_MODEL,
        "messages":    messages,
        "max_tokens":  max_tokens,
        "temperature": temperature,
    }
    resp = _requests.post(url, headers=headers, json=payload, timeout=120)
    if resp.status_code != 200:
        raise RuntimeError(f"NVIDIA error {resp.status_code}: {resp.text[:400]}")
    return resp.json()["choices"][0]["message"]["content"]


# ══════════════════════════════════════════════════════════════════════
# PERSONA VOICE GUIDES
# ══════════════════════════════════════════════════════════════════════

PERSONA_VOICE_GUIDES: Dict[str, str] = {

    "dhruvrathee": dedent("""
        You are writing in Dhruv Rathee's exact style.
        VOICE:
        - Calm, analytical, investigative
        - Always opens with "Namaskar doston" + a striking fact or question
        - Hindi-matrix Hinglish: Hindi grammar, English technical/policy/proper-noun terms retained
        - Structure per section: Problem → Context → Evidence → Analysis → Implication
        - Numbers cited aloud: "pehli baat", "doosri baat", "teesri baat"
        - Cite sources aloud: "Reuters ke mutabiq", "Bloomberg ki report mein"
        - NEVER use: hype words, slang, hedging
        - BANNED phrases: "let us begin", "it is important", "as we all know", "in conclusion"
    """).strip(),

    "carryminati": dedent("""
        You are writing in CarryMinati (Ajey Nagar)'s exact style.
        VOICE:
        - High energy Hindi-matrix Hinglish, aggressive roast
        - Sentences: 4-8 words, chaotic rhythm
        - Must use: bhai, yaar, arre, dekh, sun
        - Pattern interrupts: sudden volume drops mid-sentence, then EXPLODE
        - Every 3rd paragraph must have a roast punchline
        - Close section with: "Toh bhai, yahi tha scene."
        - NEVER: calm/measured tone, academic vocabulary, formal openers
    """).strip(),

    "samayraina": dedent("""
        You are writing in Samay Raina's exact style.
        VOICE:
        - Dry wit, dark comedy, deadpan Hinglish
        - Sentences: 10-15 words, slow build with [pause] markers
        - Anti-climax is the punchline tool
        - Signature: "matlab", "haan toh", "sochta hoon", "ye bhi theek hai"
        - NEVER scream, NEVER use hyperbole
    """).strip(),

    "rebelkid": dedent("""
        You are writing in RebelKid (Apoorva Mukhija)'s exact style.
        VOICE:
        - Bold, unapologetic, English-matrix Hinglish (~70% English)
        - Breathless run-on sentences followed by sharp fragments
        - Signature: "cute little red flag", "not my problem", "boundary hai"
        - Direct address to viewer: "you know what I mean?", "literally why"
        - NEVER: academic tone, passive voice, hedging
    """).strip(),

    "shahrukhkhan": dedent("""
        You are writing in Shah Rukh Khan's cinematic monologue style.
        VOICE:
        - Poetic Hindi-Urdu matrix with occasional English
        - Must use: ishq, zindagi, dil, mohabbat, khwab, safar, yakeen
        - Metaphors of stars, seasons, journeys, love
        - End each section with a philosophical one-liner
        - Warm, nostalgic, slightly dramatic
    """).strip(),

    "mrbeast": dedent("""
        You are writing in MrBeast's exact style.
        VOICE:
        - Pure English, 6th grade reading level
        - Sentences: 5-10 words maximum
        - Every 20-30 words must have a micro-hook or stakes-raise
        - Openers: always stakes-driven ("This cost $1 million")
        - No passive voice ever. Energy: 10/10 constant
        - Transitions: "But wait", "And then", "So we decided to"
    """).strip(),

    "alexhormozi": dedent("""
        You are writing in Alex Hormozi's exact style.
        VOICE:
        - Direct, English-only, framework-driven
        - Sentences: 5-12 words, stacked like bullet points
        - Antithesis: "Winners do X. Losers do Y."
        - Vocabulary: leverage, compound, asymmetric, offer, system
        - Energy ceiling: 5/10 — credibility through calm authority
        - BANNED: hedging, filler, any sentence over 15 words
    """).strip(),

    "joerogan": dedent("""
        You are writing in Joe Rogan's conversational podcast style.
        VOICE:
        - English, curious and exploratory
        - Asymmetric rhythm: short ("Dude.") then long (30-word exploration)
        - Socratic questioning: ask question, partially answer, ask deeper question
        - Signature: "dude", "man", "it's entirely possible", "think about it"
        - End sections with: "And that's the part that gets me."
        - NEVER: formal language, corporate tone, passive voice
    """).strip(),

    "default": dedent("""
        You are a clear, direct, and engaging YouTube creator.
        VOICE:
        - Conversational, friendly, accessible
        - Mix of English and Hinglish based on language setting
        - Medium energy, neither too hype nor too dry
        - Sentences: 10-15 words, natural rhythm
        - Every paragraph must add a new fact, angle, or story beat
    """).strip(),
}


# ══════════════════════════════════════════════════════════════════════
# STRUCTURE FORMATTER
# ══════════════════════════════════════════════════════════════════════

def _format_structure(structure: Dict[str, Any]) -> str:
    lines: List[str] = ["SCRIPT STRUCTURE BRIEF:"]
    hook       = structure.get("hook", "")
    background = structure.get("background", "")
    timeline   = structure.get("timeline", [])
    conflict   = structure.get("conflict", "")
    key_points = structure.get("key_points", [])
    conclusion = structure.get("conclusion", "")
    if hook:        lines.append(f"\nHOOK:\n  {hook}")
    if background:  lines.append(f"\nBACKGROUND:\n  {background}")
    if timeline:
        lines.append("\nTIMELINE:")
        for item in timeline: lines.append(f"  - {item}")
    if conflict:    lines.append(f"\nCONFLICT:\n  {conflict}")
    if key_points:
        lines.append("\nKEY POINTS:")
        for i, pt in enumerate(key_points, 1): lines.append(f"  {i}. {pt}")
    if conclusion:  lines.append(f"\nCONCLUSION:\n  {conclusion}")
    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════
# UTILITIES
# ══════════════════════════════════════════════════════════════════════

def _word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", text))

def _is_too_short(text: str, min_words: int = 2000) -> bool:
    return _word_count(text) < min_words


# ══════════════════════════════════════════════════════════════════════
# OFFLINE SCRIPT BUILDER
# ══════════════════════════════════════════════════════════════════════

def _offline_script(
    topic:     str,
    structure: Dict[str, Any],
    persona:   str,
    language:  str,
) -> str:
    t          = topic.strip()
    hook       = structure.get("hook") or f"Aaj hum {t} ke baare mein woh baat karenge jo log usually ignore karte hain."
    background = structure.get("background") or f"{t} ka background samajhna puri picture ke liye zaroori hai."
    timeline   = structure.get("timeline") or []
    conflict   = structure.get("conflict") or f"{t} mein ek fundamental tension hai jo is poori story ko drive karti hai."
    key_points = structure.get("key_points") or [
        f"{t} ke claims vs actual evidence",
        "Key stakeholders aur unka role",
        "Regulatory aur systemic dimension",
        "Public perception vs documented reality",
        "Long-term implications",
    ]
    conclusion = structure.get("conclusion") or (
        f"{t} se yahi seekhne ko milta hai ki verification aur critical thinking se zyada koi powerful tool nahi hai."
    )

    is_hi = language == "hinglish"
    # persona can arrive as dict or string
    if isinstance(persona, dict):
        persona = persona.get("voice") or persona.get("name") or "default"
    p     = str(persona).lower().strip()

    if is_hi:
        opener = {"dhruvrathee":"Namaskar doston.","carryminati":"Bhai, sun zara.","samayraina":"Toh haan...","rebelkid":"Okay, ek second.","shahrukhkhan":"Dosto, ek baat sunni hai."}.get(p,"Namaskar doston.")
    else:
        opener = {"mrbeast":"This is INSANE.","alexhormozi":"Here is the truth.","joerogan":"Dude, think about this."}.get(p,"Let us talk about this.")

    def hi(h, e): return h if is_hi else e

    s1 = f"HOOK\n\n{hook}\n\n" + hi(
        f"Yeh sirf ek headline nahi hai. Yeh ek aisi kahani hai jiske kai layers hain.\n\nAaj hum {t} ko systematically samjhenge — bina kisi bias ke, bina kisi agenda ke.\n\nIs topic pe kai perspectives hain, aur hum unhe fairly examine karenge.",
        f"This is not just a headline. This is a story with multiple layers.\n\nToday we break down {t} systematically — no bias, no agenda, just analysis.\n\nThere are multiple perspectives on this topic, and we will examine them fairly."
    )

    s2 = f"BACKGROUND\n\n{background}\n\n" + hi(
        f"{t} ki roots kaafi gehri hain. Isko surface level pe samajhna misleading ho sakta hai.\n\nIsliye hum pehle yeh establish karte hain ki yeh situation exist kyun karti hai.\n\nHar badi kahani ka ek origin point hota hai. Woh origin point hi batata hai ki aage kya hone wala tha.",
        f"The roots of {t} run deep. Let us establish first why this situation exists at all.\n\nEvery major story has an origin point. That origin tells us what was coming."
    )

    tl_parts = []
    if timeline:
        tl_parts.append(hi("CHRONOLOGY — TIMELINE","CHRONOLOGY — TIMELINE"))
        for i, event in enumerate(timeline[:6], 1):
            tl_parts.append(f"{i}. {event}\n\n" + hi("Is event ne situation ko significantly affect kiya.","This event significantly affected the situation."))
    tl_text = "\n".join(tl_parts)

    s4 = f"{hi('MUKHYA MUDDA','MAIN ISSUE')}\n\n{conflict}\n\n" + hi(
        f"Yeh tension hi is poori story ka core hai.\n\nAur jab yeh finally surface pe aaya, toh uski intensity ne kaafi logon ko surprise kiya.\n\nYahi is situation ki complexity hai — kuch cheezein predictable theen, kuch bilkul nahi.",
        f"This tension is the core of the entire story.\n\nAnd when it finally surfaced, its intensity surprised many.\n\nSome things were predictable. Others were not at all."
    )

    kp_sections = []
    for i, kp in enumerate(key_points[:5], 1):
        kp_sections.append(
            f"{hi('KEY POINT','KEY POINT')} {i}\n\n{kp}\n\n" + hi(
                f"Is point ko depth mein samajhna zaroori hai kyunki yeh sirf {t} ke baare mein nahi hai — yeh ek broader pattern ke baare mein hai.\n\nEvidence ke mutabiq, is particular angle ne situation ko significantly shape kiya.",
                f"Understanding this point is important because it is not just about {t} — it is about a broader pattern.\n\nAccording to available evidence, this angle significantly shaped the outcome."
            )
        )

    s_conclusion = f"{hi('NIRSKARSH — CONCLUSION','CONCLUSION')}\n\n{conclusion}\n\n" + hi(
        "Aur yahi main chahta hoon ki aap is video se le jaayein: critical thinking ko kabhi shelf pe mat rakhein.\n\nAgar yeh analysis aapko useful lagi, toh please channel ko subscribe karein. Milte hain agla video mein. Tab tak ke liye — Namaskar.",
        "And that is what I want you to take away: never put critical thinking on the shelf.\n\nIf this analysis was useful, please subscribe to the channel. See you in the next one."
    )

    all_parts = [opener, s1, s2]
    if tl_text: all_parts.append(tl_text)
    all_parts += [s4] + kp_sections + [s_conclusion]
    return "\n\n".join(p.strip() for p in all_parts if p.strip())


# ══════════════════════════════════════════════════════════════════════
# MAIN GENERATE_SCRIPT FUNCTION
# ── FIX: Added optional 'platform' parameter ──────────────────────────
# ══════════════════════════════════════════════════════════════════════

def generate_script(
    topic:         str,
    structure:     Dict[str, Any],
    persona:       str           = "dhruvrathee",
    language:      str           = "hinglish",
    min_words:     int           = 2000,
    max_words:     int           = 5000,
    platform:      Optional[str] = None,   # accepted for API compat, not used in body
    research_data: Optional[Dict[str, Any]] = None,  # accepted for API compat, not used in body
) -> str:
    """
    Generate a 2000-5000 word YouTube script.
    'platform' and 'research_data' are accepted for API compatibility.
    """
    topic    = (topic or "").strip()
    # ── persona can arrive as a full dict (from ai_router) or a plain string ──
    if isinstance(persona, dict):
        persona = persona.get("voice") or persona.get("name") or "default"
    persona  = str(persona).lower().strip()
    language = str(language).lower().strip()

    if not topic:
        return ""
    if language not in SUPPORTED_LANGUAGES:
        language = "hinglish"

    # Offline fallback when no NVIDIA key
    if not NVIDIA_API_KEY or _requests is None:
        return _offline_script(topic, structure, persona, language)

    voice_guide      = PERSONA_VOICE_GUIDES.get(persona, PERSONA_VOICE_GUIDES["default"])
    structure_brief  = _format_structure(structure)
    is_hi            = language == "hinglish"
    lang_instruction = (
        "Language: Hinglish. Hindi grammar matrix. English retained for technical/policy/proper nouns."
        if is_hi else
        "Language: English only. Natural, spoken, conversational."
    )

    system_prompt = f"""{voice_guide}

{lang_instruction}

CRITICAL WRITING RULES:
- Target length: {min_words} to {max_words} words (HARD minimum: {min_words} words)
- Each section must be 200-350 words minimum
- Do NOT repeat the same idea in different words
- Do NOT use generic openers: "let us begin", "it is important", "in conclusion"
- Every sentence must add a new fact, angle, or story beat
- No filler paragraphs
- No AI clichés: "delve into", "navigate", "game-changer", "in the ever-evolving"
"""

    user_prompt = f"""Write a complete YouTube video script on this topic.

TOPIC: {topic}

{structure_brief}

MANDATORY SCRIPT STRUCTURE (8 sections — write ALL of them):
1. Hook          — {40} words
2. Background    — {250} words
3. Timeline      — {300} words
4. Main Issue    — {350} words
5. Evidence      — {400} words
6. Counterpoints — {250} words
7. Implications  — {300} words
8. Conclusion    — {200} words

Write the full script now. Start directly with the hook. Do NOT write section headers.
Minimum {min_words} words total."""

    try:
        raw = _nvidia_chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": user_prompt},
            ],
            max_tokens=4096,
            temperature=0.72,
        )
        script = raw.strip()
    except Exception:
        return _offline_script(topic, structure, persona, language)

    # Quality gate: expand if too short
    if _is_too_short(script, min_words):
        expand_prompt = f"""The script is too short. Expand to at least {min_words} words.

Current script:
{script}

Rules: Add 200-300 words to each thin section. Keep same persona and language.
Write the FULL expanded script now."""
        try:
            expanded = _nvidia_chat(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user",   "content": expand_prompt},
                ],
                max_tokens=4096,
                temperature=0.65,
            )
            if _word_count(expanded) > _word_count(script):
                script = expanded.strip()
        except Exception:
            pass

    return script


# ══════════════════════════════════════════════════════════════════════
# BACKWARD COMPATIBLE AIScriptwriter CLASS
# ══════════════════════════════════════════════════════════════════════

def _compact_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower().strip())

def _clean_topic(topic: str) -> str:
    return re.sub(r"\s+", " ", topic.strip())

def _count_words(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", text))

def _normalize_language(value: str) -> str:
    key = _compact_key(value)
    aliases = {"en":"english","hindlish":"hinglish","hinglish":"hinglish","english":"english"}
    key = aliases.get(key, key)
    if key not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Invalid language: {value}")
    return key

def _normalize_platform(value: str) -> str:
    key = _compact_key(value)
    aliases = {"yt":"youtube","reels":"instagram","insta":"instagram","twitter":"x"}
    key = aliases.get(key, key)
    if key not in SUPPORTED_PLATFORMS:
        raise ValueError(f"Invalid platform: {value}")
    return key

def _normalize_personality(value: str) -> str:
    key = _compact_key(value)
    aliases = {
        "default":"default","casual":"default",
        "carry":"carryminati","carryminati":"carryminati",
        "samay":"samayraina","samayraina":"samayraina",
        "dhruv":"dhruvrathee","dhruvrathee":"dhruvrathee",
        "srk":"shahrukhkhan","shahrukh":"shahrukhkhan","shahrukhkhan":"shahrukhkhan",
        "mrbeast":"mrbeast","jimmy":"mrbeast",
        "rogan":"joerogan","joerogan":"joerogan",
        "hormozi":"alexhormozi","alex":"alexhormozi","alexhormozi":"alexhormozi",
        "rebelkid":"rebelkid","apoorva":"rebelkid","apoorvamakhija":"rebelkid",
    }
    return aliases.get(key, key)


@dataclass
class ScriptOutput:
    topic:            str
    language:         str
    personality:      str
    platform:         str
    duration_seconds: int
    script_text:      str
    word_count:       int
    generated_at:     str

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


class AIScriptwriterError(Exception):          pass
class InvalidTopicError(AIScriptwriterError):  pass
class InvalidLanguageError(AIScriptwriterError): pass


_INLINE_HOOKS: Dict[str, str] = {
    "carryminati":  "Bhai, {topic} ka scene dekh ke dimaag hil gaya mera.",
    "samayraina":   "Toh haan... {topic}. [pause] Mujhe lagta hai ye hona hi tha.",
    "dhruvrathee":  "Namaskar doston. Aaj hum {topic} ke baare mein baat karenge.",
    "rebelkid":     "Hey — {topic} pe baat karni hai because this is getting old.",
    "shahrukhkhan": "Zindagi mein {topic} bhi ek safar ki tarah hota hai...",
    "mrbeast":      "[HIGH ENERGY] We just figured out the insane truth about {topic}!",
    "joerogan":     "Dude, think about {topic} for a second. [pause] Like really think about it.",
    "alexhormozi":  "Here's the thing about {topic}: most people get the first step completely wrong.",
    "default":      "Yaar, {topic} ke baare mein aaj seedha baat karte hain.",
}

_INLINE_CTAS: Dict[str, str] = {
    "carryminati":  "Samajh gaya toh like kar aur subscribe ho ja.",
    "samayraina":   "Agar thoda useful laga toh follow kar lo. [pause] warna bhi theek hai.",
    "dhruvrathee":  "Agar aapko ye analysis useful lagi, toh channel subscribe karein.",
    "rebelkid":     "If this triggered you, good. Save it. Stop apologizing for having standards.",
    "shahrukhkhan": "Agar dil se laga ho toh isse save kar lo.",
    "mrbeast":      "If this was insane, subscribe and keep watching.",
    "joerogan":     "If this got you thinking, stick around.",
    "alexhormozi":  "Save this framework and stop guessing. Use it. Period.",
    "default":      "Isko save kar le bro, baad mein kaam aayega.",
}


class AIScriptwriter:
    def __init__(self, language: str = "english", personality: str = "default") -> None:
        self.language    = _normalize_language(language)
        self.personality = _normalize_personality(personality)

    def set_personality(self, personality: str) -> None:
        self.personality = _normalize_personality(personality)

    def set_language(self, language: str) -> None:
        self.language = _normalize_language(language)

    def _build_offline_script(self, topic: str) -> str:
        p    = self.personality
        hook = _INLINE_HOOKS.get(p, _INLINE_HOOKS["default"]).format(topic=topic)
        cta  = _INLINE_CTAS.get(p, _INLINE_CTAS["default"])
        if self.language == "hinglish":
            body = (
                f"Aaj hum {topic} ke baare mein detail mein baat karenge.\n\n"
                f"Sabse pehle context samajhte hain. {topic} ka background kaafi interesting hai.\n\n"
                f"Evidence ke mutabiq, is situation ne kaafi logon ko affect kiya hai.\n\n"
                f"Kuch log is baat se agree nahi karte, lekin data kuch aur hi kehta hai.\n\n"
                f"Final takeaway simple hai: {topic} ko seriously lena zaroori hai."
            )
        else:
            body = (
                f"Today we're breaking down {topic} in detail.\n\n"
                f"First, let's understand the context. The background here is significant.\n\n"
                f"According to available evidence, this situation has affected many people.\n\n"
                f"Some disagree, but the data tells a different story.\n\n"
                f"The final takeaway is simple: {topic} deserves serious attention."
            )
        return f"{hook}\n\n{body}\n\n{cta}"

    def generate_script(
        self,
        topic:            str,
        duration_seconds: int = 60,
        platform:         str = "instagram",
    ) -> ScriptOutput:
        topic    = _clean_topic(topic)
        if not topic:
            raise InvalidTopicError("Topic cannot be empty.")

        platform = _normalize_platform(platform)

        if NVIDIA_API_KEY and _requests is not None:
            minimal_structure: Dict[str, Any] = {
                "hook":       f"What you are about to learn about {topic} will change how you see it.",
                "background": f"Understanding {topic} requires looking at the full picture.",
                "timeline":   [],
                "conflict":   f"The core issue with {topic} is rarely discussed openly.",
                "key_points": [
                    f"First angle: what {topic} actually involves",
                    f"Second angle: what most people miss about {topic}",
                    f"Third angle: the real implications of {topic}",
                ],
                "conclusion": f"The lesson from {topic} is clear once you have all the facts.",
            }
            word_target = max(300, int((duration_seconds / 60) * WORDS_PER_MINUTE))
            min_w       = min(word_target, 2000)
            script_text = generate_script(
                topic=topic,
                structure=minimal_structure,
                persona=self.personality,
                language=self.language,
                min_words=min_w,
                max_words=max(min_w * 2, 5000),
                platform=platform,   # ← passes platform through safely
            )
        else:
            script_text = self._build_offline_script(topic)

        return ScriptOutput(
            topic=topic,
            language=self.language,
            personality=self.personality,
            platform=platform,
            duration_seconds=duration_seconds,
            script_text=script_text.strip(),
            word_count=_count_words(script_text),
            generated_at=datetime.now(timezone.utc).isoformat(),
        )

    def generate(self, topic: str, platform: str = "instagram", duration_seconds: int = 45) -> ScriptOutput:
        return self.generate_script(topic=topic, platform=platform, duration_seconds=duration_seconds)

    def generate_dict(self, topic: str, platform: str = "instagram", duration_seconds: int = 45) -> Dict[str, Any]:
        return self.generate(topic=topic, platform=platform, duration_seconds=duration_seconds).to_dict()


def make_scriptwriter(language: str = "english", personality: str = "default") -> AIScriptwriter:
    return AIScriptwriter(language=language, personality=personality)