"""Emails Router"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from main import supabase as db
from services.email_service import send_and_update, render_template
from services.scheduler_service import schedule_email

router = APIRouter()


class EmailDraft(BaseModel):
    deal_id: Optional[str] = None
    contact_id: str
    rep_id: Optional[str] = None
    subject: str
    body: str
    template_id: Optional[str] = None
    language: Optional[str] = "English"
    thread_id: Optional[str] = None


class EmailSend(BaseModel):
    email_id: str


class EmailSchedule(BaseModel):
    email_id: str
    scheduled_at: str  # ISO datetime


@router.post("/draft")
async def save_draft(body: EmailDraft):
    data = {
        "contact_id": body.contact_id,
        "subject": body.subject,
        "body": body.body,
        "status": "draft",
        "language": body.language,
    }
    if body.deal_id:
        data["deal_id"] = body.deal_id
    if body.rep_id:
        data["rep_id"] = body.rep_id
    if body.template_id:
        data["template_id"] = body.template_id
    if body.thread_id:
        data["thread_id"] = body.thread_id
    res = db.table("emails").insert(data).execute()
    return res.data[0] if res.data else {"error": "Failed to save draft"}


@router.post("/send")
async def send_email_now(body: EmailSend):
    # Fetch email + contact
    res = db.table("emails").select("*, contacts(email, name)").eq("id", body.email_id).execute()
    if not res.data:
        return {"error": "Email not found"}
    email = res.data[0]
    to_email = email.get("contacts", {}).get("email", "")
    if not to_email:
        return {"error": "Contact email not found"}

    result = await send_and_update(email["id"], to_email, email["subject"], email["body"], db)

    # Auto-complete linked tasks
    if result.get("success") and email.get("deal_id") and email.get("contact_id"):
        tasks = db.table("tasks").select("id").eq("type", "email").eq("status", "pending").eq("deal_id", email["deal_id"]).eq("contact_id", email["contact_id"]).execute()
        if tasks.data:
            for t in tasks.data:
                db.table("tasks").update({
                    "status": "completed",
                    "completed_at": datetime.now(timezone.utc).isoformat()
                }).eq("id", t["id"]).execute()

    return result


@router.post("/schedule")
async def schedule_email_endpoint(body: EmailSchedule):
    scheduled_dt = datetime.fromisoformat(body.scheduled_at.replace("Z", "+00:00"))
    db.table("emails").update({
        "status": "scheduled",
        "scheduled_at": body.scheduled_at,
    }).eq("id", body.email_id).execute()
    schedule_email(body.email_id, scheduled_dt, db)
    return {"success": True, "scheduled_at": body.scheduled_at}


@router.get("")
async def list_emails(
    deal_id: Optional[str] = None,
    contact_id: Optional[str] = None,
    rep_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
):
    query = db.table("emails").select("*, contacts(name, email)")
    if deal_id:
        query = query.eq("deal_id", deal_id)
    if contact_id:
        query = query.eq("contact_id", contact_id)
    if rep_id:
        query = query.eq("rep_id", rep_id)
    if status:
        query = query.eq("status", status)
    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    return res.data


@router.get("/threads")
async def get_email_threads(deal_id: str):
    res = db.table("emails").select("*").eq("deal_id", deal_id).order("created_at").execute()
    # Group by thread_id
    threads = {}
    for email in res.data:
        tid = email.get("thread_id") or email["id"]
        if tid not in threads:
            threads[tid] = []
        threads[tid].append(email)
    return list(threads.values())
