"""Tasks Router"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, date
from main import supabase as db

router = APIRouter()


class TaskUpdate(BaseModel):
    status: Optional[str] = None
    snoozed_until: Optional[str] = None


class BulkAction(BaseModel):
    task_ids: list[str]
    action: str  # "complete" | "dismiss" | "snooze"
    snoozed_until: Optional[str] = None


@router.get("")
async def list_tasks(
    rep_id: Optional[str] = None,
    status: Optional[str] = None,
    due_date: Optional[str] = None,
    type: Optional[str] = None,
    limit: int = Query(50, le=100),
    offset: int = 0,
):
    query = db.table("tasks").select("*, contacts(name, email, company_id, companies(name)), deals(title, stage, amount, close_date)")
    if rep_id:
        query = query.eq("rep_id", rep_id)
    if status:
        query = query.eq("status", status)
    if due_date:
        query = query.lte("due_date", due_date)
    if type:
        query = query.eq("type", type)
    query = query.order("priority").order("due_date").range(offset, offset + limit - 1)
    res = query.execute()
    return res.data


@router.patch("/{task_id}")
async def update_task(task_id: str, body: TaskUpdate):
    update = {}
    if body.status:
        update["status"] = body.status
        if body.status == "completed":
            update["completed_at"] = datetime.now(timezone.utc).isoformat()
    if body.snoozed_until:
        update["snoozed_until"] = body.snoozed_until
        update["status"] = "snoozed"
    res = db.table("tasks").update(update).eq("id", task_id).execute()
    return res.data[0] if res.data else {"error": "Not found"}


@router.post("/bulk")
async def bulk_action(body: BulkAction):
    results = []
    for task_id in body.task_ids:
        update = {}
        if body.action == "complete":
            update = {"status": "completed", "completed_at": datetime.now(timezone.utc).isoformat()}
        elif body.action == "dismiss":
            update = {"status": "dismissed"}
        elif body.action == "snooze":
            update = {"status": "snoozed", "snoozed_until": body.snoozed_until or str(date.today())}
        res = db.table("tasks").update(update).eq("id", task_id).execute()
        results.append(res.data[0] if res.data else None)
    return {"updated": len([r for r in results if r])}


@router.get("/summary")
async def task_summary(rep_id: Optional[str] = None):
    query = db.table("tasks").select("type, priority, status")
    if rep_id:
        query = query.eq("rep_id", rep_id)
    res = query.execute()
    tasks = res.data

    summary = {
        "total": len(tasks),
        "by_type": {},
        "by_priority": {},
        "by_status": {},
    }
    for t in tasks:
        tp = t.get("type", "unknown")
        pr = t.get("priority", "normal")
        st = t.get("status", "pending")
        summary["by_type"][tp] = summary["by_type"].get(tp, 0) + 1
        summary["by_priority"][pr] = summary["by_priority"].get(pr, 0) + 1
        summary["by_status"][st] = summary["by_status"].get(st, 0) + 1
    return summary
