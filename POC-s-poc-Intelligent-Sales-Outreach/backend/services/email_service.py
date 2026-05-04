"""
Email Service — SMTP sending via aiosmtplib
"""
import os, re
from datetime import datetime, timezone
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Sales Rep")


def render_template(template: str, variables: dict) -> str:
    """Replace {{variable}} placeholders in a template."""
    result = template
    for key, value in variables.items():
        result = result.replace(f"{{{{{key}}}}}", str(value))
    return result


async def send_email(to_email: str, subject: str, body: str,
                     smtp_host: str | None = None, smtp_port: int | None = None,
                     smtp_user: str | None = None, smtp_password: str | None = None,
                     from_name: str | None = None) -> dict:
    """Send an email via SMTP."""
    host = smtp_host or SMTP_HOST
    port = smtp_port or SMTP_PORT
    user = smtp_user or SMTP_USER
    password = smtp_password or SMTP_PASSWORD
    sender_name = from_name or SMTP_FROM_NAME

    message = MIMEMultipart("alternative")
    message["From"] = f"{sender_name} <{user}>"
    message["To"] = to_email
    message["Subject"] = subject

    # Plain text version
    message.attach(MIMEText(body, "plain"))

    # HTML version (simple wrapper)
    html_body = body.replace("\n", "<br>")
    html = f"""<html><body style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
{html_body}
</body></html>"""
    message.attach(MIMEText(html, "html"))

    try:
        await aiosmtplib.send(
            message,
            hostname=host,
            port=port,
            start_tls=True,
            username=user,
            password=password,
        )
        return {"success": True, "message": "Email sent successfully"}
    except Exception as e:
        return {"success": False, "message": str(e)}


async def send_and_update(email_id: str, to_email: str, subject: str, body: str, db) -> dict:
    """Send email via SMTP and update the DB record."""
    result = await send_email(to_email, subject, body)
    if result["success"]:
        db.table("emails").update({
            "status": "sent",
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", email_id).execute()

        # Auto-complete linked tasks
        tasks_res = db.table("tasks").select("id").eq("type", "email").eq("status", "pending").execute()
        # We could match by contact_id/deal_id, but for POC we'll handle it via the frontend
    return result


async def test_smtp_connection(smtp_host: str, smtp_port: int, smtp_user: str,
                                smtp_password: str, from_name: str) -> dict:
    """Test SMTP connection by sending a test email to the sender's own address."""
    result = await send_email(
        to_email=smtp_user,
        subject="Sales Platform — SMTP Test",
        body="This is a test email from your AI Sales Engagement Platform. If you received this, your SMTP configuration is working correctly!",
        smtp_host=smtp_host,
        smtp_port=smtp_port,
        smtp_user=smtp_user,
        smtp_password=smtp_password,
        from_name=from_name,
    )
    return result
