from __future__ import annotations
import logging
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List

log    = logging.getLogger("whatsapp_routes")
router = APIRouter(prefix="/whatsapp", tags=["whatsapp"])

def _wc():
    try:
        import whatsapp_connect
        return whatsapp_connect
    except ImportError as e:
        raise HTTPException(503, f"whatsapp_connect not found: {e}")

class SendContentRequest(BaseModel):
    to_number:   str
    topic:       str
    platform:    str = "whatsapp"
    script_text: str = ""
    best_title:  str = ""
    hook:        str = ""
    hashtags:    List[str] = []
    description: str = ""

class QuickMessageRequest(BaseModel):
    to_number: str
    text:      str

class TestRequest(BaseModel):
    to_number: str

@router.post("/send-content")
def send_content(payload: SendContentRequest):
    wc = _wc()
    try:
        return wc.send_content_pack(to_number=payload.to_number, topic=payload.topic, platform=payload.platform, script_text=payload.script_text, best_title=payload.best_title, hook=payload.hook, hashtags=payload.hashtags, description=payload.description)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/send-quick")
def send_quick(payload: QuickMessageRequest):
    wc = _wc()
    try:
        return wc.send_text(payload.to_number, payload.text)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))

@router.post("/test")
def test_connection(payload: TestRequest):
    wc = _wc()
    try:
        return wc.send_text(payload.to_number, "✅ *SocioMee WhatsApp Connected!*\n\nYou'll receive your AI-generated content here. 🚀")
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        raise HTTPException(500, str(e))

@router.get("/best-times")
def best_times():
    return _wc().get_best_send_times()

@router.get("/status")
def api_status():
    return {"connected": True, "platform": "WhatsApp Business Cloud API", "provider": "Meta (Official)", "mode": "SocioMee shared account"}
