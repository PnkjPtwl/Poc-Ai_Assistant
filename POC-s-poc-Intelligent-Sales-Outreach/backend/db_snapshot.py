"""
DB Snapshot Script — queries all key tables and prints a structured summary
"""
import os, json
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()
db = create_client(os.getenv("SUPABASE_URL",""), os.getenv("SUPABASE_SERVICE_KEY",""))

def q(table, select="*", **filters):
    query = db.table(table).select(select)
    for k,v in filters.items():
        query = query.eq(k, v)
    return query.execute().data or []

def sep(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print('='*60)

# REPS
sep("REPS")
reps = q("reps")
for r in reps:
    print(f"  [{r['id'][:8]}] {r['name']} | {r['role']} | quota=${r.get('quota',0):,}")

# CONTACTS + COMPANIES
sep("CONTACTS (with company)")
contacts = db.table("contacts").select("*, companies(*)").execute().data or []
for c in contacts:
    co = c.get("companies") or {}
    print(f"  [{c['id'][:8]}] {c['name']} | {c.get('title','?')} @ {co.get('name','?')} ({co.get('industry','?')}) | lang={c.get('preferred_language','EN')} | score={c.get('activity_score',0)}")

# DEALS
sep("DEALS (with contact+company)")
deals = db.table("deals").select("*, contacts(name), companies(name)").order("amount", desc=True).execute().data or []
for d in deals:
    print(f"  [{d['id'][:8]}] {d['title']}")
    print(f"           Stage={d['stage']} | ${d.get('amount',0):,} | prob={d.get('probability',0)}% | forecast={d.get('forecast_category','?')}")
    print(f"           Contact={d.get('contacts',{}).get('name','?')} | Company={d.get('companies',{}).get('name','?')}")
    print(f"           next_step={d.get('next_step','—')} | close={d.get('close_date','?')}")
    print()

# EMAILS per deal
sep("EMAILS (by deal)")
emails = db.table("emails").select("deal_id, subject, status, language, sent_at").order("created_at", desc=True).limit(30).execute().data or []
deal_emails = {}
for e in emails:
    did = e.get("deal_id","none")
    deal_emails.setdefault(did,[]).append(e)
for did, ems in deal_emails.items():
    print(f"  deal {str(did)[:8]}: {len(ems)} emails — statuses: {set(e['status'] for e in ems)}")

# TASKS
sep("TASKS summary")
tasks = q("tasks")
from collections import Counter
statuses = Counter(t['status'] for t in tasks)
types = Counter(t['type'] for t in tasks)
print(f"  Total tasks: {len(tasks)}")
print(f"  By status: {dict(statuses)}")
print(f"  By type:   {dict(types)}")
# Show a few pending
pending = [t for t in tasks if t['status']=='pending'][:5]
for t in pending:
    print(f"    PENDING [{t['id'][:8]}] {t['type']}: {t['title'][:60]} | due={t.get('due_date','?')}")

# CALLS / TRANSCRIPTS
sep("CALL TRANSCRIPTS")
calls = db.table("call_transcripts").select("id, deal_id, contact_id, sentiment, summary, call_date, duration_seconds").order("call_date", desc=True).limit(10).execute().data or []
for c in calls:
    print(f"  [{c['id'][:8]}] deal={str(c.get('deal_id','?'))[:8]} | {c.get('sentiment','?')} | {c.get('call_date','?')[:10]}")
    print(f"           summary: {str(c.get('summary',''))[:100]}")

# PLAYS
sep("PLAYS")
plays = q("plays")
for p in plays:
    print(f"  [{p['id'][:8]}] {p['name']} | type={p.get('type','?')} | stages={p.get('target_stages',[])} | steps={p.get('total_steps',0)}")

# FLOWS
sep("FLOWS")
flows = db.table("flows").select("*, flow_steps(*)").execute().data or []
for f in flows:
    steps = f.get("flow_steps",[])
    print(f"  [{f['id'][:8]}] {f['name']} | status={f['status']} | steps={len(steps)}")
    for s in sorted(steps, key=lambda x: x.get("step_number",0)):
        print(f"    step{s['step_number']}: {s['channel']} — {s.get('action_description','')[:50]} (day {s.get('delay_days',0)})")

# FLOW ENROLLMENTS
sep("FLOW ENROLLMENTS")
enrolls = db.table("flow_enrollments").select("*, flows(name), contacts(name), deals(title)").execute().data or []
for e in enrolls:
    print(f"  [{e['id'][:8]}] flow={e.get('flows',{}).get('name','?')} | deal={e.get('deals',{}).get('title','?')}")
    print(f"           contact={e.get('contacts',{}).get('name','?')} | step={e.get('current_step')} | status={e['status']}")

# FORECAST
sep("FORECAST SUMMARY")
for cat in ["Commit","Best Case","Pipeline","Omit"]:
    cat_deals = [d for d in deals if d.get("forecast_category")==cat]
    total = sum(d.get("amount",0) for d in cat_deals)
    print(f"  {cat:12s}: {len(cat_deals)} deals | ${total:,.0f}")

# PLAY GUIDELINES
sep("PLAY GUIDELINES (count per play+stage)")
guidelines = q("play_guidelines")
from collections import defaultdict
g_map = defaultdict(list)
for g in guidelines:
    g_map[g.get("play_id","?")].append(g.get("deal_stage","?"))
for pid, stages in g_map.items():
    print(f"  play {pid[:8]}: guidelines for stages: {set(stages)}")

print("\n\n✅ DB snapshot complete.")
