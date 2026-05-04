# Vantage AI — Founder Reference
> How the system actually works, what it's costing right now, and what to expect as we scale.

---

## How Email Ingestion Works (Reading from Inbox)

Every 60 seconds, `APScheduler` triggers a background job that calls `imap_service.py`. Here's exactly what happens:

1. **Login** — connects to your mail server using `IMAP4_SSL` (Python's built-in `imaplib`). Uses your email + app password to authenticate. No OAuth yet — that's a production upgrade.

2. **Fetch** — pulls unread/recent emails from the inbox using standard IMAP commands (`SEARCH`, `FETCH`). Grabs subject, sender, recipient, body, date.

3. **Privacy filter** — before anything is saved, a regex + keyword matcher runs on the sender address and subject. If it matches personal patterns (Amazon, Netflix, bank alerts, etc.), it gets dropped entirely. This happens **in memory** — it never touches the database.

4. **Save** — clean, work-related emails are written to Supabase (PostgreSQL). Indexed on `sender`, `recipient`, `date`, and `urgency_score` so queries stay fast.

5. **Failures** — if the sync fails (network issue, IMAP timeout), it logs the error and retries on the next 60s cycle.

**What this means practically:** Your inbox is always at most 60 seconds behind. The AI never sees your personal emails — they're filtered before storage.

---

## How Email Sending Works (Sending from Vantage)

When you confirm an AI-drafted email, here's the chain:

1. **You type `CONFIRM`** in the chat.

2. **Backend looks at chat history** — finds the last drafted email in the session.

3. **Generates a command** — internally produces `COMMAND: SEND_EMAIL` with the recipient, subject, and body.

4. **SMTP dispatch** — `email_service.py` connects to your SMTP server (same credentials as IMAP) and sends the email directly from your account. It goes out as *you*, from your actual email address.

5. **Logged** — success or failure is written back to Supabase. The dashboard updates in real time via WebSocket.

**What this means practically:** Emails sent through Vantage look exactly like emails you sent manually. Same sender, same domain, no third-party relay visible to the recipient.

---

## How the AI Actually Answers Your Questions

When you type a query in the chat:

1. **Frontend** (React) sends it via Axios to FastAPI at `/api/chat/assistant`.

2. **Context is assembled** — FastAPI pulls together:
   - Recent emails from PostgreSQL
   - Your active deals and stages (SQLAlchemy ORM)
   - Pending tasks with due dates
   - Last 10–50 messages from this session (stored in Redis)

3. **Sent to Groq** — the full context (capped at 8,000 tokens) goes to Groq Cloud running Llama 3.1-70B.

4. **Response streams back** — tokens come back over a WebSocket (Socket.io) so you see the reply as it's being written, not after a delay.

5. **If there's an action** (like drafting an email) — Groq embeds a hidden command in the response. The backend detects it and prepares the draft, waiting for your `CONFIRM`.

---

## What It's Costing Right Now (POC)

Running locally or on a free/starter tier, your actual cash spend is close to zero — but here's the real cost breakdown once you're on paid services:

| What | Cost |
|---|---|
| **Groq API** (Llama 3.1-70B) | $0.10 per 1M input tokens + $0.30 per 1M output tokens |
| **Supabase** (Free tier) | $0 now → $25/mo on Pro |
| **SMTP sending** | $0 (using your own email account's SMTP) |
| **Hosting** (if local) | $0 now |
| **Redis** (if local) | $0 now |

**Groq cost in real terms:** A typical user session with ~10 queries, each pulling 2,000 tokens of context and getting a 500 token reply = ~25K tokens per day. At that rate one active user costs **~$0.05–0.10/day** on Groq. Very cheap right now.

**Total POC burn: roughly $0–5/month** depending on how much you're querying Groq.

---

## What It'll Cost as We Scale (Production)

Once we move to paid infra and start onboarding users, costs shift. Here's the honest picture:

### Per-User Monthly Cost (Shared Infrastructure, ~100 users)

| Component | Cost/User/Mo |
|---|---|
| Groq AI (~2M input + 1M output tokens) | $0.50 |
| Supabase PostgreSQL | $0.25 |
| SMTP (own account, no relay cost) | $0.00 |
| Backend hosting (Railway/Render) | $0.50 |
| Frontend hosting (Vercel) | $0.20 |
| Redis (AWS ElastiCache) | $0.20 |
| Monitoring | $0.50 |
| Stripe fees (2.9% of revenue) | $0.50 |
| Support overhead | $2.00 |
| **Total** | **~$4.65/user/mo** |

We're pricing at $29–79/user/mo, so **gross margin sits around 70%+** even at 100 users.

### How Costs Drop as We Grow

| Users | COGS/User/Mo | Why it drops |
|---|---|---|
| 100 | ~$4.65 | Shared infra, fixed costs spread thin |
| 1,000 | ~$3.50 | DB and hosting fixed costs amortize further |
| 10,000 | ~$2.50 | Volume discounts on infra, Groq usage stays linear |

The only cost that scales **linearly with usage** is Groq (AI tokens). Everything else (hosting, DB, Redis) is largely fixed until we hit capacity thresholds.

### Biggest Cost Risk to Watch

If users query the AI heavily (power users doing 100+ queries/day), Groq costs can spike. A user doing 100 queries/day at ~3K tokens each = ~300K tokens/day = ~$9/month just in AI cost for that one user. This is why the Starter tier caps at 10 queries/day — it protects margin.

### Future Infrastructure Upgrades and Their Cost Impact

| Upgrade | When | Added Cost/User/Mo |
|---|---|---|
| OAuth2 (Google/M365) | Before public launch | $0 (free API) |
| Supabase Pro (RLS, backups) | At first paying customer | +$0.25 |
| pgvector semantic search | When session history gets long | $0 (included in Supabase) |
| Dedicated Groq instance | At ~500+ users, for SLA | +$5.00 |
| Multi-region DB replication | Enterprise customers only | +$3.00 |
| SOC2 compliance audit | If targeting enterprise | One-time $5K–20K |

---

## TL;DR

- **Right now:** costs almost nothing. Groq is the only real spend and it's fractions of a cent per query.
- **At 100 users:** ~$4.65/user/mo to run, charging $29–79 → healthy margins.
- **Main thing to watch:** Groq token usage from power users. Cap queries on lower tiers.
- **As we grow:** fixed infra costs amortize, margins improve. Only Groq scales with actual usage.