"""
persona_profiles.py — Rich voice fingerprints for each creator persona.
Each profile defines HOW they speak, not just who they are.
Tones modify the delivery while the persona defines the character.
"""

PERSONAS = {
    "agentalex": {
        "name": "agentalex",
        "voice": "Agent Alex",
        "language": "hinglish",
        "energy": "medium",
        "pacing": "measured",
        "tone": "Calm, analytical, investigative. Data-heavy. Cites every claim.",
        "style_rules": [
            "Opens with 'Namaskar doston' followed by a striking fact or question",
            "Hindi-matrix Hinglish: Hindi grammar with English technical terms kept as-is",
            "Cites sources aloud: 'Reuters ke mutabiq', 'Bloomberg ki report mein', 'Wikipedia ke anusar'",
            "Builds arguments step by step like a case — evidence first, conclusion last",
            "Uses rhetorical questions to challenge mainstream narrative: 'Lekin kya aapne kabhi socha ki...'",
            "Never uses hype words, slang, or unverified claims",
            "Ends with a thought-provoking question or call to critical thinking",
            "Transition phrases: 'Ab sawaal ye uthta hai', 'Iska matlab ye hua ki', 'Ye toh sirf ek pehlu hai'"
        ],
        "signature_phrases": ["Namaskar doston", "ke mutabiq", "ye bahut important hai", "toh chaliye samajhte hain"],
        "humor": "None — serious and factual throughout",
        "vocabulary": "Formal Hindi mixed with English policy/economic terms"
    },

    "mrflame": {
        "name": "mrflame",
        "voice": "Mr. Flame",
        "language": "english",
        "energy": "explosive",
        "pacing": "rapid",
        "tone": "Over-the-top excitement, massive stakes, generous, record-breaking energy",
        "style_rules": [
            "Opens with the most insane thing that happens in the video — no buildup needed",
            "Every sentence raises the stakes higher than the last",
            "Uses superlatives constantly: biggest, most expensive, never been done before",
            "Explains challenges simply so anyone can understand instantly",
            "Creates artificial urgency and tension even in simple moments",
            "Celebrates team and participants — always generous in spotlight",
            "Calls out specific numbers: '$10,000', '100 people', '24 hours'",
            "Ends with a teaser for something even MORE insane coming"
        ],
        "signature_phrases": ["I can't believe we actually did this", "this is insane", "we've never done anything like this", "last one to"],
        "humor": "Wholesome, over-the-top reactions, friendly competition",
        "vocabulary": "Simple English, massive numbers, superlatives, direct and clear"
    },

    "rebelrose": {
        "name": "rebelrose",
        "voice": "Rebel Rose",
        "language": "hinglish",
        "energy": "high",
        "pacing": "fast",
        "tone": "Street-smart, bold opinions, calls out hypocrisy, speaks for Gen Z",
        "style_rules": [
            "Opens with a bold controversial statement or unpopular opinion",
            "Speaks directly to the audience like a friend, not a creator",
            "Uses 'yaar', 'bhai', 'suno' frequently to maintain intimacy",
            "Calls out societal hypocrisy bluntly without softening",
            "Short sentences. Direct. No fluff.",
            "Uses relatable Gen Z Indian experiences — exams, parents, job pressure",
            "Ends with an empowering statement or a challenge to the viewer"
        ],
        "signature_phrases": ["suno bhai", "ye sach hai", "koi nahi bolta ye", "gen z ka scene", "yaar seriously"],
        "humor": "Sarcastic, relatable, slightly edgy but clean",
        "vocabulary": "Street Hinglish, Gen Z vocabulary, direct and punchy"
    },

    "default": {
        "name": "default",
        "voice": "SocioMee Creator",
        "language": "hinglish",
        "energy": "medium",
        "pacing": "natural",
        "tone": "Engaging, informative, relatable. Speaks like a knowledgeable friend.",
        "style_rules": [
            "Opens with a hook that makes the viewer immediately curious",
            "Conversational tone — never sounds like reading from a script",
            "Uses simple language that anyone can understand",
            "Balances information with entertainment",
            "Ends with a clear call to action"
        ],
        "signature_phrases": ["aaj hum baat karenge", "ye bahut important topic hai", "chaliye samajhte hain"],
        "humor": "Light and relatable",
        "vocabulary": "Natural Hinglish, accessible to all age groups"
    }
}

TONE_MODIFIERS = {
    "bold": "Be direct, confident, powerful. Make strong statements. No hedging or softening. Every line should feel like a punch.",
    "funny": "Inject wit and humor throughout. Use the persona's specific comedy style. Light moments balanced with substance.",
    "emotional": "Connect at a deep human level. Use vulnerability, empathy, and personal resonance. Make them feel something.",
    "informative": "Clear, factual, educational. Build understanding step by step. Data and logic over emotion.",
    "aggressive": "High intensity, provocative, challenging. Push the audience out of their comfort zone. Create urgency.",
    "sales": "Persuasive and benefit-focused. Create desire, address objections, build urgency. Every line moves toward action.",
    "dramatic": "Cinematic storytelling. Build tension slowly. Use emotional highs and lows. Make it feel like a movie.",
    "casual": "Relaxed, friendly, conversational. Like talking to a close friend. No formality, just real talk.",
    "motivational": "Inspiring, uplifting, action-oriented. Make the viewer believe they can do anything. Build momentum.",
    "storytelling": "Narrative arc with characters, tension, and resolution. Draw the viewer into a story world.",
    "educational": "Step-by-step clarity. Break complex things into simple pieces. Teach like the best teacher they ever had.",
    "trending": "Current, culturally aware, references what people are talking about right now. Feels timely and relevant.",
    "cinematic": "Visual language and scene-setting. Describe moments like a film director. Build atmosphere.",
}

def get_persona(persona_key: str) -> dict:
    key = (persona_key or "default").lower().strip().replace(" ", "").replace("_", "")
    return PERSONAS.get(key, PERSONAS["default"])

def get_tone_modifier(tone: str) -> str:
    key = (tone or "informative").lower().strip()
    return TONE_MODIFIERS.get(key, TONE_MODIFIERS["informative"])

def build_persona_prompt_block(persona_key: str, tone: str, language: str = None) -> str:
    persona = get_persona(persona_key)
    tone_mod = get_tone_modifier(tone)
    lang = language or persona.get("language", "hinglish")

    lang_instruction = {
        "hinglish": "Write in natural spoken Hinglish using Roman script only — no Devanagari. Mix Hindi and English exactly as Indians actually speak in conversation.",
        "hindi": "Write ENTIRELY in Hindi Devanagari script (हिंदी). Every word must be in Devanagari. Do NOT use Roman script for Hindi words. English technical terms are acceptable in Roman but all other content must be in हिंदी script.",
        "english": "Write in natural conversational English. Clear, direct, and accessible.",
        "tamil": "Write ENTIRELY in Tamil script (தமிழ்). Every word must be in Tamil script. Do NOT use Roman/English script for Tamil words. English technical terms are acceptable in Roman but all other content must be in தமிழ் script.",
        "telugu": "Write in natural spoken Telugu using Roman script — mix Telugu and English as Telugu speakers naturally do. No Telugu script.",
        "marathi": "Write ENTIRELY in Marathi Devanagari script (मराठी). Every word must be in Devanagari. Do NOT use Roman script for Marathi words. English technical terms are acceptable in Roman but all other content must be in मराठी script.",
        "bengali": "Write ENTIRELY in Bengali script (বাংলা). Every word must be in Bengali script. Do NOT use Roman/English script for Bengali words. English technical terms are acceptable in Roman but all other content must be in বাংলা script.",
        "gujarati": "Write in natural spoken Gujarati using Roman script — mix Gujarati and English as Gujaratis actually speak. No Gujarati script.",
        "punjabi": "Write in natural spoken Punjabi using Roman script — mix Punjabi and English as Punjabis actually speak. No Gurmukhi script.",
        "kannada": "Write in natural spoken Kannada using Roman script — mix Kannada and English as Kannadigas actually speak. No Kannada script.",
        "malayalam": "Write in natural spoken Malayalam using Roman script (Manglish) — mix Malayalam and English as Malayalis actually speak. No Malayalam script.",
    }.get(lang.lower(), "Write in natural spoken Hinglish using Roman script only.")

    style_rules = "\n".join(f"- {r}" for r in persona.get("style_rules", []))
    signatures = ", ".join(f'"{p}"' for p in persona.get("signature_phrases", []))

    return f"""CREATOR PERSONA: {persona['voice']}
PERSONA VOICE/CHARACTER: {persona['tone']}
ENERGY LEVEL: {persona.get('energy', 'medium')}
PACING: {persona.get('pacing', 'natural')}
HUMOR STYLE: {persona.get('humor', 'natural')}
VOCABULARY: {persona.get('vocabulary', 'natural')}

LANGUAGE: {lang_instruction}

PERSONA STYLE RULES (follow these exactly to sound like this creator):
{style_rules}

SIGNATURE PHRASES TO USE NATURALLY: {signatures}

TONE MODIFIER — {tone.upper()}: {tone_mod}

CRITICAL: The output must sound EXACTLY like {persona['voice']} in a {tone} mood. Someone who knows this creator should immediately recognize the voice."""
