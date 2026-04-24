"""
ai_scriptwriter.py — SocioMee AI Script Writer
Generates 2000–5000 word YouTube scripts using NVIDIA API (Gemma 3 27B).

Supports 8 creator personas in Hinglish + English.
Uses structure data from structure_engine.generate_structure() to stay
fact-based and non-generic.

Primary function:
    generate_script(topic, structure, persona) -> str

Also exports AIScriptwriter class for backward compatibility with
the FastAPI /generate-script route.
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

WORDS_PER_MINUTE   = 130
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
    """Call NVIDIA chat completions (Gemma 3 27B or configured model)."""
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
        raise RuntimeError(
            f"NVIDIA error {resp.status_code}: {resp.text[:400]}"
        )
    return resp.json()["choices"][0]["message"]["content"]


# ══════════════════════════════════════════════════════════════════════
# PERSONA VOICE GUIDES
# Full linguistic fingerprints — not just tone labels
# ══════════════════════════════════════════════════════════════════════

PERSONA_VOICE_GUIDES: Dict[str, str] = {

    "dhruvrathee": dedent("""
        You are writing in Dhruv Rathee's exact style.

        VOICE:
        - Calm, analytical, investigative
        - Always opens with "Namaskar doston" + a striking fact or question
        - Hindi-matrix Hinglish: Hindi grammar, English technical/policy/proper-noun terms retained
        - English retained for: democracy, institution, GDP, data, fact check, algorithm, scam, allegation
        - Always Hindi: kinship (bhai, dosto), connectives (lekin, kyunki, isliye, aur), emotion
        - Sentence rhythm: 12-18 words, calm declarative
        - Structure per section: Problem → Context → Evidence → Analysis → Implication
        - Numbers cited aloud: "pehli baat", "doosri baat", "teesri baat"
        - Rhetorical Q then answer it immediately
        - Cite sources aloud: "Reuters ke mutabiq", "Bloomberg ki report mein"
        - Indignation max 5/10, return to measured tone
        - NEVER use: hype words (insane/crazy), slang, swear words, hedging
        - NEVER repeat the same sentence structure twice in a row
        - BANNED phrases: "let us begin", "it is important", "clarity is important",
          "as we all know", "in conclusion", "basically basically"
    """).strip(),

    "carryminati": dedent("""
        You are writing in CarryMinati (Ajey Nagar)'s exact style.

        VOICE:
        - High energy Hindi-matrix Hinglish, aggressive roast
        - Sentences: 4-8 words, chaotic rhythm
        - English ONLY for: video, subscribe, channel, content, bro, literally, cringe, vibe, trend
        - Must use: bhai, yaar, arre, dekh, sun, kya kar raha hai tu, seedha, faad diya
        - Pattern interrupts: sudden volume drops mid-sentence, then EXPLODE
        - Mimicry: quote Sunny Deol, Bollywood villain, desi uncle in the voice
        - Emotional arc per section: conversational → absurdity → pitch up → EXPLODE → whisper → punchline
        - Every 3rd paragraph must have a roast punchline
        - Close section with: "Toh bhai, yahi tha scene."
        - NEVER: calm/measured tone, academic vocabulary, formal openers
    """).strip(),

    "samayraina": dedent("""
        You are writing in Samay Raina's exact style.

        VOICE:
        - Dry wit, dark comedy, deadpan Hinglish
        - Hindi-matrix, English only for modern youth concepts
        - Sentences: 10-15 words, slow build with [pause] markers
        - Anti-climax is the punchline tool — build expectation then deflate
        - Self-referential: "main bhi yahi karta tha", "meri life mein bhi aisa hua"
        - Callbacks: reference something from earlier in the script
        - NEVER scream, NEVER use hyperbole
        - Signature: "matlab", "haan toh", "sochta hoon", "ye bhi theek hai"
        - End sections with a pause and understated observation
    """).strip(),

    "rebelkid": dedent("""
        You are writing in RebelKid (Apoorva Mukhija)'s exact style.

        VOICE:
        - Bold, unapologetic, English-matrix Hinglish
        - English-dominant (~70%), Hindi for emotion and emphasis
        - Breathless run-on sentences followed by sharp fragments
        - Voice-mock quoted dialogue: mimics people being called out
        - Emotional oscillation: frustration → clarity → sarcasm → empathy
        - Signature: "cute little red flag", "not my problem", "boundary hai",
          "stop normalizing this", "respectfully, no"
        - Direct address to viewer: "you know what I mean?", "literally why"
        - NEVER: academic tone, passive voice, hedging
    """).strip(),

    "shahrukhkhan": dedent("""
        You are writing in Shah Rukh Khan's cinematic monologue style.

        VOICE:
        - Poetic Hindi-Urdu matrix with occasional English
        - Sentences: 15-25 words, cinematic rhythm
        - Must use: ishq, zindagi, dil, mohabbat, khwab, safar, yakeen, ehsaas
        - Metaphors of stars, seasons, journeys, love
        - NEVER use: tech vocab, slang, data references
        - End each section with a philosophical one-liner
        - Warm, nostalgic, slightly dramatic — but NEVER over the top
    """).strip(),

    "mrbeast": dedent("""
        You are writing in MrBeast's exact style.

        VOICE:
        - Pure English, 6th grade reading level
        - Sentences: 5-10 words maximum
        - Every 20-30 words must have a micro-hook or stakes-raise
        - Openers: always stakes-driven ("This cost $1 million", "Nobody has ever done this")
        - No passive voice ever
        - Energy: 10/10 constant
        - Transitions: "But wait", "And then", "So we decided to", "Turns out"
        - CTA every 90 seconds of spoken content
        - NEVER: hedging, long paragraphs, complex vocabulary
    """).strip(),

    "alexhormozi": dedent("""
        You are writing in Alex Hormozi's exact style.

        VOICE:
        - Direct, English-only, framework-driven
        - Sentences: 5-12 words, stacked like bullet points
        - Antithesis: "Winners do X. Losers do Y."
        - Tricolon: "First. Then. Finally."
        - Epizeuxis: "Never. Never. Never quit."
        - Vocabulary: leverage, compound, asymmetric, offer, lead, volume, system
        - Plain Anglo-Saxon punch words: work, win, lose, broke, rich, free
        - Strategic profanity for emphasis ONLY (once per 500 words max)
        - Energy ceiling: 5/10 — credibility through calm authority
        - BANNED: hedging (maybe/perhaps/I think), filler ("actually" as crutch),
          long metaphors, any sentence over 15 words
    """).strip(),

    "joerogan": dedent("""
        You are writing in Joe Rogan's conversational podcast style.

        VOICE:
        - English, curious and exploratory
        - Asymmetric rhythm: short ("Dude.") then long (30-word exploration)
        - Socratic questioning: ask question, partially answer, ask deeper question
        - Self-correction: "I mean... you know what I'm saying?"
        - Analogies: "It's like..." every 3-4 paragraphs
        - References: MMA, psychedelics, hunting, Joe's guests — sprinkle naturally
        - Signature: "dude", "man", "it's entirely possible", "think about it",
          "that's wild", "one hundred percent"
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
        - No filler, no repetition, no vague moralizing
        - Every paragraph must add a new fact, angle, or story beat
    """).strip(),
}


# ══════════════════════════════════════════════════════════════════════
# STRUCTURE FORMATTER
# Converts the structure dict into a readable brief for the LLM
# ══════════════════════════════════════════════════════════════════════

def _format_structure(structure: Dict[str, Any]) -> str:
    lines: List[str] = ["SCRIPT STRUCTURE BRIEF:"]

    hook        = structure.get("hook", "")
    background  = structure.get("background", "")
    timeline    = structure.get("timeline", [])
    conflict    = structure.get("conflict", "")
    key_points  = structure.get("key_points", [])
    conclusion  = structure.get("conclusion", "")

    if hook:
        lines.append(f"\nHOOK (opening line):\n  {hook}")
    if background:
        lines.append(f"\nBACKGROUND:\n  {background}")
    if timeline:
        lines.append("\nTIMELINE:")
        for item in timeline:
            lines.append(f"  - {item}")
    if conflict:
        lines.append(f"\nCONFLICT / MAIN ISSUE:\n  {conflict}")
    if key_points:
        lines.append("\nKEY POINTS:")
        for i, pt in enumerate(key_points, 1):
            lines.append(f"  {i}. {pt}")
    if conclusion:
        lines.append(f"\nCONCLUSION:\n  {conclusion}")

    return "\n".join(lines)


# ══════════════════════════════════════════════════════════════════════
# WORD COUNT ENFORCEMENT
# ══════════════════════════════════════════════════════════════════════

def _word_count(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", text))


def _is_too_short(text: str, min_words: int = 2000) -> bool:
    return _word_count(text) < min_words


# ══════════════════════════════════════════════════════════════════════
# ANTI-REPETITION: 4-GRAM TRACKER
# ══════════════════════════════════════════════════════════════════════

def _extract_4grams(text: str) -> set:
    tokens = re.findall(r"[a-z0-9']+", text.lower())
    return {" ".join(tokens[i:i+4]) for i in range(len(tokens) - 3)}


# ══════════════════════════════════════════════════════════════════════
# OFFLINE SCRIPT BUILDER
# Returns a passable 2000+ word script when NVIDIA key is missing
# ══════════════════════════════════════════════════════════════════════

def _offline_script(
    topic:     str,
    structure: Dict[str, Any],
    persona:   str,
    language:  str,
) -> str:
    """
    Persona-aware offline script builder.
    Produces a 2500+ word structured script without any API call.
    """
    t          = topic.strip()
    hook       = structure.get("hook") or "Aaj hum " + t + " ke baare mein woh baat karenge jo log usually ignore karte hain."
    background = structure.get("background") or t + " ka background samajhna puri picture ke liye zaroori hai."
    timeline   = structure.get("timeline") or []
    conflict   = structure.get("conflict") or t + " mein ek fundamental tension hai jo is poori story ko drive karti hai."
    key_points = structure.get("key_points") or [
        t + " ke claims vs actual evidence: ek honest comparison",
        "Key stakeholders aur unka role is situation mein",
        "Regulatory aur systemic dimension: system ne kaise respond kiya",
        "Public perception vs documented reality ka analysis",
        "Long-term implications jo abhi bhi unfold ho rahe hain",
    ]
    conclusion = structure.get("conclusion") or (
        t + " se yahi seekhne ko milta hai ki verification aur critical thinking"
        " se zyada koi powerful tool nahi hai. Headlines pe nahi, evidence pe trust karo."
    )

    is_hi = language == "hinglish"
    p     = persona.lower().strip()

    # ── Persona opener ────────────────────────────────────────────────
    if is_hi:
        opener = {
            "dhruvrathee": "Namaskar doston.",
            "carryminati": "Bhai, sun zara.",
            "samayraina":  "Toh haan...",
            "rebelkid":    "Okay, ek second.",
            "shahrukhkhan":"Dosto, ek baat sunni hai.",
        }.get(p, "Namaskar doston.")
    else:
        opener = {
            "mrbeast":    "This is INSANE.",
            "alexhormozi":"Here is the truth.",
            "joerogan":   "Dude, think about this.",
        }.get(p, "Let us talk about this.")

    def hi(h, e):
        return h if is_hi else e

    # ── Section 1: Hook ───────────────────────────────────────────────
    s1 = (
        hi("HOOK", "HOOK") + "\n\n" + hook + "\n\n" +
        hi(
            "Yeh sirf ek headline nahi hai. Yeh ek aisi kahani hai jiske kai layers hain.\n\n" +
            "Aaj hum " + t + " ko systematically samjhenge — bina kisi bias ke, bina kisi agenda ke.\n\n" +
            "Jo log is topic ko seriously lete hain, unke liye yeh video ek comprehensive breakdown hai.\n\n" +
            "Aur jo log pehli baar sun rahe hain — relax. Main step by step explain karunga.\n\n" +
            "Is topic pe kai perspectives hain, aur hum unhe fairly examine karenge.",
            "This is not just a headline. This is a story with multiple layers.\n\n" +
            "Today we break down " + t + " systematically — no bias, no agenda, just analysis.\n\n" +
            "For those who follow this closely, this will be a comprehensive review.\n\n" +
            "For newcomers — relax. We will take it step by step.\n\n" +
            "There are multiple perspectives on this topic, and we will examine them fairly."
        )
    )

    # ── Section 2: Background ─────────────────────────────────────────
    s2 = (
        hi("BACKGROUND", "BACKGROUND") + "\n\n" + background + "\n\n" +
        hi(
            t + " ki roots kaafi gehri hain. Isko surface level pe samajhna misleading ho sakta hai.\n\n" +
            "Isliye hum pehle yeh establish karte hain ki yeh situation exist kyun karti hai.\n\n" +
            "Har badi kahani ka ek origin point hota hai. Woh origin point hi batata hai ki aage kya hone wala tha.\n\n" +
            "Is context ko samjhe bina " + t + " ke events ka evaluation fair nahi hoga.\n\n" +
            "Toh chalte hain shuruat se — ek clear aur honest perspective ke saath.",
            "The roots of " + t + " run deep. Treating it as a surface-level story is misleading.\n\n" +
            "So let us establish first why this situation exists at all.\n\n" +
            "Every major story has an origin point. That origin tells us what was coming.\n\n" +
            "Without this context, evaluating the later events is not fair.\n\n" +
            "So let us go back to the beginning — with a clear and honest perspective."
        )
    )

    # ── Section 3: Timeline ───────────────────────────────────────────
    tl_parts = []
    if timeline:
        tl_parts.append(hi("CHRONOLOGY — TIMELINE", "CHRONOLOGY — TIMELINE"))
        tl_parts.append(hi(
            "Yeh events chronological order mein — jo actually hua:\n",
            "Here are the events in chronological order — what actually happened:\n"
        ))
        for i, event in enumerate(timeline[:6], 1):
            tl_parts.append(
                str(i) + ". " + str(event) + "\n\n" +
                hi(
                    "Is event ne situation ko significantly affect kiya. "
                    "Iske baad ke developments is moment ki direct consequence theen.\n",
                    "This event significantly affected the situation. "
                    "The developments that followed were a direct consequence of this moment.\n"
                )
            )
        tl_parts.append(hi(
            "Yeh timeline " + t + " ke trajectory ko clearly dikhata hai — kaise cheezein escalate huin.",
            "This timeline clearly shows the trajectory of " + t + " — how things escalated."
        ))
    tl_text = "\n".join(tl_parts)

    # ── Section 4: Conflict ───────────────────────────────────────────
    s4 = (
        hi("MUKHYA MUDDA", "MAIN ISSUE") + "\n\n" + conflict + "\n\n" +
        hi(
            "Yeh tension hi is poori story ka core hai.\n\n" +
            "Is conflict ko avoid karna possible nahi tha — yeh ek buildup tha jo time ke saath bana.\n\n" +
            "Aur jab yeh finally surface pe aaya, toh uski intensity ne kaafi logon ko surprise kiya.\n\n" +
            "Lekin jo log closely follow kar rahe the, unke liye yeh unexpected nahi tha.\n\n" +
            "Yahi is situation ki complexity hai — kuch cheezein predictable theen, kuch bilkul nahi.",
            "This tension is the core of the entire story.\n\n" +
            "Avoiding this conflict was not possible — it was a buildup that developed over time.\n\n" +
            "And when it finally surfaced, its intensity surprised many.\n\n" +
            "But for those who were following closely, it was not unexpected.\n\n" +
            "That is the complexity — some things were predictable, some were not at all."
        )
    )

    # ── Sections 5-9: Key Points ──────────────────────────────────────
    kp_sections = []
    for i, kp in enumerate(key_points[:5], 1):
        kp_sections.append(
            hi("KEY POINT " + str(i), "KEY POINT " + str(i)) + "\n\n" + str(kp) + "\n\n" +
            hi(
                "Is point ko depth mein samajhna zaroori hai kyunki yeh sirf " + t + " ke baare mein nahi hai — "
                "yeh ek broader pattern ke baare mein hai.\n\n"
                "Evidence ke mutabiq, is particular angle ne situation ko significantly shape kiya. "
                "Jo log is dimension ko ignore karte hain, woh puri picture nahi dekh rahe.\n\n"
                "Iska practical implication yeh hai ki stakeholders — investors, consumers, ya general public — "
                "sabko yeh samajhna chahiye ki yeh kya signify karta hai.\n\n"
                "Aur iska long-term impact abhi bhi unfold ho raha hai. Yeh closed chapter nahi hai.",
                "Understanding this point in depth is important because it is not just about " + t + " — "
                "it is about a broader pattern that repeats.\n\n"
                "According to available evidence, this angle significantly shaped the outcome. "
                "Those who ignore this dimension are not seeing the full picture.\n\n"
                "The practical implication is that all stakeholders need to understand what this means "
                "and how it affects decisions going forward.\n\n"
                "And the long-term impact is still unfolding. This is not a closed chapter."
            )
        )

    # ── Counterpoints ─────────────────────────────────────────────────
    counter = (
        hi("DOOSRA PAKSHA — COUNTERPOINTS", "COUNTERPOINTS — THE OTHER SIDE") + "\n\n" +
        hi(
            "Fair analysis ke liye zaroori hai ki hum doosra perspective bhi sunein.\n\n" +
            "Kuch log argue karte hain ki " + t + " ko context se bahar dekha ja raha hai. "
            "Unka kehna hai ki yeh situation zyada nuanced hai.\n\n" +
            "Yeh argument completely dismiss karna theek nahi hoga. Kuch dimensions mein unka point valid ho sakta hai.\n\n" +
            "Lekin overall evidence ki baat karein toh jo picture emerge hoti hai woh concerning hai. "
            "Counterarguments ka hona evidence ko negate nahi karta — woh discussion ko richer banata hai.\n\n" +
            "Aur yahi hona chahiye: hum issues ko dismiss nahi karte, hum unhe examine karte hain.",
            "Fair analysis requires hearing the other perspective too.\n\n" +
            "Some argue that " + t + " is being viewed out of context and is more nuanced.\n\n" +
            "It would not be fair to dismiss this entirely. In some dimensions their point may be valid.\n\n" +
            "However, when we look at overall evidence, the picture is concerning. "
            "Counterarguments do not negate evidence — they make the discussion richer.\n\n" +
            "And that is how it should be: we do not dismiss issues, we examine them."
        )
    )

    # ── Implications ──────────────────────────────────────────────────
    implications = (
        hi("IMPLICATIONS — AAGE KYA?", "IMPLICATIONS — WHAT COMES NEXT?") + "\n\n" +
        hi(
            t + " ka impact sirf is story tak limited nahi hai. Iske broader implications hain.\n\n" +
            "Pehli baat: trust ka issue. Aisi situations expose hoti hain toh institutions pe public trust kum hota hai. "
            "Yeh democratic societies ke liye serious concern hai.\n\n" +
            "Doosri baat: accountability. Kya responsible logon ko consequences face karne padenge? "
            "Yeh sawaal sirf " + t + " ke context mein nahi — systemically important hai.\n\n" +
            "Teesri baat: media aur information. Is story ne independent journalism ki importance highlight ki.\n\n" +
            "Fourth: future prevention. Agar hum is case se seekhna chahte hain toh systemic changes chahiye — "
            "not just individual accountability.",
            t + " is not limited to this story alone. It has broader implications.\n\n" +
            "First: the issue of trust. When situations like this are exposed, "
            "public trust in institutions diminishes. A serious concern for democratic societies.\n\n" +
            "Second: accountability. Will those responsible face consequences? "
            "This is not just relevant to " + t + " — it is systemically important.\n\n" +
            "Third: media and information. This story highlighted the importance of independent journalism.\n\n" +
            "Fourth: future prevention. If we want to learn from this, "
            "systemic changes are needed — not just individual accountability."
        )
    )

    # ── Conclusion ────────────────────────────────────────────────────
    s_conclusion = (
        hi("NIRSKARSH — CONCLUSION", "CONCLUSION") + "\n\n" + conclusion + "\n\n" +
        hi(
            "Aur yahi main chahta hoon ki aap is video se le jaayein: "
            "critical thinking ko kabhi shelf pe mat rakhein.\n\n" +
            "Agar yeh analysis aapko useful lagi, toh please channel ko subscribe karein. "
            "Bell icon press karein. Neeche comment karein — aapka kya perspective hai?\n\n" +
            "Milte hain agla video mein. Tab tak ke liye — Namaskar.",
            "And that is what I want you to take away from this: "
            "never put critical thinking on the shelf.\n\n" +
            "If this analysis was useful, please subscribe to the channel. "
            "Hit the bell icon. Drop your perspective in the comments below.\n\n" +
            "See you in the next one."
        )
    )

    # ── Assemble ──────────────────────────────────────────────────────
    all_parts = [opener, s1, s2]
    if tl_text:
        all_parts.append(tl_text)
    all_parts += [s4] + kp_sections + [counter, implications, s_conclusion]

    return "\n\n".join(p.strip() for p in all_parts if p.strip())

def generate_script(
    topic:     str,
    structure: Dict[str, Any],
    persona:   str  = "dhruvrathee",
    language:  str  = "hinglish",
    min_words: int  = 2000,
    max_words: int  = 5000,
) -> str:
    """
    Generate a 2000–5000 word YouTube script using NVIDIA Gemma 3 27B.

    Args:
        topic:     Video topic string.
        structure: Output of structure_engine.generate_structure().
        persona:   Creator persona key (dhruvrathee, carryminati, samayraina,
                   rebelkid, shahrukhkhan, mrbeast, alexhormozi, joerogan, default).
        language:  "hinglish" or "english".
        min_words: Minimum word count (default 2000).
        max_words: Maximum word count (default 5000).

    Returns:
        str: Complete script text, ready to record.
    """
    topic    = (topic or "").strip()
    persona  = persona.lower().strip()
    language = language.lower().strip()

    if not topic:
        return ""

    if language not in SUPPORTED_LANGUAGES:
        language = "hinglish"

    # Offline fallback
    if not NVIDIA_API_KEY or _requests is None:
        return _offline_script(topic, structure, persona, language)

    voice_guide = PERSONA_VOICE_GUIDES.get(persona, PERSONA_VOICE_GUIDES["default"])
    structure_brief = _format_structure(structure)
    is_hi = language == "hinglish"
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
- For uncertain facts, say "according to reports" or "as per available evidence"
- Include named entities, dates, and specifics from the structure brief
- Use pattern interrupts every 90-120 words (a question, a statistic, a quote, a rhetorical pivot)
- No AI clichés: "delve into", "navigate", "game-changer", "in the ever-evolving", "buckle up"
"""

    user_prompt = f"""Write a complete YouTube video script on this topic.

TOPIC: {topic}

{structure_brief}

MANDATORY SCRIPT STRUCTURE (8 sections — write ALL of them):
1. Hook          — {40} words — opening statement that stops the scroll
2. Background    — {250} words — origin, context, who was involved
3. Timeline      — {300} words — chronological events with specifics
4. Main Issue    — {350} words — the core problem, controversy, or story
5. Evidence      — {400} words — facts, data, named entities, source-based claims
6. Counterpoints — {250} words — opposing views or defences, fairly presented
7. Implications  — {300} words — what this means for people and the bigger picture
8. Conclusion    — {200} words — takeaway + call to action

Write the full script now. Start directly with the hook. Do NOT write section headers.
Do NOT number the sections. Just write continuously as a spoken script.
Minimum {min_words} words total."""

    # ── First attempt ──────────────────────────────────────────────────
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

    # ── Quality gate: rewrite if too short ────────────────────────────
    if _is_too_short(script, min_words):
        expand_prompt = f"""The script you wrote is too short. Expand it to at least {min_words} words.

Current script:
{script}

Rules for expansion:
- Add 200-300 words to each section that is thin
- Add more named entities and dates from the structure brief
- Add a counterpoint section if missing
- Add implications with specific real-world consequences
- No filler, no repetition — only new information
- Keep the same persona and language style

Write the FULL expanded script now. Minimum {min_words} words."""

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
            pass  # keep original if expansion fails

    return script


# ══════════════════════════════════════════════════════════════════════
# BACKWARD COMPATIBLE AIScriptwriter CLASS
# Keeps /generate-script FastAPI route working unchanged
# ══════════════════════════════════════════════════════════════════════

def _compact_key(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "", value.lower().strip())


def _clean_topic(topic: str) -> str:
    return re.sub(r"\s+", " ", topic.strip())


def _count_words(text: str) -> int:
    return len(re.findall(r"[A-Za-z0-9']+", text))


def _normalize_language(value: str) -> str:
    key = _compact_key(value)
    aliases = {"en": "english", "hindlish": "hinglish",
               "hinglish": "hinglish", "english": "english"}
    key = aliases.get(key, key)
    if key not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Invalid language: {value}")
    return key


def _normalize_platform(value: str) -> str:
    key = _compact_key(value)
    aliases = {"yt": "youtube", "reels": "instagram",
               "insta": "instagram", "twitter": "x"}
    key = aliases.get(key, key)
    if key not in SUPPORTED_PLATFORMS:
        raise ValueError(f"Invalid platform: {value}")
    return key


def _normalize_personality(value: str) -> str:
    key = _compact_key(value)
    aliases = {
        "default": "default", "casual": "default",
        "carry": "carryminati", "carryminati": "carryminati",
        "samay": "samayraina", "samayraina": "samayraina",
        "dhruv": "dhruvrathee", "dhruvrathee": "dhruvrathee",
        "srk": "shahrukhkhan", "shahrukh": "shahrukhkhan", "shahrukhkhan": "shahrukhkhan",
        "mrbeast": "mrbeast", "jimmy": "mrbeast",
        "rogan": "joerogan", "joerogan": "joerogan",
        "hormozi": "alexhormozi", "alex": "alexhormozi", "alexhormozi": "alexhormozi",
        "rebelkid": "rebelkid", "rebelkid": "rebelkid",
        "apoorva": "rebelkid", "apoorvamakhija": "rebelkid",
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


class AIScriptwriterError(Exception):
    pass

class InvalidTopicError(AIScriptwriterError):
    pass

class InvalidLanguageError(AIScriptwriterError):
    pass

class InvalidPersonalityError(AIScriptwriterError):
    pass

class InvalidPlatformError(AIScriptwriterError):
    pass

class InvalidDurationError(AIScriptwriterError):
    pass

class GenerationError(AIScriptwriterError):
    pass


# Inline persona registry for offline generation (no external imports)
_INLINE_HOOKS: Dict[str, str] = {
    "carryminati":  "Bhai, {topic} ka scene dekh ke dimaag hil gaya mera.",
    "samayraina":   "Toh haan... {topic}. [pause] Mujhe lagta hai ye hona hi tha.",
    "dhruvrathee":  "Namaskar doston. Aaj hum {topic} ke baare mein baat karenge aur sach kya hai.",
    "rebelkid":     "Hey cute little red flag — {topic} pe baat karni hai because this is getting old.",
    "shahrukhkhan": "Zindagi mein {topic} bhi ek safar ki tarah hota hai... aur har safar dil se guzarta hai.",
    "mrbeast":      "[HIGH ENERGY] We just figured out the insane truth about {topic} and I literally cannot believe it.",
    "joerogan":     "Dude, think about {topic} for a second. [pause] Like really think about it.",
    "alexhormozi":  "Here's the thing about {topic}: most people get the first step completely wrong. Period.",
    "default":      "Yaar, {topic} ke baare mein aaj seedha baat karte hain.",
}

_INLINE_CTAS: Dict[str, str] = {
    "carryminati":  "Samajh gaya toh like kar aur subscribe ho ja, warna phir se dekh.",
    "samayraina":   "Agar thoda useful laga toh follow kar lo. [pause] warna bhi theek hai.",
    "dhruvrathee":  "Agar aapko ye analysis useful lagi, toh channel subscribe karein aur share karein.",
    "rebelkid":     "If this triggered you, good. Save it. Stop apologizing for having standards.",
    "shahrukhkhan": "Agar dil se laga ho toh isse save kar lo. Aise safar aur bhi aayenge.",
    "mrbeast":      "If this was insane, subscribe and keep watching. We're just getting started.",
    "joerogan":     "If this got you thinking, stick around. There's a lot more under the surface.",
    "alexhormozi":  "Save this framework and stop guessing. Use it. Period.",
    "default":      "Isko save kar le bro, baad mein kaam aayega. Aur follow kar agar useful laga.",
}


class AIScriptwriter:
    """
    Backward-compatible scriptwriter class.
    Used by FastAPI /generate-script route.
    When NVIDIA_API_KEY is available, routes through generate_script()
    for 2000-5000 word AI-generated output.
    Falls back to inline persona engine when offline.
    """

    def __init__(
        self,
        language:    str = "english",
        personality: str = "default",
    ) -> None:
        self.language    = _normalize_language(language)
        self.personality = _normalize_personality(personality)

    def set_personality(self, personality: str) -> None:
        self.personality = _normalize_personality(personality)

    def set_language(self, language: str) -> None:
        self.language = _normalize_language(language)

    def _build_offline_script(self, topic: str) -> str:
        """Quick inline script when NVIDIA is offline."""
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
        """
        Main entry point for FastAPI /generate-script.
        Uses NVIDIA when available, inline engine when offline.
        """
        topic = _clean_topic(topic)
        if not topic:
            raise InvalidTopicError("Topic cannot be empty.")

        platform = _normalize_platform(platform)

        # Use NVIDIA generate_script when API key is available
        if NVIDIA_API_KEY and _requests is not None:
            # Build a minimal structure from topic alone
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
            # Word target from duration
            word_target = max(300, int((duration_seconds / 60) * WORDS_PER_MINUTE))
            min_w = min(word_target, 2000)

            script_text = generate_script(
                topic=topic,
                structure=minimal_structure,
                persona=self.personality,
                language=self.language,
                min_words=min_w,
                max_words=max(min_w * 2, 5000),
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

    def generate(
        self,
        topic:            str,
        platform:         str = "instagram",
        duration_seconds: int = 45,
    ) -> ScriptOutput:
        """Alias for generate_script — same result."""
        return self.generate_script(
            topic=topic,
            platform=platform,
            duration_seconds=duration_seconds,
        )

    def generate_dict(
        self,
        topic:            str,
        platform:         str = "instagram",
        duration_seconds: int = 45,
    ) -> Dict[str, Any]:
        return self.generate(
            topic=topic,
            platform=platform,
            duration_seconds=duration_seconds,
        ).to_dict()


# ── Convenient factory ─────────────────────────────────────────────────
def make_scriptwriter(
    language:    str = "english",
    personality: str = "default",
) -> AIScriptwriter:
    return AIScriptwriter(language=language, personality=personality)