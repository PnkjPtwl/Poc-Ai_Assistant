"""
Scheduler Service — APScheduler for scheduled emails
"""
from datetime import datetime, timezone
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.date import DateTrigger
from apscheduler.triggers.interval import IntervalTrigger
import os

scheduler = AsyncIOScheduler()
scheduler.start()


async def _send_scheduled_email(email_id: str, db):
    """Callback: send a scheduled email."""
    from services.email_service import send_email
    res = db.table("emails").select("*, contacts(email)").eq("id", email_id).execute()
    if not res.data:
        return
    email = res.data[0]
    to_email = email.get("contacts", {}).get("email", "") if email.get("contacts") else ""
    if not to_email:
        return

    result = await send_email(to_email, email["subject"], email["body"])
    if result["success"]:
        db.table("emails").update({
            "status": "sent",
            "sent_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", email_id).execute()


def schedule_email(email_id: str, scheduled_at: datetime, db):
    """Schedule an email to be sent at a specific time."""
    scheduler.add_job(
        _send_scheduled_email,
        trigger=DateTrigger(run_date=scheduled_at),
        args=[email_id, db],
        id=f"email_{email_id}",
        replace_existing=True,
    )


async def restore_scheduled_jobs(db):
    """On startup, restore all pending scheduled emails."""
    try:
        res = db.table("emails").select("id, scheduled_at").eq("status", "scheduled").execute()
        if res.data:
            for email in res.data:
                scheduled_at_str = email.get("scheduled_at")
                if scheduled_at_str:
                    try:
                        dt = datetime.fromisoformat(scheduled_at_str.replace("Z", "+00:00"))
                        if dt > datetime.now(timezone.utc):
                            schedule_email(email["id"], dt, db)
                    except Exception:
                        pass
            print(f"Restored {len(res.data)} scheduled email jobs")
    except Exception as e:
        print(f"Could not restore scheduled jobs: {e}")

async def _auto_sync_emails(db):
    """Background task to automatically sync emails via IMAP."""
    email_address = os.getenv("SMTP_USER")
    app_password = os.getenv("SMTP_PASSWORD")
    if not email_address or not app_password:
        return
        
    from services.imap_service import fetch_real_emails
    host = "imap.gmail.com" if "@gmail.com" in email_address else "imap-mail.outlook.com"
    fetched_emails = fetch_real_emails(email_address, app_password, host)
    
    if not fetched_emails:
        return
        
    for em in fetched_emails:
        exists = db.table("emails").select("id").eq("subject", em["subject"]).execute()
        if not exists.data:
            full_body = f"From: {em['from']}\n\n{em['body']}"
            db.table("emails").insert({
                "subject": em["subject"],
                "body": full_body,
                "status": "replied",
                "sent_at": datetime.now(timezone.utc).isoformat()
            }).execute()

def schedule_auto_sync(db):
    """Schedule the background email sync to run every 60 seconds."""
    scheduler.add_job(
        _auto_sync_emails,
        trigger=IntervalTrigger(seconds=60),
        args=[db],
        id="auto_email_sync",
        replace_existing=True,
    )
