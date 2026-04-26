"""
research_engine.py — SocioMee Production Research Engine
AI-powered two-stage pipeline:
  Stage 1: Fetch + clean raw news from GNews
  Stage 2: AI deep-analysis via NVIDIA/DeepSeek
  Output:  Structured research JSON
"""

from __future__ import annotations

import json
import logging
import os
import re
import time
from typing import Any, Dict, List, Optional, Tuple

# ── Optional deps ─────────────────────────────────────────────────────
try:
    import requests as _requests
    from requests.adapters import HTTPAdapter, Retry
except ImportError:
    _requests = None  # type: ignore

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# ══════════════════════════════════════════════════════════════════════
# LOGGING
# ══════════════════════════════════════════════════════════════════════

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
log = logging.getLogger("research_engine")

# ══════════════════════════════════════════════════════════════════════
# ENV CONFIG
# ══════════════════════════════════════════════════════════════════════

GNEWS_API_KEY   = os.getenv("GNEWS_API_KEY", "")
NVIDIA_API_KEY  = os.getenv("NVIDIA_API_KEY", "")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")

NVIDIA_BASE_URL  = os.getenv("NVIDIA_BASE_URL", "https://integrate.api.nvidia.com/v1")
NVIDIA_MODEL     = os.getenv("NVIDIA_MODEL", "meta/llama3-70b-instruct")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1")
DEEPSEEK_MODEL    = os.getenv("DEEPSEEK_MODEL", "deepseek-chat")

AI_MAX_TOKENS   = int(os.getenv("AI_MAX_TOKENS", "3000"))
AI_TEMPERATURE  = float(os.getenv("AI_TEMPERATURE", "0.15"))
GNEWS_MAX       = int(os.getenv("GNEWS_MAX_ARTICLES", "10"))
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "30"))
AI_TIMEOUT      = int(os.getenv("AI_TIMEOUT", "90"))

# ══════════════════════════════════════════════════════════════════════
# OUTPUT CONTRACT
# ══════════════════════════════════════════════════════════════════════

EMPTY_RESULT: Dict[str, Any] = {
    "timeline":      [],
    "facts":         [],
    "insights":      [],
    "controversies": [],
    "key_events":    [],
    "summary":       "",
    "sources":       [],
}


def _empty_result(topic: str = "", reason: str = "") -> Dict[str, Any]:
    out = dict(EMPTY_RESULT)
    out["topic"]  = topic
    out["reason"] = reason
    return out


# ══════════════════════════════════════════════════════════════════════
# HTTP SESSION
# ══════════════════════════════════════════════════════════════════════

def _make_session() -> Any:
    if _requests is None:
        raise RuntimeError("'requests' package not installed. Run: pip install requests")
    session = _requests.Session()
    retry   = Retry(total=3, backoff_factor=0.5,
                    status_forcelist=[429, 500, 502, 503, 504])
    adapter = HTTPAdapter(max_retries=retry)
    session.mount("https://", adapter)
    session.mount("http://",  adapter)
    return session


_SESSION: Any = None

def _session() -> Any:
    global _SESSION
    if _SESSION is None:
        _SESSION = _make_session()
    return _SESSION


# ══════════════════════════════════════════════════════════════════════
# GNEWS FETCH
# ══════════════════════════════════════════════════════════════════════

_LANG_MAP = {
    "hindi": "hi", "hi": "hi", "hinglish": "hi",
    "english": "en", "en": "en",
}

def _gnews_lang(language: str) -> str:
    return _LANG_MAP.get((language or "english").strip().lower(), "en")


def fetch_news(
    topic: str,
    language: str = "english",
    country: Optional[str] = "in",
    max_articles: int = GNEWS_MAX,
    extra_queries: Optional[List[str]] = None,
) -> List[Dict[str, Any]]:
    """
    Fetch news articles from GNews API for a given topic.
    Falls back to empty list if the key is missing or request fails.
    Runs extra_queries to expand thin result sets.
    """
    if not GNEWS_API_KEY:
        log.warning("GNEWS_API_KEY not set — skipping news fetch")
        return []

    if _requests is None:
        log.error("'requests' not installed")
        return []

    lang = _gnews_lang(language)
    all_articles: List[Dict[str, Any]] = []

    queries_to_run = [topic] + (extra_queries or [])

    for query in queries_to_run:
        if len(all_articles) >= max_articles:
            break
        try:
            params: Dict[str, Any] = {
                "q":      query.strip(),
                "lang":   lang,
                "max":    min(max_articles, 10),
                "apikey": GNEWS_API_KEY,
            }
            if country:
                params["country"] = country

            log.info("GNews fetch — query=%r lang=%s", query, lang)
            resp = _session().get(
                "https://gnews.io/api/v4/search",
                params=params,
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            data = resp.json()
            raw  = data.get("articles") or []

            for a in raw:
                all_articles.append({
                    "title":       (a.get("title") or "").strip(),
                    "description": (a.get("description") or "").strip(),
                    "content":     (a.get("content") or "").strip(),
                    "url":         (a.get("url") or "").strip(),
                    "source":      ((a.get("source") or {}).get("name") or "Unknown"),
                    "published_at": (a.get("publishedAt") or "")[:10],
                })

            log.info("GNews returned %d articles for query=%r", len(raw), query)

        except Exception as exc:
            log.error("GNews request failed for query=%r — %s", query, exc)

        time.sleep(0.3)  # polite pacing

    return all_articles


# ══════════════════════════════════════════════════════════════════════
# CLEAN / DEDUPLICATE
# ══════════════════════════════════════════════════════════════════════

def clean_news(articles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deduplicate by URL and title, drop articles with no usable text,
    normalise field lengths.
    """
    seen_urls:   set[str] = set()
    seen_titles: set[str] = set()
    cleaned: List[Dict[str, Any]] = []

    for a in articles:
        url   = (a.get("url")   or "").strip()
        title = (a.get("title") or "").strip().lower()

        if not title:
            continue
        if url and url in seen_urls:
            continue
        if title in seen_titles:
            continue

        body = (
            a.get("description") or a.get("content") or ""
        ).strip()

        if not body:
            continue

        if url:
            seen_urls.add(url)
        seen_titles.add(title)

        cleaned.append({
            "title":        a.get("title", "").strip()[:200],
            "description":  body[:500],
            "url":          url,
            "source":       a.get("source", "Unknown")[:100],
            "published_at": a.get("published_at", ""),
        })

    log.info("clean_news: %d → %d articles after dedup", len(articles), len(cleaned))
    return cleaned


# ══════════════════════════════════════════════════════════════════════
# AI BACKEND (NVIDIA / DeepSeek)
# ══════════════════════════════════════════════════════════════════════

def _call_nvidia(messages: List[Dict[str, str]], max_tokens: int = AI_MAX_TOKENS) -> str:
    if not NVIDIA_API_KEY:
        raise RuntimeError("NVIDIA_API_KEY not set")
    url = f"{NVIDIA_BASE_URL.rstrip('/')}/chat/completions"
    payload = {
        "model":       NVIDIA_MODEL,
        "messages":    messages,
        "temperature": AI_TEMPERATURE,
        "max_tokens":  max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {NVIDIA_API_KEY}",
        "Content-Type":  "application/json",
    }
    log.info("NVIDIA request — model=%s max_tokens=%d", NVIDIA_MODEL, max_tokens)
    resp = _session().post(url, headers=headers, json=payload, timeout=AI_TIMEOUT)
    if resp.status_code != 200:
        raise RuntimeError(f"NVIDIA error {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"]


def _call_deepseek(messages: List[Dict[str, str]], max_tokens: int = AI_MAX_TOKENS) -> str:
    if not DEEPSEEK_API_KEY:
        raise RuntimeError("DEEPSEEK_API_KEY not set")
    url = f"{DEEPSEEK_BASE_URL.rstrip('/')}/chat/completions"
    payload = {
        "model":       DEEPSEEK_MODEL,
        "messages":    messages,
        "temperature": AI_TEMPERATURE,
        "max_tokens":  max_tokens,
    }
    headers = {
        "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
        "Content-Type":  "application/json",
    }
    log.info("DeepSeek request — model=%s max_tokens=%d", DEEPSEEK_MODEL, max_tokens)
    resp = _session().post(url, headers=headers, json=payload, timeout=AI_TIMEOUT)
    if resp.status_code != 200:
        raise RuntimeError(f"DeepSeek error {resp.status_code}: {resp.text[:300]}")
    return resp.json()["choices"][0]["message"]["content"]


def _ai_chat(messages: List[Dict[str, str]], max_tokens: int = AI_MAX_TOKENS) -> str:
    """
    Try NVIDIA first, fallback to DeepSeek, raise if both unavailable.
    """
    errors: List[str] = []

    if NVIDIA_API_KEY:
        try:
            return _call_nvidia(messages, max_tokens)
        except Exception as exc:
            log.warning("NVIDIA call failed — %s. Trying DeepSeek…", exc)
            errors.append(f"NVIDIA: {exc}")

    if DEEPSEEK_API_KEY:
        try:
            return _call_deepseek(messages, max_tokens)
        except Exception as exc:
            log.error("DeepSeek call failed — %s", exc)
            errors.append(f"DeepSeek: {exc}")

    raise RuntimeError("All AI backends failed. " + " | ".join(errors))


def _extract_json(text: str) -> Dict[str, Any]:
    """
    Safe JSON extractor — no recursion, no retry loops.
    Strips markdown fences then attempts a single json.loads.
    Returns {"parse_error": True} on failure.
    """
    raw = (text or "").strip()

    # Strip markdown fences (non-recursive, one pass)
    if raw.startswith("```"):
        raw = re.sub(r"^```(?:json)?\s*", "", raw)
        raw = re.sub(r"\s*```\s*$",       "", raw)
        raw = raw.strip()

    try:
        return json.loads(raw)
    except Exception:
        log.error("_extract_json failed. Snippet: %s…", raw[:200])
        return {"parse_error": True, "raw_output": raw[:1000]}


# ══════════════════════════════════════════════════════════════════════
# AI ANALYSIS PROMPT
# ══════════════════════════════════════════════════════════════════════

_SYSTEM_PROMPT = """You are a senior investigative journalist and research analyst.
Your role is to analyze raw news data and produce a clean, structured, factual research brief.

Core rules:
- Extract only verifiable facts from the source material
- Eliminate duplicates and generic filler statements
- Flag disputed claims as "alleged" or "according to reports"
- Never invent facts — if evidence is thin, say so in the summary
- Use precise language: avoid "clearly", "obviously", "it is important"
- Each item must be a standalone, specific, non-redundant statement
- Controversies must name specific parties and claims, not vague "tensions"
- Timeline entries must be date-anchored where possible
- Key events must be concrete actions or announcements, not background context
- Insights must offer interpretation, not restate facts already listed elsewhere"""

_BUILD_PROMPT = """Analyze the research data below and return a structured JSON research brief.

TOPIC: {topic}
LANGUAGE: {language}

RAW ARTICLES ({count} total):
{articles_block}

Return ONLY valid JSON matching this exact schema — no markdown, no preamble:
{{
  "timeline": [
    {{
      "date":   "YYYY-MM-DD or approximate period",
      "event":  "specific factual event",
      "source": "publication name"
    }}
  ],
  "facts": [
    "concrete verifiable fact extracted from articles (non-redundant, specific)"
  ],
  "insights": [
    "analytical interpretation — what a pattern or data point actually means"
  ],
  "controversies": [
    {{
      "claim":   "what is alleged or disputed",
      "parties": "who is involved",
      "status":  "alleged | reported | confirmed | denied | under investigation"
    }}
  ],
  "key_events": [
    {{
      "title":       "short event headline",
      "description": "2-3 sentence explanation with context",
      "source":      "publication name",
      "date":        "YYYY-MM-DD if known"
    }}
  ],
  "summary": "3-4 paragraph executive summary — angle, key findings, open questions. No generic statements.",
  "sources": [
    {{
      "name": "publication name",
      "url":  "article URL"
    }}
  ]
}}

Strict rules:
- facts array: minimum 5 items, each 15-60 words, zero duplication
- insights array: minimum 3 items, each must go beyond what the facts state
- timeline: sort chronologically, oldest first
- summary: must name key entities, mention specific claims, flag uncertainties
- If article data is thin or missing, generate research from your knowledge of the topic but label those items with (general knowledge)"""

_KNOWLEDGE_PROMPT = """You are a senior investigative journalist.

The topic below has no live news data available. Use your knowledge to generate a structured research brief.
Label every item with "(general knowledge)" to indicate it is not from a live source.

TOPIC: {topic}
LANGUAGE: {language}

Return ONLY valid JSON matching this exact schema — no markdown, no preamble:
{{
  "timeline": [
    {{
      "date":   "approximate period or year",
      "event":  "specific factual event (general knowledge)",
      "source": "general knowledge"
    }}
  ],
  "facts": [
    "concrete verifiable fact — label with (general knowledge)"
  ],
  "insights": [
    "analytical interpretation — label with (general knowledge)"
  ],
  "controversies": [
    {{
      "claim":   "disputed or controversial aspect",
      "parties": "who is involved",
      "status":  "general knowledge"
    }}
  ],
  "key_events": [
    {{
      "title":       "event headline",
      "description": "2-3 sentence factual explanation",
      "source":      "general knowledge",
      "date":        "approximate year or period"
    }}
  ],
  "summary": "3-4 paragraph executive summary using your knowledge of the topic. Name entities, flag open questions. No generic filler.",
  "sources": []
}}

Rules:
- Be specific — name real people, organisations, dates, figures where known
- facts: minimum 5 items
- insights: minimum 3 items
- Never use vague statements like "this is important" or "things are complex"
- Controversies must name parties"""


# ══════════════════════════════════════════════════════════════════════
# AI ANALYZE
# ══════════════════════════════════════════════════════════════════════

def _build_articles_block(articles: List[Dict[str, Any]]) -> str:
    if not articles:
        return "NO ARTICLES"
    parts = []
    for i, a in enumerate(articles, 1):
        parts.append(
            f"[{i}] {a.get('title','')}\n"
            f"    Source: {a.get('source','')} | Date: {a.get('published_at','')}\n"
            f"    {a.get('description','')}\n"
            f"    URL: {a.get('url','')}"
        )
    return "\n\n".join(parts)


def ai_analyze(
    topic:    str,
    articles: List[Dict[str, Any]],
    language: str = "english",
) -> Dict[str, Any]:
    """
    Send cleaned articles to AI for deep analysis.
    Falls back to knowledge-only prompt if no articles.
    Falls back to structured skeleton if AI fails entirely.
    """
    if articles:
        articles_block = _build_articles_block(articles)
        user_content   = _BUILD_PROMPT.format(
            topic=topic,
            language=language,
            count=len(articles),
            articles_block=articles_block,
        )
        log.info("ai_analyze — %d articles → AI prompt", len(articles))
    else:
        user_content = _KNOWLEDGE_PROMPT.format(topic=topic, language=language)
        log.info("ai_analyze — no articles, using knowledge-only prompt")

    messages = [
        {"role": "system", "content": _SYSTEM_PROMPT},
        {"role": "user",   "content": user_content},
    ]

    try:
        raw    = _ai_chat(messages, max_tokens=AI_MAX_TOKENS)
        result = _extract_json(raw)

        if result.get("parse_error"):
            log.error("AI returned unparseable JSON — falling back to skeleton")
            return _fallback_skeleton(topic, articles, reason="ai_parse_error")

        log.info("ai_analyze complete — facts=%d insights=%d timeline=%d",
                 len(result.get("facts") or []),
                 len(result.get("insights") or []),
                 len(result.get("timeline") or []))
        return _validate_and_fill(result, topic, articles)

    except Exception as exc:
        log.error("ai_analyze failed — %s", exc)
        return _fallback_skeleton(topic, articles, reason=str(exc))


# ══════════════════════════════════════════════════════════════════════
# VALIDATION + NORMALISATION
# ══════════════════════════════════════════════════════════════════════

def _validate_and_fill(
    result:   Dict[str, Any],
    topic:    str,
    articles: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Ensure all required keys exist with correct types.
    Uses setdefault — never calls fallback or recurses.
    """
    result.setdefault("timeline",      [])
    result.setdefault("facts",         [])
    result.setdefault("insights",      [])
    result.setdefault("controversies", [])
    result.setdefault("key_events",    [])
    result.setdefault("summary",       "")
    result.setdefault("sources",       [])
    result["topic"] = topic

    # Guarantee list types (AI sometimes returns None for an empty field)
    for key in ("timeline", "facts", "insights", "controversies", "key_events", "sources"):
        if not isinstance(result[key], list):
            result[key] = []

    # Inject sources from articles if AI returned none
    if not result["sources"] and articles:
        result["sources"] = [
            {"name": a.get("source", "Unknown"), "url": a.get("url", "")}
            for a in articles if a.get("url")
        ]

    return result


def _ensure_list(val: Any) -> List[Any]:
    if isinstance(val, list):
        return val
    if val is None:
        return []
    return [val]


def _fallback_skeleton(
    topic:    str,
    articles: Optional[List[Dict[str, Any]]] = None,
    reason:   str = "error",
) -> Dict[str, Any]:
    """
    Safe fallback — pure data, no AI calls, no recursion, no validate_and_fill.
    """
    log.warning("_fallback_skeleton — topic=%r reason=%s", topic, reason)

    articles = articles or []
    facts:    List[str]           = []
    timeline: List[Dict[str,Any]] = []
    sources:  List[Dict[str,Any]] = []

    for a in articles:
        title = (a.get("title") or "").strip()
        desc  = (a.get("description") or "").strip()
        date  = (a.get("published_at") or "")
        url   = (a.get("url") or "").strip()
        src   = (a.get("source") or "Unknown")

        if title:
            facts.append((f"{title} — {desc}" if desc else title)[:200])
        if title and date:
            timeline.append({"date": date, "event": title[:150], "source": src})
        if url:
            sources.append({"name": src, "url": url})

    return {
        "timeline":      sorted(timeline, key=lambda x: x.get("date") or ""),
        "facts":         facts[:10],
        "insights":      [],
        "controversies": [],
        "key_events":    [],
        "summary":       "",
        "sources":       sources,
        "topic":         topic,
        "reason":        reason,
    }


# ══════════════════════════════════════════════════════════════════════
# MAIN PUBLIC INTERFACE
# ══════════════════════════════════════════════════════════════════════

def generate_research(
    topic:        str,
    language:     str           = "english",
    country:      Optional[str] = "in",
    max_articles: int           = GNEWS_MAX,
) -> Dict[str, Any]:
    """
    Full research pipeline.

    1. fetch_news()  — GNews API
    2. clean_news()  — dedup + normalise
    3. ai_analyze()  — NVIDIA or DeepSeek deep analysis
    4. Return structured dict

    Compatible with FastAPI: returns Python dict, never raises on API errors.
    """
    if not topic or not topic.strip():
        log.error("generate_research called with empty topic")
        return _empty_result(topic="", reason="empty topic")

    topic = topic.strip()
    log.info("generate_research START — topic=%r language=%s", topic, language)
    t0 = time.perf_counter()

    # ── Stage 1: Fetch ────────────────────────────────────────────────
    raw_articles = fetch_news(
        topic=topic,
        language=language,
        country=country,
        max_articles=max_articles,
        extra_queries=[
            f"{topic} news",
            f"{topic} investigation controversy",
        ],
    )

    # ── Stage 2: Clean ────────────────────────────────────────────────
    cleaned = clean_news(raw_articles)

    # ── Stage 3: AI analysis ──────────────────────────────────────────
    result = ai_analyze(topic=topic, articles=cleaned, language=language)

    elapsed = time.perf_counter() - t0
    log.info(
        "generate_research DONE — topic=%r articles=%d elapsed=%.2fs",
        topic, len(cleaned), elapsed,
    )

    result["_meta"] = {
        "articles_fetched": len(raw_articles),
        "articles_used":    len(cleaned),
        "elapsed_seconds":  round(elapsed, 2),
        "ai_backend":       "nvidia" if NVIDIA_API_KEY else ("deepseek" if DEEPSEEK_API_KEY else "none"),
        "gnews_available":  bool(GNEWS_API_KEY),
    }

    return result


# ══════════════════════════════════════════════════════════════════════
# FASTAPI HELPER  (optional — import and wire up in your router)
# ══════════════════════════════════════════════════════════════════════

def get_research_data(
    topic:    str,
    language: str           = "english",
    country:  Optional[str] = "in",
) -> Dict[str, Any]:
    """
    Thin FastAPI-compatible wrapper.
    Returns the same contract as generate_research().
    Never raises — always returns a dict.
    """
    try:
        return generate_research(topic=topic, language=language, country=country)
    except Exception as exc:
        log.exception("Unhandled error in get_research_data — %s", exc)
        return _empty_result(topic=topic, reason=f"internal error: {exc}")


# ══════════════════════════════════════════════════════════════════════
# CLI QUICK-TEST
# ══════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    query = " ".join(sys.argv[1:]) or "OpenAI GPT-5"
    out   = generate_research(topic=query, language="english", country="in")
    print(json.dumps(out, indent=2, ensure_ascii=False))