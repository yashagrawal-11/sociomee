"""
vertex_engine.py — Universal Vertex AI generation engine for all platforms.
All platform engines call this instead of direct Gemini API calls.
Uses Google Cloud $300 credits via service account authentication.
"""
import os, json, warnings, logging
from typing import Optional

logger = logging.getLogger("vertex_engine")

os.environ.setdefault('GOOGLE_APPLICATION_CREDENTIALS', '/var/www/sociomee/backend/sociomee-auth-key.json')

_VERTEX_READY = False
_model = None

def _init():
    global _VERTEX_READY, _model
    if _VERTEX_READY:
        return True
    try:
        import vertexai
        from vertexai.generative_models import GenerativeModel
        vertexai.init(project='sociomee-auth', location='us-central1')
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            _model = GenerativeModel('gemini-2.5-flash')
        _VERTEX_READY = True
        return True
    except Exception as e:
        logger.error(f"Vertex AI init failed: {e}")
        return False

def generate(prompt: str, max_tokens: int = 2000, temperature: float = 0.85, json_mode: bool = False) -> str:
    """Generate content using Vertex AI. Returns text or empty string on failure."""
    if not _init():
        return ""
    try:
        from vertexai.generative_models import GenerationConfig, Content, Part
        full_prompt = HUMANIZER_RULES + "\n\n" + prompt
        config = GenerationConfig(max_output_tokens=max_tokens, temperature=temperature)
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            response = _model.generate_content(full_prompt, generation_config=config)
        text = response.text.strip()
        if json_mode:
            # Extract JSON from response
            start = text.find('{') if '{' in text else text.find('[')
            if start == -1:
                return text
            end = text.rfind('}') + 1 if '{' in text else text.rfind(']') + 1
            return text[start:end]
        return text
    except Exception as e:
        logger.error(f"Vertex AI generate failed: {e}")
        return ""

def generate_json(prompt: str, max_tokens: int = 2000, temperature: float = 0.85) -> Optional[dict]:
    """Generate and parse JSON response."""
    raw = generate(prompt, max_tokens=max_tokens, temperature=temperature, json_mode=True)
    if not raw:
        return None
    try:
        return json.loads(raw)
    except Exception:
        try:
            # Try to fix common JSON issues
            raw = raw.replace("```json", "").replace("```", "").strip()
            return json.loads(raw)
        except Exception as e:
            logger.error(f"JSON parse failed: {e} | raw: {raw[:200]}")
            return None


# ══════════════════════════════════════════════════════════════════════
# HUMANIZER RULES — Applied to every generation
# Based on Wikipedia Signs of AI Writing guide
# ══════════════════════════════════════════════════════════════════════
HUMANIZER_RULES = """
CRITICAL WRITING RULES — violating these makes the output feel AI-generated and useless:

NEVER USE:
- Hyphens or em dashes (— or -) anywhere in the output
- Bullet points with symbols like •, ✦, ★, 💡, 🚀 unless specifically asked
- Phrases like: "stands as", "serves as", "is a testament to", "pivotal moment", "evolving landscape", "underscores", "highlights", "it is worth noting", "in conclusion", "in today's world", "needless to say", "it goes without saying", "at the end of the day", "game-changer", "dive into", "delve into", "leverage", "synergy", "groundbreaking", "transformative", "seamlessly", "unlock", "foster", "streamline"
- The rule of three structure (always listing exactly 3 things)
- Starting sentences with "Additionally,", "Furthermore,", "Moreover,", "However," repeatedly
- Ending with generic encouragement like "exciting times ahead", "the future is bright"
- Hollow significance statements like "This represents a major shift in..."
- Passive voice where active voice works: "it was decided" → "we decided"
- Fake hedging: "it could potentially be argued that", "it might be suggested"
- Synonym cycling: saying the same thing three ways in a row
- Perfect parallel structure in every sentence (too clean = AI)

ALWAYS DO:
- Write with varied sentence length — short punchy ones mixed with longer flowing ones
- Use specific details, not vague generalities
- Sound like a real person who has opinions, not a neutral reporter
- Use contractions naturally (don't, isn't, it's, we're)
- Let the persona's actual voice come through with their real vocabulary
- Write how people actually speak, not how textbooks describe speech
"""

# ══════════════════════════════════════════════════════════════════════
# PLATFORM CONTENT GENERATORS
# Each function returns platform-specific content using the right prompt
# ══════════════════════════════════════════════════════════════════════

def generate_instagram(topic: str, tone: str = "casual", persona: str = "default",
                       language: str = "hinglish", niche: str = "general") -> dict:
    """Generate Instagram-optimized content: caption, hashtags, reel hook, CTA."""
    from persona_profiles import build_persona_prompt_block
    persona_block = build_persona_prompt_block(persona, tone, language)

    prompt = f"""Generate Instagram content for this topic: "{topic}"
Niche: {niche}

{persona_block}

Generate the following for Instagram. Instagram is a VISUAL platform — no titles or long descriptions.

Return ONLY valid JSON:
{{
  "reel_hook": "First 3 seconds spoken hook for a reel — must stop the scroll immediately. 1-2 punchy sentences.",
  "caption": "Full Instagram caption. Start with a hook line. 3-4 short paragraphs. Conversational. Ends with a question or CTA. 150-250 words.",
  "hashtags": ["list", "of", "20", "relevant", "hashtags", "mix", "of", "niche", "trending", "broad"],
  "cta": "Call to action — save this, share with a friend, comment below, etc.",
  "story_ideas": ["3 story slide ideas related to this topic"],
  "bio_link_text": "Text to say 'link in bio' naturally in the persona voice"
}}"""

    result = generate_json(prompt, max_tokens=1500)
    if not result:
        return {
            "reel_hook": f"You need to know this about {topic}",
            "caption": f"Let's talk about {topic}. This is something every creator needs to understand.",
            "hashtags": ["#instagram", "#reels", "#viral", "#trending", "#india", "#creator", "#content", "#explore"],
            "cta": "Save this post for later!",
            "story_ideas": [f"Story 1 about {topic}", f"Story 2 about {topic}", f"Story 3 about {topic}"],
            "bio_link_text": "Full breakdown in bio link!"
        }
    return result

def generate_linkedin(topic: str, tone: str = "informative", persona: str = "default",
                      language: str = "english") -> dict:
    """Generate LinkedIn-optimized professional content."""
    from persona_profiles import build_persona_prompt_block
    persona_block = build_persona_prompt_block(persona, tone, "english")

    prompt = f"""Generate LinkedIn content for this topic: "{topic}"

{persona_block}

LinkedIn is a PROFESSIONAL network. Content must feel authentic, insightful, and professional — not salesy or generic.

Return ONLY valid JSON:
{{
  "post": "Full LinkedIn post. Start with a bold first line that stops scrolling. Use line breaks between short paragraphs (1-3 lines each). Include a specific insight or story. End with a genuine question. 150-250 words total.",
  "hashtags": ["5", "relevant", "professional", "hashtags"],
  "hook_line": "Just the first line of the post — must be scroll-stopping",
  "post_type": "story|insight|list|question",
  "engagement_question": "The closing question to drive comments"
}}"""

    result = generate_json(prompt, max_tokens=1000)
    if not result:
        return {
            "post": f"Here's something important about {topic} that most professionals miss.\n\nThis insight changed how I think about it.\n\nWhat's your take?",
            "hashtags": ["#linkedin", "#professional", "#growth", "#india", "#business"],
            "hook_line": f"Here's something important about {topic}",
            "post_type": "insight",
            "engagement_question": "What's your experience with this?"
        }
    return result

def generate_twitter_x(topic: str, tone: str = "bold", persona: str = "default",
                        language: str = "english") -> dict:
    """Generate Twitter/X optimized content: tweet + thread."""
    from persona_profiles import build_persona_prompt_block
    persona_block = build_persona_prompt_block(persona, tone, language)

    prompt = f"""Generate Twitter/X content for this topic: "{topic}"

{persona_block}

Twitter/X rewards bold opinions, specific insights, and strong hooks. Be concise and punchy.

Return ONLY valid JSON:
{{
  "tweet": "Single tweet under 280 characters. Bold, specific, makes people want to reply or retweet.",
  "thread": ["Tweet 1 — hook", "Tweet 2 — context", "Tweet 3 — insight", "Tweet 4 — example", "Tweet 5 — conclusion + CTA"],
  "hashtags": ["3", "relevant", "hashtags"],
  "reply_bait": "A question or statement designed to get replies"
}}"""

    result = generate_json(prompt, max_tokens=1000)
    if not result:
        return {
            "tweet": f"Hot take on {topic}: most people are thinking about this completely wrong.",
            "thread": [f"1/ Let's talk about {topic}.", f"2/ Here's what most people miss.", f"3/ The reality is...", f"4/ What this means for you:", f"5/ Bottom line: pay attention to this."],
            "hashtags": ["#twitter", "#trending", "#india"],
            "reply_bait": f"What's your take on {topic}?"
        }
    return result

def generate_facebook(topic: str, tone: str = "casual", persona: str = "default",
                      language: str = "hinglish", objective: str = "engagement") -> dict:
    """Generate Facebook-optimized content."""
    from persona_profiles import build_persona_prompt_block
    persona_block = build_persona_prompt_block(persona, tone, language)

    prompt = f"""Generate Facebook content for this topic: "{topic}"
Objective: {objective}

{persona_block}

Facebook rewards longer, story-driven posts with emotional hooks. Mix personal tone with valuable information.

Return ONLY valid JSON:
{{
  "post": "Full Facebook post. Conversational, story-driven, 200-350 words. Feels like a personal share not a brand post. Ends with a question to drive comments.",
  "hashtags": ["5", "to", "8", "hashtags"],
  "hook_line": "First line — must make people click 'See more'",
  "cta": "What action should readers take"
}}"""

    result = generate_json(prompt, max_tokens=1200)
    if not result:
        return {
            "post": f"Something important I want to share about {topic}...\n\nThis has been on my mind lately and I think you'll find it useful.\n\nWhat do you think?",
            "hashtags": ["#facebook", "#trending", "#india", "#viral", "#share"],
            "hook_line": f"Something important about {topic}",
            "cta": "Share with someone who needs to see this"
        }
    return result

def generate_threads(topic: str, tone: str = "casual", persona: str = "default",
                     language: str = "hinglish") -> dict:
    """Generate Threads-optimized content."""
    from persona_profiles import build_persona_prompt_block
    persona_block = build_persona_prompt_block(persona, tone, language)

    prompt = f"""Generate Threads content for this topic: "{topic}"

{persona_block}

Threads is conversational and casual — like a Twitter but warmer. Short punchy posts that feel personal.

Return ONLY valid JSON:
{{
  "main_post": "Primary Threads post. Casual, punchy, 100-150 words max. Feels like a genuine thought.",
  "thread_replies": ["Reply 1 — adds context", "Reply 2 — adds example", "Reply 3 — ends with question"],
  "hashtags": ["3", "to", "5", "hashtags"]
}}"""

    result = generate_json(prompt, max_tokens=800)
    if not result:
        return {
            "main_post": f"Real talk about {topic} — here's what nobody tells you.",
            "thread_replies": ["Here's the thing...", "And what this means is...", "What's your experience with this?"],
            "hashtags": ["#threads", "#india", "#trending"]
        }
    return result

def generate_pinterest(topic: str, tone: str = "informative", persona: str = "default",
                       language: str = "english", niche: str = "general") -> dict:
    """Generate Pinterest-optimized content."""
    prompt = f"""Generate Pinterest content for this topic: "{topic}"
Niche: {niche}

Pinterest is a visual discovery platform. Content must be highly searchable and save-worthy.

Return ONLY valid JSON:
{{
  "pin_title": "Pin title under 100 characters — SEO optimized, includes main keyword",
  "pin_description": "Pin description 200-300 words. Keyword rich. Lists steps or tips. Ends with a soft CTA.",
  "hashtags": ["10", "to", "15", "pinterest", "specific", "hashtags"],
  "board_suggestions": ["3 Pinterest board names this pin would fit"],
  "seo_keywords": ["5 search keywords people would use to find this"]
}}"""

    result = generate_json(prompt, max_tokens=1000)
    if not result:
        return {
            "pin_title": f"Everything You Need to Know About {topic}",
            "pin_description": f"Discover everything about {topic} in this comprehensive guide.",
            "hashtags": ["#pinterest", "#lifestyle", "#tips", "#howto", "#guide"],
            "board_suggestions": ["Helpful Tips", "Life Hacks", "Must Read"],
            "seo_keywords": [topic, f"{topic} tips", f"how to {topic}"]
        }
    return result

def generate_telegram(topic: str, tone: str = "informative", persona: str = "default",
                      language: str = "hinglish", destination_type: str = "channel") -> dict:
    """Generate Telegram channel/group content."""
    from persona_profiles import build_persona_prompt_block
    persona_block = build_persona_prompt_block(persona, tone, language)

    prompt = f"""Generate Telegram {destination_type} content for this topic: "{topic}"

{persona_block}

Telegram channels are for delivering value directly. No fluff — pure signal.

Return ONLY valid JSON:
{{
  "message": "Full Telegram message. Well-formatted with line breaks, bullet points, bold using markdown (**bold**). 200-400 words. Dense value.",
  "hashtags": ["5", "hashtags"],
  "poll_question": "A poll question related to the topic to boost engagement",
  "poll_options": ["Option 1", "Option 2", "Option 3", "Option 4"]
}}"""

    result = generate_json(prompt, max_tokens=1200)
    if not result:
        return {
            "message": f"**{topic}**\n\nHere's what you need to know about this topic...\n\n📌 Key Point 1\n📌 Key Point 2\n📌 Key Point 3",
            "hashtags": ["#telegram", "#india", "#trending"],
            "poll_question": f"What do you think about {topic}?",
            "poll_options": ["Very Important", "Somewhat Important", "Not Important", "Need More Info"]
        }
    return result

def generate_reddit(topic: str, tone: str = "informative", persona: str = "default",
                    language: str = "english") -> dict:
    """Generate Reddit post content."""
    prompt = f"""Generate a Reddit post for this topic: "{topic}"

Reddit rewards genuine, helpful, conversation-starting posts. No marketing speak.

Return ONLY valid JSON:
{{
  "post_title": "Reddit post title — specific, genuine, curiosity-driving. Under 300 chars.",
  "post_body": "Reddit post body. Conversational, first-person, genuine. 200-350 words. Share a real perspective. End with a question to spark discussion.",
  "subreddit_suggestions": ["5 relevant subreddits without the r/ prefix"],
  "flair_suggestion": "Suggested post flair"
}}"""

    result = generate_json(prompt, max_tokens=1000)
    if not result:
        return {
            "post_title": f"My thoughts on {topic} — what does everyone else think?",
            "post_body": f"Been thinking about {topic} lately and wanted to get some different perspectives. Here's what I've observed...",
            "subreddit_suggestions": ["india", "IndiaSpeaks", "technology", "AskIndia", "IndianBros"],
            "flair_suggestion": "Discussion"
        }
    return result

def generate_quora(topic: str, tone: str = "informative", persona: str = "default",
                   language: str = "english") -> dict:
    """Generate Quora answer content."""
    prompt = f"""Generate a Quora answer for this topic: "{topic}"

Quora rewards credible, detailed, well-structured answers. Sound like a genuine expert.

Return ONLY valid JSON:
{{
  "question": "The most searched Quora question about this topic",
  "answer": "Full Quora answer. Start with a direct answer. Then elaborate with context, examples, data points. 300-500 words. Professional but readable.",
  "credentials_line": "First line establishing why you're qualified to answer this"
}}"""

    result = generate_json(prompt, max_tokens=1500)
    if not result:
        return {
            "question": f"What should I know about {topic}?",
            "answer": f"Great question. Having studied {topic} extensively, here's what I've found...",
            "credentials_line": "As someone who has researched this topic deeply:"
        }
    return result
