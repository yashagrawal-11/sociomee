"""
email_service.py — SocioMee Email Notifications via Resend
Handles: Welcome, Payment Confirmation, Low Credits Warning, Plan Expiry
"""
import os
import logging
import resend
from datetime import datetime

log = logging.getLogger("email_service")

resend.api_key = os.getenv("RESEND_API_KEY", "")

FROM_EMAIL = "SocioMee <hello@sociomeeai.com>"
SUPPORT_EMAIL = "hello@sociomeeai.com"
BRAND_PURPLE = "#7c3aed"
BRAND_ROSE   = "#ff3d8f"


def _base_template(content: str, preview_text: str = "") -> str:
    """Wrap content in SocioMee branded email shell."""
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="x-apple-disable-message-reformatting"/>
  <title>SocioMee</title>
  <style>
    body{{margin:0;padding:0;background:#0d0015;font-family:'Helvetica Neue',Arial,sans-serif;color:#ede8ff}}
    .wrapper{{background:#0d0015;padding:40px 16px}}
    .card{{background:linear-gradient(145deg,#1f0d35,#150d2a 50%,#0d0820);border-radius:20px;max-width:560px;margin:0 auto;overflow:hidden;border:1px solid rgba(167,139,250,0.2)}}
    .header{{background:linear-gradient(135deg,{BRAND_PURPLE},{BRAND_ROSE});padding:32px 36px 28px;text-align:center}}
    .logo{{font-size:28px;font-weight:900;color:#fff;letter-spacing:-1px;margin-bottom:4px}}
    .logo span{{color:rgba(255,255,255,0.7)}}
    .tagline{{font-size:12px;color:rgba(255,255,255,0.8);letter-spacing:1px;text-transform:uppercase}}
    .body{{padding:32px 36px}}
    .h1{{font-size:22px;font-weight:800;color:#ede8ff;margin:0 0 8px;line-height:1.3}}
    .p{{font-size:14px;color:#c4b5fd;line-height:1.8;margin:0 0 16px}}
    .btn{{display:inline-block;padding:13px 28px;border-radius:99px;background:linear-gradient(135deg,{BRAND_PURPLE},{BRAND_ROSE});color:#fff;font-weight:800;font-size:14px;text-decoration:none;margin:8px 0 20px}}
    .stat-row{{display:flex;gap:12px;margin:20px 0;flex-wrap:wrap}}
    .stat{{background:rgba(124,58,237,0.15);border:1px solid rgba(124,58,237,0.3);border-radius:12px;padding:14px 18px;flex:1;min-width:100px;text-align:center}}
    .stat-val{{font-size:22px;font-weight:900;color:#a78bfa;display:block}}
    .stat-lbl{{font-size:10px;color:#9d86c8;text-transform:uppercase;letter-spacing:1px;margin-top:2px;display:block}}
    .divider{{height:1px;background:linear-gradient(90deg,transparent,rgba(167,139,250,0.3),transparent);margin:24px 0}}
    .tip{{background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:12px;padding:14px 18px;font-size:13px;color:#c4b5fd;line-height:1.7;margin:16px 0}}
    .footer{{padding:20px 36px 28px;text-align:center}}
    .footer p{{font-size:11px;color:rgba(157,134,200,0.6);margin:4px 0;line-height:1.6}}
    .footer a{{color:rgba(167,139,250,0.7);text-decoration:none}}
    .success-badge{{display:inline-block;background:rgba(52,211,153,0.15);border:1px solid rgba(52,211,153,0.4);border-radius:99px;padding:6px 16px;font-size:12px;font-weight:700;color:#34d399;margin-bottom:16px}}
    .warn-badge{{display:inline-block;background:rgba(251,191,36,0.15);border:1px solid rgba(251,191,36,0.4);border-radius:99px;padding:6px 16px;font-size:12px;font-weight:700;color:#fbbf24;margin-bottom:16px}}
  </style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="logo">SocioMee<span>.</span></div>
      <div class="tagline">✦ AI Content Studio</div>
    </div>
    <div class="body">
      {content}
    </div>
    <div class="footer">
      <p>SocioMee · AI Content Studio for Indian Creators</p>
      <p><a href="https://sociomeeai.com">sociomeeai.com</a> · <a href="mailto:{SUPPORT_EMAIL}">Support</a></p>
      <p style="margin-top:8px;font-size:10px;color:rgba(157,134,200,0.4)">You're receiving this because you have a SocioMee account.</p>
    </div>
  </div>
</div>
</body>
</html>"""


# ─── Email Templates ──────────────────────────────────────────────────────────

def _welcome_html(name: str) -> str:
    first = name.split()[0] if name else "Creator"
    content = f"""
      <div class="success-badge">🎉 Welcome to SocioMee!</div>
      <h1 class="h1">Hey {first}, you're in! 🚀</h1>
      <p class="p">You've just joined India's most powerful AI content studio. Transform any topic into complete scripts, SEO packs, and hashtags for YouTube, Instagram, LinkedIn, and 5 more platforms.</p>

      <div style="margin:20px 0">
        <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:14px;padding:18px 20px;margin-bottom:10px;display:flex;align-items:center;gap:12px">
          <span style="font-size:22px">🎯</span>
          <div>
            <div style="font-size:13px;font-weight:700;color:#ede8ff">Generate your first script</div>
            <div style="font-size:12px;color:#9d86c8">Enter any topic → get a full script + SEO in seconds</div>
          </div>
        </div>
        <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:14px;padding:18px 20px;margin-bottom:10px">
          <span style="font-size:22px">📊</span>
          <div style="display:inline-block;margin-left:12px;vertical-align:top">
            <div style="font-size:13px;font-weight:700;color:#ede8ff">Connect YouTube</div>
            <div style="font-size:12px;color:#9d86c8">Auto-upload videos with AI-generated titles & descriptions</div>
          </div>
        </div>
        <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.25);border-radius:14px;padding:18px 20px">
          <span style="font-size:22px">🎪</span>
          <div style="display:inline-block;margin-left:12px;vertical-align:top">
            <div style="font-size:13px;font-weight:700;color:#ede8ff">Festival Calendar</div>
            <div style="font-size:12px;color:#9d86c8">Plan content around Indian festivals automatically</div>
          </div>
        </div>
      </div>

      <div style="text-align:center;margin:24px 0">
        <a href="https://sociomeeai.com" class="btn">✦ Start Creating Now</a>
      </div>

      <div class="tip">
        💡 <strong>Free plan tip:</strong> You have 20 credits this month. Each content generation uses 1 credit. Use them wisely — or upgrade to Pro for 200 credits/month!
      </div>
    """
    return _base_template(content)


def _payment_html(name: str, plan_label: str, credits: int, amount: int, payment_id: str) -> str:
    first = name.split()[0] if name else "Creator"
    is_topup = "topup" in plan_label.lower() or "pack" in plan_label.lower() or "credits" in plan_label.lower()
    content = f"""
      <div class="success-badge">✅ Payment Successful</div>
      <h1 class="h1">{'Credits added!' if is_topup else f'Welcome to {plan_label}!'} 🎉</h1>
      <p class="p">Hey {first}, your payment of <strong style="color:#a78bfa">₹{amount}</strong> was successful. {'Your credits have been topped up.' if is_topup else 'Your plan is now active and ready to use.'}</p>

      <div style="background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.25);border-radius:14px;padding:20px 24px;margin:20px 0">
        <div style="font-size:11px;font-weight:700;color:#34d399;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Order Summary</div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;color:#c4b5fd">Plan</span>
          <span style="font-size:13px;font-weight:700;color:#ede8ff">{plan_label}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;color:#c4b5fd">Credits</span>
          <span style="font-size:13px;font-weight:700;color:#a78bfa">+{credits} credits</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:8px">
          <span style="font-size:13px;color:#c4b5fd">Amount Paid</span>
          <span style="font-size:13px;font-weight:700;color:#34d399">₹{amount}</span>
        </div>
        <div style="height:1px;background:rgba(167,139,250,0.2);margin:12px 0"></div>
        <div style="display:flex;justify-content:space-between">
          <span style="font-size:11px;color:#9d86c8">Payment ID</span>
          <span style="font-size:11px;color:#9d86c8;font-family:monospace">{payment_id}</span>
        </div>
      </div>

      <div style="text-align:center;margin:24px 0">
        <a href="https://sociomeeai.com" class="btn">✦ Start Creating</a>
      </div>

      <div class="tip">
        🔒 Secured by Razorpay. Keep this email as your payment receipt. For any issues contact <a href="mailto:{SUPPORT_EMAIL}" style="color:#a78bfa">{SUPPORT_EMAIL}</a>
      </div>
    """
    return _base_template(content)


def _low_credits_html(name: str, credits_left: int, plan: str) -> str:
    first = name.split()[0] if name else "Creator"
    is_free = plan == "free"
    content = f"""
      <div class="warn-badge">⚠️ Low Credits Alert</div>
      <h1 class="h1">Only {credits_left} credit{'s' if credits_left != 1 else ''} left, {first}!</h1>
      <p class="p">You're running low on credits this month. Don't let your content creation slow down — top up instantly or upgrade your plan.</p>

      <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.25);border-radius:14px;padding:20px 24px;margin:20px 0;text-align:center">
        <div style="font-size:48px;font-weight:900;color:#fbbf24;line-height:1">{credits_left}</div>
        <div style="font-size:12px;color:#9d86c8;text-transform:uppercase;letter-spacing:1px;margin-top:4px">Credits Remaining</div>
      </div>

      {'<p class="p">Upgrade to <strong style="color:#a78bfa">Pro</strong> for just ₹499/month and get 200 credits every month — 10x more content!</p>' if is_free else '<p class="p">Top up instantly with our credit packs — ₹99 for 50 credits or ₹199 for 120 credits.</p>'}

      <div style="text-align:center;margin:24px 0">
        <a href="https://sociomeeai.com" class="btn">{'✦ Upgrade to Pro' if is_free else '⚡ Top Up Credits'}</a>
      </div>

      <div class="tip">
        💡 <strong>Quick top-up:</strong> ₹99 = 50 credits · ₹199 = 120 credits · Available instantly after payment.
      </div>
    """
    return _base_template(content)


def _otp_html(name: str, otp: str) -> str:
    first = name.split()[0] if name else "Creator"
    content = f"""
      <div class="warn-badge">🔐 Password Reset Requested</div>
      <h1 class="h1">Hey {first}, here's your code</h1>
      <p class="p">Use the code below to reset your SocioMee password. This code expires in <strong style="color:#fbbf24">15 minutes</strong>.</p>

      <div style="background:rgba(124,58,237,0.1);border:1px solid rgba(124,58,237,0.3);border-radius:14px;padding:24px;margin:20px 0;text-align:center">
        <div style="font-size:36px;font-weight:900;color:#a78bfa;letter-spacing:6px">{otp}</div>
      </div>

      <div class="tip">
        🔒 If you didn't request this, you can safely ignore this email — your password will not be changed. Never share this code with anyone, including anyone claiming to be SocioMee support.
      </div>
    """
    return _base_template(content)


def _verify_email_html(name: str, verify_url: str) -> str:
    first = name.split()[0] if name else "Creator"
    content = f"""
      <div class="success-badge">✦ One Last Step</div>
      <h1 class="h1">Hey {first}, verify your email</h1>
      <p class="p">Click the button below to confirm your email address and unlock full access to SocioMee.</p>

      <div style="text-align:center;margin:24px 0">
        <a href="{verify_url}" class="btn">✦ Verify My Email</a>
      </div>

      <div class="tip">
        🔒 This link expires in 24 hours. If you didn't create a SocioMee account, you can safely ignore this email.
      </div>
    """
    return _base_template(content)


def _plan_expiry_html(name: str, plan_label: str, days_left: int) -> str:
    first = name.split()[0] if name else "Creator"
    content = f"""
      <div class="warn-badge">⏰ Plan Renewing Soon</div>
      <h1 class="h1">Your {plan_label} renews in {days_left} days</h1>
      <p class="p">Hey {first}, just a heads up — your {plan_label} plan will auto-renew in <strong style="color:#fbbf24">{days_left} days</strong>. Make sure your payment method is up to date.</p>

      <div style="text-align:center;margin:24px 0">
        <a href="https://sociomeeai.com" class="btn">✦ Manage Plan</a>
      </div>

      <div class="tip">
        Questions? Reply to this email or contact <a href="mailto:{SUPPORT_EMAIL}" style="color:#a78bfa">{SUPPORT_EMAIL}</a>
      </div>
    """
    return _base_template(content)


# ─── Send Functions ───────────────────────────────────────────────────────────

def send_invoice_email(to_email: str, name: str, plan_label: str,
                       amount: int, payment_id: str, order_id: str = "") -> bool:
    """Generate GST invoice PDF and email it to the customer."""
    if not resend.api_key or not to_email:
        return False
    try:
        from invoice_generator import generate_invoice
        import base64
        pdf_bytes, invoice_no = generate_invoice(
            customer_email=to_email,
            customer_name=name,
            plan_label=plan_label,
            amount_with_gst=amount,
            payment_id=payment_id,
            order_id=order_id,
        )
        pdf_b64 = base64.b64encode(pdf_bytes).decode()
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      [to_email],
            "subject": f"Your SocioMee Invoice {invoice_no} — {plan_label}",
            "html":    f"""
<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;background:#fff">
  <div style="text-align:center;margin-bottom:24px">
    <img src="https://sociomeeai.com/s_logo.png" width="48" style="border-radius:12px"/>
    <h2 style="margin:12px 0 4px;color:#0a0a0a">Your GST Invoice</h2>
    <p style="color:#666;font-size:14px;margin:0">Invoice No: <b>{invoice_no}</b></p>
  </div>
  <p style="color:#333;font-size:15px">Hi {name or to_email.split('@')[0].title()},</p>
  <p style="color:#333;font-size:15px">Thank you for subscribing to <b>{plan_label}</b>. Please find your GST invoice attached.</p>
  <div style="background:#f9f5ff;border:1px solid #e9d5ff;border-radius:12px;padding:20px;margin:24px 0">
    <p style="margin:0 0 8px;color:#7c3aed;font-weight:700">Invoice Summary</p>
    <p style="margin:4px 0;color:#333;font-size:14px">Plan: {plan_label}</p>
    <p style="margin:4px 0;color:#333;font-size:14px">Amount Paid: ₹{amount}</p>
    <p style="margin:4px 0;color:#333;font-size:14px">Payment ID: {payment_id}</p>
    <p style="margin:4px 0;color:#333;font-size:14px">GSTIN: 27IPNPP2774C1ZF</p>
  </div>
  <p style="color:#666;font-size:13px">For support, reply to this email or visit <a href="https://sociomeeai.com/help" style="color:#7c3aed">sociomeeai.com/help</a></p>
  <p style="color:#999;font-size:11px;margin-top:32px;border-top:1px solid #eee;padding-top:16px">Mee Group | GSTIN: 27IPNPP2774C1ZF | Kalyan, Maharashtra</p>
</div>""",
            "attachments": [{
                "filename": f"SocioMee_Invoice_{invoice_no.replace('/','_')}.pdf",
                "content":  pdf_b64,
            }],
        })
        log.info("Invoice %s sent to %s", invoice_no, to_email)
        return True
    except Exception as e:
        log.error("send_invoice_email failed: %s", e)
        return False

def send_welcome_email(to_email: str, name: str) -> bool:
    """Send welcome email after signup."""
    if not resend.api_key or not to_email:
        log.warning("send_welcome_email: missing API key or email")
        return False
    try:
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      [to_email],
            "subject": "Welcome to SocioMee — Your AI Content Studio is Ready! 🚀",
            "html":    _welcome_html(name),
        })
        log.info("Welcome email sent to %s", to_email)
        return True
    except Exception as e:
        log.error("send_welcome_email failed: %s", e)
        return False


def send_payment_confirmation(to_email: str, name: str, plan_label: str,
                               credits: int, amount: int, payment_id: str) -> bool:
    """Send payment confirmation after successful Razorpay payment."""
    if not resend.api_key or not to_email:
        return False
    try:
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      [to_email],
            "subject": f"Payment Confirmed — {plan_label} Activated ✅",
            "html":    _payment_html(name, plan_label, credits, amount, payment_id),
        })
        log.info("Payment confirmation sent to %s for %s", to_email, plan_label)
        return True
    except Exception as e:
        log.error("send_payment_confirmation failed: %s", e)
        return False


def send_low_credits_warning(to_email: str, name: str, credits_left: int, plan: str) -> bool:
    """Send low credits warning when user has 3 or fewer credits left."""
    if not resend.api_key or not to_email:
        return False
    try:
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      [to_email],
            "subject": f"⚠️ Only {credits_left} credits left — Top up now!",
            "html":    _low_credits_html(name, credits_left, plan),
        })
        log.info("Low credits warning sent to %s (%d left)", to_email, credits_left)
        return True
    except Exception as e:
        log.error("send_low_credits_warning failed: %s", e)
        return False


def send_otp_email(to_email: str, name: str, otp: str) -> bool:
    """Send password reset OTP. Returns True only if the email genuinely sent —
    callers must treat a False return as a real failure, not a silent success."""
    if not resend.api_key or not to_email:
        log.warning("send_otp_email: missing API key or email")
        return False
    try:
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      [to_email],
            "subject": "Your SocioMee password reset code",
            "html":    _otp_html(name, otp),
        })
        log.info("OTP email sent to %s", to_email)
        return True
    except Exception as e:
        log.error("send_otp_email failed: %s", e)
        return False


def send_verification_email(to_email: str, name: str, verify_url: str) -> bool:
    """Send email verification link after signup."""
    if not resend.api_key or not to_email:
        log.warning("send_verification_email: missing API key or email")
        return False
    try:
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      [to_email],
            "subject": "Verify your email — SocioMee",
            "html":    _verify_email_html(name, verify_url),
        })
        log.info("Verification email sent to %s", to_email)
        return True
    except Exception as e:
        log.error("send_verification_email failed: %s", e)
        return False


def send_plan_expiry_reminder(to_email: str, name: str, plan_label: str, days_left: int) -> bool:
    """Send plan expiry reminder."""
    if not resend.api_key or not to_email:
        return False
    try:
        resend.Emails.send({
            "from":    FROM_EMAIL,
            "to":      [to_email],
            "subject": f"Your {plan_label} renews in {days_left} days",
            "html":    _plan_expiry_html(name, plan_label, days_left),
        })
        log.info("Plan expiry reminder sent to %s", to_email)
        return True
    except Exception as e:
        log.error("send_plan_expiry_reminder failed: %s", e)
        return False
