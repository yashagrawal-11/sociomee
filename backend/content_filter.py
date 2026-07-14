"""
content_filter.py — Smart multilingual content moderation for SocioMee.
Context-aware filtering across all 10 supported languages.
Avoids false positives on innocent content.
"""
import re

# ══════════════════════════════════════════════════════════════════════
# HARD BLOCK — Always blocked regardless of context or language
# ══════════════════════════════════════════════════════════════════════
HARD_BLOCK = [
    "terrorist attack", "bomb making", "how to make bomb", "ied",
    "suicide bomb", "suicide vest", "car bomb", "pipe bomb",
    "mass shooting", "school shooting", "jihadist",
    "how to suicide", "how to kill myself", "suicide method", "ways to die",
    "aatmahatya kaise kare", "khud ko kaise maare",
    "child porn", "cp", "csam", "minor nude", "underage sex",
    "drug dealer", "buy heroin", "buy cocaine", "sell meth", "drug trafficking",
    "nasha bechna", "charas bechna", "ganja bechna",
    "money laundering tutorial", "how to launder", "hawala trick",
    "black money convert",
]

# ══════════════════════════════════════════════════════════════════════
# CONTEXT-AWARE WORDS — Only blocked without innocent context
# ══════════════════════════════════════════════════════════════════════
CONTEXT_WORDS = {
    "bomb": {
        "innocent_contexts": ["makeup", "fashion", "look", "style", "outfit", "food", "recipe", "song", "music", "comedy", "bollywood", "viral", "skincare", "photobomb", "bombay", "mumbai"],
        "reason": "weapons"
    },
    "kill": {
        "innocent_contexts": ["time", "comedy", "joke", "performance", "skill", "thrill", "grill", "workout", "fitness", "killing it", "fashion"],
        "reason": "violence"
    },
    "shoot": {
        "innocent_contexts": ["photo", "video", "film", "camera", "reel", "content", "bts", "photoshoot", "shoot karna", "basketball", "football"],
        "reason": "violence"
    },
    "nude": {
        "innocent_contexts": ["color", "lipstick", "makeup", "nail", "fashion", "palette", "shade", "tone", "aesthetic"],
        "reason": "adult content"
    },
    "sex": {
        "innocent_contexts": ["education", "awareness", "health", "biology", "science", "gender", "unisex"],
        "reason": "adult content"
    },
    "weed": {
        "innocent_contexts": ["garden", "gardening", "plants", "lawn", "farming", "agriculture", "seaweed"],
        "reason": "drugs"
    },
    "crack": {
        "innocent_contexts": ["joke", "comedy", "dawn", "code", "programming", "knuckle", "whip", "cracker", "crackers"],
        "reason": "drugs"
    },
}

# ══════════════════════════════════════════════════════════════════════
# PROFANITY — All 10 languages in Roman script
# ══════════════════════════════════════════════════════════════════════

# English profanity
ENGLISH_PROFANITY = [
    r'\bf+u+c+k+', r'\bs+h+i+t+\b', r'\bb+i+t+c+h+\b',
    r'\bc+u+n+t+\b', r'\ba+s+s+h+o+l+e+\b', r'\bb+a+s+t+a+r+d+\b',
    r'\bw+h+o+r+e+\b', r'\bf+a+g+g+o+t+\b', r'\bn+i+g+g+e+r+\b',
]

# Hindi/Hinglish profanity (Roman script)
HINDI_PROFANITY = [
    r'\bm+a+d+e+r+c+h+o+d+\b', r'\bm+[^a-z]*c+\b',
    r'\bb+h+e+n+c+h+o+d+\b', r'\bb+[^a-z]*c+\b',
    r'\bc+h+u+t+i+y+a+\b', r'\bc+h+u+t+\b',
    r'\bl+o+d+e+\b', r'\bg+a+n+d+u+\b',
    r'\bh+a+r+a+m+i+\b', r'\bk+a+m+i+n+e+\b',
    r'\br+a+n+d+i+\b', r'\bb+h+o+s+d+i+\b',
    r'\bc+h+o+d+\b', r'\bl+a+u+d+a+\b',
    r'\bs+a+l+e+\b', r'\bg+a+n+d+\b',
]

# Tamil profanity (Roman/Tanglish)
TAMIL_PROFANITY = [
    r'\bp+u+n+d+a+i+\b', r'\bp+u+n+d+e+\b',
    r'\bk+o+o+t+h+i+\b', r'\bp+a+y+y+a+l+\b',
    r'\bd+a+y+y+a+\b', r'\bp+a+z+h+a+y+a+\b',
    r'\bs+u+n+n+i+\b', r'\bv+e+r+i+y+a+n+\b',
]

# Telugu profanity (Roman)
TELUGU_PROFANITY = [
    r'\bn+a+y+a+l+a+\b', r'\bb+o+o+t+h+u+\b',
    r'\bd+e+n+g+u+\b', r'\bl+a+n+j+a+\b',
    r'\bm+o+d+d+a+\b', r'\bb+a+s+t+a+r+d+u+\b',
]

# Marathi profanity (Roman)
MARATHI_PROFANITY = [
    r'\bz+a+v+\b', r'\bb+h+o+k+\b',
    r'\bc+h+u+t+\b', r'\bg+a+n+d+\b',
    r'\bh+a+r+a+m+k+h+o+r+\b', r'\bb+o+k+a+\b',
]

# Bengali profanity (Roman)
BENGALI_PROFANITY = [
    r'\bm+a+g+i+\b', r'\bb+a+l+\b',
    r'\bk+h+a+n+k+i+\b', r'\bb+h+o+d+\b',
    r'\bc+h+u+d+\b', r'\bh+a+r+a+m+z+a+d+a+\b',
]

# Punjabi profanity (Roman)
PUNJABI_PROFANITY = [
    r'\bb+h+e+n+d+i+\b', r'\bl+u+n+d+\b',
    r'\bc+h+o+d+\b', r'\bg+a+n+d+\b',
    r'\bb+h+u+s+d+i+\b', r'\bp+u+t+t+a+r+\b',
]

# Gujarati profanity (Roman)
GUJARATI_PROFANITY = [
    r'\bb+h+o+s+d+i+\b', r'\bc+h+o+d+\b',
    r'\bl+o+d+a+\b', r'\bg+a+n+d+\b',
    r'\bh+a+r+a+m+i+\b',
]

# Kannada profanity (Roman)
KANNADA_PROFANITY = [
    r'\bs+u+l+i+\b', r'\bn+a+y+i+\b',
    r'\bm+u+t+t+h+a+\b', r'\bb+o+s+u+d+i+\b',
    r'\bh+a+v+u+\b', r'\bj+a+n+a+v+a+r+a+\b',
]

# Malayalam profanity (Roman/Manglish)
MALAYALAM_PROFANITY = [
    r'\bp+u+n+d+a+\b', r'\bm+y+i+r+\b',
    r'\bk+o+o+t+i+\b', r'\bp+e+d+a+\b',
    r'\bt+h+e+v+i+d+i+\b', r'\bb+o+o+r+i+\b',
]

ALL_PROFANITY = (
    ENGLISH_PROFANITY + HINDI_PROFANITY + TAMIL_PROFANITY +
    TELUGU_PROFANITY + MARATHI_PROFANITY + BENGALI_PROFANITY +
    PUNJABI_PROFANITY + GUJARATI_PROFANITY + KANNADA_PROFANITY +
    MALAYALAM_PROFANITY
)

# ══════════════════════════════════════════════════════════════════════
# HATE SPEECH — Cross-language
# ══════════════════════════════════════════════════════════════════════
HATE_PATTERNS = [
    r'\bnazi\b', r'\bhitler\b', r'\bwhite supremac',
    r'\bcommunal riot\b', r'\blynch mob\b',
    r'\bcaste discriminat\b', r'\buntouchable slur\b',
    r'\bkill muslims\b', r'\bkill hindus\b', r'\bkill christians\b',
    r'\bkill sikhs\b', r'\bkill dalits\b',
    r'\bnslur\b', r'\bracist\b',
]


def check_content(text: str) -> tuple:
    """
    Smart context-aware content check.
    Returns (is_safe, reason, severity)
    """
    if not text or len(text.strip()) < 2:
        return True, "", ""

    text_lower = text.lower().strip()
    text_clean = re.sub(r'[^\w\s]', ' ', text_lower)

    # 1. Hard block — always blocked
    for phrase in HARD_BLOCK:
        if phrase in text_clean:
            return False, "This topic cannot be used for content creation. Please choose a different topic.", "hard"

    # 2. Hate speech
    for pattern in HATE_PATTERNS:
        if re.search(pattern, text_clean, re.IGNORECASE):
            return False, "Content promoting hate speech or discrimination is not allowed.", "hard"

    # 3. Profanity across all languages
    for pattern in ALL_PROFANITY:
        if re.search(pattern, text_clean, re.IGNORECASE):
            return False, "Please keep your topic clean and creator-friendly.", "soft"

    # 4. Context-aware word check
    for word, config in CONTEXT_WORDS.items():
        if word in text_clean:
            innocent = config["innocent_contexts"]
            has_innocent_context = any(ctx in text_clean for ctx in innocent)
            if not has_innocent_context:
                if re.search(r'\b' + re.escape(word) + r'\b', text_clean):
                    return False, f"Your topic appears to contain {config['reason']}-related content. Please refine your topic.", "soft"

    return True, "", ""


def get_error_ui_message(reason: str, severity: str) -> dict:
    if severity == "hard":
        return {
            "title": "Topic Not Allowed",
            "message": reason,
            "suggestion": "SocioMee is for creative content that helps and entertains. Try a different topic.",
            "color": "red"
        }
    return {
        "title": "Let's Keep It Clean",
        "message": reason,
        "suggestion": "Rephrase your topic to make it more creator-friendly.",
        "color": "orange"
    }
