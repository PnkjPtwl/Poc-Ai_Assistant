"""Plays Router"""
from fastapi import APIRouter
from typing import Optional
from main import supabase as db

router = APIRouter()


@router.get("")
async def list_plays():
    res = db.table("plays").select("*").order("name").execute()
    for play in res.data:
        flows = db.table("flows").select("id").eq("play_id", play["id"]).execute()
        play["flow_count"] = len(flows.data) if flows.data else 0
        guidelines = db.table("play_guidelines").select("id").eq("play_id", play["id"]).execute()
        play["guideline_count"] = len(guidelines.data) if guidelines.data else 0
    return res.data


@router.get("/{play_id}")
async def get_play(play_id: str):
    play = db.table("plays").select("*").eq("id", play_id).execute()
    if not play.data:
        return {"error": "Play not found"}
    result = play.data[0]
    flows = db.table("flows").select("*, flow_steps(id)").eq("play_id", play_id).execute()
    result["flows"] = flows.data
    guidelines = db.table("play_guidelines").select("*").eq("play_id", play_id).order("deal_stage").execute()
    grouped = {}
    for g in guidelines.data:
        stage = g.get("deal_stage", "General")
        if stage not in grouped:
            grouped[stage] = []
        grouped[stage].append(g)
    result["guidelines"] = grouped
    return result


@router.get("/{play_id}/guidelines")
async def get_play_guidelines(play_id: str, stage: Optional[str] = None):
    query = db.table("play_guidelines").select("*").eq("play_id", play_id)
    if stage:
        query = query.eq("deal_stage", stage)
    res = query.order("deal_stage").execute()
    grouped = {}
    for g in res.data:
        s = g.get("deal_stage", "General")
        if s not in grouped:
            grouped[s] = []
        grouped[s].append(g)
    return grouped
