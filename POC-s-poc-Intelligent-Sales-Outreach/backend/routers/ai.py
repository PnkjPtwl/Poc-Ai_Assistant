"""AI Router — Groq-powered endpoints"""
from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from main import supabase as db
from services.groq_service import (
    draft_email, translate_email, generate_guidelines,
    generate_whatsapp_message, summarize_transcript,
    generate_executive_briefing, score_email, get_deal_temperature,
    optimize_email, analyze_raw_thread, assistant_chat
)
from services.imap_service import fetch_real_emails
from datetime import datetime

router = APIRouter()


class DraftEmailRequest(BaseModel):
    contact_id: str
    deal_id: Optional[str] = None
    intent: str = "follow-up"
    language: Optional[str] = None
    transcript_id: Optional[str] = None
    template_id: Optional[str] = None
    rep_id: Optional[str] = None


class TranslateRequest(BaseModel):
    subject: str
    body: str
    target_language: str


class GuidelinesRequest(BaseModel):
    play_id: str
    deal_stage: str
    context: Optional[str] = ""


class WhatsAppRequest(BaseModel):
    contact_id: str
    deal_id: Optional[str] = None
    intent: str = "check-in"


class SummarizeRequest(BaseModel):
    transcript_id: str

class ExecutiveBriefingRequest(BaseModel):
    deal_id: str

class ScoreEmailRequest(BaseModel):
    subject: str = ""
    body: str = ""

class DealTemperatureRequest(BaseModel):
    deal_id: str

class OptimizeEmailRequest(BaseModel):
    subject: str
    body: str
    target_tone: str

class AnalyzeRawThreadRequest(BaseModel):
    thread_text: str

class AssistantChatRequest(BaseModel):
    message: str
    history: Optional[list] = []

class ConnectEmailRequest(BaseModel):
    email: str
    app_password: str

@router.post("/draft-email")
async def ai_draft_email(body: DraftEmailRequest):
    result = await draft_email(
        contact_id=body.contact_id,
        deal_id=body.deal_id,
        intent=body.intent,
        language=body.language,
        transcript_id=body.transcript_id,
        template_id=body.template_id,
        rep_id=body.rep_id,
        db=db,
    )
    return result


@router.post("/translate-email")
async def ai_translate_email(body: TranslateRequest):
    result = await translate_email(body.subject, body.body, body.target_language)
    return result


@router.post("/generate-guidelines")
async def ai_generate_guidelines(body: GuidelinesRequest):
    result = await generate_guidelines(body.play_id, body.deal_stage, body.context, db)
    return {"guidelines": result}


@router.post("/whatsapp-message")
async def ai_whatsapp_message(body: WhatsAppRequest):
    result = await generate_whatsapp_message(body.contact_id, body.deal_id, body.intent, db)
    return result


@router.post("/summarize-transcript")
async def ai_summarize_transcript(body: SummarizeRequest):
    result = await summarize_transcript(body.transcript_id, db)
    return result


@router.post("/executive-briefing")
async def ai_executive_briefing(body: ExecutiveBriefingRequest):
    result = await generate_executive_briefing(body.deal_id, db)
    return result


@router.post("/score-email")
async def ai_score_email(body: ScoreEmailRequest):
    """Score an email draft for reply probability. No DB access — pure AI text analysis."""
    result = await score_email(body.subject, body.body)
    return result


@router.post("/deal-temperature")
async def ai_deal_temperature(body: DealTemperatureRequest):
    """Get deal temperature badge (Hot/Warm/Cold/At Risk) with AI reasoning."""
    result = await get_deal_temperature(body.deal_id, db)
    return result


@router.post("/optimize-email")
async def ai_optimize_email(body: OptimizeEmailRequest):
    """Optimize an email draft based on a target tone and AI best practices."""
    result = await optimize_email(body.subject, body.body, body.target_tone)
    return result

@router.post("/analyze-raw-thread")
async def ai_analyze_raw_thread(body: AnalyzeRawThreadRequest):
    """Analyze a pasted email thread directly."""
    result = await analyze_raw_thread(body.thread_text)
    return result

@router.post("/chat")
async def ai_assistant_chat(body: AssistantChatRequest):
    """Chat with the Vantage AI assistant."""
    result = await assistant_chat(body.message, db, history=body.history)
    return result

@router.post("/connect-email")
async def ai_connect_email(body: ConnectEmailRequest = None):
    """Connect to a real email inbox via IMAP and extract recent emails into DB using .env credentials."""
    import os
    try:
        # Use credentials from .env
        email_address = os.getenv("SMTP_USER")
        app_password = os.getenv("SMTP_PASSWORD")
        
        if not email_address or not app_password:
             return {"status": "error", "message": "No email credentials found in .env."}
             
        host = "imap.gmail.com" if "@gmail.com" in email_address else "imap-mail.outlook.com"
        fetched_emails = fetch_real_emails(email_address, app_password, host)
        
        if not fetched_emails:
            return {"status": "error", "message": "Failed to connect or no emails found. Make sure you used an App Password, not your standard password."}
        
        # Save them to the database
        inserted_count = 0
        for em in fetched_emails:
            # Check if exists (simple subject check)
            exists = db.table("emails").select("id").eq("subject", em["subject"]).execute()
            if not exists.data:
                # Prepend sender to body since there is no 'sender' column in schema
                full_body = f"From: {em['from']}\n\n{em['body']}"
                db.table("emails").insert({
                    "subject": em["subject"],
                    "body": full_body,
                    "status": "replied",  # Changed from unread to pass db constraint
                    "sent_at": datetime.utcnow().isoformat()
                }).execute()
                inserted_count += 1
                
        return {"status": "success", "message": f"Successfully connected! Extracted {len(fetched_emails)} real emails. Inserted {inserted_count} new emails to database."}
    except Exception as e:
        return {"status": "error", "message": str(e)}
