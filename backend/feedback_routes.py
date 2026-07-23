"""
feedback_routes.py — User Feedback Endpoint
One submission per user (tracked by user_id).
Awards 5 credits on first submission.
Full data logged and emailed.
"""
import os, json, logging, resend
from fastapi import APIRouter, Request, HTTPException
from pathlib import Path
from datetime import datetime, timezone

log = logging.getLogger("feedback_routes")
router = APIRouter(prefix="/feedback", tags=["feedback"])

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = "SocioMee <hello@sociomeeai.com>"
TO_EMAIL   = "socimateai@gmail.com"

FEEDBACK_FILE = Path("/var/www/sociomee/backend/data/feedback_submissions.json")
FEEDBACK_FILE.parent.mkdir(parents=True, exist_ok=True)

def _load():
    if FEEDBACK_FILE.exists():
        try:
            return json.loads(FEEDBACK_FILE.read_text())
        except:
            return {}
    return {}

def _save(data):
    FEEDBACK_FILE.write_text(json.dumps(data, indent=2))

@router.get("/check")
async def check_submitted(user_id: str):
    data = _load()
    return {"has_submitted": user_id in data}

@router.post("/submit")
async def submit_feedback(request: Request):
    try:
        payload = await request.json()
    except:
        raise HTTPException(400, "Invalid JSON")

    user_id    = payload.get("user_id", "unknown")
    user_email = payload.get("user_email", "unknown")
    rating     = payload.get("rating")
    usage      = payload.get("usage", [])
    improve    = payload.get("improve", "")
    comment    = payload.get("comment", "")
    submitted_at = datetime.now(timezone.utc).isoformat()

    # Check if already submitted
    data = _load()
    if user_id in data and user_id != "unknown":
        return {"success": False, "already_submitted": True}

    # Save submission
    data[user_id] = {
        "user_email": user_email,
        "rating": rating,
        "usage": usage,
        "improve": improve,
        "comment": comment,
        "submitted_at": submitted_at
    }
    _save(data)

    # Award 5 credits
    credits_awarded = False
    try:
        from credits_manager import add_credits
        add_credits(user_id, 5, reason="feedback_reward")
        credits_awarded = True
    except Exception as e:
        log.warning("Credits award failed: %s", e)

    # Send email
    rating_labels = {1: "hmm", 2: "not bad", 3: "damn"}
    rating_text = rating_labels.get(rating, str(rating))

    html = f"""
<div style="font-family:sans-serif;max-width:580px;margin:0 auto;padding:32px 24px;background:#fff">
  <h2 style="color:#7c3aed;margin:0 0 4px">User Feedback</h2>
  <p style="color:#666;font-size:13px;margin:0 0 24px">Submitted via SocioMee app · {submitted_at}</p>

  <div style="background:#f9f5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin-bottom:16px">
    <p style="margin:0 0 8px;font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:1px">User</p>
    <p style="margin:4px 0;color:#333;font-size:14px"><b>Email:</b> {user_email}</p>
    <p style="margin:4px 0;color:#333;font-size:14px"><b>User ID:</b> {user_id}</p>
  </div>

  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:12px;padding:20px;margin-bottom:16px">
    <p style="margin:0 0 8px;font-size:12px;color:#16a34a;font-weight:700;text-transform:uppercase;letter-spacing:1px">Rating</p>
    <p style="margin:0;color:#333;font-size:20px;font-weight:800">{rating_text}</p>
  </div>

  <div style="background:#fff8f0;border:1px solid #fed7aa;border-radius:12px;padding:20px;margin-bottom:16px">
    <p style="margin:0 0 8px;font-size:12px;color:#ea580c;font-weight:700;text-transform:uppercase;letter-spacing:1px">Uses SocioMee For</p>
    <p style="margin:0;color:#333;font-size:14px">{", ".join(usage) if usage else "Not answered"}</p>
  </div>

  <div style="background:#fdf4ff;border:1px solid #e879f9;border-radius:12px;padding:20px;margin-bottom:16px">
    <p style="margin:0 0 8px;font-size:12px;color:#a21caf;font-weight:700;text-transform:uppercase;letter-spacing:1px">Wants Us To Improve</p>
    <p style="margin:0;color:#333;font-size:14px">{improve or "Not answered"}</p>
  </div>

  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:16px">
    <p style="margin:0 0 8px;font-size:12px;color:#475569;font-weight:700;text-transform:uppercase;letter-spacing:1px">Additional Comment</p>
    <p style="margin:0;color:#333;font-size:14px;white-space:pre-wrap">{comment or "None"}</p>
  </div>

  <p style="color:#666;font-size:12px;margin-top:16px">Credits awarded: {"5 ✓" if credits_awarded else "failed ✗"}</p>
</div>"""

    try:
        resend.Emails.send({
            "from": FROM_EMAIL,
            "to": [TO_EMAIL],
            "subject": f"Feedback: {rating_text} — {user_email}",
            "html": html,
        })
    except Exception as e:
        log.error("Feedback email failed: %s", e)

    return {"success": True, "credits_awarded": credits_awarded, "already_submitted": False}
