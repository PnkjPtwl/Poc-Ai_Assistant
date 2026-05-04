"""Deals Router"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from main import supabase as db

router = APIRouter()


class DealUpdate(BaseModel):
    stage: Optional[str] = None
    forecast_category: Optional[str] = None
    amount: Optional[float] = None
    probability: Optional[int] = None
    next_step: Optional[str] = None
    notes: Optional[str] = None
    close_date: Optional[str] = None


@router.get("")
async def list_deals(
    rep_id: Optional[str] = None,
    stage: Optional[str] = None,
    forecast_category: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
):
    query = db.table("deals").select("*, contacts(name, email, title), companies(name, industry)")
    if rep_id:
        query = query.eq("rep_id", rep_id)
    if stage:
        query = query.eq("stage", stage)
    if forecast_category:
        query = query.eq("forecast_category", forecast_category)
    query = query.order("updated_at", desc=True).range(offset, offset + limit - 1)
    res = query.execute()
    return res.data


@router.get("/{deal_id}")
async def get_deal(deal_id: str):
    deal = db.table("deals").select("*, contacts(*, companies(*)), companies(*)").eq("id", deal_id).execute()
    if not deal.data:
        return {"error": "Deal not found"}
    result = deal.data[0]

    # Timeline: emails + tasks + calls
    emails = db.table("emails").select("id, subject, status, sent_at, created_at").eq("deal_id", deal_id).order("created_at", desc=True).execute()
    tasks = db.table("tasks").select("id, title, type, status, due_date, completed_at").eq("deal_id", deal_id).order("created_at", desc=True).execute()
    calls = db.table("call_transcripts").select("id, summary, sentiment, call_date, duration_seconds").eq("deal_id", deal_id).order("call_date", desc=True).execute()

    timeline = []
    for e in (emails.data or []):
        timeline.append({"type": "email", "date": e.get("sent_at") or e.get("created_at"), **e})
    for t in (tasks.data or []):
        timeline.append({"type": "task", "date": t.get("completed_at") or t.get("due_date"), **t})
    for c in (calls.data or []):
        timeline.append({"type": "call", "date": c.get("call_date"), **c})
    timeline.sort(key=lambda x: x.get("date") or "", reverse=True)

    result["timeline"] = timeline
    return result


@router.patch("/{deal_id}")
async def update_deal(deal_id: str, body: DealUpdate):
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = db.table("deals").update(update).eq("id", deal_id).execute()
    return res.data[0] if res.data else {"error": "Not found"}
