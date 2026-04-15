import os
import requests
from pathlib import Path
from dotenv import load_dotenv

# ── Load .env from the exact backend folder ───────────────────────────
ENV_PATH = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=ENV_PATH)

NVIDIA_API_KEY   = os.getenv("NVIDIA_API_KEY")
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY")

SCORE_THRESHOLD = 75  # regenerate if score below this


# ── Persona-aware prompt builder ──────────────────────────────────────
def _build_prompt(data: dict) -> str:
    personality = (data.get("personality") or "default").lower().strip()
    topic       = data.get("topic", "")
    platform    = data.get("platform", "")
    language    = data.get("language", "hinglish")
    format_type = data.get("format_type", "long")
    tone        = data.get("tone", "default")

    # ── Personality style block ────────────────────────────────────────
    if personality == "carryminati":
        style = """
You are CarryMinati — India's most aggressive, roast-heavy creator.

Style rules:
- Aggressive, punchy, fast-paced Hinglish
- Dark humor with heavy roast energy
- Gen Z slang and internet culture references
- Slightly censored abusive tone (bhai, yaar, dimag band, pagal, bakwaas)
- Never safe, never boring, never generic
- Speak directly to the viewer like they are the problem

Example tone:
"bhai ye log na itne dumb hote hain ki dimag use karna bhool gaye hain"
"seedha bolunga, ye scene poora bakwaas hai aur log phir bhi follow karte hain"

NO SAFE LANGUAGE. NO GENERIC LINES. FULL ENERGY. ZERO FILTER.
"""
    elif personality == "samayraina":
        style = """
You are Samay Raina — India's driest, darkest, most sarcastic stand-up comic turned creator.

Style rules:
- Dry humor, slow build, deadpan delivery
- Smart and observational — not loud, not aggressive
- Slightly dark with self-aware commentary
- Clever Hinglish that sounds like a person thinking out loud
- Witty punchlines that land quietly

Example tone:
"bhai logic itna simple hai ki log jaan bujh ke ignore karte hain"
"matlab, hum sab jaante hain yeh galat hai, phir bhi karte hain. classic human behavior."

Make it witty, not loud. Let the silence do the work.
"""
    elif personality == "rebelkid":
        style = """
You are Rebel Kid — bold, savage, zero sugarcoating.

Style rules:
- Brutal honesty with attitude
- Slightly toxic but entertaining
- Straight to the point, no softening
- Confident and slightly condescending tone

Example tone:
"agar itna hi dimaag hota toh aaj ye problem hoti hi nahi"
"bhai seedha baat karo, ghuma ke bolne se koi fayda nahi"

No sugarcoating. No politeness. Pure attitude.
"""
    elif personality == "dhruvrathee":
        style = """
You are Dhruv Rathee — calm, logical, fact-driven.

Style rules:
- Structured and educational tone
- Data and reasoning backed arguments
- Clear Hinglish with formal undertones
- Builds the case step by step

Example tone:
"aaj hum is topic ko logically samjhenge step by step"
"facts yeh kehte hain ki..."
"""
    elif personality == "shahrukhkhan":
        style = """
You are Shah Rukh Khan — poetic, romantic, cinematic Hinglish.

Style rules:
- Warm, philosophical, emotionally resonant
- Metaphors and storytelling-heavy
- Slightly dramatic but always charming

Example tone:
"kabhi kabhi ek cheez itni simple hoti hai ki hum usse dekhna hi bhool jaate hain"
"""
    elif personality == "mrbeast":
        style = """
You are MrBeast — high energy, challenge-driven, payoff-focused.

Style rules:
- Loud, dramatic, fast-paced English
- Every line builds anticipation
- Reward-driven storytelling

Example tone:
"We tested this and the result was absolutely insane."
"Nobody expected what happened next."
"""
    elif personality == "alexhormozi":
        style = """
You are Alex Hormozi — direct, business-focused, no-fluff English.

Style rules:
- Framework-driven and value-dense
- Short punchy sentences
- Zero filler, maximum insight

Example tone:
"Here is the thing most people miss about this topic."
"Stop overthinking. Here is the actual framework."
"""
    elif personality == "joerogan":
        style = """
You are Joe Rogan — curious, conversational, long-form English.

Style rules:
- Exploratory and open-minded
- Philosophical and thought-provoking
- Feels like a real conversation

Example tone:
"Think about this for a second. Like really think about it."
"It is entirely possible that we are all missing the point here."
"""
    else:
        style = """
You are a natural viral content creator.

Style rules:
- Clear, direct, platform-native
- Human tone, no corporate speak
- Strong hook, clear structure
- Relatable and engaging
"""

    # ── Language rules ────────────────────────────────────────────────
    if language == "hinglish":
        language_rules = """
Use natural spoken Hinglish.
Mix Hindi and English like a real creator.
Do not translate English word by word into Hindi.
Keep it casual, sharp, and human.
"""
    elif language == "hindi":
        language_rules = """
Use natural spoken Hindi.
Keep it conversational, simple, and human.
Do not sound formal or textbook like.
"""
    else:
        language_rules = """
Use clear English with decent vocabulary.
Keep it natural, modern, and human.
Do not sound robotic or overly generic.
"""

    # ── Length rules ──────────────────────────────────────────────────
    if format_type == "short":
        length_rules = """
Write a proper short form script.
Target length: 110 to 150 words.
Include hook, intro, 3 body beats, CTA, outro.
"""
    else:
        length_rules = """
Write a proper long form script.
Target length: 180 to 260 words.
Include hook, intro, 5 body beats, CTA, outro.
"""

    # ── Platform rules ────────────────────────────────────────────────
    if platform == "youtube":
        platform_rules = """
Platform focus: YouTube.
Make it retention focused, story driven, and punchy.
For YouTube shorts, return exactly 7 beats.
Do not make the total script longer overall.
Keep the same approximate word count but distribute content across 7 beats.
Each beat should be concise and feel like spoken dialogue.
Smaller chunks per beat — same total content length.
"""
    elif platform == "instagram":
        platform_rules = """
Platform focus: Instagram.
Make it reel friendly, caption friendly, and scroll stopping.
"""
    elif platform == "x":
        platform_rules = """
Platform focus: X.
Make it sharp, opinionated, and highly shareable.
"""
    else:
        platform_rules = """
Platform focus: general social media.
Keep it platform native and natural.
"""

    return f"""
{style}

Topic    : {topic}
Platform : {platform}
Language : {language}
Format   : {format_type}
Tone     : {tone}

{language_rules}

{length_rules}

{platform_rules}

STRICT RULES:
- Strong hook in the very first line
- Structure: Hook -> Build -> Punch -> CTA
- Sound like a real creator speaking, not a script being read
- Stay in character for the entire output
- No translation tone
- No robotic phrasing
- Each beat must contain 2 to 3 lines (NOT one-liners)
- Each beat should feel like continuous spoken dialogue, not bullet points
- Add natural fillers like "matlab", "samajh rahe ho", "simple si baat hai" where it fits
- Every beat should build on the previous one — flow, not isolated lines
- Avoid short robotic sentences — make it sound like real talking
- Each beat should feel at least 4 to 6 seconds long when spoken aloud

OUTPUT FORMAT RULE:
- Hook = 1 to 2 strong lines
- Intro = 2 to 3 lines
- Each beat = 2 to 3 lines of natural speech
- CTA = 1 to 2 impactful lines

CRITICAL OUTPUT CONTRACT (MANDATORY):
Return ONLY valid JSON.
Each beat MUST follow:
  "text" MUST contain 2 to 3 lines
  Lines MUST be separated using "\n"
  Minimum 2 line breaks per beat

Example (FOLLOW EXACTLY):
  "text": "Line 1\nLine 2\nLine 3"

STRICT:
  If any beat has only 1 line → output is INVALID
  If invalid → internally FIX before returning
  DO NOT return single-line beats under any condition

Generate the script now.
"""


# ── Shared HTTP helper ────────────────────────────────────────────────
def _call_chat_api(
    provider_name: str,
    url: str,
    api_key: str,
    model: str,
    data: dict,
    temperature: float,
    max_tokens: int,
) -> dict:
    if not api_key:
        raise RuntimeError(f"{provider_name} API key missing")

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    payload = {
        "model": model,
        "messages": [
            {
                "role": "system",
                "content": "You are a viral content expert who writes platform native scripts.",
            },
            {
                "role": "user",
                "content": _build_prompt(data),
            },
        ],
        "temperature": temperature,
        "max_tokens":  max_tokens,
    }

    response = requests.post(url, headers=headers, json=payload, timeout=30)

    if response.status_code != 200:
        raise Exception(
            f"{provider_name} Error {response.status_code}: {response.text}"
        )

    result = response.json()

    try:
        content = result["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError):
        raise Exception(
            f"{provider_name} returned unexpected response: {result}"
        )

    return {
        "output":     content,
        "model_used": provider_name.lower(),
    }


# ── Primary: DeepSeek ─────────────────────────────────────────────────
def deepseek_generate(data: dict) -> dict:
    return _call_chat_api(
        provider_name="DeepSeek",
        url="https://api.deepseek.com/v1/chat/completions",
        api_key=DEEPSEEK_API_KEY,
        model="deepseek-chat",
        data=data,
        temperature=0.9,
        max_tokens=900,
    )


# ── Backup: NVIDIA ────────────────────────────────────────────────────
def nvidia_generate(data: dict) -> dict:
    return _call_chat_api(
        provider_name="NVIDIA",
        url="https://integrate.api.nvidia.com/v1/chat/completions",
        api_key=NVIDIA_API_KEY,
        model="meta/llama3-70b-instruct",
        data=data,
        temperature=0.8,
        max_tokens=900,
    )


# ── Script analyzer ───────────────────────────────────────────────────
def analyze_script(script: str) -> int:
    """
    Score a script 0-100 based on hook strength, viral keywords, and length.
    Used by generate_content() to decide whether to regenerate.
    """
    score = 50

    # Hook strength — strong opener signals
    if "?" in script[:100] or "!" in script[:100]:
        score += 10

    # Viral / high-engagement words
    viral_words = [
        "truth", "dark", "mistake", "secret",
        "exposed", "scam", "shocking", "crazy",
        "toxic", "money", "rich", "mindset",
        "psychology", "hack", "nobody", "real",
    ]
    for word in viral_words:
        if word in script.lower():
            score += 5

    # Length check — longer scripts have more substance
    if len(script) > 300:
        score += 10

    return min(score, 100)


def force_multiline_beats(output: str) -> str:
    """
    Post-process AI output.
    If the output is valid JSON with a 'beats' key, ensure every beat
    has at least 2 lines (separated by \n).
    If a beat is a single line, split it into 3 natural chunks.
    Falls back to returning the original string if JSON parsing fails.
    """
    import json as _json

    try:
        data = _json.loads(output)
    except Exception:
        # Not JSON — return as-is (plain text scripts still get multiline check)
        return output

    if "beats" not in data:
        return output

    for beat in data["beats"]:
        text = beat.get("text", "")
        if not text:
            continue
        # Already multiline → skip
        if "\n" in text:
            continue
        # Force split into up to 3 lines by word count
        words      = text.split()
        chunk_size = max(3, len(words) // 3)
        lines = [
            " ".join(words[:chunk_size]),
            " ".join(words[chunk_size : chunk_size * 2]),
            " ".join(words[chunk_size * 2 :]),
        ]
        beat["text"] = "\n".join(line for line in lines if line.strip())

    return _json.dumps(data, ensure_ascii=False)


def has_multiline_beats(script: str) -> bool:
    """Check if the script contains multi-line beats (\n inside content)."""
    return "\n" in script


# ── Main router: generate → analyze → improve if weak ────────────────
def generate_content(data: dict) -> dict:
    """
    1. Try DeepSeek (primary) → NVIDIA (fallback)
    2. Analyze the output score
    3. If score < SCORE_THRESHOLD (75), regenerate with improvement prompt
    4. Return the best version with score, model, and optimized flag
    """
    result: dict = {}

    # ── Generation attempt ────────────────────────────────────────────
    try:
        print("Using DeepSeek...")
        result = deepseek_generate(data)
        result["output"] = force_multiline_beats(result["output"])
    except Exception as e:
        print(f"DeepSeek failed: {e}")
        try:
            print("Using NVIDIA fallback...")
            result = nvidia_generate(data)
            result["output"] = force_multiline_beats(result["output"])
        except Exception as e2:
            print(f"NVIDIA failed: {e2}")
            return {
                "error":      "All AI providers failed. Check API keys and network.",
                "model_used": "none",
                "score":      0,
                "optimized":  False,
            }

    # ── Analyze output ────────────────────────────────────────────────
    score = analyze_script(result["output"])
    print(f"Script score: {score}/100")

    # ── Fix single-line beats ─────────────────────────────────────────
    if not has_multiline_beats(result["output"]):
        print("Single-line beats detected — forcing multi-line rewrite...")
        fix_data = {
            **data,
            "topic": (
                data.get("topic", "")
                + "\n\nRewrite with multi-line beats. "
                "Each beat MUST have 2 to 3 lines separated by newline. "
                "No one-liner beats allowed."
            ),
        }
        try:
            result = deepseek_generate(fix_data)
        except Exception:
            try:
                result = nvidia_generate(fix_data)
            except Exception:
                pass
        score = analyze_script(result["output"])
        print(f"Post-fix score: {score}/100")

    # ── Improve if weak ───────────────────────────────────────────────
    if score < SCORE_THRESHOLD:
        print(f"Score {score} below threshold {SCORE_THRESHOLD} — improving script...")

        improvement_data = {
            **data,
            "topic": (
                result["output"]
                + "\n\nRewrite this to make it more engaging. "
                "Stronger hook in the first line. More viral energy. "
                "Better punchlines. More personality. Do not repeat the same structure."
            ),
        }

        improved: dict = {}
        try:
            improved = deepseek_generate(improvement_data)
            improved["output"] = force_multiline_beats(improved["output"])
        except Exception as e:
            print(f"DeepSeek improvement failed: {e}")
            try:
                improved = nvidia_generate(improvement_data)
                improved["output"] = force_multiline_beats(improved["output"])
            except Exception as e2:
                print(f"NVIDIA improvement failed: {e2}")

        if improved:
            improved_score = analyze_script(improved["output"])
            print(f"Improved score: {improved_score}/100")

            if improved_score > score:
                print("Using improved version.")
                return {
                    "output":     improved["output"],
                    "score":      improved_score,
                    "model_used": improved["model_used"],
                    "optimized":  True,
                }

    # ── Return original (already good enough, or improvement failed) ──
    return {
        "output":     result["output"],
        "score":      score,
        "model_used": result["model_used"],
        "optimized":  False,
    }