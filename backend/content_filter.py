"""
content_filter.py — Multilingual content moderation for SocioMee.
Filters harmful, adult, violent, and policy-violating keywords
across all supported Indian languages and English.
"""

# ══════════════════════════════════════════════════════════════════════
# BLOCKED CATEGORIES AND KEYWORDS
# ══════════════════════════════════════════════════════════════════════

# Violence and weapons
VIOLENCE = [
    "bomb", "explosion", "blast", "grenade", "missile", "nuclear", "weapon",
    "shoot", "shooting", "gunshot", "kill", "killing", "murder", "assassin",
    "terrorist", "terrorism", "jihad", "attack", "massacre", "genocide",
    "bom", "dhamaka", "hatya", "marna", "maar dalo", "khoon", "katl",
]

# Self harm
SELF_HARM = [
    "suicide", "self harm", "self-harm", "cut myself", "end my life",
    "kill myself", "hang myself", "overdose", "aatmahatya", "khud ko maarna",
]

# Adult content
ADULT = [
    "porn", "pornography", "xxx", "nude", "naked", "sex", "sexual", "adult content",
    "onlyfans", "escort", "prostitute", "strip", "erotic",
]

# Drugs
DRUGS = [
    "cocaine", "heroin", "meth", "methamphetamine", "crack", "weed", "marijuana",
    "drug deal", "buy drugs", "sell drugs", "charas", "ganja", "smack", "afeem",
]

# Hate speech
HATE = [
    "nazi", "hitler", "white supremacy", "ethnic cleansing", "racial slur",
    "casteist", "untouchable slur", "communal riot", "lynching",
]

# Scam and fraud
SCAM = [
    "ponzi scheme", "pyramid scheme", "get rich quick", "crypto scam",
    "fake investment", "money laundering", "black money",
]

# All blocked terms combined
ALL_BLOCKED = VIOLENCE + SELF_HARM + ADULT + DRUGS + HATE + SCAM

def check_content(text: str) -> tuple[bool, str]:
    """
    Check if content is safe to generate.
    Returns (is_safe, reason)
    """
    if not text:
        return True, ""

    text_lower = text.lower().strip()

    # Remove common punctuation for better matching
    import re
    text_clean = re.sub(r'[^\w\s]', ' ', text_lower)

    for term in ALL_BLOCKED:
        term_lower = term.lower()
        if term_lower in text_clean:
            category = _get_category(term)
            return False, f"Content blocked: topic contains {category} related content which violates our usage policy."

    return True, ""

def _get_category(term: str) -> str:
    if term in [t.lower() for t in VIOLENCE]:
        return "violence or weapons"
    if term in [t.lower() for t in SELF_HARM]:
        return "self-harm"
    if term in [t.lower() for t in ADULT]:
        return "adult"
    if term in [t.lower() for t in DRUGS]:
        return "drugs"
    if term in [t.lower() for t in HATE]:
        return "hate speech"
    if term in [t.lower() for t in SCAM]:
        return "fraud or scam"
    return "policy-violating"

def check_with_ai(text: str) -> tuple[bool, str]:
    """
    Use Vertex AI to check borderline content that rule-based filter misses.
    Use this for topics that pass keyword filter but might still be harmful.
    """
    try:
        from vertex_engine import generate
        prompt = f"""Is the following content topic safe for a social media content creation platform?

Topic: "{text}"

Check if this topic:
1. Promotes violence, weapons, or terrorism
2. Promotes self-harm or suicide
3. Contains adult or sexual content
4. Promotes illegal drug use
5. Contains hate speech or discrimination
6. Promotes financial scams or fraud
7. Violates Indian laws or regulations

Reply with ONLY one of these two responses:
SAFE
BLOCKED: [brief reason]"""

        response = generate(prompt, max_tokens=50, temperature=0.1)
        if response.strip().upper().startswith("BLOCKED"):
            reason = response.strip().replace("BLOCKED:", "").strip()
            return False, f"Content blocked: {reason}"
        return True, ""
    except Exception:
        return True, ""  # On error, allow content
