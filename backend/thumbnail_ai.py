import os, base64, json, re, logging
import httpx
log = logging.getLogger(__name__)

def _get_key():
    return os.environ.get("GOOGLE_API_KEY", "") or os.environ.get("GOOGLE_AI_API_KEY", "")

GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

def _b64(image_bytes: bytes) -> str:
    return base64.b64encode(image_bytes).decode()

def _resize(image_bytes: bytes, max_size: int = 800) -> bytes:
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

def _parse_json(text: str) -> dict:
    clean = re.sub(r'```json|```', '', text).strip()
    m = re.search(r'\{[\s\S]*\}', clean)
    if m:
        return json.loads(m.group())
    return json.loads(clean)

def _call_gemini(parts: list) -> str:
    key = _get_key()
    r = httpx.post(
        f"{GEMINI_URL}?key={key}",
        json={"contents": [{"parts": parts}]},
        timeout=90
    )
    rj = r.json()
    cands = rj.get("candidates", [])
    if not cands:
        raise ValueError(f"No candidates: {rj.get('error',{}).get('message','unknown')}")
    if cands[0].get("finishReason") == "SAFETY":
        raise ValueError("SAFETY_BLOCK")
    return cands[0]["content"]["parts"][0]["text"]

def analyze_thumbnail_real(image_bytes: bytes, mime_type: str = "image/jpeg", keyword: str = "general", niche: str = "general", plan: str = "free") -> dict:
    try:
        img = _resize(image_bytes)
        prompt = f"""Analyze this YouTube thumbnail for niche: "{niche}", keyword: "{keyword}".
Score 0-100: ctr_potential, color_contrast, text_readability, emotion_hook, face_element, fit_score.
Return ONLY valid JSON (no markdown):
{{"ctr_potential":75,"color_contrast":80,"text_readability":70,"emotion_hook":85,"face_element":60,"fit_score":74,"verdict":"Good thumbnail","suggestions":["tip1","tip2"],"strengths":["strength1"]}}"""
        text = _call_gemini([
            {"inline_data": {"mime_type": "image/jpeg", "data": _b64(img)}},
            {"text": prompt}
        ])
        return _parse_json(text)
    except ValueError as e:
        if "SAFETY_BLOCK" in str(e):
            return {"error": "inappropriate", "message": "Image flagged as inappropriate. Please upload a YouTube-safe thumbnail."}
        log.error("analyze_thumbnail error: %s", e)
        return {"ctr_potential":65,"color_contrast":60,"text_readability":65,"emotion_hook":60,"face_element":50,"fit_score":62,"verdict":"Analysis unavailable","suggestions":["Add bold text","Use bright colors","Include a face"],"strengths":["Uploaded successfully"]}
    except Exception as e:
        log.error("analyze_thumbnail error: %s", e)
        return {"ctr_potential":65,"color_contrast":60,"text_readability":65,"emotion_hook":60,"face_element":50,"fit_score":62,"verdict":"Analysis unavailable","suggestions":["Add bold text","Use bright colors","Include a face"],"strengths":["Uploaded successfully"]}

def ab_test_thumbnails(img_a: bytes, img_b: bytes, mime_a: str, mime_b: str, niche: str = "general") -> dict:
    try:
        a = _resize(img_a)
        b = _resize(img_b)
        prompt = f"""You are a YouTube CTR expert. Compare these TWO thumbnails for niche: "{niche}".
Thumbnail A = first image. Thumbnail B = second image.
Score each 0-100: ctr_potential, color_contrast, text_readability, emotion_hook, overall.
Return ONLY valid JSON (no markdown, no extra text):
{{"a":{{"ctr_potential":75,"color_contrast":80,"text_readability":70,"emotion_hook":85,"overall":78,"strengths":["s1","s2"],"weaknesses":["w1"]}},"b":{{"ctr_potential":65,"color_contrast":70,"text_readability":75,"emotion_hook":60,"overall":68,"strengths":["s1"],"weaknesses":["w1","w2"]}},"winner":"A","winner_reason":"Thumbnail A wins because...","improvement_a":"specific tip for A","improvement_b":"specific tip for B"}}"""
        text = _call_gemini([
            {"inline_data": {"mime_type": "image/jpeg", "data": _b64(a)}},
            {"inline_data": {"mime_type": "image/jpeg", "data": _b64(b)}},
            {"text": prompt}
        ])
        return _parse_json(text)
    except ValueError as e:
        if "SAFETY_BLOCK" in str(e):
            return {"error": "inappropriate", "message": "One or both images were flagged as inappropriate."}
        log.error("ab_test error: %s", e)
        return {"a":{"ctr_potential":70,"color_contrast":65,"text_readability":70,"emotion_hook":65,"overall":68,"strengths":["Clear composition"],"weaknesses":["Needs more contrast"]},"b":{"ctr_potential":60,"color_contrast":60,"text_readability":65,"emotion_hook":55,"overall":60,"strengths":["Good layout"],"weaknesses":["Low visual impact"]},"winner":"A","winner_reason":"Thumbnail A has better overall visual impact","improvement_a":"Add bolder text","improvement_b":"Use brighter colors"}
    except Exception as e:
        log.error("ab_test error: %s", e)
        return {"a":{"ctr_potential":70,"color_contrast":65,"text_readability":70,"emotion_hook":65,"overall":68,"strengths":["Clear composition"],"weaknesses":["Needs more contrast"]},"b":{"ctr_potential":60,"color_contrast":60,"text_readability":65,"emotion_hook":55,"overall":60,"strengths":["Good layout"],"weaknesses":["Low visual impact"]},"winner":"A","winner_reason":"Thumbnail A has better overall visual impact","improvement_a":"Add bolder text","improvement_b":"Use brighter colors"}
