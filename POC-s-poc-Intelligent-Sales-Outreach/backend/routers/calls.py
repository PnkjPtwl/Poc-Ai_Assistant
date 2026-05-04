"""Calls Router"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from main import supabase as db

router = APIRouter()


class NewCall(BaseModel):
    contact_id: str
    deal_id: Optional[str] = None
    rep_id: Optional[str] = None
    transcript: str
    duration_seconds: int = 0
    language_detected: str = "English"


@router.get("")
async def list_calls(
    contact_id: Optional[str] = None,
    deal_id: Optional[str] = None,
    limit: int = Query(20, le=50),
    offset: int = 0,
):
    query = db.table("call_transcripts").select("*, contacts(name, email), deals(title, stage)")
    if contact_id:
        query = query.eq("contact_id", contact_id)
    if deal_id:
        query = query.eq("deal_id", deal_id)
    query = query.order("call_date", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    return res.data


@router.get("/{call_id}")
async def get_call(call_id: str):
    res = db.table("call_transcripts").select("*, contacts(name, email, title, companies(name)), deals(title, stage, amount)").eq("id", call_id).execute()
    if not res.data:
        return {"error": "Call not found"}
    return res.data[0]


@router.post("")
async def create_call(body: NewCall):
    data = {
        "contact_id": body.contact_id,
        "transcript": body.transcript,
        "duration_seconds": body.duration_seconds,
        "language_detected": body.language_detected,
        "call_date": datetime.now(timezone.utc).isoformat(),
    }
    if body.deal_id:
        data["deal_id"] = body.deal_id
    if body.rep_id:
        data["rep_id"] = body.rep_id
    res = db.table("call_transcripts").insert(data).execute()

    # Auto-create follow-up email task
    if res.data and body.rep_id:
        contact = db.table("contacts").select("name").eq("id", body.contact_id).execute()
        contact_name = contact.data[0].get("name", "Contact") if contact.data else "Contact"
        db.table("tasks").insert({
            "rep_id": body.rep_id,
            "contact_id": body.contact_id,
            "deal_id": body.deal_id,
            "type": "email",
            "title": f"Follow-up email after call with {contact_name}",
            "description": "Send a follow-up email summarizing the key points discussed.",
            "priority": "high",
        }).execute()

    return res.data[0] if res.data else {"error": "Failed to create"}


@router.patch("/{call_id}/summarize")
async def summarize_call(call_id: str):
    from services.groq_service import summarize_transcript
    result = await summarize_transcript(call_id, db)
    return result
