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
