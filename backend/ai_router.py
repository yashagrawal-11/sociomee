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


# ══════════════════════════════════════════════════════════════════════
# SAFE ENGINE IMPORTS
# ══════════════════════════════════════════════════════════════════════

try:
    from research_engine import get_research_data as _get_research_data
    _HAS_RESEARCH = True
except Exception:
    _HAS_RESEARCH = False
    def _get_research_data(*a, **kw) -> dict:  # type: ignore[misc]
        return {"timeline": [], "key_events": [], "insights": [], "facts": [],
                "controversies": [], "quotes": [], "numbers": [],
                "evidence_pack": "", "raw_count": 0, "topic": ""}

try:
    from youtube_engine import get_youtube_data as _get_youtube_data
    _HAS_YOUTUBE = True
except Exception:
    _HAS_YOUTUBE = False
    def _get_youtube_data(*a, **kw) -> dict:  # type: ignore[misc]
        return {"titles": [], "keywords": []}

try:
    from structure_engine import generate_structure as _generate_structure
    _HAS_STRUCTURE = True
except Exception:
    _HAS_STRUCTURE = False
    def _generate_structure(*a, **kw) -> dict:  # type: ignore[misc]
        return {"hook": "", "background": "", "timeline": [],
                "conflict": "", "key_points": [], "conclusion": ""}

try:
    from persona_profiles import get_persona as _get_persona
    _HAS_PERSONA = True
except Exception:
    _HAS_PERSONA = False
    def _get_persona(name: str = "default") -> dict:  # type: ignore[misc]
        return {"name": "default", "tone": "clear", "language": "hinglish",
                "style_rules": [], "voice": "default", "energy": "medium", "pacing": "medium"}

try:
    from ai_scriptwriter import generate_script as _generate_script
    _HAS_SCRIPT = True
except Exception:
    _HAS_SCRIPT = False
    def _generate_script(*a, **kw) -> str:  # type: ignore[misc]
        return ""

try:
    from seo_engine import generate_seo as _generate_seo
    _HAS_SEO = True
except Exception:
    _HAS_SEO = False
    def _generate_seo(*a, **kw) -> dict:  # type: ignore[misc]
        return {"titles": [], "scores": [], "best_title": "", "best_score": 0,
                "keyword": "", "yt_keywords": []}


# ══════════════════════════════════════════════════════════════════════
# GOOGLE GEMMA CLIENT
# ══════════════════════════════════════════════════════════════════════

def _gemma_generate(prompt: str, temperature: float = 0.8, max_tokens: int = 8192,
                    top_p: float = 0.95) -> str:
    if not GOOGLE_API_KEY:
        raise RuntimeError("GOOGLE_API_KEY missing. Get at https://aistudio.google.com/app/apikey")
    try:
        import google.generativeai as genai  # type: ignore[import]
    except ImportError as exc:
        raise RuntimeError("Run: pip install google-generativeai") from exc

    genai.configure(api_key=GOOGLE_API_KEY)
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

def _deepseek_generate(
    system_prompt: str, user_prompt: str,
    temperature: float = 0.7, max_tokens: int = 2048,
) -> str:
    if not DEEPSEEK_API_KEY:
        raise RuntimeError("DEEPSEEK_API_KEY missing. Get at https://platform.deepseek.com")
    headers = {"Authorization": f"Bearer {DEEPSEEK_API_KEY}", "Content-Type": "application/json"}
    payload = {
        "model": "deepseek-chat",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user",   "content": user_prompt},
        ],
        "temperature": temperature, "max_tokens": max_tokens,
    }
    resp = requests.post("https://api.deepseek.com/v1/chat/completions",
                         headers=headers, json=payload, timeout=60)
    if resp.status_code != 200:
        raise Exception(f"DeepSeek API error {resp.status_code}: {resp.text[:300]}")
    try:
        return resp.json()["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise Exception(f"DeepSeek bad response: {exc}") from exc


# ══════════════════════════════════════════════════════════════════════
# MAIN PIPELINE  v2
# ══════════════════════════════════════════════════════════════════════

def generate_full_content(
    topic:    str,
    persona:  str = "dhruvrathee",
    language: str = "hinglish",
    country:  str = "in",
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

    # ── Step 1: Research + Evidence Pack (GNews → DeepSeek / Simulation) ──
    research: Dict[str, Any] = {}
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
        errors.append(f"research_engine: {exc}")
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
        errors.append(f"youtube_engine: {exc}")
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
        errors.append(f"structure_engine: {exc}")
        # Evidence-aware fallback — use best available fact as hook
        best_fact = (research.get("facts") or [""])[0]
        best_num  = (research.get("numbers") or [""])[0]
        structure = {
            "hook":       best_fact or best_num or f"The evidence on {topic} tells a specific story.",
            "background": f"Background of {topic} — what the documented record shows.",
            "timeline":   research.get("timeline", [])[:5],
            "conflict":   (research.get("controversies") or [{}])[0].get("claim", ""),
            "key_points": [f["event"] if isinstance(f, dict) else str(f)
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
        errors.append(f"persona_profiles: {exc}")
        persona_data = {
            "name": persona, "tone": "clear", "language": language,
            "style_rules": [], "voice": persona, "energy": "medium", "pacing": "medium",
        }

    # ── Step 5: Script generation (Gemma — evidence-first) ────────────
    # KEY CHANGE v2: pass persona_data (full dict) AND research (evidence pack)
    script: str = ""
    try:
        script = _generate_script(
            topic         = topic,
            structure     = structure,
            persona       = persona_data,     # ← full dict, not just voice string
            language      = language,
            platform      = "youtube",
            min_words     = 3000,             # ← raised from 2000
            max_words     = 5000,
            research_data = research,         # ← evidence flows to Gemma
        )
    except Exception as exc:
        errors.append(f"ai_scriptwriter: {exc}")
        script = (
            f"[Script generation failed: {exc}]\n"
            "Ensure GOOGLE_API_KEY is set in .env and google-generativeai is installed."
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

    style = _PERSONA_STYLES.get(personality, _DEFAULT_STYLE)

    lang_rule = {
        "hinglish": "Natural spoken Hinglish. Mix Hindi and English. Keep casual, sharp, evidence-grounded.",
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
        f"Topic: {topic} | Platform: {platform} | Language: {language} | Format: {format_type} | Tone: {tone}\n\n"
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
    output = _deepseek_generate(
        system_prompt=system, user_prompt=_build_prompt(data),
        temperature=0.9, max_tokens=900,
    )
    return {"output": output, "model_used": "deepseek"}


def _generate_via_gemma(data: dict) -> dict:
    full_prompt = (
        "You are a viral content expert who writes evidence-first, platform-native scripts.\n\n"
        + _build_prompt(data)
    )
    output = _gemma_generate(full_prompt, temperature=0.8, max_tokens=900, top_p=0.95)
    return {"output": output, "model_used": "gemma"}


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