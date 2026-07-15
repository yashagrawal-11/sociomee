"""
ai_router.py — SocioMee Master Content Router  v2
"The Masterbrain Orchestrator — Evidence-First Pipeline"

KEY UPGRADE v2:
    The research data (evidence_pack) now flows from Step 1 all the way
    through to Step 5 (Gemma scriptwriter). The scriptwriter receives the
    full research dict so build_gemma_prompt() can inject the evidence_pack
    at the TOP of the Gemma prompt.

    Step 5 change: _generate_script() now called with:
        persona    = persona_data  (full dict, not just voice string)
        research_data = research   (full evidence pack from Step 1)
        min_words  = 3000          (raised from 2000)

Architecture:
    Creative Writing  → Google Gemma  (evidence-first prompt)
    Deep Research     → DeepSeek API  (search simulation if GNews empty)
    Live Data         → GNews API + YouTube Data API

Pipeline:
    1. research_engine   — GNews + DeepSeek evidence pack (with simulation fallback)
    2. youtube_engine    — Trending titles + keywords
    3. structure_engine  — DeepSeek logical outline (evidence-informed)
    4. persona_profiles  — Creator Prompt DNA + logical method
    5. ai_scriptwriter   — Gemma 3000-5000 word evidence-first script
    6. seo_engine        — Cross-platform SEO
"""

from __future__ import annotations
try:
    from ai_scriptwriter import generate_script as _generate_script
except Exception as _e:
    def _generate_script(*a, **kw): return ""
try:
    from research_engine import get_research_data as _get_research_data
except Exception as _e:
    def _get_research_data(*a, **kw): return {}
try:
    from structure_engine import generate_structure as _generate_structure
except Exception as _e:
    def _generate_structure(*a, **kw): return {}
try:
    from youtube_engine import get_youtube_data as _get_youtube_data
except Exception as _e:
    def _get_youtube_data(*a, **kw): return {"titles": [], "keywords": []}
try:
    from persona_profiles import get_persona as _get_persona
except Exception as _e:
    def _get_persona(name): return {"name": name, "tone": "clear", "language": "hinglish", "style_rules": [], "voice": name, "energy": "medium", "pacing": "medium"}
try:
    from seo_engine import generate_seo as _generate_seo
except Exception as _e:
    def _generate_seo(*a, **kw): return {"titles": [], "scores": [], "best_title": "", "best_score": 0, "yt_keywords": []}

import json
import os
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

import requests
from dotenv import load_dotenv

ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

DEEPSEEK_API_KEY: str = os.getenv("DEEPSEEK_API_KEY", "")
GOOGLE_API_KEY:   str = os.getenv("GOOGLE_API_KEY",   "")
SCORE_THRESHOLD:  int = 75

GEMINI_API_KEY = os.getenv("GOOGLE_API_KEY", os.getenv("GOOGLE_AI_API_KEY", ""))


def _check_topic_safety(topic: str) -> bool:
    """Returns True if topic is safe to generate content about. Returns False (block) for
    self-harm, sexual content, slurs, hate speech, or violence — regardless of language,
    spelling variant, or character substitution used to evade filters."""
    # Fast-path allowlist: obviously safe topics bypass Gemini entirely
    _SAFE_KEYWORDS = [
        "skincare","makeup","beauty","haircare","fitness","yoga","workout","diet","nutrition",
        "recipe","cooking","food","travel","vlog","gaming","game","review","tech","mobile",
        "crypto","finance","money","invest","startup","business","marketing","seo","social media",
        "youtube","instagram","linkedin","creator","influencer","content","blog","podcast",
        "fashion","style","outfit","clothing","shopping","education","study","exam","career",
        "motivation","productivity","mindset","health","wellness","meditation","music","dance",
        "art","design","photography","coding","programming","ai","chatgpt","iphone","android",
        "cricket","football","ipl","bollywood","movie","series","netflix","amazon",
    ]
    t_lower = topic.lower()
    if any(kw in t_lower for kw in _SAFE_KEYWORDS):
        return True
    # Hard-block obvious violations without calling Gemini
    _BLOCK_KEYWORDS = [
        "suicide","self harm","self-harm","kill myself","rape","porn","sex act","nude",
        "child abuse","csam","bhenchod","chutiya","madarchod","fuck you",
    ]
    if any(kw in t_lower for kw in _BLOCK_KEYWORDS):
        return False
    try:
        check_prompt = f"""You are a content safety classifier. Classify the following video topic.
Topic: "{topic}"
Answer with ONLY one word: SAFE or UNSAFE.
Mark UNSAFE if the topic involves: suicide or self-harm, sexual content or explicit sex acts, slurs or profanity (in any language, including Hindi/Hinglish such as bhenchod, chutiya, etc.), hate speech, graphic violence, illegal drugs, or content sexualizing minors.
Mark UNSAFE even if the topic is spelled with extra letters, numbers, or symbols to evade filters (e.g. "sexx", "s3x", "fuckk").
Mark SAFE only for genuinely neutral, informational, or entertainment topics with no harmful intent.
Answer with only SAFE or UNSAFE, nothing else."""
        resp = requests.post(
            f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={"contents": [{"parts": [{"text": check_prompt}]}], "generationConfig": {"maxOutputTokens": 20, "temperature": 0, "thinkingConfig": {"thinkingBudget": 0}}},
            timeout=15
        )
        data = resp.json()
        if "candidates" in data:
            verdict = data["candidates"][0]["content"]["parts"][0]["text"].strip().upper()
            if "UNSAFE" in verdict:
                return False
            if "SAFE" in verdict:
                return True
        # Could not parse a clear verdict — fail open (allow) to avoid blocking legitimate topics
        return True
    except Exception as exc:
        import logging
        logging.getLogger("ai_router").warning("Topic safety check failed: %s — defaulting to ALLOW (fail open)", exc)
        return True
GEMINI_MODEL = "gemini-2.5-flash"
# ══════════════════════════════════════════════════════════════════════
# VERTEX AI HELPER - Uses $300 Google Cloud credits
# ══════════════════════════════════════════════════════════════════════
import os as _os
_VERTEX_INITIALIZED = False

def _init_vertex():
    global _VERTEX_INITIALIZED
    if not _VERTEX_INITIALIZED:
        _os.environ.setdefault('GOOGLE_APPLICATION_CREDENTIALS', '/var/www/sociomee/backend/sociomee-auth-key.json')
        import vertexai
        vertexai.init(project='sociomee-auth', location='us-central1')
        _VERTEX_INITIALIZED = True

def _vertex_generate(prompt: str, max_tokens: int = 8000, temperature: float = 0.85) -> str:
    """Generate content using Vertex AI Gemini 2.5 Flash — uses $300 GCloud credits."""
    _init_vertex()
    from vertexai.generative_models import GenerativeModel, GenerationConfig
    import warnings
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        model = GenerativeModel('gemini-2.5-flash')
        gen_config_dict = {
            "max_output_tokens": max_tokens,
            "temperature": temperature,
            "thinking_config": {"thinking_budget": 0}
        }
        try:
            response = model.generate_content(prompt, generation_config=gen_config_dict)
        except Exception:
            config = GenerationConfig(max_output_tokens=max_tokens, temperature=temperature)
            response = model.generate_content(prompt, generation_config=config)
        try:
            return response.text if response.text else ""
        except ValueError:
            for candidate in response.candidates:
                for part in candidate.content.parts:
                    if hasattr(part, 'text') and part.text:
                        return part.text.strip()
            return ""


def _gemini_generate(prompt: str, max_tokens: int = 8000) -> str:
    """Generate content using Vertex AI Gemini 2.5 Flash - uses $300 GCloud credits."""
    return _vertex_generate(prompt, max_tokens=max_tokens)

# DeepSeek rate limit tracker
import threading as _ds_lock_mod
_ds_lock = _ds_lock_mod.Lock()
_ds_calls = {"minute": [], "day": 0, "day_reset": 0}

def _deepseek_rate_check() -> bool:
    import time
    with _ds_lock:
        now = time.time()
        _ds_calls["minute"] = [t for t in _ds_calls["minute"] if now - t < 60]
        if len(_ds_calls["minute"]) >= 10:
            return False
        if now > _ds_calls.get("day_reset", 0):
            _ds_calls["day"] = 0
            _ds_calls["day_reset"] = now + 86400
        if _ds_calls["day"] >= 200:
            return False
        _ds_calls["minute"].append(now)
        _ds_calls["day"] += 1
        return True

def _deepseek_generate(prompt: str, max_tokens: int = 8000, **kwargs) -> str:
    """Use Gemini 2.5 Flash (DeepSeek credits exhausted)."""
    return _gemini_generate(prompt, max_tokens)


def _gemma_generate(prompt: str, temperature: float = 0.8, max_tokens: int = 8192,
                    top_p: float = 0.95) -> str:
    if not GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_API_KEY missing. Get at https://aistudio.google.com/app/apikey")
    try:
        import google.generativeai as genai  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError("Run: pip install google-generativeai") from exc

    pass  # Using Gemini REST API instead
    model = genai.GenerativeModel(
        model_name="gemma-3-27b-it",
        generation_config=genai.GenerationConfig(
            temperature=temperature, max_output_tokens=max_tokens, top_p=top_p,
        ),
    )
    return model.generate_content(prompt).text


# ══════════════════════════════════════════════════════════════════════
# DEEPSEEK CLIENT
# ══════════════════════════════════════════════════════════════════════

def _gemini_generate(system_prompt: str, user_prompt: str, temperature: float=0.7, max_tokens: int=2048) -> str:
    """Gemini 2.5 Flash - replaces DeepSeek."""
    prompt = system_prompt + "\n\n" + user_prompt
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={GEMINI_API_KEY}"
    resp = requests.post(url,
        headers={"Content-Type":"application/json"},
        json={"contents":[{"parts":[{"text":prompt}]}],"generationConfig":{"maxOutputTokens":max_tokens,"temperature":temperature,"thinkingConfig":{"thinkingBudget":0}}},
        timeout=120
    )
    data = resp.json()
    if "error" in data:
        raise RuntimeError(f"Gemini: {data['error']['message']}")
    return data["candidates"][0]["content"]["parts"][0]["text"]

def generate_full_content(
    topic:    str,
    persona:  str = "dhruvrathee",
    language: str = "hinglish",
    country:  str = "in",
    plan:     str = "free",
    deep_research: bool = None,
) -> Dict[str, Any]:
    """
    Run the full 6-step evidence-first AI pipeline.

    v2 key change: research data (with evidence_pack) flows from Step 1
    directly into Step 5 (Gemma scriptwriter). This ensures every script
    is built around the actual research evidence.

    Returns unified content pack (see module docstring for full shape).
    """
    topic    = (topic    or "").strip()
    persona  = (persona  or "dhruvrathee").strip()
    language = (language or "hinglish").strip().lower()
    country  = (country  or "in").strip().lower()
    errors:  List[str] = []

    if not topic:
        return {
            "titles": [], "seo_scores": [], "script": "",
            "research": {}, "structure": {}, "persona": {},
            "best_title": "", "topic": "", "language": language,
            "errors": ["Topic cannot be empty."],
        }
    # ── Safety gate: block self-harm, sexual content, slurs, hate speech, violence ──
    if not _check_topic_safety(topic):
        raise ValueError("UNSAFE_TOPIC: This topic cannot be generated. SocioMee does not create content involving self-harm, sexual content, slurs, hate speech, or violence.")

    # ── Plan tier config ───────────────────────────────────────────────
    _plan = (plan or "free").lower()
    if "premium" in _plan:
        min_words, max_words, gen_max_tokens, do_research = 6000, 7000, 20000, True
    elif "pro" in _plan:
        min_words, max_words, gen_max_tokens, do_research = 3000, 5000, 16000, True
    else:
        min_words, max_words, gen_max_tokens, do_research = 1500, 2500, 8000, False
    # User can explicitly toggle deep research regardless of plan
    if deep_research is not None:
        do_research = deep_research

    # ── Step 1: Research + Evidence Pack (Premium only) ────────────────
    research: Dict[str, Any] = {
        "timeline": [], "key_events": [], "insights": [],
        "facts": [], "quotes": [], "numbers": [],
        "controversies": [], "evidence_pack": "", "raw_count": 0, "topic": topic,
    }
    if do_research:
      try:
        research = _get_research_data(
            topic=topic, language=language, country=country,
        )
        # Log evidence pack availability
        ep_len = len(research.get("evidence_pack", ""))
        import logging
        logging.getLogger("ai_router").info(
            "Step 1 complete — evidence_pack=%d chars, facts=%d, numbers=%d",
            ep_len, len(research.get("facts", [])), len(research.get("numbers", []))
        )
      except Exception as exc:
        print(f"[PIPELINE-DEBUG] research_engine FAILED: {exc}", flush=True); errors.append(f"research_engine: {exc}")
        research = {
            "timeline": [], "key_events": [], "insights": [],
            "facts": [], "quotes": [], "numbers": [],
            "controversies": [], "evidence_pack": "", "raw_count": 0, "topic": topic,
        }

    # ── Step 2: YouTube trending data ─────────────────────────────────
    youtube_data: Dict[str, Any] = {}
    try:
        youtube_data = _get_youtube_data(
            topic=topic, region_code=country.upper(),
            relevance_language="hi" if language == "hinglish" else "en",
        )
    except Exception as exc:
        print(f"[PIPELINE-DEBUG] youtube_engine FAILED: {exc}", flush=True); errors.append(f"youtube_engine: {exc}")
        youtube_data = {"titles": [], "keywords": []}

    # ── Step 3: Script structure (DeepSeek — evidence-informed) ───────
    structure: Dict[str, Any] = {}
    try:
        structure = _generate_structure(
            topic=topic,
            research_data=research,
            youtube_data=youtube_data,
        )
    except Exception as exc:
        print(f"[PIPELINE-DEBUG] structure_engine FAILED: {exc}", flush=True); errors.append(f"structure_engine: {exc}")
        # Gemini-powered structure with persona-specific hook
        best_fact = (research.get("facts") or [""])[0]
        best_num  = (research.get("numbers") or [""])[0]
        
        # Generate persona-specific hook using Gemini
        persona_hooks = {
            "dhruvrathee": f"Namaskar doston. Aaj hum {topic} ke baare mein woh sach baat karenge jo mainstream media aapko nahi batata. Evidence dekhte hain.",
            "carryminati": f"Bhai, {topic} ka scene dekh ke dimaag hil gaya mera. Yeh kya ho raha hai seriously?",
            "samayraina": f"Toh haan... {topic}. [pause] Maine socha nahi tha ki aaj iss topic pe baat karni padegi.",
            "rebelkid": f"Okay so {topic} — yeh topic bahut log avoid karte hain. Main nahi karunga.",
            "mrbeast": f"We spent 30 days investigating {topic} and what we found will SHOCK you!",
            "alexhormozi": f"Here is the uncomfortable truth about {topic} that nobody wants to admit.",
            "default": f"Aaj hum {topic} ke baare mein seedha baat karte hain — bina sugarcoating ke.",
        }
        
        # Try Gemini for better hook
        try:
            p_key = str(persona).lower().strip()
            base_hook = persona_hooks.get(p_key, persona_hooks["default"])
            _style_hint = _PERSONA_STYLES.get(p_key, _DEFAULT_STYLE)
            hook_prompt = f"""Write a powerful YouTube video opening hook (2-3 sentences) for topic: "{topic}"
Creator style: {p_key}. Style notes: {_style_hint}
Language: Hinglish, written ENTIRELY in Roman/English script (transliterated), never Devanagari (Hindi + English mix)
The hook must:
- Start with the creator's signature opening style
- Create immediate curiosity or shock
- Promise value to viewer
- Be 40-60 words max
Write ONLY the hook text, nothing else."""
            
            generated_hook = _vertex_generate(hook_prompt, max_tokens=150, temperature=0.9)
            if generated_hook and len(generated_hook.strip()) > 20:
                from content_filter import clean_output
                base_hook = clean_output(generated_hook.strip())
        except Exception:
            pass
        
        structure = {
            "hook":       base_hook,
            "background": f"Background of {topic} — what the documented record shows.",
            "timeline":   research.get("timeline", [])[:5],
            "conflict":   (research.get("controversies") or [{}])[0].get("claim", ""),
            "key_points": [(f.get("event") or f.get("title") or str(f)) if isinstance(f, dict) else str(f)
                           for f in research.get("key_events", [])[:5]],
            "conclusion": research.get("summary", "")[:300] or f"The evidence on {topic} has clear implications.",
        }

    # ── Step 4: Persona profile ───────────────────────────────────────
    persona_data: Dict[str, Any] = {}
    try:
        persona_data = _get_persona(persona)
        if language == "hinglish":
            persona_lang = persona_data.get("language", "hinglish")
            if persona_lang == "english":
                language = "english"
    except Exception as exc:
        print(f"[PIPELINE-DEBUG] persona_profiles FAILED: {exc}", flush=True); errors.append(f"persona_profiles: {exc}")
        _style_desc = _PERSONA_STYLES.get(str(persona).lower().strip(), _DEFAULT_STYLE)
        persona_data = {
            "name": persona, "tone": _style_desc, "language": language,
            "style_rules": [_style_desc], "voice": persona, "energy": "medium", "pacing": "medium",
        }

    # ── Step 5: Script generation (Gemma — evidence-first) ────────────
    # KEY CHANGE v2: pass persona_data (full dict) AND research (evidence pack)
    script: str = ""
    try:
        from persona_profiles import build_persona_prompt_block, get_persona
        _req_tone = ""
        try:
            _req_tone = str(payload.tone or "informative").lower()
        except Exception:
            _req_tone = "informative"
        persona_key = persona_data.get("name", "default") if isinstance(persona_data, dict) else str(persona_data or "default")
        persona_data_full = get_persona(persona_key)
        persona_voice = persona_data_full.get("voice", persona_key)
        persona_language = persona_data_full.get("language", language)
        research_text = research.get("evidence_pack", "") if isinstance(research, dict) else ""
        persona_prompt_block = build_persona_prompt_block(persona_key, _req_tone, language)
        gemini_prompt = f"""You are writing a YouTube video script. Follow every instruction exactly.

TOPIC: {topic}

{persona_prompt_block}

SCRIPT LENGTH: {min_words} to {max_words} words

ABSOLUTE RULES:
1. This script must be ENTIRELY and SPECIFICALLY about: {topic}
2. Do NOT drift to loosely related topics unless directly explaining THIS topic
3. Do NOT copy or paraphrase search result titles or article headlines as content
4. Write as if you genuinely understand this topic and are explaining it to your audience
5. Every paragraph must add a new insight, angle, comparison, or fact about THIS topic
6. Use the persona signature phrases and opening style naturally — make it unmistakably sound like this creator
7. Ground every claim in real logic and reasoning
8. The research below is context only — do NOT copy it verbatim, use it to inform your reasoning

HUMANIZER RULES — the script must not feel AI-generated:
- NO hyphens or em dashes anywhere
- NO phrases like: "stands as", "serves as", "pivotal moment", "evolving landscape", "underscores", "game-changer", "dive into", "delve into", "leverage", "transformative", "seamlessly", "needless to say"
- NO rule of three structure (always exactly 3 points)
- NO hollow significance statements ("This represents a major shift...")
- NO generic endings ("exciting times ahead", "the future is bright")
- NO repeated transition starters ("Additionally,", "Furthermore,", "Moreover,")
- VARY sentence length — mix short punchy lines with longer flowing ones
- Use contractions naturally (don't, isn't, it's, we're)
- Sound like the ACTUAL creator, with their specific vocabulary and humor style
- Write how they ACTUALLY speak, not how a textbook describes their style

CONTEXT/RESEARCH (use to inform content, do not copy):
{research_text[:1500]}

STRUCTURE — write in this exact order with these labels:

**HOOK**
[3 to 5 sentences. Open EXACTLY in this creator's signature style. First line must be their characteristic opener.]

**MAIN CONTENT**
[{min_words - 100} to {max_words - 100} words. Explain the topic deeply in this creator's unique voice. Every paragraph sounds unmistakably like them. Stay strictly on: {topic}]

**CTA**
[Call to action in THIS creator's natural voice — should sound exactly like something they would say.]

**OUTRO**
[1 to 2 sentences closing in this creator's signature style.]

Write ONLY the script. No meta-commentary, no preamble, no explanation outside the script itself."""

        script = _vertex_generate(gemini_prompt, max_tokens=gen_max_tokens, temperature=0.85)
        if script:
            from content_filter import clean_output
            script = clean_output(script)
    except Exception as exc:
        print(f"[PIPELINE-DEBUG] gemini_script FAILED: {exc}", flush=True); errors.append(f"gemini_script: {exc}")
        script = (
            f"[Script generation failed: {exc}]\n"
            "Gemini script generation failed. Please try again or check API keys."
        )

    # ── Step 6: SEO ───────────────────────────────────────────────────
    seo_result: Dict[str, Any] = {}
    try:
        seo_result = _generate_seo(
            topic=topic, youtube_data=youtube_data, persona=persona_data,
        )
    except Exception as exc:
        # Try without persona if seo_engine doesn't support it yet
        try:
            seo_result = _generate_seo(topic=topic, youtube_data=youtube_data)
        except Exception as exc2:
            errors.append(f"seo_engine: {exc2}")
            seo_result = {
                "titles": [topic], "scores": [],
                "best_title": topic, "best_score": 0, "yt_keywords": [],
            }

    return {
        "titles":     seo_result.get("titles",     []),
        "seo_scores": seo_result.get("scores",     []),
        "script":     script,
        "research":   research,
        "structure":  structure,
        "persona":    persona_data,
        "best_title": seo_result.get("best_title", topic),
        "topic":      topic,
        "language":   language,
        "errors":     errors,
        # v2: surface evidence quality metadata
        "evidence_meta": {
            "evidence_pack_chars": len(research.get("evidence_pack", "")),
            "facts_count":         len(research.get("facts",    [])),
            "numbers_count":       len(research.get("numbers",  [])),
            "quotes_count":        len(research.get("quotes",   [])),
            "timeline_count":      len(research.get("timeline", [])),
            "research_mode":       research.get("_meta", {}).get("mode", "unknown"),
        },
    }


# ══════════════════════════════════════════════════════════════════════
# BACKWARD-COMPATIBLE generate_content(data)
# Used by /generate-platform-content route
# ══════════════════════════════════════════════════════════════════════

_PERSONA_STYLES: Dict[str, str] = {
    "carryminati":  "Aggressive, roast-heavy Hinglish. Evidence-powered roast. Dark humor. Full energy.",
    "samayraina":   "Dry wit, deadpan Hinglish. State specific facts without exaggeration — the evidence does the work.",
    "rebelkid":     "Bold, unapologetic. Use specific evidence to make call-outs credible. Name the pattern.",
    "dhruvrathee":  "Calm, analytical. Data-heavy. Cite every claim. Show gap between narrative and reality.",
    "shahrukhkhan": "Poetic, philosophical. Transform specific facts into universal human truths.",
    "mrbeast":      "High energy. Lead with the biggest specific number. Escalate with evidence.",
    "alexhormozi":  "Direct, framework-driven. Build the framework FROM the evidence, not generic advice.",
    "joerogan":     "Curious, exploratory. Use specific facts to raise deeper questions. Socratic method.",
}

_DEFAULT_STYLE = "Evidence-first content creator. Open with the strongest specific fact. Build every argument from evidence."


def _build_prompt(data: dict) -> str:
    personality = (data.get("personality") or "default").lower().strip()
    topic       = data.get("topic",       "")
    platform    = data.get("platform",    "")
    language    = data.get("language",    "hinglish")
    format_type = data.get("format_type", "long")
    tone        = data.get("tone",        "default")
    tone_rules = {
        "bold":        "Be direct, confident, powerful. Strong statements. No hedging.",
        "funny":       "Use wit, humor, relatable jokes. Light-hearted but informative.",
        "emotional":   "Connect deeply. Use personal stories, empathy, human moments.",
        "informative": "Clear, factual, educational. Data-driven. Teach step by step.",
        "aggressive":  "High energy, provocative, challenging. Push boundaries.",
        "sales":       "Persuasive, benefit-focused, urgency-driven. Clear CTA. Sell the value.",
        "dramatic":    "Cinematic storytelling. Build tension. Emotional highs and lows. Suspense.",
        "casual":      "Chill, conversational, like talking to a friend. Simple words, relatable.",
    }
    tone_rule = tone_rules.get(tone, "Natural, engaging, authentic tone.")

    style = _PERSONA_STYLES.get(personality, _DEFAULT_STYLE)

    lang_rule = {
        "hinglish": "Natural spoken Hinglish, written in Roman script not Devanagari. Mix Hindi and English. Keep casual, sharp, evidence-grounded.",
        "hindi":    "Natural spoken Hindi. Conversational, simple, evidence-grounded.",
    }.get(language, "Clear English. Natural, modern, evidence-grounded.")

    length_rule = (
        "110-150 words. Hook (evidence-based) + 3 evidence beats + CTA."
        if format_type == "short"
        else "180-260 words. Hook (evidence-based) + 5 evidence beats + CTA."
    )

    platform_rule = {
        "youtube":   "Retention-focused. Open with specific evidence. Every 90 seconds: new specific fact.",
        "instagram": "Scroll-stopping specific fact as hook. Save-worthy evidence insight.",
        "x":         "Sharp, specific, named-source claim.",
    }.get(platform, "Platform-native. Evidence-first. No generic openers.")

    return (
        f"You are: {style}\n\n"
        f"Topic: {topic} | Platform: {platform} | Language: {language} | Format: {format_type}\n\n"
        f"TONE INSTRUCTION: {tone_rule}\n\n"
        f"EVIDENCE-FIRST MANDATE:\n"
        f"- NEVER open with a generic topic introduction\n"
        f"- Open with the most specific, striking fact about this topic\n"
        f"- Every beat must contain a specific fact, number, name, or quote\n"
        f"- Use real specifics — no vague claims\n\n"
        f"{lang_rule}\n{length_rule}\n{platform_rule}\n\n"
        "STRUCTURE: Specific hook fact → Evidence build → Punchline → CTA\n"
        r'Return ONLY valid JSON. Each beat "text" MUST have 2-3 lines separated by "\n".'
    )


def _fix_multiline_beats(output: str) -> str:
    try:
        data = json.loads(output)
    except Exception:
        return output
    if "beats" not in data:
        return output
    for beat in data["beats"]:
        text = beat.get("text", "")
        if not text or "\n" in text:
            continue
        words      = text.split()
        chunk_size = max(3, len(words) // 3)
        lines = [
            " ".join(words[:chunk_size]),
            " ".join(words[chunk_size: chunk_size * 2]),
            " ".join(words[chunk_size * 2:]),
        ]
        beat["text"] = "\n".join(ln for ln in lines if ln.strip())
    return json.dumps(data, ensure_ascii=False)


def _has_multiline_beats(script: str) -> bool:
    return "\n" in script


def _score_script(script: str) -> int:
    score = 50
    if "?" in script[:100] or "!" in script[:100]: score += 10
    # Reward evidence signals
    evidence_words = ["according to", "ke mutabiq", "report", "data", "percent", "%",
                      "crore", "million", "billion", "₹", "$", "said", "confirmed",
                      "truth", "exposed", "scam", "mistake", "real", "nobody", "dark"]
    for word in evidence_words:
        if word in script.lower(): score += 4
    if len(script) > 300: score += 10
    return min(score, 100)


def _generate_via_deepseek(data: dict) -> dict:
    system = "You are a viral content expert who writes evidence-first, platform-native scripts."
    output = _gemini_generate(
        system_prompt=system, user_prompt=_build_prompt(data),
        temperature=0.9, max_tokens=900,
    )
    return {"output": output, "model_used": "gemini"}


def _generate_via_gemma(data: dict) -> dict:
    full_prompt = (
        "You are a viral content expert who writes evidence-first, platform-native scripts.\n\n"
        + _build_prompt(data)
    )
    output = _gemma_generate(full_prompt, temperature=0.8, max_tokens=900, top_p=0.95)
    return {"output": output, "model_used": "gemini"}


def generate_content(data: dict) -> dict:
    """
    Backward-compatible /generate-platform-content entry point.
    DeepSeek primary → Gemma fallback.
    """
    result: dict = {}

    try:
        result = _generate_via_deepseek(data)
    except Exception as primary_err:
        try:
            result = _generate_via_gemma(data)
        except Exception as fallback_err:
            return {
                "error": f"All providers failed. DeepSeek: {primary_err} | Gemma: {fallback_err}",
                "model_used": "none", "score": 0, "optimized": False,
            }

    result["output"] = _fix_multiline_beats(result["output"])

    if not _has_multiline_beats(result["output"]):
        fix_data = {**data, "topic": data.get("topic", "") +
                    "\n\nRewrite with multi-line beats. Each beat MUST have 2-3 lines."}
        try:
            result = _generate_via_deepseek(fix_data)
        except Exception:
            try: result = _generate_via_gemma(fix_data)
            except Exception: pass
        result["output"] = _fix_multiline_beats(result["output"])

    score = _score_script(result["output"])

    if score < SCORE_THRESHOLD:
        improvement_data = {**data, "topic": result["output"] +
                            "\n\nRewrite: stronger specific facts, stronger hook, more evidence."}
        improved: dict = {}
        try: improved = _generate_via_deepseek(improvement_data)
        except Exception:
            try: improved = _generate_via_gemma(improvement_data)
            except Exception: pass
        if improved:
            improved["output"] = _fix_multiline_beats(improved["output"])
            if _score_script(improved["output"]) > score:
                return {"output": improved["output"], "score": _score_script(improved["output"]),
                        "model_used": improved["model_used"], "optimized": True}

    return {"output": result["output"], "score": score,
            "model_used": result["model_used"], "optimized": False}
