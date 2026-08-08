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
        "signature_phrases": {'hinglish': {'opener': 'Suno, ye sunke bura lage toh lage, mujhe farak nahi padta', 'source_citing': ['koi bolta nahi kyunki sabko dar lagta hai', 'sach itna simple hai, log bas darpok hain', 'ye sabko pata hai, bolne ki himmat kisi mein nahi'], 'transition': ['ab yahan se maza aana shuru hota hai', 'asli baat, jo koi sunna nahi chahta', 'ruk, ye part important hai, dhyan se sun'], 'rhetorical': 'ab bologe main galat hoon?', 'importance': 'ye baat kisi ko achi nahi lagegi, but sach yahi hai', 'summary': 'toh bas itna hi hai, seedhi baat', 'cta': 'samajh aaya toh follow karo, nahi toh scroll kar jao', 'outro': 'main sorry nahi bolungi, kyunki main galat nahi hoon, milte hain phir'}, 'english': {'opener': "Say this offends you, I genuinely don't care", 'source_citing': ["nobody says it because everyone's scared", 'the truth is this simple, people are just cowards', 'everyone knows it, nobody has the spine to say it'], 'transition': ['now it gets good', "here's the part nobody wants to hear", 'wait, this bit actually matters, pay attention'], 'rhetorical': "so what, now I'm the problem?", 'importance': "nobody's going to like this, but it's true", 'summary': "so that's it, plain and simple", 'cta': 'if you get it, follow, if not, keep scrolling', 'outro': "I'm not saying sorry, because I'm not wrong, catch you next time"}, 'hindi': {'opener': 'सुनो, ये सुनके बुरा लगे तो लगे, मुझे फ़र्क नहीं पड़ता', 'source_citing': ['कोई बोलता नहीं क्योंकि सबको डर लगता है', 'सच इतना सिंपल है, लोग बस डरपोक हैं', 'ये सबको पता है, बोलने की हिम्मत किसी में नहीं'], 'transition': ['अब यहाँ से मज़ा आना शुरू होता है', 'असली बात, जो कोई सुनना नहीं चाहता', 'रुको, ये पार्ट ज़रूरी है, ध्यान से सुनो'], 'rhetorical': 'अब बोलोगे मैं गलत हूँ?', 'importance': 'ये बात किसी को अच्छी नहीं लगेगी, but सच यही है', 'summary': 'तो बस इतना ही है, सीधी बात', 'cta': 'समझ आया तो फॉलो करो, नहीं तो स्क्रॉल कर जाओ', 'outro': 'मैं sorry नहीं बोलूंगी, क्योंकि मैं गलत नहीं हूँ, मिलते हैं फिर'}, 'marathi': {'opener': 'ऐक, हे ऐकून वाईट वाटलं तर वाटू दे, मला फरक पडत नाही', 'source_citing': ['कोणी बोलत नाही कारण सगळ्यांना भीती वाटते', 'सत्य इतकं सोपं आहे, लोक फक्त भित्रे आहेत', 'हे सगळ्यांना माहितीमे, बोलण्याची हिंमत कोणात नाही'], 'transition': ['आता इथून मजा येऊ लागते', 'खरी गोष्ट, जी कोणालाच ऐकायची नाही', 'थांब, हा भाग महत्त्वाचा आहे, लक्ष देऊन ऐक'], 'rhetorical': 'आता म्हणाल मी चुकीची आहे?', 'importance': 'ही गोष्ट कोणालाच आवडणार नाही, but सत्य हेच आहे', 'summary': 'तर एवढंच आहे, सरळ बोलायचं तर', 'cta': 'समजलं तर फॉलो कर, नाहीतर स्क्रोल कर', 'outro': 'मी sorry म्हणणार नाही, कारण मी चुकीची नाही, भेटूया परत'}, 'tamil': {'opener': 'சொல்லிட்டேன், இது வருத்தப்படுத்தினா, படுத்திக்கோ, எனக்கு கவலையில்ல', 'source_citing': ['யாரும் சொல்ல மாட்டாங்க எல்லாருக்கும் பயம்', 'உண்மை இவ்வளவு சிம்பிள், மக்க பயந்தாங்கொள்ளிகள்', 'எல்லாருக்கும் தெரியும், சொல்ல தைரியம் யாருக்கும் இல்ல'], 'transition': ['இப்போ இருந்து ரசிக்கலாம்', 'யாரும் கேக்க விரும்பாத பகுதி', 'நில்லு, இது இம்போர்ட்டன்ட், கவனமா கேளு'], 'rhetorical': 'இப்போ நான் தப்புன்னு சொல்றியா?', 'importance': 'இது யாருக்கும் பிடிக்காது, but உண்மை இதுதான்', 'summary': 'அவ்ளோதான், நேரடியா சொல்றேன்', 'cta': 'புரிஞ்சா ஃபாலோ பண்ணு, இல்ல ஸ்க்ரோல் பண்ணு', 'outro': 'நான் sorry சொல்ல மட்டேன், நான் தப்பு பண்ணல, மறுபடி சந்திப்போம்'}, 'bengali': {'opener': 'শোনো, এট\u09ba শুনে খারাপ ল\u09baগলে লাগুক, আম\u09baর কিছু যায় আসে ন\u09ba', 'source_citing': ['কেউ বলে ন\u09ba কারণ সব\u09baই ভয় পায়', 'সত্যিট\u09ba এত সহজ, মানুষ শুধু ভীতু', 'সবাই জানে, বলার সাহস ক\u09baরো নেই'], 'transition': ['এখ\u09baন থেকে মজ\u09ba শুরু হয়', 'আসল কথ\u09ba, যেট\u09ba কেউ শুনতে চায় ন\u09ba', 'দাঁড়\u09baও, এই অংশট\u09ba গুরুত্বপূর্ণ, মন দিয়ে শোনো'], 'rhetorical': 'এখন বলবে আমি ভুল?', 'importance': 'এট\u09ba ক\u09baরো ভালো লাগবে ন\u09ba, but সত্যি এটাই', 'summary': 'তো এটাই, সোজা কথ\u09ba', 'cta': 'বুঝলে ফলো করো, নাহলে স্ক্রল করো', 'outro': 'আমি sorry বলব ন\u09ba, ক\u09baরণ আমি ভুল ন\u09ba, আব\u09baর দেখ\u09ba হবে'}},
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
    _sig_raw = persona.get("signature_phrases", [])
    if isinstance(_sig_raw, dict):
        _sig_set = _sig_raw.get(lang.lower()) or _sig_raw.get("hinglish") or {}
        _sig_lines = []
        if _sig_set.get("opener"): _sig_lines.append("Opening line: " + repr(_sig_set["opener"]))
        if _sig_set.get("source_citing"): _sig_lines.append("Source-citing phrases: " + ", ".join(repr(p) for p in _sig_set["source_citing"]))
        if _sig_set.get("transition"): _sig_lines.append("Transition phrases: " + ", ".join(repr(p) for p in _sig_set["transition"]))
        if _sig_set.get("rhetorical"): _sig_lines.append("Rhetorical challenge phrase: " + repr(_sig_set["rhetorical"]))
        if _sig_set.get("importance"): _sig_lines.append("Importance flag phrase: " + repr(_sig_set["importance"]))
        if _sig_set.get("summary"): _sig_lines.append("Summary cue phrase: " + repr(_sig_set["summary"]))
        if _sig_set.get("cta"): _sig_lines.append("Call to action line: " + repr(_sig_set["cta"]))
        if _sig_set.get("outro"): _sig_lines.append("Outro line: " + repr(_sig_set["outro"]))
        signatures = chr(10).join(_sig_lines)
    else:
        signatures = ", ".join(repr(p) for p in _sig_raw)

    return f"""CREATOR PERSONA: {persona['voice']}
PERSONA VOICE/CHARACTER: {persona['tone']}
ENERGY LEVEL: {persona.get('energy', 'medium')}
PACING: {persona.get('pacing', 'natural')}
HUMOR STYLE: {persona.get('humor', 'natural')}
VOCABULARY: {persona.get('vocabulary', 'natural')}

LANGUAGE: {lang_instruction}

PERSONA STYLE RULES (follow these exactly to sound like this creator):
{style_rules}
NOTE: any quoted example phrases inside the style rules above are illustrative only, showing the persona's structure and personality. If they are not in the specified LANGUAGE above, do NOT use those exact words. Use the localized SIGNATURE PHRASES below instead, which are already in the correct language.

SIGNATURE PHRASES TO USE NATURALLY: {signatures}

TONE MODIFIER — {tone.upper()}: {tone_mod}

CRITICAL: The output must sound EXACTLY like {persona['voice']} in a {tone} mood. Someone who knows this creator should immediately recognize the voice."""
