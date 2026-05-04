# 🎯 Demo Walkthroughs — AI Sales Engagement Platform
### Based on live database snapshot (April 24, 2026)

---

> [!IMPORTANT]
> **Before you start:** Make sure both servers are running.
> - Backend: `venv\Scripts\python.exe -m uvicorn main:app --reload` (port 8000)
> - Frontend: `npm run dev` (port 3000)
> Select rep **"Sarah Chen"** or **"Marcus Johnson"** from the rep selector on first load.

---

## 🎬 Walkthrough 1 — "The Hot Deal in Proposal Stage"
### Deal: **Deal-Jennifer-11** · Jennifer Liu @ Apex Manufacturing · $280,000

**Why this deal?**
- $280K — highest value deal, making it visually impactful
- Stage = **Proposal**, forecast = **Best Case** (shows forecast mechanics)
- Has **1 sent email** + a **completed flow enrollment** (Post-Demo Nurture)
- Has **call transcripts** with summaries
- Active **next_step = "Executive review"** — perfect to change live
- Contact has high engagement and is at a decision stage

---

### Step 1 — Dashboard Overview
**Navigate to: `/` (Dashboard)**

- Point out the **KPI cards**: total pipeline value ($2.55M), commit vs best case
- Show the **Task Queue summary** widget — pending tasks count
- Show the **deals list** — find "Deal-Jennifer-11" at the top ($280K)
- **Click into the deal** from the dashboard

> 💬 *"This is our live pipeline. The AI platform surfaces the most critical deals — let's look at our biggest one."*

---

### Step 2 — Deal Detail: Info Tab
**Navigate to: `/deals/4478dbfd...`**

Show the deal header:
- **$280,000 · Proposal · 80% probability · Best Case**
- Contact: Jennifer Liu, Company: Apex Manufacturing

**Live change to demonstrate:** Change **Stage** from `Proposal` → `Negotiation`
- Select from the dropdown → it auto-saves on blur
- Watch the stage badge update immediately
- **Point out:** "This immediately affects the Forecast Board"

Then change **Next Step** from `"Executive review"` → `"Send final contract draft"`

> 💬 *"Every field auto-saves. No save button needed. Changes propagate to the forecast and task queue in real time."*

---

### Step 3 — Generate Executive Briefing (AI)
**Still on Deal Detail**

Click the **"1-Click Executive Briefing"** button (purple gradient, top right)

Watch the AI:
1. Pull deal context (stage, amount, close date)
2. Pull email history
3. Pull call transcript summaries
4. Generate a structured briefing in ~3-5 seconds

Point out sections:
- **Executive Summary** — 2 sentence deal health
- **Key Pain Points** — extracted from call transcripts
- **Recommended Strategy** — 3 specific action bullets

> 💬 *"In 5 seconds, the rep has a full pre-meeting brief assembled from every touchpoint — emails, calls, deal data. No manual prep."*

---

### Step 4 — Timeline Tab
Click **"Timeline"** tab on the deal

Show:
- Previously **sent email** (from the emails table)
- The email status: `sent`
- Call activity logged

> 💬 *"Full activity history — every email, call, and task linked to this deal."*

---

### Step 5 — Flows & Plays Tab
Click **"Flows & Plays"** tab

Show:
- **Completed enrollment** in "Post-Demo Nurture - Flow 1" (step 3/5, completed from seed data)
- The step timeline with ✅ completed steps

**Live action:** Click **"Enroll in Flow"**
1. Select **"Cold Outreach Play"** (or "Post-Demo Nurture" again)
2. Select **"Cold Outreach Play - Flow 1"** (active, 5 steps)
3. Click **"Enroll Deal"**

Now the enrollment appears with Step 1 active (email step).

**Click "Execute Step 1: email"**
- Watch the loading state
- Result popup appears with:
  - AI-generated subject line for Jennifer Liu @ Apex Manufacturing
  - Full email body drafted from deal context
  - Confirmation: "Saved as draft in Email Composer"

> 💬 *"The AI just drafted a contextual email using the deal stage, company info, and call history — in one click. The rep just needs to review and send."*

---

### Step 6 — Email Composer
**Navigate to: `/email/compose`**

Show the draft that just appeared (from the flow step execution):
- Pre-filled subject + body
- **Language selector** — change to Spanish or French
- Click **"AI Translate"** → body translates instantly
- Click **"Send"** to demonstrate real SMTP send (or just show the draft)

> 💬 *"Multi-language support built in. One click to translate. The email goes through real SMTP."*

---

### Step 7 — Task Queue
**Navigate to: `/tasks`**

Show:
- The tasks created by the flow enrollment (call + review tasks)
- **Bulk complete** tasks by checking multiple
- Show the **summary bar** (today/overdue/done counts)

> 💬 *"Every flow step auto-creates a task. Reps see exactly what to do and when."*

---

### Step 8 — Forecast Board
**Navigate to: `/forecast`**

Show:
- The stage change from Step 2 reflected here — deal moved from Best Case to the Negotiation bucket
- **Drag & drop** a deal between forecast categories (Commit → Best Case)
- Show total pipeline values

> 💬 *"The forecast board updates in real-time as reps move deals through stages."*

---

## 🎬 Walkthrough 2 — "Re-Engaging a Lost Deal + Cold Outreach"
### Deal: **Deal-Akiko-8** · Akiko Tanaka @ HealthBridge Systems · $180,000

**Why this deal?**
- Stage = **Prospecting**, has an **active flow enrollment** (Renewal & Re-engagement, step 4/5)
- Contact has a **Positive call sentiment** transcript
- Has `draft` + `opened` email statuses — great to show email thread
- Contact: Akiko Tanaka — Japanese healthcare company → great for **multi-language email demo**
- `next_step = "Schedule demo"` — perfect to update live

---

### Step 1 — Start from Plays
**Navigate to: `/plays`**

Show the 4 plays:
- **Cold Outreach Play** — for Prospecting/Qualification
- **Post-Demo Nurture** — for Discovery/Proposal
- **Expansion/Upsell** — for Closed Won
- **Renewal & Re-Engagement** — for Negotiation/Closed Lost ← click this one

**On Play Detail:**
- Show the play type, steps, duration
- Show **AI Guidelines** — click **"Generate"** for the "Prospecting" stage
- Watch Groq generate 3-5 specific sales coaching bullets in real time

> 💬 *"Plays are strategic playbooks. The AI generates coaching guidelines specific to each deal stage — like having a sales coach in the app."*

---

### Step 2 — Navigate to Deal
**Navigate to: `/deals/db057ca2...` (Deal-Akiko-8)**

Show:
- Stage: **Prospecting** · $180,000 · **Pipeline** forecast
- next_step: "Schedule demo"

**Live change:** Change **Forecast Category** from `Pipeline` → `Best Case`
- Instant save
- Point out this affects the forecast board total

---

### Step 3 — Call Transcripts
**Navigate to: `/calls`**

Filter by the deal or contact. Show Akiko Tanaka's transcript:
- **Sentiment: Positive**
- Summary visible in the list
- Click to expand — show the full transcript
- Click **"AI Summarize"** → Groq re-analyzes and shows:
  - Key topics discussed
  - Sentiment classification
  - Action items extracted

> 💬 *"Every sales call is logged with AI-powered analysis. Sentiment tracking, key topics, automatic summaries."*

---

### Step 4 — AI Email Composer (Multi-language)
**Navigate to: `/email/compose`**

1. Select **Contact:** Akiko Tanaka
2. Select **Deal:** Deal-Akiko-8
3. Set **Intent:** "Discovery call follow-up"
4. Click **"AI Draft Email"**

Watch the AI:
- Assemble context (deal stage, call transcript, company info)
- Generate a personalized email body

**Now demonstrate language:**
5. Change language selector to **Japanese** (or Spanish)
6. Click **"AI Translate"**
7. Show both English + translated version side by side

> 💬 *"Context-aware email drafting. The AI reads the call transcript, the deal stage, and the contact's profile to write a relevant email."*

**Schedule it:**
8. Click **"Schedule"** → pick a date/time tomorrow
9. Show toast: "Email scheduled"

> 💬 *"Emails can be sent immediately or scheduled. The backend scheduler handles delivery automatically."*

---

### Step 5 — Flows & Plays Tab on Deal
**Back to Deal-Akiko-8 → Flows & Plays tab**

Show existing **active enrollment** in "Renewal & Re-engagement - Flow 2" at step 4:
- Steps 1-3 shown as ✅ completed
- Step 4 (call step) highlighted as current

**Click "Execute Step 4: call"**
- Result: "Call task logged as completed"
- Enrollment advances to step 5

**Click "Execute Step 5: email"**
- AI drafts final re-engagement email
- Shows subject + body in popup
- Enrollment status → **completed!** 🎉

> 💬 *"The entire re-engagement sequence ran in 2 clicks. Each step either drafts an email, logs a call, or generates a WhatsApp message — automatically, with AI context."*

---

### Step 6 — WhatsApp Step (bonus if time)
**Enroll in a new flow that has a WhatsApp step**

1. Click "Enroll in Flow" → Select "Cold Outreach Play" → Flow 1
2. Enroll → Execute Step 1 (email) → Execute Step 2 (email) → Execute Step 3 (whatsapp)
3. WhatsApp popup shows:
   - Generated message
   - **"Open in WhatsApp"** button → opens `wa.me` link

> 💬 *"Multi-channel outreach — email, call, and WhatsApp — all orchestrated from one flow."*

---

### Step 7 — Forecast Impact
**Navigate to: `/forecast`**

Show:
- Deal-Akiko-8 now shows as **Best Case** (changed in Step 2)
- Drag it to **Commit** → value adds to the $925K commit total
- Show the summary totals updating

---

## 📋 Feature Coverage Matrix

| Feature | Walkthrough 1 | Walkthrough 2 |
|---|---|---|
| Dashboard KPIs | ✅ | — |
| Deal Stage Change (live save) | ✅ | ✅ |
| AI Executive Briefing | ✅ | — |
| Deal Timeline | ✅ | — |
| Flow Enrollment from Deal | ✅ | ✅ |
| Flow Step Execution (email) | ✅ | ✅ |
| Flow Step Execution (call) | — | ✅ |
| Flow Step Execution (whatsapp) | — | ✅ |
| Flow Completion 🎉 | — | ✅ |
| AI Email Drafting | ✅ | ✅ |
| Email Translation (multi-lang) | ✅ | ✅ |
| Email Scheduling | — | ✅ |
| Task Queue | ✅ | — |
| Call Transcripts + AI Summarize | — | ✅ |
| Sales Plays + AI Guidelines | — | ✅ |
| Forecast Board + Drag & Drop | ✅ | ✅ |
| WhatsApp Generation | — | ✅ |

---

## ⚡ Quick Navigation Reference

| What to show | URL |
|---|---|
| Dashboard | `localhost:3000/` |
| Deal-Jennifer ($280K) | `localhost:3000/deals/4478dbfd-...` |
| Deal-Akiko ($180K) | `localhost:3000/deals/db057ca2-...` |
| Email Composer | `localhost:3000/email/compose` |
| Task Queue | `localhost:3000/tasks` |
| Flows | `localhost:3000/flows` |
| Plays | `localhost:3000/plays` |
| Forecast | `localhost:3000/forecast` |
| Call Transcripts | `localhost:3000/calls` |

> [!TIP]
> Open DevTools Network tab during AI calls — show the actual POST to `/ai/draft-email`, the Groq API being called, and the JSON response. Great for technical panels.
