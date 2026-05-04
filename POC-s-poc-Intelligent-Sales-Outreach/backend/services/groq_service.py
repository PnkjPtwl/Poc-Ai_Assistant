"""
Groq AI Service — Context Assembly + LLM calls
"""
import os, json, re
from datetime import datetime, timezone
from groq import Groq
from services.email_service import send_email

client = Groq(api_key=os.getenv("GROQ_API_KEY", ""))
# Switched model due to rate limits on 70b
MODEL = "llama-3.1-8b-instant"

# ── Context Assembly ──────────────────────────────────────

async def assemble_deal_context(contact_id: str, deal_id: str, db) -> str:
    """Assemble full deal context for AI prompts. Always fetches live data."""
    parts = []

    # ── Deal ──
    deal = None
    if deal_id:
        res = db.table("deals").select("*, contacts(*), companies(*)").eq("id", deal_id).execute()
        if res.data:
            deal = res.data[0]
            updated = deal.get("updated_at") or deal.get("created_at")
            days_in_stage = 0
            if updated:
                try:
                    dt = datetime.fromisoformat(updated.replace("Z", "+00:00"))
                    days_in_stage = (datetime.now(timezone.utc) - dt).days
                except Exception:
                    pass
            parts.append(f"""DEAL CONTEXT:
- Deal: {deal.get('title')} | Stage: {deal.get('stage')} | Amount: ${deal.get('amount', 0):,.0f} | Close: {deal.get('close_date', 'N/A')}
- Days in current stage: {days_in_stage}
- Forecast category: {deal.get('forecast_category', 'Pipeline')}
- Next step noted: {deal.get('next_step', 'None')}
- Rep notes: {deal.get('notes', 'None')}""")

    # ── Contact + Company ──
    contact = None
    if contact_id:
        res = db.table("contacts").select("*, companies(*)").eq("id", contact_id).execute()
        if res.data:
            contact = res.data[0]
            company = contact.get("companies") or {}
            parts.append(f"""CONTACT: {contact.get('name')}, {contact.get('title', 'N/A')} at {company.get('name', 'N/A')} ({company.get('industry', 'N/A')}, {company.get('employee_count', 'N/A')} employees, {company.get('location', 'N/A')})
- Preferred language: {contact.get('preferred_language', 'English')} | Timezone: {contact.get('timezone', 'UTC')}
- Engagement score: {contact.get('activity_score', 0)}/100""")

    # ── Email History (last 5) ──
    if deal_id:
        res = db.table("emails").select("subject, body, status, sent_at").eq("deal_id", deal_id).order("sent_at", desc=True).limit(5).execute()
        if res.data:
            lines = ["EMAIL HISTORY (most recent first):"]
            for i, em in enumerate(res.data, 1):
                days_ago = 0
                if em.get("sent_at"):
                    try:
                        dt = datetime.fromisoformat(em["sent_at"].replace("Z", "+00:00"))
                        days_ago = (datetime.now(timezone.utc) - dt).days
                    except Exception:
                        pass
                snippet = (em.get("body") or "")[:200]
                lines.append(f'{i}. [{days_ago}d ago] "{em.get("subject", "")}" — {em.get("status", "draft")}\n   Preview: "{snippet}"')
            parts.append("\n".join(lines))

    # ── Call Transcripts ──
    if contact_id:
        res = db.table("call_transcripts").select("*").eq("contact_id", contact_id).order("call_date", desc=True).execute()
        if res.data:
            lines = ["CALL HISTORY (most recent first):"]
            for i, call in enumerate(res.data):
                days_ago = 0
                if call.get("call_date"):
                    try:
                        dt = datetime.fromisoformat(call["call_date"].replace("Z", "+00:00"))
                        days_ago = (datetime.now(timezone.utc) - dt).days
                    except Exception:
                        pass
                topics = ", ".join(call.get("key_topics") or [])
                if i == 0:
                    transcript_text = call.get("transcript", "")[:1500]
                    lines.append(f'{i+1}. [{days_ago}d ago] Sentiment: {call.get("sentiment")} | Topics: {topics}\n   Summary: {call.get("summary", "N/A")}\n   Full transcript: {transcript_text}')
                else:
                    lines.append(f'{i+1}. [{days_ago}d ago] Sentiment: {call.get("sentiment")}\n   Summary: {call.get("summary", "N/A")}')
            parts.append("\n".join(lines))

    # ── Last contact days ago ──
    last_contact = None
    if deal_id:
        em_res = db.table("emails").select("sent_at").eq("deal_id", deal_id).eq("status", "sent").order("sent_at", desc=True).limit(1).execute()
        if em_res.data and em_res.data[0].get("sent_at"):
            try:
                last_contact = datetime.fromisoformat(em_res.data[0]["sent_at"].replace("Z", "+00:00"))
            except Exception:
                pass
    if contact_id:
        call_res = db.table("call_transcripts").select("call_date").eq("contact_id", contact_id).order("call_date", desc=True).limit(1).execute()
        if call_res.data and call_res.data[0].get("call_date"):
            try:
                cd = datetime.fromisoformat(call_res.data[0]["call_date"].replace("Z", "+00:00"))
                if last_contact is None or cd > last_contact:
                    last_contact = cd
            except Exception:
                pass
    if last_contact:
        days = (datetime.now(timezone.utc) - last_contact).days
        parts.append(f"Last contacted: {days} days ago")

    # ── Completed Tasks (last 5) ──
    if deal_id:
        res = db.table("tasks").select("type, title, completed_at").eq("deal_id", deal_id).eq("status", "completed").order("completed_at", desc=True).limit(5).execute()
        if res.data:
            lines = ["COMPLETED ACTIONS:"]
            for t in res.data:
                lines.append(f'- [{t.get("completed_at", "")}] {t.get("type")}: {t.get("title")}')
            parts.append("\n".join(lines))

    context = "\n\n".join(parts)
    # Cap at ~3000 tokens (~12000 chars)
    if len(context) > 12000:
        context = context[:12000] + "\n... (context truncated)"
    return context


# ── AI Functions ──────────────────────────────────────────

async def draft_email(contact_id: str, deal_id: str, intent: str, language: str,
                      transcript_id: str | None, template_id: str | None,
                      rep_id: str | None, db) -> dict:
    """Draft an email using Groq with full deal context."""
    context = await assemble_deal_context(contact_id, deal_id, db)

    # If template provided, fetch it
    template_text = ""
    if template_id:
        res = db.table("email_templates").select("*").eq("id", template_id).execute()
        if res.data:
            t = res.data[0]
            template_text = f"\nTEMPLATE TO FOLLOW:\nSubject: {t['subject_template']}\nBody: {t['body_template']}"

    # If specific transcript requested, fetch full text
    transcript_text = ""
    if transcript_id:
        res = db.table("call_transcripts").select("transcript, summary").eq("id", transcript_id).execute()
        if res.data:
            transcript_text = f"\nREFERENCE TRANSCRIPT:\n{res.data[0].get('transcript', '')[:2000]}"

    # Get contact preferred language
    target_lang = language or "English"
    if contact_id and not language:
        res = db.table("contacts").select("preferred_language").eq("id", contact_id).execute()
        if res.data:
            target_lang = res.data[0].get("preferred_language", "English")

    multi_lang = target_lang != "English"

    system_prompt = f"""{context}
{template_text}
{transcript_text}

You are a senior B2B sales email writer. Draft a professional sales email based on the context above.

Intent: {intent}

Rules:
- Use the deal context, email history, and call transcripts to write a highly personalized email
- Reference specific details from recent calls or emails when relevant
- Match the tone to the deal stage (early = educational, mid = value-driven, late = urgency)
- Keep it concise — max 200 words for the body
- Replace any template variables with actual contact/company names from the context
- Subject line must be compelling and specific (not generic)
{"- Write TWO versions: first in English, then in " + target_lang + ". Separate with ---TRANSLATION---" if multi_lang else ""}

Respond in JSON format:
{{"subject": "...", "body": "..."{"," + '"subject_translated": "...", "body_translated": "..."' if multi_lang else ""}}}
"""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Draft an email for this {intent} scenario."}
        ],
        temperature=0.7,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    result["language"] = target_lang
    return result


async def translate_email(subject: str, body: str, target_language: str) -> dict:
    """Translate an email to a target language."""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": f"Translate the following sales email to {target_language}. Maintain professional tone and formatting. Respond in JSON: {{\"subject\": \"...\", \"body\": \"...\"}}"},
            {"role": "user", "content": f"Subject: {subject}\n\nBody: {body}"}
        ],
        temperature=0.3,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    result["language"] = target_language
    return result


async def generate_guidelines(play_id: str, deal_stage: str, context: str, db) -> list:
    """Generate AI coaching guidelines for a play × stage combination."""
    # Get play info
    play = None
    res = db.table("plays").select("*").eq("id", play_id).execute()
    if res.data:
        play = res.data[0]

    system_prompt = f"""You are a B2B sales coaching AI. Generate actionable coaching guidelines for a sales play.

Play: {play.get('name') if play else 'Unknown'} ({play.get('type') if play else 'Unknown'})
Description: {play.get('description') if play else ''}
Current Deal Stage: {deal_stage}
Additional Context: {context}

Generate 3-5 coaching guidelines. Each should have a clear title and 3 bullet points of actionable advice.

Respond in JSON format:
{{"guidelines": [{{"title": "...", "bullets": ["...", "...", "..."]}}]}}
"""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Generate coaching guidelines for the {deal_stage} stage."}
        ],
        temperature=0.7,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    guidelines = result.get("guidelines", [])

    # Save to DB
    for g in guidelines:
        db.table("play_guidelines").insert({
            "play_id": play_id,
            "deal_stage": deal_stage,
            "guideline_title": g["title"],
            "guideline_content": json.dumps(g["bullets"]),
            "ai_generated": True,
        }).execute()

    return guidelines


async def generate_whatsapp_message(contact_id: str, deal_id: str, intent: str, db) -> dict:
    """Generate a WhatsApp message and wa.me URL."""
    context = await assemble_deal_context(contact_id, deal_id, db)

    # Get contact WhatsApp number
    contact = db.table("contacts").select("name, whatsapp_number").eq("id", contact_id).execute()
    whatsapp_number = ""
    contact_name = ""
    if contact.data:
        whatsapp_number = contact.data[0].get("whatsapp_number", "")
        contact_name = contact.data[0].get("name", "")

    system_prompt = f"""{context}

You are a sales professional writing a WhatsApp message. Keep it concise, warm, and conversational.

Rules:
- Max 150 words
- No formal salutations (no "Dear", no "Sincerely")
- Warm, direct tone — like messaging a business acquaintance
- Include a clear purpose/CTA
- Reference relevant context from the deal/emails/calls when appropriate

Intent: {intent}

Respond in JSON: {{"message": "..."}}
"""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Write a WhatsApp message to {contact_name} about: {intent}"}
        ],
        temperature=0.7,
        max_tokens=500,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    message = result.get("message", "")

    import urllib.parse
    encoded = urllib.parse.quote(message)
    clean_number = whatsapp_number.replace("+", "").replace(" ", "").replace("-", "")
    whatsapp_url = f"https://wa.me/{clean_number}?text={encoded}"

    return {"message": message, "whatsapp_url": whatsapp_url}


async def summarize_transcript(transcript_id: str, db) -> dict:
    """AI-summarize a call transcript."""
    res = db.table("call_transcripts").select("*").eq("id", transcript_id).execute()
    if not res.data:
        return {"error": "Transcript not found"}

    call = res.data[0]
    system_prompt = """You are a sales call analysis AI. Analyze this transcript and provide:
1. A concise summary (2-3 sentences)
2. Key topics discussed (as a list)
3. Overall sentiment (Positive, Neutral, or Negative)

Respond in JSON: {"summary": "...", "key_topics": ["...", "..."], "sentiment": "..."}
"""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": call.get("transcript", "")}
        ],
        temperature=0.3,
        max_tokens=500,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)

    # Update the transcript record
    db.table("call_transcripts").update({
        "summary": result.get("summary"),
        "key_topics": result.get("key_topics", []),
        "sentiment": result.get("sentiment"),
    }).eq("id", transcript_id).execute()

    return result

async def generate_executive_briefing(deal_id: str, db) -> dict:
    """Generate a comprehensive executive briefing for a deal."""
    res = db.table("deals").select("contact_id").eq("id", deal_id).execute()
    if not res.data:
        return {"error": "Deal not found"}
    contact_id = res.data[0].get("contact_id")
    
    context = await assemble_deal_context(contact_id, deal_id, db)
    
    system_prompt = f"""{context}

You are an expert enterprise sales strategist.
Create an "Executive Briefing" document for this deal. The rep is jumping into a critical meeting in 5 minutes and needs a fast, scannable, and highly insightful brief based ONLY on the context provided above.

Format as beautiful Markdown. Include:
1. **Executive Summary** (2 sentences max)
2. **Current Deal Health** (Brief assessment based on sentiment, stage, and recent activity)
3. **Key Pain Points** (Extracted from past calls/emails)
4. **Known Objections & Competitors** (If any mentioned)
5. **Recommended Strategy for Next Call** (3 highly specific, actionable bullet points)

Respond in JSON format:
{{"briefing": "..."}} (Where the value is the raw markdown string)
"""
    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "Generate the executive briefing."}
        ],
        temperature=0.4,
        max_tokens=1500,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    return result


async def score_email(subject: str, body: str) -> dict:
    """Score an email draft for reply probability using Groq.
    Returns score (0-100), tone label, reason bullets, and one improvement tip.
    No DB access needed — pure text analysis.
    """
    if not subject.strip() and not body.strip():
        return {"score": 0, "tone": "Empty", "reasons": ["No content to score"], "improvement": "Write your email first"}

    system_prompt = """You are an expert B2B sales email analyst. Analyze the given email and predict its reply likelihood.

Evaluate based on:
1. Subject line specificity and curiosity (generic = bad, specific + relevant = good)
2. Personalization signals (name, company, role, situation mentioned)
3. Value proposition clarity (what's in it for them)
4. Call-to-action (CTA) clarity (specific ask vs vague)
5. Length appropriateness (< 150 words = good, > 300 = bad)
6. Tone match (too formal/informal for B2B)
7. Avoid spam trigger words

Scoring guide:
- 80-100: Excellent — high personalization, clear CTA, appropriate length
- 60-79: Good — solid but missing one key element
- 40-59: Average — generic or unclear CTA
- 20-39: Poor — too long, no personalization, or vague
- 0-19: Very poor — spam-like or empty

Tone options: "Too Formal", "Professional", "Casual", "Too Casual", "Salesy"

Respond ONLY in JSON:
{
  "score": <integer 0-100>,
  "tone": "<tone label>",
  "reasons": ["<positive or negative reason 1>", "<reason 2>", "<reason 3>"],
  "improvement": "<single most impactful improvement suggestion>"
}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Subject: {subject}\n\nBody:\n{body}"}
        ],
        temperature=0.2,
        max_tokens=400,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)
    # Validate and clamp score
    result["score"] = max(0, min(100, int(result.get("score", 0))))
    return result


async def get_deal_temperature(deal_id: str, db) -> dict:
    """Compute deal temperature (Hot/Warm/Cold/At Risk) from existing deal data.
    Uses assemble_deal_context() — no new DB queries, no schema changes.
    Returns: temperature, label, hex_color, emoji, and one-line reasoning.
    """
    # Fetch lightweight deal signals without full context assembly
    deal_res = db.table("deals").select("*, contacts(*)").eq("id", deal_id).execute()
    if not deal_res.data:
        return {"temperature": "unknown", "emoji": "❓", "color": "#767586", "reasoning": "Deal not found"}

    deal = deal_res.data[0]
    contact_id = deal.get("contact_id", "")

    # Days since last email sent
    days_since_email = 999
    em_res = db.table("emails").select("sent_at").eq("deal_id", deal_id).eq("status", "sent").order("sent_at", desc=True).limit(1).execute()
    if em_res.data and em_res.data[0].get("sent_at"):
        try:
            dt = datetime.fromisoformat(em_res.data[0]["sent_at"].replace("Z", "+00:00"))
            days_since_email = (datetime.now(timezone.utc) - dt).days
        except Exception:
            pass

    # Latest call sentiment
    latest_sentiment = "None"
    if contact_id:
        call_res = db.table("call_transcripts").select("sentiment").eq("contact_id", contact_id).order("call_date", desc=True).limit(1).execute()
        if call_res.data:
            latest_sentiment = call_res.data[0].get("sentiment") or "None"

    # Close date check
    close_date_str = deal.get("close_date") or ""
    days_to_close = 999
    is_overdue = False
    if close_date_str:
        try:
            close_dt = datetime.fromisoformat(close_date_str).replace(tzinfo=timezone.utc)
            days_to_close = (close_dt - datetime.now(timezone.utc)).days
            is_overdue = days_to_close < 0
        except Exception:
            pass

    has_next_step = bool(deal.get("next_step", "").strip())
    stage = deal.get("stage", "")
    is_closed = stage in ("Closed Won", "Closed Lost")

    # Signal summary for Groq
    signals = f"""Deal: {deal.get('title')}
Stage: {stage}
Amount: ${deal.get('amount', 0):,.0f}
Days since last sent email: {days_since_email if days_since_email < 999 else 'Never'}
Latest call sentiment: {latest_sentiment}
Days until close date: {days_to_close if days_to_close < 999 else 'Not set'} ({'OVERDUE' if is_overdue else 'on track'})
Next step defined: {'Yes' if has_next_step else 'No'}
Forecast category: {deal.get('forecast_category', 'Pipeline')}"""

    system_prompt = """You are a deal health analyst. Based on deal signals, classify the temperature and write a one-line reasoning.

Temperature rules:
- "Hot": Recent contact (< 5 days), positive sentiment, clear next step, close date on track
- "Warm": Some activity, neutral signals, close date within range
- "Cold": No contact in 7+ days, no next step defined, or no calls on record
- "At Risk": Overdue close date, negative sentiment, OR no contact in 14+ days with upcoming close

Respond ONLY in JSON:
{
  "temperature": "Hot" | "Warm" | "Cold" | "At Risk",
  "reasoning": "<one sentence max, e.g.: Cold — Last contact was 9 days ago with no next step defined>"
}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": signals}
        ],
        temperature=0.1,
        max_tokens=120,
        response_format={"type": "json_object"},
    )
    result = json.loads(response.choices[0].message.content)

    temp = result.get("temperature", "Warm")
    temp_map = {
        "Hot":     {"emoji": "🔥", "color": "#ef4444", "bg": "#ffdad6"},
        "Warm":    {"emoji": "🌡️", "color": "#f59e0b", "bg": "#fef3c7"},
        "Cold":    {"emoji": "🧊", "color": "#64748b", "bg": "#e2e8f0"},
        "At Risk": {"emoji": "⚠️", "color": "#dc2626", "bg": "#ffdad6"},
    }
    meta = temp_map.get(temp, temp_map["Warm"])

    return {
        "temperature": temp,
        "emoji": meta["emoji"],
        "color": meta["color"],
        "bg": meta["bg"],
        "reasoning": result.get("reasoning", ""),
        "deal_id": deal_id,
        # Include signals for debugging
        "signals": {
            "days_since_email": days_since_email if days_since_email < 999 else None,
            "latest_sentiment": latest_sentiment,
            "days_to_close": days_to_close if days_to_close < 999 else None,
            "is_overdue": is_overdue,
            "has_next_step": has_next_step,
        }
    }


async def optimize_email(subject: str, body: str, target_tone: str) -> dict:
    """Rewrite an email to match a specific tone and apply AI best practices.
    Returns: subject, body, and a summary of changes.
    """
    system_prompt = f"""You are an elite B2B sales copywriter. Your goal is to rewrite the provided email to match the target tone: "{target_tone}".

Tone Definitions:
- "Professional": Balanced, respectful, clear, and business-oriented.
- "Casual": Friendly, approachable, uses natural phrasing, less rigid.
- "Urgent": Concise, time-sensitive, direct ask.
- "Persuasive": Value-first, focuses heavily on the "why", uses active verbs.

Rewrite Rules:
1. Maintain the core message and any technical details.
2. Ensure the subject line is compelling and matches the tone.
3. Keep the body concise (under 150 words).
4. Preserve placeholders like [Name] or [Company].
5. Fix any clarity or flow issues identified in the draft.

Respond ONLY in JSON:
{{
  "subject": "...",
  "body": "...",
  "changes_made": "A short summary of what was adjusted (e.g., 'Softened the opening, added a clear CTA')"
}}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": f"Subject: {subject}\n\nBody:\n{body}"}
        ],
        temperature=0.7,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)


async def summarize_email_history(deal_id: str, db) -> dict:
    """Summarize recent email history for a deal into actionable intelligence."""
    # Fetch last 10 emails
    res = db.table("emails").select("subject, body, status, sent_at").eq("deal_id", deal_id).order("sent_at", desc=True).limit(10).execute()
    
    if not res.data:
        return {"summary": "No email history found for this deal.", "key_points": [], "prospect_stance": "Unknown"}

    email_history = ""
    for i, em in enumerate(res.data, 1):
        email_history += f"Email {i} ({em.get('status')} at {em.get('sent_at')}):\nSubject: {em.get('subject')}\nBody: {em.get('body')}\n\n"

    system_prompt = """You are a sales intelligence analyst. Analyze the following email history for a deal.
Distill the information into a high-level executive summary.

Your output must include:
1. **The Core Thread Summary**: What has happened so far in 3 sentences?
2. **Key Points & Concerns**: What specific points or objections has the prospect raised?
3. **The Prospect's Stance**: Are they excited, skeptical, neutral, or ghosting?
4. **Actionable Next Step**: What should the rep do in the NEXT email based on this history?

Respond ONLY in JSON:
{
  "summary": "...",
  "key_points": ["...", "..."],
  "prospect_stance": "...",
  "next_step": "..."
}"""

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": email_history}
        ],
        temperature=0.4,
        max_tokens=1000,
        response_format={"type": "json_object"},
    )
    return json.loads(response.choices[0].message.content)

async def analyze_raw_thread(thread_text: str) -> dict:
    """Analyze a pasted email thread directly without DB context."""
    if not thread_text.strip():
        return {"sentiment": "Neutral", "executiveSummary": "No text provided.", "actionItems": [], "objections": []}

    system_prompt = """You are a sales intelligence analyst. Analyze the following raw email thread pasted by a user.
Extract the key actionable information for the sales rep.

Respond ONLY in JSON format:
{
  "sentiment": "Positive" | "Neutral" | "Negative" | "At Risk",
  "executiveSummary": "<2 sentence high-level summary of the relationship and where things stand>",
  "actionItems": ["<action 1>", "<action 2>"],
  "objections": ["<objection or risk 1>", "<objection 2>"]
}"""

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": thread_text[:10000]} # Limit length to prevent context overflow
            ],
            temperature=0.3,
            max_tokens=1000,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        return {"sentiment": "Error", "executiveSummary": str(e), "actionItems": [], "objections": []}

async def assistant_chat(message: str, db, history: list = None) -> dict:
    """A conversational assistant like GAIA to answer queries about pipeline or simulate email extraction."""
    if history is None:
        history = []
    
    # Extract actual context from the database so it's not just a demo hallucination
    context_parts = []
    
    try:
        # 1. Fetch recent emails (to summarize emails)
        email_res = db.table("emails").select("subject, body, status, sent_at").order("sent_at", desc=True).limit(30).execute()
        if email_res.data:
            em_context = "RECENT EMAILS IN INBOX:\n"
            for em in email_res.data:
                em_context += f"- Subject: {em.get('subject')} | Status: {em.get('status')} | Date: {em.get('sent_at')}\n  Body Snippet: {em.get('body', '')[:200]}...\n"
            context_parts.append(em_context)
            
        # 2. Fetch active deals (for pipeline queries)
        deal_res = db.table("deals").select("title, stage, amount, next_step, contacts(name)").neq("stage", "Closed Won").neq("stage", "Closed Lost").order("amount", desc=True).limit(5).execute()
        if deal_res.data:
            dl_context = "ACTIVE PIPELINE DEALS:\n"
            for d in deal_res.data:
                contact_name = d.get('contacts', {}).get('name', 'Unknown') if d.get('contacts') else 'Unknown'
                dl_context += f"- {d.get('title')} (Contact: {contact_name}) | Amount: ${d.get('amount', 0):,} | Stage: {d.get('stage')} | Next: {d.get('next_step')}\n"
            context_parts.append(dl_context)
            
        # 3. Fetch pending tasks & events (for calendar queries)
        task_res = db.table("tasks").select("title, priority, due_date").order("due_date", desc=False).limit(15).execute()
        if task_res.data:
            ts_context = "CALENDAR EVENTS & PENDING TASKS:\n"
            for t in task_res.data:
                ts_context += f"- [{t.get('priority', 'medium').upper()}] {t.get('title')} | Date: {t.get('due_date')}\n"
            context_parts.append(ts_context)
    except Exception as e:
        print("Error fetching context for chat:", str(e))

    real_context = "\n\n".join(context_parts) if context_parts else "No live data available in DB right now."

    system_prompt = f"""You are Vantage, an elite AI sales assistant (similar to heygaia.io). 
Your job is to assist the user proactively by analyzing their ACTUAL data.

Here is the live data pulled from the user's connected systems (CRM, Inbox, Tasks) just now:
=== LIVE DATA CONTEXT ===
{real_context}
=========================

When the user asks you a question (e.g. "Summarize my emails", "Check my calendar", or "What's in my pipeline?"), YOU MUST answer using ONLY the live data provided above. 
Pull specific names, dates, times, amounts, and subjects from the live data. Do NOT make up generic responses.

--- STRICT SCOPE POLICY ---
You are a HIGH-SPECIALIZED SALES ASSISTANT. 
1. You ONLY answer questions related to Sales, Pipelines, CRM, Emails, and Calendars.
2. If a user asks something irrelevant to business/sales (e.g., math "1+1", recipes, generic trivia, coding questions unrelated to this app), you MUST respond EXACTLY with:
"I am sorry, but as your Vantage Executive Assistant, I am specialized only in Sales Intelligence and Revenue Operations. I cannot assist with that request."
3. Do NOT engage in small talk or generic AI assistant behaviors. Stay strictly focused on the provided context.

--- ACTIONS & SAFETY PROTOCOLS ---
You can send emails, but you MUST follow the **DRAFT & CONFIRM** protocol to prevent accidental sending:

1. **PHASE 1: DRAFT**: If the user asks to send a message or reply, FIRST present the draft text to the user in your markdown response. ASK the user: "Type **CONFIRM** to send this message."
2. **PHASE 2: EXECUTE**: ONLY after the user has explicitly said "CONFIRM", "SEND IT", or "GO AHEAD" in the current conversation, you may append the command line at the VERY END of your response:
COMMAND: SEND_EMAIL | TO: <email_address> | SUBJECT: <subject> | BODY: <body_text>

CRITICAL: NEVER include the COMMAND: SEND_EMAIL line in the same turn where you are first proposing the draft. You must wait for the user's confirmation in the next turn.

Example Workflow:
User: "Reply to Marcus saying I'll be there."
Vantage: "I have drafted the following reply to Marcus: 'Hi Marcus, I'll be there.' Type **CONFIRM** to send this."
User: "CONFIRM"
Vantage: "(Vantage Action: Executing send...) COMMAND: SEND_EMAIL | TO: marcus@example.com | SUBJECT: Re: Meeting | BODY: Hi Marcus, I'll be there."

Keep your markdown response concise and professional. Always confirm to the user that you are executing the action if you include a COMMAND."""

    # Build message list with history for context
    messages = [{"role": "system", "content": system_prompt}]
    
    # Add recent history (last 10 messages to save tokens)
    for h in history[-10:]:
        # Map our Message format to Groq role/content format
        role = h.get('role', 'user')
        content = h.get('content', '')
        # Only add if content is not a protocol command
        if not content.startswith('COMMAND:'):
            messages.append({"role": role, "content": content})
            
    messages.append({"role": "user", "content": message})

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=messages,
            temperature=0.7,
            max_tokens=1500,
        )
        full_reply = response.choices[0].message.content
        
        # Action execution logic
        if "COMMAND: SEND_EMAIL" in full_reply:
            try:
                # Regex to extract TO, SUBJECT, and BODY
                to_match = re.search(r"TO:\s*(.*?)\s*\|", full_reply)
                sub_match = re.search(r"SUBJECT:\s*(.*?)\s*\|", full_reply)
                body_match = re.search(r"BODY:\s*(.*)", full_reply, re.DOTALL)
                
                if to_match and sub_match and body_match:
                    to_email = to_match.group(1).strip()
                    subject = sub_match.group(1).strip()
                    body = body_match.group(1).strip()
                    
                    # Call actual email service
                    import asyncio
                    asyncio.create_task(send_email(to_email, subject, body))
                    
                    # Clean the reply for the UI (remove the command line)
                    clean_reply = re.sub(r"COMMAND: SEND_EMAIL.*", "*(Vantage Action: Email sent successfully)*", full_reply, flags=re.DOTALL)
                    return {"reply": clean_reply}
            except Exception as e:
                return {"reply": f"{full_reply}\n\n*(Error executing action: {str(e)})*"}

        return {"reply": full_reply}
    except Exception as e:
        return {"reply": f"Sorry, I encountered an error communicating with the model: {str(e)}"}
