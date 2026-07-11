"""
bug_routes.py — Bug Report Endpoint
Accepts text + optional image, sends to bug@sociomeeai.com via Resend
"""
import os, base64, logging, resend
from fastapi import APIRouter, Request, HTTPException

log = logging.getLogger("bug_routes")
router = APIRouter(prefix="/bug", tags=["bug"])

resend.api_key = os.getenv("RESEND_API_KEY", "")
FROM_EMAIL = "SocioMee <hello@sociomeeai.com>"
BUG_EMAIL  = "socimateai@gmail.com"

@router.post("/report")
async def report_bug(request: Request):
    try:
        payload = await request.json()
    except Exception:
        raise HTTPException(400, "Invalid JSON")

    description = payload.get("description", "").strip()
    user_email  = payload.get("user_email", "Unknown")
    user_id     = payload.get("user_id", "Unknown")
    screenshot  = payload.get("screenshot", None)  # base64 string

    if not description:
        raise HTTPException(400, "Description is required")

    attachments = []
    if screenshot:
        try:
            header, data = screenshot.split(",", 1)
            ext = "png" if "png" in header else "jpg"
            attachments.append({
                "filename": f"screenshot.{ext}",
                "content":  data,
            })
        except Exception:
            pass

    html = f"""
<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#fff">
  <h2 style="color:#7c3aed;margin:0 0 4px">Bug Report</h2>
  <p style="color:#666;font-size:13px;margin:0 0 24px">Submitted via SocioMee app</p>

  <div style="background:#f9f5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin-bottom:20px">
    <p style="margin:0 0 8px;font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:1px">Reporter</p>
    <p style="margin:4px 0;color:#333;font-size:14px"><b>Email:</b> {user_email}</p>
    <p style="margin:4px 0;color:#333;font-size:14px"><b>User ID:</b> {user_id}</p>
  </div>

  <div style="background:#fff8f0;border:1px solid #fed7aa;border-radius:12px;padding:20px">
    <p style="margin:0 0 8px;font-size:12px;color:#ea580c;font-weight:700;text-transform:uppercase;letter-spacing:1px">Description</p>
    <p style="margin:0;color:#333;font-size:14px;line-height:1.7;white-space:pre-wrap">{description}</p>
  </div>

  {"<p style='margin-top:16px;color:#666;font-size:13px'>📎 Screenshot attached.</p>" if attachments else ""}
</div>"""

    try:
        params = {
            "from":    FROM_EMAIL,
            "to":      [BUG_EMAIL],
            "subject": f"Bug Report from {user_email}",
            "html":    html,
            "reply_to": user_email if "@" in user_email else BUG_EMAIL,
        }
        if attachments:
            params["attachments"] = attachments
        resend.Emails.send(params)
        log.info("Bug report sent from %s", user_email)
        return {"success": True}
    except Exception as e:
        log.error("Bug report send failed: %s", e)
        raise HTTPException(500, "Failed to send bug report")
