"""Forecast Router"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from main import supabase as db

router = APIRouter()


class ForecastCategoryUpdate(BaseModel):
    forecast_category: str
    rep_override_amount: Optional[float] = None


@router.get("")
async def get_forecast(
    rep_id: Optional[str] = None,
    period: Optional[str] = None,
    year: Optional[int] = None,
):
    query = db.table("deals").select("*, contacts(name), companies(name)")
    if rep_id:
        query = query.eq("rep_id", rep_id)
    query = query.not_.in_("stage", ["Closed Lost"])
    res = query.order("amount", desc=True).execute()

    deals = res.data
    # Group by forecast category
    grouped = {"Commit": [], "Best Case": [], "Pipeline": [], "Omit": []}
    totals = {"Commit": 0, "Best Case": 0, "Pipeline": 0, "Omit": 0}

    for d in deals:
        cat = d.get("forecast_category", "Pipeline")
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(d)
        totals[cat] = totals.get(cat, 0) + (d.get("amount") or 0)

    return {"deals": deals, "grouped": grouped, "totals": totals}


@router.patch("/deals/{deal_id}/category")
async def update_forecast_category(deal_id: str, body: ForecastCategoryUpdate):
    update = {
        "forecast_category": body.forecast_category,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    res = db.table("deals").update(update).eq("id", deal_id).execute()

    # Update or create forecast entry
    if body.rep_override_amount is not None:
        existing = db.table("forecast_entries").select("id").eq("deal_id", deal_id).execute()
        if existing.data:
            db.table("forecast_entries").update({
                "forecast_category": body.forecast_category,
                "rep_override_amount": body.rep_override_amount,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("deal_id", deal_id).execute()
        else:
            deal = db.table("deals").select("rep_id").eq("id", deal_id).execute()
            rep_id = deal.data[0].get("rep_id") if deal.data else None
            db.table("forecast_entries").insert({
                "deal_id": deal_id,
                "rep_id": rep_id,
                "forecast_category": body.forecast_category,
                "rep_override_amount": body.rep_override_amount,
            }).execute()

    return res.data[0] if res.data else {"error": "Not found"}


@router.get("/summary")
async def forecast_summary(period: Optional[str] = None):
    reps = db.table("reps").select("*").execute()
    result = []
    for rep in reps.data:
        deals = db.table("deals").select("amount, forecast_category").eq("rep_id", rep["id"]).not_.in_("stage", ["Closed Lost"]).execute()
        totals = {"Commit": 0, "Best Case": 0, "Pipeline": 0, "Omit": 0}
        for d in deals.data:
            cat = d.get("forecast_category", "Pipeline")
            totals[cat] = totals.get(cat, 0) + (d.get("amount") or 0)
        result.append({
            "rep": rep,
            "totals": totals,
            "quota": rep.get("quota", 0),
            "attainment": round((totals["Commit"] / rep.get("quota", 1)) * 100, 1) if rep.get("quota") else 0,
        })
    return result
