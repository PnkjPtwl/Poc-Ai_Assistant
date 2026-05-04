"""Seed script for AI Sales Engagement Platform - Run once to populate Supabase."""
import os, sys
from datetime import datetime, timedelta, date
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
db = create_client(os.getenv("SUPABASE_URL",""), os.getenv("SUPABASE_SERVICE_KEY",""))

def check_exists(table):
    r = db.table(table).select("id", count="exact").limit(1).execute()
    return (r.count or 0) > 0

def seed():
    counts = {}
    # ── REPS ──
    if not check_exists("reps"):
        reps_data = [
            {"name":"Sarah Chen","email":"sarah.chen@acme.com","role":"Account Executive","quota":600000,"avatar_initials":"SC"},
            {"name":"Marcus Rodriguez","email":"marcus.r@acme.com","role":"Senior AE","quota":800000,"avatar_initials":"MR"},
            {"name":"Priya Sharma","email":"priya.s@acme.com","role":"Account Executive","quota":500000,"avatar_initials":"PS"},
        ]
        res = db.table("reps").insert(reps_data).execute()
        counts["reps"] = len(res.data)
    reps = db.table("reps").select("*").execute().data

    # ── COMPANIES ──
    if not check_exists("companies"):
        companies_data = [
            {"name":"TechNova Inc","industry":"SaaS","website":"technova.io","employee_count":450,"location":"San Francisco, CA"},
            {"name":"Meridian Financial","industry":"Fintech","website":"meridianfin.com","employee_count":1200,"location":"New York, NY"},
            {"name":"HealthBridge Systems","industry":"Healthcare","website":"healthbridge.com","employee_count":800,"location":"Boston, MA"},
            {"name":"RetailCore","industry":"Retail","website":"retailcore.com","employee_count":2000,"location":"Chicago, IL"},
            {"name":"Apex Manufacturing","industry":"Manufacturing","website":"apexmfg.com","employee_count":3500,"location":"Detroit, MI"},
            {"name":"Cloudify Solutions","industry":"SaaS","website":"cloudify.io","employee_count":200,"location":"Austin, TX"},
            {"name":"DataVault Corp","industry":"SaaS","website":"datavault.com","employee_count":350,"location":"Seattle, WA"},
            {"name":"NexGen Pharma","industry":"Healthcare","website":"nexgenpharma.com","employee_count":1500,"location":"San Diego, CA"},
            {"name":"BlueStar Retail","industry":"Retail","website":"bluestarretail.com","employee_count":900,"location":"Miami, FL"},
            {"name":"Fusion Analytics","industry":"SaaS","website":"fusionanalytics.io","employee_count":150,"location":"Denver, CO"},
            {"name":"Quantum Logistics","industry":"Manufacturing","website":"quantumlog.com","employee_count":2800,"location":"Dallas, TX"},
            {"name":"PrimeCare Networks","industry":"Healthcare","website":"primecare.net","employee_count":600,"location":"Atlanta, GA"},
            {"name":"Stellar SaaS","industry":"SaaS","website":"stellarsaas.com","employee_count":100,"location":"Portland, OR"},
            {"name":"Ironclad Security","industry":"Fintech","website":"ironcladsec.com","employee_count":400,"location":"Washington, DC"},
            {"name":"Vertex Commerce","industry":"Retail","website":"vertexcommerce.com","employee_count":700,"location":"Los Angeles, CA"},
        ]
        res = db.table("companies").insert(companies_data).execute()
        counts["companies"] = len(res.data)
    companies = db.table("companies").select("*").execute().data

    # ── CONTACTS ──
    if not check_exists("contacts"):
        titles = ["CTO","VP Sales","CFO","Head of Operations","VP Engineering","Director of IT","Head of Product"]
        langs = ["English","English","English","English","English","Spanish","French","English","English","German"]
        tzs = ["America/New_York","America/Chicago","America/Los_Angeles","Europe/London","Europe/Berlin","Asia/Tokyo","America/Denver","Asia/Singapore","America/New_York","Europe/Paris"]
        phones = ["+14155551001","+12125551002","+16175551003","+13125551004","+13135551005","+15125551006","+12065551007","+18585551008","+13055551009","+17205551010"]
        contacts_data = []
        ci = 0
        for comp in companies:
            n_contacts = 2 if ci % 3 == 0 else 3
            for j in range(n_contacts):
                idx = (ci*3+j) % len(titles)
                contacts_data.append({
                    "name": f"Contact {ci*3+j+1}",
                    "email": f"contact{ci*3+j+1}@{comp['website']}",
                    "phone": phones[(ci*3+j) % len(phones)],
                    "whatsapp_number": phones[(ci*3+j) % len(phones)],
                    "company_id": comp["id"],
                    "title": titles[idx],
                    "preferred_language": langs[(ci*3+j) % len(langs)],
                    "timezone": tzs[(ci*3+j) % len(tzs)],
                    "activity_score": ((ci*3+j)*17+23) % 101,
                })
                if len(contacts_data) >= 35:
                    break
            ci += 1
            if len(contacts_data) >= 35:
                break
        # Give real names
        real_names = ["James Mitchell","Elena Vasquez","Robert Kim","Lisa Chen","David Okafor","Maria Santos","Thomas Weber","Akiko Tanaka","Patricia Reynolds","Hans Mueller",
                      "Jennifer Liu","Carlos Mendez","Amanda Foster","Rajesh Patel","Sophie Dubois","Michael Chang","Isabella Rossi","Kevin O'Brien","Yuki Nakamura","Christine Larsen",
                      "Daniel Wright","Fatima Al-Hassan","Brian Cooper","Mei Lin","Andrew Brooks","Valentina Cruz","Steven Park","Laura Bergmann","Nathan Gray","Carmen Diaz",
                      "Christopher Lee","Aisha Mohammed","Ryan Sullivan","Eva Lindqvist","George Hamilton"]
        for i, c in enumerate(contacts_data):
            if i < len(real_names):
                c["name"] = real_names[i]
                c["email"] = real_names[i].lower().replace(" ", ".") + "@" + comp["website"] if i < len(contacts_data) else c["email"]
        res = db.table("contacts").insert(contacts_data).execute()
        counts["contacts"] = len(res.data)
    contacts = db.table("contacts").select("*").execute().data

    # ── DEALS ──
    if not check_exists("deals"):
        stages = ["Prospecting","Qualification","Discovery","Proposal","Negotiation","Closed Won","Closed Lost"]
        fcats = ["Pipeline","Pipeline","Best Case","Best Case","Commit","Commit","Omit"]
        deals_data = []
        for i in range(25):
            rep = reps[i % 3]
            contact = contacts[i % len(contacts)]
            comp_id = contact.get("company_id")
            stage = stages[i % 7]
            amt = [15000,35000,50000,75000,95000,120000,150000,180000,200000,250000,280000][i % 11]
            prob = [10,20,30,40,50,60,70,80,90,95,100][i % 11]
            cd = date.today() + timedelta(days=(i*7-30))
            deals_data.append({
                "title": f"Deal-{contact['name'].split()[0]}-{i+1}",
                "contact_id": contact["id"],
                "company_id": comp_id,
                "rep_id": rep["id"],
                "stage": stage,
                "amount": amt,
                "probability": prob,
                "close_date": str(cd),
                "forecast_category": fcats[i % 7],
                "next_step": ["Schedule demo","Send proposal","Follow up on pricing","Executive review","Contract review","Onboarding call","Re-engage"][i % 7],
                "notes": f"Key deal for {contact['name']}. Priority account.",
            })
        res = db.table("deals").insert(deals_data).execute()
        counts["deals"] = len(res.data)
    deals = db.table("deals").select("*").execute().data

    # ── EMAIL TEMPLATES ──
    if not check_exists("email_templates"):
        templates = [
            {"name":"ROI-focused intro","category":"Cold Outreach","subject_template":"Driving {{company_name}}'s growth with proven ROI","body_template":"Hi {{contact_name}},\n\nI noticed {{company_name}} has been expanding rapidly. Companies in your space typically see 30-40% efficiency gains with our platform.\n\nWould you be open to a 15-minute call to explore how we could help?\n\nBest,\n{{rep_name}}","variables":["contact_name","company_name","rep_name"],"open_rate":38,"reply_rate":8,"times_used":45},
            {"name":"Pain point opener","category":"Cold Outreach","subject_template":"{{contact_name}}, solving {{company_name}}'s scaling challenges","body_template":"Hi {{contact_name}},\n\nMany {{company_name}}-sized teams struggle with operational bottlenecks as they scale. Our solution has helped similar companies reduce manual work by 60%.\n\nCurious if this resonates?\n\nBest,\n{{rep_name}}","variables":["contact_name","company_name","rep_name"],"open_rate":35,"reply_rate":7,"times_used":38},
            {"name":"Post-demo recap","category":"Follow Up","subject_template":"Great connecting today, {{contact_name}}","body_template":"Hi {{contact_name}},\n\nThanks for taking the time for today's demo. As discussed, here are the key takeaways:\n\n1. Integration with your existing stack\n2. Expected ROI timeline of 3-6 months\n3. Custom onboarding plan\n\nI'll send the proposal by end of week. Any questions in the meantime?\n\nBest,\n{{rep_name}}","variables":["contact_name","rep_name"],"open_rate":42,"reply_rate":12,"times_used":52},
            {"name":"After no-reply nudge","category":"Follow Up","subject_template":"Quick follow-up, {{contact_name}}","body_template":"Hi {{contact_name}},\n\nI wanted to circle back on my previous email. I understand you're busy — would a brief 10-minute call work better?\n\nHappy to work around your schedule.\n\nBest,\n{{rep_name}}","variables":["contact_name","rep_name"],"open_rate":28,"reply_rate":5,"times_used":67},
            {"name":"Proposal follow-up","category":"Follow Up","subject_template":"Following up on the {{company_name}} proposal","body_template":"Hi {{contact_name}},\n\nI wanted to check if you had a chance to review the proposal I sent over. The pricing we discussed — {{deal_amount}} — is valid through end of month.\n\nWould love to address any questions your team might have.\n\nBest,\n{{rep_name}}","variables":["contact_name","company_name","deal_amount","rep_name"],"open_rate":32,"reply_rate":9,"times_used":41},
            {"name":"Custom proposal cover","category":"Proposal","subject_template":"{{company_name}} — Custom Solution Proposal","body_template":"Hi {{contact_name}},\n\nPlease find attached our customized proposal for {{company_name}}. The solution is tailored to address the specific challenges we discussed.\n\nKey highlights:\n- Custom integration plan\n- Dedicated success manager\n- {{deal_amount}} annual investment\n\nLooking forward to your feedback.\n\nBest,\n{{rep_name}}","variables":["contact_name","company_name","deal_amount","rep_name"],"open_rate":40,"reply_rate":11,"times_used":29},
            {"name":"Pricing discussion","category":"Proposal","subject_template":"Pricing options for {{company_name}}","body_template":"Hi {{contact_name}},\n\nFollowing our conversation, I've put together pricing tiers. The recommended option at {{deal_amount}} includes everything we discussed.\n\nHappy to hop on a call to walk through the details.\n\nBest,\n{{rep_name}}","variables":["contact_name","company_name","deal_amount","rep_name"],"open_rate":36,"reply_rate":10,"times_used":33},
            {"name":"Decision timeline ask","category":"Closing","subject_template":"Next steps for {{company_name}}?","body_template":"Hi {{contact_name}},\n\nI wanted to align on timing. What does your decision-making process look like, and is there a target date you're working toward?\n\nHappy to support with any additional materials for internal stakeholders.\n\nBest,\n{{rep_name}}","variables":["contact_name","company_name","rep_name"],"open_rate":34,"reply_rate":8,"times_used":25},
            {"name":"Final offer","category":"Closing","subject_template":"Special terms for {{company_name}}","body_template":"Hi {{contact_name}},\n\nI've secured approval for enhanced terms on your deal. This includes a 15% discount on the first year if we can finalize by end of quarter.\n\nShall we schedule a final review call?\n\nBest,\n{{rep_name}}","variables":["contact_name","company_name","rep_name"],"open_rate":30,"reply_rate":6,"times_used":18},
            {"name":"Expansion opportunity","category":"Upsell","subject_template":"Unlocking more value for {{company_name}}","body_template":"Hi {{contact_name}},\n\nBased on your team's usage patterns, there's a significant opportunity to expand into additional departments. Teams that do this typically see 2x the ROI.\n\nWant to explore what this could look like?\n\nBest,\n{{rep_name}}","variables":["contact_name","company_name","rep_name"],"open_rate":25,"reply_rate":5,"times_used":15},
            {"name":"Welcome kickoff","category":"Onboarding","subject_template":"Welcome aboard, {{contact_name}}! 🎉","body_template":"Hi {{contact_name}},\n\nWelcome to the family! I'm excited to kick off your onboarding.\n\nHere's what to expect in the first 30 days:\n- Week 1: Platform setup and team invitations\n- Week 2: Core workflow configuration\n- Week 3-4: Advanced features and integrations\n\nYour dedicated success manager will reach out shortly.\n\nBest,\n{{rep_name}}","variables":["contact_name","rep_name"],"open_rate":42,"reply_rate":12,"times_used":22},
            {"name":"30-day check-in","category":"Onboarding","subject_template":"30-day check-in — How's everything going, {{contact_name}}?","body_template":"Hi {{contact_name}},\n\nIt's been 30 days since we launched! I'd love to hear how things are going and if there are any areas where we can help optimize.\n\nQuick call this week?\n\nBest,\n{{rep_name}}","variables":["contact_name","rep_name"],"open_rate":38,"reply_rate":10,"times_used":19},
        ]
        res = db.table("email_templates").insert(templates).execute()
        counts["email_templates"] = len(res.data)
    templates = db.table("email_templates").select("*").execute().data

    # ── PLAYS ──
    if not check_exists("plays"):
        plays_data = [
            {"name":"Cold Outreach Play","type":"Cold Outreach","description":"Multi-touch cold outreach sequence for new prospects","target_stages":["Prospecting","Qualification"],"total_steps":5,"duration_days":21},
            {"name":"Post-Demo Nurture","type":"Onboarding","description":"Nurture sequence after initial demo to drive proposal stage","target_stages":["Discovery","Proposal"],"total_steps":4,"duration_days":14},
            {"name":"Expansion / Upsell","type":"Upsell","description":"Cross-sell and upsell sequence for existing customers","target_stages":["Closed Won"],"total_steps":6,"duration_days":30},
            {"name":"Renewal & Re-engagement","type":"Re-Engagement","description":"Re-engage dormant accounts and drive renewals","target_stages":["Negotiation","Closed Lost"],"total_steps":5,"duration_days":25},
        ]
        res = db.table("plays").insert(plays_data).execute()
        counts["plays"] = len(res.data)
    plays = db.table("plays").select("*").execute().data

    # ── FLOWS ──
    if not check_exists("flows"):
        flows_data = []
        triggers = ["deal_stage_change","manual","email_opened","time_elapsed","email_replied","manual"]
        for i, play in enumerate(plays):
            for j in range(2):
                flows_data.append({
                    "play_id": play["id"],
                    "name": f"{play['name']} - Flow {j+1}",
                    "description": f"Automated sequence for {play['name']}",
                    "trigger_type": triggers[(i*2+j) % len(triggers)],
                    "status": "active" if j == 0 else "draft",
                })
        res = db.table("flows").insert(flows_data).execute()
        counts["flows"] = len(res.data)
    flows = db.table("flows").select("*").execute().data

    # ── FLOW STEPS ──
    if not check_exists("flow_steps"):
        steps_data = []
        channels = ["email","email","whatsapp","call","email","task"]
        for flow in flows:
            n_steps = 5
            for s in range(n_steps):
                ch = channels[s % len(channels)]
                steps_data.append({
                    "flow_id": flow["id"],
                    "step_number": s+1,
                    "channel": ch,
                    "delay_days": s * 3,
                    "subject_template": f"Step {s+1}: {ch} touchpoint" if ch == "email" else None,
                    "body_template": f"Automated {ch} action for step {s+1}" if ch == "email" else None,
                    "action_description": f"{ch.title()} touchpoint - Day {s*3}",
                })
        res = db.table("flow_steps").insert(steps_data).execute()
        counts["flow_steps"] = len(res.data)

    # ── FLOW ENROLLMENTS ──
    if not check_exists("flow_enrollments"):
        enrollments = []
        statuses = ["active","active","completed","active","paused","active","completed","active","active","active","completed","paused","active","active","active"]
        for i in range(15):
            flow = flows[i % len(flows)]
            contact = contacts[i % len(contacts)]
            deal = deals[i % len(deals)] if deals else None
            enrollments.append({
                "flow_id": flow["id"],
                "contact_id": contact["id"],
                "deal_id": deal["id"] if deal else None,
                "rep_id": reps[i % 3]["id"],
                "current_step": (i % 4) + 1,
                "status": statuses[i],
            })
        res = db.table("flow_enrollments").insert(enrollments).execute()
        counts["flow_enrollments"] = len(res.data)

    # ── CALL TRANSCRIPTS ──
    if not check_exists("call_transcripts"):
        transcripts_data = []
        scenarios = [
            ("Discovery call with focus on current pain points and workflow challenges","Positive",["pain points","workflow","budget","timeline"]),
            ("Demo follow-up discussing implementation timeline and technical requirements","Positive",["implementation","technical","integration","timeline"]),
            ("Objection handling around pricing and competitor comparison","Neutral",["pricing","competitor","ROI","value"]),
            ("Executive check-in on strategic alignment and partnership goals","Positive",["strategy","partnership","growth","alignment"]),
            ("Pricing negotiation with focus on volume discounts and contract terms","Neutral",["pricing","discount","contract","terms"]),
            ("Technical deep-dive on API integration and data migration","Positive",["API","integration","migration","security"]),
            ("Quarterly business review covering adoption metrics and expansion","Positive",["adoption","metrics","expansion","ROI"]),
            ("Llamada de descubrimiento sobre necesidades del equipo de ventas","Positive",["ventas","equipo","necesidades","presupuesto"]),
            ("Llamada sobre implementación y requisitos técnicos","Neutral",["implementación","técnico","integración","plazo"]),
            ("Appel de suivi sur la proposition commerciale et les prochaines étapes","Positive",["proposition","commercial","étapes","budget"]),
        ]
        for i, (summary, sentiment, topics) in enumerate(scenarios):
            contact = contacts[i % len(contacts)]
            deal = deals[i % len(deals)] if deals else None
            lang = "Spanish" if i in [7,8] else ("French" if i == 9 else "English")
            transcript_text = f"[00:00] Rep: Hi {contact['name']}, thanks for joining today.\n[00:15] {contact['name']}: Thanks for setting this up.\n[00:30] Rep: I wanted to discuss {topics[0]} and {topics[1]}.\n[01:00] {contact['name']}: That's exactly what we've been looking at. Our main challenge is around {topics[2]}.\n[02:00] Rep: I completely understand. Many of our clients faced similar issues. Let me walk you through how we address {topics[0]}.\n[03:00] {contact['name']}: That sounds promising. What about {topics[3]}?\n[04:00] Rep: Great question. Our approach to {topics[3]} involves a phased rollout.\n[05:00] {contact['name']}: I'd like to loop in our {contact.get('title','')} for the next discussion.\n[06:00] Rep: Absolutely. I'll send over a summary and we can schedule a follow-up.\n[06:30] {contact['name']}: Sounds good. Talk soon."
            transcripts_data.append({
                "contact_id": contact["id"],
                "deal_id": deal["id"] if deal else None,
                "rep_id": reps[i % 3]["id"],
                "duration_seconds": 300 + i * 60,
                "transcript": transcript_text,
                "summary": summary,
                "language_detected": lang,
                "sentiment": sentiment,
                "key_topics": topics,
                "call_date": (datetime.now() - timedelta(days=i*3)).isoformat(),
            })
        res = db.table("call_transcripts").insert(transcripts_data).execute()
        counts["call_transcripts"] = len(res.data)

    # ── EMAILS ──
    if not check_exists("emails"):
        emails_data = []
        statuses = ["sent","sent","opened","replied","sent","sent","opened","draft","scheduled","sent"]
        for i in range(40):
            contact = contacts[i % len(contacts)]
            deal = deals[i % len(deals)] if deals else None
            st = statuses[i % len(statuses)]
            sent_at = (datetime.now() - timedelta(days=i*2, hours=i)).isoformat() if st in ["sent","opened","replied"] else None
            scheduled_at = (datetime.now() + timedelta(days=2)).isoformat() if st == "scheduled" else None
            emails_data.append({
                "deal_id": deal["id"] if deal else None,
                "contact_id": contact["id"],
                "rep_id": reps[i % 3]["id"],
                "thread_id": f"thread-{i//3}",
                "subject": f"Re: {deal['title'] if deal else 'Follow up'} - Update {i+1}",
                "body": f"Hi {contact['name']},\n\nFollowing up on our recent conversation. I wanted to share some updates regarding our proposal.\n\nLooking forward to hearing from you.\n\nBest regards",
                "status": st,
                "sent_at": sent_at,
                "scheduled_at": scheduled_at,
                "opened_at": (datetime.now() - timedelta(days=i*2-1)).isoformat() if st in ["opened","replied"] else None,
                "replied_at": (datetime.now() - timedelta(days=i*2-1)).isoformat() if st == "replied" else None,
                "ai_generated": i % 4 == 0,
            })
        res = db.table("emails").insert(emails_data).execute()
        counts["emails"] = len(res.data)

    # ── TASKS ──
    if not check_exists("tasks"):
        tasks_data = []
        types = ["email","call","whatsapp","review","email","call","email","custom","email","whatsapp"]
        priorities = ["urgent","high","normal","normal","low","high","urgent","normal","normal","high"]
        for i in range(30):
            contact = contacts[i % len(contacts)]
            deal = deals[i % len(deals)] if deals else None
            if i < 10:
                due = str(date.today())
            elif i < 20:
                due = str(date.today() - timedelta(days=(i-9)))
            else:
                due = str(date.today() + timedelta(days=(i-19)))
            tp = types[i % len(types)]
            tasks_data.append({
                "rep_id": reps[i % 3]["id"],
                "contact_id": contact["id"],
                "deal_id": deal["id"] if deal else None,
                "type": tp,
                "title": f"{tp.title()} task: {contact['name']}",
                "description": f"Follow up with {contact['name']} regarding {deal['title'] if deal else 'outreach'}",
                "due_date": due,
                "priority": priorities[i % len(priorities)],
                "status": "pending",
            })
        res = db.table("tasks").insert(tasks_data).execute()
        counts["tasks"] = len(res.data)

    # ── PLAY GUIDELINES ──
    if not check_exists("play_guidelines"):
        guidelines_data = []
        stage_list = ["Prospecting","Qualification","Discovery","Proposal","Negotiation"]
        for play in plays:
            for stage in stage_list[:4]:
                guidelines_data.append({
                    "play_id": play["id"],
                    "deal_stage": stage,
                    "guideline_title": f"{play['name']} - {stage} Guide",
                    "guideline_content": '["Research the prospect thoroughly before outreach","Personalize every touchpoint with company-specific insights","Focus on value metrics relevant to their industry","Set clear next steps with specific timelines"]',
                    "ai_generated": True,
                })
        res = db.table("play_guidelines").insert(guidelines_data).execute()
        counts["play_guidelines"] = len(res.data)

    # ── FORECAST ENTRIES ──
    if not check_exists("forecast_entries"):
        fe_data = []
        for deal in deals[:15]:
            fe_data.append({
                "rep_id": deal["rep_id"],
                "deal_id": deal["id"],
                "period": "Q2",
                "year": 2026,
                "forecast_category": deal.get("forecast_category","Pipeline"),
            })
        res = db.table("forecast_entries").insert(fe_data).execute()
        counts["forecast_entries"] = len(res.data)

    print("\n✅ Seed complete! Summary:")
    for table, count in counts.items():
        print(f"  {table}: {count} records inserted")
    if not counts:
        print("  All tables already have data — no inserts needed.")

if __name__ == "__main__":
    seed()
