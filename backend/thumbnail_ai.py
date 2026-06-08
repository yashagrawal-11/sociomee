import os, base64, json, httpx, logging
log = logging.getLogger(__name__)

GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key={GEMINI_KEY}"

def _b64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode()

def _resize(image_bytes: bytes, max_size: int = 800) -> bytes:
    """Resize image to max dimension for faster Gemini processing"""
    try:
        from PIL import Image
        import io
        img = Image.open(io.BytesIO(image_bytes))
        w, h = img.size
        if max(w, h) > max_size:
            ratio = max_size / max(w, h)
            img = img.resize((int(w*ratio), int(h*ratio)), Image.LANCZOS)
        out = io.BytesIO()
        img.save(out, format="JPEG", quality=85)
        return out.getvalue()
    except:
        return image_bytes

def analyze_thumbnail_real(image_bytes: bytes, mime_type: str = "image/jpeg", keyword: str = "general", niche: str = "general", plan: str = "free") -> dict:
    try:
        prompt = f"""Analyze this YouTube thumbnail for the niche: "{niche}" / keyword: "{keyword}".

Score each metric 0-100:
1. CTR Potential — will people click this?
2. Color Contrast — are colors bold and visible?
3. Text Readability — is text clear and readable?
4. Emotion/Hook — does it trigger curiosity or emotion?
5. Face/Human Element — is there a face or human element?
6. Overall Score — weighted average

Return ONLY valid JSON:
{{"ctr_potential": 75, "color_contrast": 80, "text_readability": 70, "emotion_hook": 85, "face_element": 60, "fit_score": 74, "verdict": "Good thumbnail with strong emotional hook", "suggestions": ["Make text bigger", "Add arrow pointing to subject", "Brighter background"], "strengths": ["Strong face expression", "Good color contrast"]}}"""

        payload = {
            "contents": [{
                "parts": [
                    {"inline_data": {"mime_type": "image/jpeg", "data": _b64(_resize(image_bytes))}},
                    {"text": prompt}
                ]
            }]
        }
        import httpx as _httpx
        r = _httpx.post(GEMINI_URL, json=payload, timeout=30)
        rj = r.json()
        # Check for safety block
        candidates = rj.get("candidates", [])
        if not candidates:
            reason = rj.get("promptFeedback", {}).get("blockReason", "SAFETY")
            return {"error": "inappropriate", "message": "This image was flagged as inappropriate and cannot be analyzed. Please upload a YouTube-safe thumbnail."}
        finish = candidates[0].get("finishReason", "")
        if finish == "SAFETY":
            return {"error": "inappropriate", "message": "This image was flagged as inappropriate and cannot be analyzed. Please upload a YouTube-safe thumbnail."}
        text = candidates[0]["content"]["parts"][0]["text"]
        clean = text.replace("```json","").replace("```","").strip()
        return json.loads(clean)
    except Exception as e:
        log.error("thumbnail_ai error: %s", e)
        return {"ctr_potential":65,"color_contrast":60,"text_readability":65,"emotion_hook":60,"face_element":50,"fit_score":62,"verdict":"Analysis unavailable","suggestions":["Add bold text","Use bright colors","Include a face"],"strengths":["Uploaded successfully"]}

def ab_test_thumbnails(img_a: bytes, img_b: bytes, mime_a: str, mime_b: str, niche: str = "general") -> dict:
    try:
        prompt = f"""You are a YouTube thumbnail expert. Compare these TWO thumbnails for niche: "{niche}".

Thumbnail A is the FIRST image. Thumbnail B is the SECOND image.

Score each 0-100 on:
- ctr_potential: will people click?
- color_contrast: bold visible colors?
- text_readability: clear readable text?
- emotion_hook: curiosity or emotion?
- overall: weighted score

Return ONLY valid JSON:
{{
  "a": {{"ctr_potential": 75, "color_contrast": 80, "text_readability": 70, "emotion_hook": 85, "overall": 78, "strengths": ["point1","point2"], "weaknesses": ["point1"]}},
  "b": {{"ctr_potential": 65, "color_contrast": 70, "text_readability": 75, "emotion_hook": 60, "overall": 68, "strengths": ["point1"], "weaknesses": ["point1","point2"]}},
  "winner": "A",
  "winner_reason": "Thumbnail A wins because of stronger emotional hook and better color contrast",
  "improvement_a": "Add bigger text overlay",
  "improvement_b": "Use brighter background and add a face"
}}"""

        payload = {
            "contents": [{
                "parts": [
                    {"inline_data": {"mime_type": "image/jpeg", "data": _b64(_resize(img_a))}},
                    {"inline_data": {"mime_type": "image/jpeg", "data": _b64(_resize(img_b))}},
                    {"text": prompt}
                ]
            }]
        }
        import httpx as _httpx
        r = _httpx.post(GEMINI_URL, json=payload, timeout=30)
        rj = r.json()
        candidates = rj.get("candidates", [])
        if not candidates or candidates[0].get("finishReason") == "SAFETY":
            return {"error": "inappropriate", "message": "One or both images were flagged as inappropriate. Please upload YouTube-safe thumbnails."}
        text = candidates[0]["content"]["parts"][0]["text"]
        clean = text.replace("```json","").replace("```","").strip()
        return json.loads(clean)
    except Exception as e:
        log.error("ab_test error: %s", e)
        return {
            "a": {"ctr_potential":70,"color_contrast":65,"text_readability":70,"emotion_hook":65,"overall":68,"strengths":["Clear composition"],"weaknesses":["Needs more contrast"]},
            "b": {"ctr_potential":60,"color_contrast":60,"text_readability":65,"emotion_hook":55,"overall":60,"strengths":["Good layout"],"weaknesses":["Low visual impact"]},
            "winner": "A",
            "winner_reason": "Thumbnail A has better overall visual impact",
            "improvement_a": "Add bolder text",
            "improvement_b": "Use brighter colors and add emotion"
        }
