import google.generativeai as genai
import json
import asyncio
from typing import Dict, List, Optional
import os

GEMINI_KEY = "AIzaSyB_K3MbHZsRiz3lTeMpXNn_NC97s_Svgxc"
genai.configure(api_key=GEMINI_KEY)
model = genai.GenerativeModel('gemini-2.5-flash')

FILTER_PROMPT = """You are a content filter for SocioMee, an AI content studio for Indian creators.

Given a news article, determine if it is relevant to the creator economy (YouTube, Instagram, content creation, brand deals, creator milestones, platform updates, viral moments, Indian creators).

Return ONLY valid JSON, no explanation, no markdown:
{
  "is_relevant": true,
  "relevance_score": 8,
  "ai_summary": "2 line casual Hinglish summary",
  "category": "milestone",
  "region": "india",
  "creator_tags": ["CarryMinati"],
  "platform_tags": ["YouTube"]
}

category must be one of: milestone, drama, platform, india, global, trend
region must be one of: india, global"""

IDEAS_PROMPT = """You are a content strategist for Indian creators.

Given this news story, generate 3 ready-to-publish social media posts in casual GenZ Hinglish tone.

News: {title}
Summary: {summary}

Return ONLY valid JSON, no markdown:
{{
  "instagram": {{
    "hook": "scroll stopping first line",
    "content": "full caption max 100 words",
    "hashtags": ["#CreatorEconomy", "#IndianCreator", "#YouTube"]
  }},
  "twitter": {{
    "hook": "opening line",
    "content": "tweet max 240 chars",
    "hashtags": ["#IndianCreator", "#YouTube"]
  }},
  "youtube_shorts": {{
    "hook": "first 3 seconds script",
    "content": "60 second script",
    "hashtags": ["#Shorts", "#IndianCreator"]
  }}
}}"""


async def filter_article(article: Dict) -> Optional[Dict]:
    title = article.get("title", "")
    desc = article.get("description", "") or ""
    text = f"Title: {title}\nDescription: {desc[:400]}"
    prompt = f"{FILTER_PROMPT}\n\nArticle:\n{text}"
    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        raw = response.text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception as e:
        print(f"Gemini filter error: {e}")
        return None


async def generate_ideas(news_id: str, title: str, summary: str) -> Optional[Dict]:
    prompt = IDEAS_PROMPT.format(title=title, summary=summary)
    try:
        response = await asyncio.to_thread(model.generate_content, prompt)
        raw = response.text.strip()
        if "```" in raw:
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        return json.loads(raw.strip())
    except Exception as e:
        print(f"Gemini ideas error: {e}")
        return None


async def batch_filter(articles: List[Dict]) -> List[Dict]:
    tasks = [filter_article(a) for a in articles]
    results = await asyncio.gather(*tasks, return_exceptions=True)
    filtered = []
    for article, result in zip(articles, results):
        if isinstance(result, dict) and result.get("is_relevant") and result.get("relevance_score", 0) >= 6:
            article["_ai"] = result
            filtered.append(article)
    filtered.sort(key=lambda x: x["_ai"].get("relevance_score", 0), reverse=True)
    return filtered
