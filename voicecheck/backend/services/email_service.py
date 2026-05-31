"""
Transactional email via Resend.

All sends are fire-and-forget — failures are logged but never raise so
they can't break the main request path.
"""

import resend
from config import settings
from utils.logger import get_logger

logger = get_logger(__name__)


def _send(to: str, subject: str, html: str) -> None:
    if not settings.RESEND_API_KEY:
        logger.debug("email_skipped_no_api_key", to=to, subject=subject)
        return
    if not to:
        logger.debug("email_skipped_no_recipient", subject=subject)
        return

    resend.api_key = settings.RESEND_API_KEY
    try:
        resend.Emails.send({
            "from": settings.FROM_EMAIL,
            "to": [to],
            "subject": subject,
            "html": html,
        })
        logger.info("email_sent", to=to, subject=subject)
    except Exception as e:
        logger.warning("email_send_failed", to=to, subject=subject, error=str(e))


def send_welcome(to: str) -> None:
    _send(
        to=to,
        subject="Welcome to SoundProof 🎙️",
        html="""
<p>Hey there,</p>
<p>Welcome to <strong>SoundProof</strong> — your AI-powered voiceover accuracy tool.</p>
<p>You're on the <strong>Free Trial</strong> plan with 30 minutes of transcription included.
When you're ready for more, you can upgrade any time from your
<a href="https://voice-profile-two.vercel.app/account">Billing page</a>.</p>
<p>Happy recording!</p>
<p>— The SoundProof team</p>
""",
    )


def send_subscription_confirmed(to: str, plan: str) -> None:
    plan_label = plan.capitalize()
    _send(
        to=to,
        subject=f"Your SoundProof {plan_label} subscription is active",
        html=f"""
<p>Hi,</p>
<p>Your <strong>SoundProof {plan_label}</strong> subscription is now active. 🎉</p>
<p>You can manage your plan or download invoices from the
<a href="https://voice-profile-two.vercel.app/account">Billing page</a>.</p>
<p>— The SoundProof team</p>
""",
    )


def send_subscription_cancelled(to: str) -> None:
    _send(
        to=to,
        subject="Your SoundProof subscription has been cancelled",
        html="""
<p>Hi,</p>
<p>Your SoundProof subscription has been cancelled. You'll keep access until the end of
the current billing period.</p>
<p>If this was a mistake or you'd like to resubscribe, visit your
<a href="https://voice-profile-two.vercel.app/account">Billing page</a>.</p>
<p>— The SoundProof team</p>
""",
    )


def send_admin_reply(to: str, subject: str, reply_text: str) -> None:
    import html as _html
    safe_reply = _html.escape(reply_text).replace('\n', '<br>')
    safe_subject = _html.escape(subject or 'your message')
    _send(
        to=to,
        subject=f"Re: {safe_subject} — SoundProof support",
        html=f"""
<p>Hi,</p>
<p>Our team has replied to your message about <strong>{safe_subject}</strong>:</p>
<blockquote style="border-left:3px solid #3b82f6;padding-left:14px;color:#374151;margin:16px 0;font-style:italic;">
{safe_reply}
</blockquote>
<p>If you have further questions, visit our
<a href="https://voice-profile-two.vercel.app/contact">contact page</a>.</p>
<p>— The SoundProof team</p>
""",
    )


def send_subscription_request_to_admin(
    admin_email: str, user_email: str, user_id: str, plan: str
) -> None:
    import html as _html
    safe_email = _html.escape(user_email)
    safe_plan = _html.escape(plan.capitalize())
    _send(
        to=admin_email,
        subject=f"[SoundProof] New subscription request — {safe_plan}",
        html=f"""
<p>A user has requested a <strong>{safe_plan}</strong> subscription.</p>
<table style="border-collapse:collapse;margin:16px 0">
  <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Email</td><td style="font-size:14px"><strong>{safe_email}</strong></td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">Plan</td><td style="font-size:14px">{safe_plan}</td></tr>
  <tr><td style="padding:4px 12px 4px 0;color:#6b7280;font-size:14px">User ID</td><td style="font-size:14px;font-family:monospace">{_html.escape(user_id)}</td></tr>
</table>
<p>
  <strong>Next steps:</strong><br>
  1. Generate a Payoneer invoice for this user<br>
  2. Go to the <a href="https://voice-profile-two.vercel.app/admin/users">Admin → Users panel</a>,
     find this user, and click <strong>Send Payment Link</strong> to email them the invoice URL<br>
  3. Once they confirm payment, click <strong>Activate</strong> to enable their subscription
</p>
<p>— SoundProof admin notifications</p>
""",
    )


def send_payment_link(to: str, plan: str, payment_link: str) -> None:
    import html as _html
    safe_plan = _html.escape(plan.capitalize())
    safe_link = _html.escape(payment_link)
    _send(
        to=to,
        subject=f"Your SoundProof {safe_plan} payment link",
        html=f"""
<p>Hi,</p>
<p>Thank you for requesting a <strong>SoundProof {safe_plan}</strong> subscription!</p>
<p>Please complete your payment using the link below:</p>
<p style="margin:20px 0">
  <a href="{safe_link}"
     style="background:#3b82f6;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">
    Pay now →
  </a>
</p>
<p style="font-size:13px;color:#6b7280">Or copy this link: <code>{safe_link}</code></p>
<p>Once your payment is confirmed, your {safe_plan} plan will be activated within a few hours.
You'll receive a confirmation email when it's live.</p>
<p>— The SoundProof team</p>
""",
    )


def send_payment_failed(to: str) -> None:
    _send(
        to=to,
        subject="Action required: SoundProof payment failed",
        html="""
<p>Hi,</p>
<p>We couldn't process your latest SoundProof payment. Please update your payment
method to avoid losing access.</p>
<p><a href="https://voice-profile-two.vercel.app/account">Update payment method →</a></p>
<p>— The SoundProof team</p>
""",
    )
