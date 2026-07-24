"""
YouTube SEO Routes — keyword analysis, trending topics, video scorer
Uses Vertex AI for real data, deducts credits.
"""
import os, json, re, logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

log = logging.getLogger("youtube_seo")
router = APIRouter(prefix="/youtube/seo", tags=["youtube-seo"])

def _vertex(prompt, max_tokens=1500):
    try:
        from vertex_engine import generate
        return generate(prompt, max_tokens=max_tokens)
    except Exception as e:
        log.warning("Vertex failed: %s", e)
        return ""

def _pj(raw):
    try:
        m = re.search(r'\{[\s\S]*\}', raw)
        if m: return json.loads(m.group())
    except: pass
    return {}

def _pjl(raw):
    try:
        m = re.search(r'\[[\s\S]*\]', raw)
        if m: return json.loads(m.group())
    except: pass
    return []

def _auth(token: str = None):
    from auth_routes import _load_users, _verify_token
    return _verify_token(token)

@router.get("/trending")
async def trending_topics(user_id: str, channel_niche: str = "general"):
    from credits_manager import use_credit, get_credit_status
    if not use_credit(user_id, cost=2):
        status = get_credit_status(user_id)
        raise HTTPException(402, detail={"error":"no_credits","message":f"Not enough credits. {status.get('credits_remaining',0)} remaining."})
    
    prompt = f"""You are a YouTube trend analyst for Indian creators. Channel niche: {channel_niche}.
Return ONLY valid JSON array of 8 trending topics right now for Indian YouTube in 2026:
[{{"topic":"topic name","category":"Gaming/Tech/Finance/Lifestyle/etc","search_volume":"High/Medium","growth":"rising/stable/viral","why_trending":"one sentence reason","video_ideas":["idea1","idea2"]}}]
Focus on what Indian creators are actually making videos about right now. Mix Hindi and English topics."""

    raw = _vertex(prompt)
    topics = _pjl(raw)
    if not topics:
        topics = [
            {"topic":"AI Tools for Creators 2026","category":"Tech","search_volume":"High","growth":"viral","why_trending":"Every creator wants to automate content","video_ideas":["Top 10 AI tools that replaced my editor","I used AI for 30 days"]},
            {"topic":"Budget Travel India 2026","category":"Travel","search_volume":"High","growth":"rising","why_trending":"Post-monsoon travel season","video_ideas":["₹500/day travel challenge","Hidden hill stations near Mumbai"]},
            {"topic":"Stock Market Beginners","category":"Finance","search_volume":"High","growth":"stable","why_trending":"Young Indians investing in equity","video_ideas":["How I started with ₹1000","Biggest investing mistakes"]},
        ]
    return {"trending": topics}

@router.get("/analyze")
async def analyze_keyword(user_id: str, keyword: str, language: str = "Hindi/English"):
    from credits_manager import use_credit, get_credit_status
    if not use_credit(user_id, cost=5):
        status = get_credit_status(user_id)
        raise HTTPException(402, detail={"error":"no_credits","message":f"Not enough credits. {status.get('credits_remaining',0)} remaining."})

    prompt = f"""YouTube SEO analyst for Indian creators. Keyword: "{keyword}" | Language: {language}
Return ONLY valid JSON:
{{"seo_score":85,"competition":"Low/Medium/High","search_volume_estimate":"50K-200K/month","best_upload_time":"Tuesday & Thursday 7-9 PM IST","shorts_potential":75,"titles":["title1","title2","title3","title4","title5"],"related_keywords":["kw1","kw2","kw3","kw4","kw5","kw6","kw7","kw8"],"tags":["tag1","tag2","tag3","tag4","tag5","tag6","tag7","tag8","tag9","tag10"],"hook":"opening line for video","why_opportunity":"one sentence on why this keyword is good now","content_angle":"best angle to approach this topic"}}
Make titles specific, clickable, in Hinglish/English. Tags should be real YouTube tags."""

    raw = _vertex(prompt)
    data = _pj(raw)
    if not data.get("titles"):
        raise HTTPException(500, "Analysis failed, please retry")
    data["keyword"] = keyword
    return data

@router.post("/score-video")
async def score_video(user_id: str, video_url: str, keyword: str = ""):
    from credits_manager import use_credit, get_credit_status
    if not use_credit(user_id, cost=3):
        status = get_credit_status(user_id)
        raise HTTPException(402, detail={"error":"no_credits","message":f"Not enough credits. {status.get('credits_remaining',0)} remaining."})

    # Extract video ID
    vid_match = re.search(r'(?:v=|youtu\.be/)([a-zA-Z0-9_-]{11})', video_url)
    if not vid_match:
        raise HTTPException(400, "Invalid YouTube URL")
    vid_id = vid_match.group(1)

    prompt = f"""YouTube SEO auditor. Video URL: {video_url} | Target keyword: "{keyword or 'not specified'}"
Return ONLY valid JSON with realistic scores and actionable tips:
{{"overall_score":72,"title_score":80,"description_score":60,"tags_score":70,"thumbnail_score":75,"engagement_score":65,"suggestions":["specific tip 1","specific tip 2","specific tip 3","specific tip 4","specific tip 5"],"strengths":["what's working 1","what's working 2"],"quick_wins":["do this today 1","do this today 2"]}}"""

    raw = _vertex(prompt)
    data = _pj(raw)
    if not data.get("overall_score"):
        raise HTTPException(500, "Scoring failed, please retry")
    return data
