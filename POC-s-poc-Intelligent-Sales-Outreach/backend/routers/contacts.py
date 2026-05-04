"""Contacts Router"""
from fastapi import APIRouter, Query
from typing import Optional
from main import supabase as db

router = APIRouter()


@router.get("")
async def list_contacts(
    search: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
):
    query = db.table("contacts").select("*, companies(name, industry)")
    if search:
        query = query.or_(f"name.ilike.%{search}%,email.ilike.%{search}%")
    query = query.order("name").range(offset, offset + limit - 1)
    res = query.execute()
    return res.data


@router.get("/{contact_id}")
async def get_contact(contact_id: str):
    contact = db.table("contacts").select("*, companies(*)").eq("id", contact_id).execute()
    if not contact.data:
        return {"error": "Contact not found"}
    result = contact.data[0]

    # Deal history
    deals = db.table("deals").select("*").eq("contact_id", contact_id).order("updated_at", desc=True).execute()
    result["deals"] = deals.data

    # Email history
    emails = db.table("emails").select("*").eq("contact_id", contact_id).order("created_at", desc=True).execute()
    result["emails"] = emails.data

    # Task history
    tasks = db.table("tasks").select("*").eq("contact_id", contact_id).order("due_date", desc=True).execute()
    result["tasks"] = tasks.data

    # Call history
    calls = db.table("call_transcripts").select("*").eq("contact_id", contact_id).order("call_date", desc=True).execute()
    result["calls"] = calls.data

    return result
