"""Flows Router"""
from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta
from main import supabase as db

router = APIRouter()


class EnrollRequest(BaseModel):
    contact_id: str
    deal_id: Optional[str] = None
    rep_id: Optional[str] = None


# ── Static / prefix routes MUST come before /{flow_id} ──────────────────────

@router.get("")
async def list_flows(play_id: Optional[str] = None, status: Optional[str] = None):
    query = db.table("flows").select("*, plays(name, type), flow_steps(id)")
    if play_id:
        query = query.eq("play_id", play_id)
    if status:
        query = query.eq("status", status)
    res = query.execute()
    for flow in res.data:
        enroll_res = db.table("flow_enrollments").select("id", count="exact").eq("flow_id", flow["id"]).execute()
        flow["enrollment_count"] = enroll_res.count if enroll_res.count else 0
        flow["step_count"] = len(flow.get("flow_steps", []))
    return res.data


@router.get("/deal-enrollments/{deal_id}")
async def get_deal_enrollments(deal_id: str):
    """Get all flow enrollments for a specific deal, with flow + step details."""
    res = db.table("flow_enrollments").select(
        "*, flows(id, name, description, status, flow_steps(*))"
    ).eq("deal_id", deal_id).order("enrolled_at", desc=True).execute()

    enrollments = res.data or []
    for e in enrollments:
        flow = e.get("flows") or {}
        steps = sorted(flow.get("flow_steps", []), key=lambda s: s.get("step_number", 0))
        current = e.get("current_step", 1)
        current_step_data = next((s for s in steps if s.get("step_number") == current), None)
        e["current_step_detail"] = current_step_data
        e["total_steps"] = len(steps)
        e["steps"] = steps
    return enrollments


@router.patch("/enrollments/{enrollment_id}/advance")
async def advance_enrollment(enrollment_id: str):
    enrollment = db.table("flow_enrollments").select("*, flows(id)").eq("id", enrollment_id).execute()
    if not enrollment.data:
        return {"error": "Enrollment not found"}
    e = enrollment.data[0]
    flow_id = e.get("flows", {}).get("id") or e.get("flow_id")
    steps = db.table("flow_steps").select("id", count="exact").eq("flow_id", flow_id).execute()
    total = steps.count if steps.count else 0
    next_step = e.get("current_step", 1) + 1
    if next_step > total:
        res = db.table("flow_enrollments").update({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", enrollment_id).execute()
    else:
        res = db.table("flow_enrollments").update({"current_step": next_step}).eq("id", enrollment_id).execute()
    return res.data[0] if res.data else {"error": "Failed to advance"}


@router.patch("/enrollments/{enrollment_id}/exit")
async def exit_enrollment(enrollment_id: str):
    res = db.table("flow_enrollments").update({"status": "exited"}).eq("id", enrollment_id).execute()
    return res.data[0] if res.data else {"error": "Failed to exit"}


@router.post("/enrollments/{enrollment_id}/execute")
async def execute_step(enrollment_id: str):
    """
    Execute the current step of an enrollment.
    - email    → AI-drafts an email and saves to emails table as draft
    - call     → logs a completed call task
    - whatsapp → generates a WhatsApp message + wa.me link
    - task     → marks a review task completed
    Then advances the enrollment to the next step.
    """
    enroll_res = db.table("flow_enrollments").select(
        "*, flows(id, name, play_id), contacts(id, name, email, preferred_language)"
    ).eq("id", enrollment_id).execute()
    if not enroll_res.data:
        return {"error": "Enrollment not found"}
    e = enroll_res.data[0]

    flow_id = (e.get("flows") or {}).get("id") or e.get("flow_id")
    deal_id = e.get("deal_id")
    contact_id = e.get("contact_id")
    rep_id = e.get("rep_id")
    contact = e.get("contacts") or {}
    current_step_num = e.get("current_step", 1)

    step_res = db.table("flow_steps").select("*").eq("flow_id", flow_id).eq("step_number", current_step_num).execute()
    if not step_res.data:
        return {"error": "Step not found"}
    step = step_res.data[0]
    channel = step.get("channel", "task")
    action: dict = {"step": current_step_num, "channel": channel, "action": None, "simulated": True}

    if channel == "email":
        try:
            from services.groq_service import draft_email
            from services.email_service import send_email
            ai_result = await draft_email(
                contact_id=contact_id or "",
                deal_id=deal_id,
                intent=step.get("action_description") or "follow-up",
                language=contact.get("preferred_language") or "English",
                transcript_id=None, template_id=None, rep_id=rep_id, db=db,
            )
            subject = ai_result.get("subject") or step.get("subject_template") or "Following up"
            body = ai_result.get("body") or step.get("body_template") or ""

            # Get contact email address
            contact_res = db.table("contacts").select("email, name").eq("id", contact_id).execute()
            to_email = contact_res.data[0].get("email", "") if contact_res.data else ""

            # Send via SMTP
            send_result = {"success": False, "message": "No contact email found"}
            if to_email:
                send_result = await send_email(to_email=to_email, subject=subject, body=body)

            # Always set action fields before the DB save (so popup works even if save fails)
            action["action"] = "email_sent" if send_result.get("success") else "email_drafted"
            action["subject"] = subject
            action["body"] = body
            action["sent"] = send_result.get("success", False)
            action["to_email"] = to_email
            if not send_result.get("success"):
                action["send_error"] = send_result.get("message", "SMTP failed")

            # Save to emails table (best-effort — don't let this crash the response)
            try:
                email_status = "sent" if send_result.get("success") else "draft"
                insert_data = {
                    "deal_id": deal_id, "contact_id": contact_id, "rep_id": rep_id,
                    "subject": subject, "body": body,
                    "status": email_status,
                    "language": ai_result.get("language", "English"),
                }
                if send_result.get("success"):
                    insert_data["sent_at"] = datetime.now(timezone.utc).isoformat()
                saved = db.table("emails").insert(insert_data).execute()
                action["email_id"] = saved.data[0]["id"] if saved.data else None
            except Exception as db_err:
                action["db_warning"] = str(db_err)

        except Exception as ex:
            action["action"] = "email_draft_failed"
            action["error"] = str(ex)
            action["subject"] = step.get("subject_template") or "Follow-up email"
            action["body"] = step.get("body_template") or ""

    elif channel == "call":
        task = db.table("tasks").insert({
            "rep_id": rep_id, "contact_id": contact_id, "deal_id": deal_id,
            "flow_enrollment_id": enrollment_id, "type": "call",
            "title": step.get("action_description") or f"Call {contact.get('name', 'contact')}",
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(), "priority": "normal",
        }).execute()
        action["action"] = "call_logged"
        action["task_id"] = task.data[0]["id"] if task.data else None

    elif channel == "whatsapp":
        try:
            from services.groq_service import generate_whatsapp_message
            result = await generate_whatsapp_message(
                contact_id=contact_id or "", deal_id=deal_id,
                intent=step.get("action_description") or "check-in", db=db,
            )
            action["action"] = "whatsapp_generated"
            action["message"] = result.get("message", "")
            action["whatsapp_url"] = result.get("whatsapp_url", "")
        except Exception as ex:
            action["action"] = "whatsapp_failed"
            action["error"] = str(ex)

    else:  # task / review
        task = db.table("tasks").insert({
            "rep_id": rep_id, "contact_id": contact_id, "deal_id": deal_id,
            "flow_enrollment_id": enrollment_id, "type": "review",
            "title": step.get("action_description") or f"Review step {current_step_num}",
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(), "priority": "normal",
        }).execute()
        action["action"] = "task_completed"
        action["task_id"] = task.data[0]["id"] if task.data else None

    # Advance enrollment
    steps_count = db.table("flow_steps").select("id", count="exact").eq("flow_id", flow_id).execute()
    total = steps_count.count or 0
    next_step = current_step_num + 1
    if next_step > total:
        db.table("flow_enrollments").update({
            "status": "completed",
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }).eq("id", enrollment_id).execute()
        action["enrollment_status"] = "completed"
    else:
        db.table("flow_enrollments").update({
            "current_step": next_step,
            "next_action_at": (datetime.now(timezone.utc) + timedelta(days=step.get("delay_days", 1))).isoformat(),
        }).eq("id", enrollment_id).execute()
        action["enrollment_status"] = "active"
        action["next_step"] = next_step

    return action


# ── Parameterized routes last ────────────────────────────────────────────────

@router.get("/{flow_id}")
async def get_flow(flow_id: str):
    flow = db.table("flows").select("*, plays(name, type, description)").eq("id", flow_id).execute()
    if not flow.data:
        return {"error": "Flow not found"}
    steps = db.table("flow_steps").select("*").eq("flow_id", flow_id).order("step_number").execute()
    result = flow.data[0]
    result["steps"] = steps.data
    return result


@router.post("/{flow_id}/enroll")
async def enroll_in_flow(flow_id: str, body: EnrollRequest):
    steps = db.table("flow_steps").select("*").eq("flow_id", flow_id).order("step_number").execute()
    enrollment = db.table("flow_enrollments").insert({
        "flow_id": flow_id,
        "contact_id": body.contact_id,
        "deal_id": body.deal_id,
        "rep_id": body.rep_id,
        "current_step": 1,
        "status": "active",
        "next_action_at": datetime.now(timezone.utc).isoformat(),
    }).execute()
    enrollment_id = enrollment.data[0]["id"] if enrollment.data else None

    if steps.data and enrollment_id:
        for step in steps.data:
            due_date = (datetime.now(timezone.utc) + timedelta(days=step.get("delay_days", 0))).strftime("%Y-%m-%d")
            task_type = step.get("channel", "email")
            if task_type == "task":
                task_type = "review"
            db.table("tasks").insert({
                "rep_id": body.rep_id,
                "contact_id": body.contact_id,
                "deal_id": body.deal_id,
                "flow_enrollment_id": enrollment_id,
                "type": task_type,
                "title": step.get("action_description") or step.get("subject_template") or f"Flow step {step['step_number']}",
                "description": step.get("body_template") or "",
                "due_date": due_date,
                "priority": "normal",
            }).execute()

    return enrollment.data[0] if enrollment.data else {"error": "Failed to enroll"}


@router.get("/{flow_id}/enrollments")
async def list_enrollments(flow_id: str):
    res = db.table("flow_enrollments").select(
        "*, contacts(name, email, companies(name)), deals(title, stage, amount)"
    ).eq("flow_id", flow_id).order("enrolled_at", desc=True).execute()
    return res.data
