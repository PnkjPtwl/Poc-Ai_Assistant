# AI Sales Engagement Platform — Vantage AI Outreach

A fully functional AI-powered B2B Sales Engagement Platform built as a POC. Unified workspace for sales reps to manage outreach, automate email cadences, get AI coaching during sales plays, and track pipeline forecasts.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vite + React + TypeScript, Tailwind CSS, Zustand, React Router v6, react-hot-toast, lucide-react, axios, date-fns |
| **Backend** | FastAPI (Python), aiosmtplib, APScheduler, Groq SDK, supabase-py |
| **Database** | Supabase (PostgreSQL) |
| **AI** | Groq API — `llama-3.3-70b-versatile` |

---

## Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **Supabase** account (free tier works)
- **Groq** API key (free at [console.groq.com](https://console.groq.com))
- **Gmail** App Password (for SMTP email sending)

---

## 1. Supabase Setup

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full schema SQL below:

```sql
-- Reps (sales users)
CREATE TABLE reps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT DEFAULT 'Account Executive',
  quota NUMERIC DEFAULT 500000,
  avatar_initials TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Companies
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  employee_count INT,
  location TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  whatsapp_number TEXT,
  company_id UUID REFERENCES companies(id),
  title TEXT,
  preferred_language TEXT DEFAULT 'English',
  timezone TEXT DEFAULT 'America/New_York',
  activity_score INT DEFAULT 0,
  last_contacted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals (CRM)
CREATE TABLE deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  contact_id UUID REFERENCES contacts(id),
  company_id UUID REFERENCES companies(id),
  rep_id UUID REFERENCES reps(id),
  stage TEXT CHECK (stage IN ('Prospecting','Qualification','Discovery','Proposal','Negotiation','Closed Won','Closed Lost')),
  amount NUMERIC DEFAULT 0,
  probability INT DEFAULT 0,
  close_date DATE,
  forecast_category TEXT CHECK (forecast_category IN ('Commit','Best Case','Pipeline','Omit')) DEFAULT 'Pipeline',
  next_step TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email templates
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  language TEXT DEFAULT 'English',
  open_rate NUMERIC DEFAULT 0,
  reply_rate NUMERIC DEFAULT 0,
  times_used INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Emails
CREATE TABLE emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID REFERENCES deals(id),
  contact_id UUID REFERENCES contacts(id),
  rep_id UUID REFERENCES reps(id),
  thread_id TEXT,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft','scheduled','sent','opened','replied','bounced')) DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  language TEXT DEFAULT 'English',
  ai_generated BOOLEAN DEFAULT false,
  template_id UUID REFERENCES email_templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Call transcripts
CREATE TABLE call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  rep_id UUID REFERENCES reps(id),
  duration_seconds INT,
  transcript TEXT NOT NULL,
  summary TEXT,
  language_detected TEXT DEFAULT 'English',
  sentiment TEXT CHECK (sentiment IN ('Positive','Neutral','Negative')),
  key_topics JSONB DEFAULT '[]',
  call_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sales plays
CREATE TABLE plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('Cold Outreach','Cross-Sell','Upsell','Onboarding','Renewal','Re-Engagement')),
  description TEXT,
  target_stages TEXT[],
  total_steps INT DEFAULT 0,
  duration_days INT DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flows
CREATE TABLE flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID REFERENCES plays(id),
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT CHECK (trigger_type IN ('deal_stage_change','time_elapsed','email_opened','email_replied','manual')),
  trigger_condition JSONB DEFAULT '{}',
  status TEXT CHECK (status IN ('active','paused','draft')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flow steps
CREATE TABLE flow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES flows(id) ON DELETE CASCADE,
  step_number INT NOT NULL,
  channel TEXT CHECK (channel IN ('email','whatsapp','call','task')) DEFAULT 'email',
  delay_days INT DEFAULT 0,
  subject_template TEXT,
  body_template TEXT,
  action_description TEXT,
  template_id UUID REFERENCES email_templates(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Flow enrollments
CREATE TABLE flow_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flow_id UUID REFERENCES flows(id),
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  rep_id UUID REFERENCES reps(id),
  current_step INT DEFAULT 1,
  status TEXT CHECK (status IN ('active','completed','paused','exited')) DEFAULT 'active',
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  next_action_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID REFERENCES reps(id),
  contact_id UUID REFERENCES contacts(id),
  deal_id UUID REFERENCES deals(id),
  flow_enrollment_id UUID REFERENCES flow_enrollments(id),
  type TEXT CHECK (type IN ('email','call','whatsapp','review','custom')) NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE DEFAULT CURRENT_DATE,
  priority TEXT CHECK (priority IN ('urgent','high','normal','low')) DEFAULT 'normal',
  status TEXT CHECK (status IN ('pending','snoozed','completed','dismissed')) DEFAULT 'pending',
  snoozed_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Play guidelines
CREATE TABLE play_guidelines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  play_id UUID REFERENCES plays(id),
  deal_stage TEXT,
  step_number INT,
  channel TEXT,
  guideline_title TEXT,
  guideline_content TEXT,
  ai_generated BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Forecast entries
CREATE TABLE forecast_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rep_id UUID REFERENCES reps(id),
  deal_id UUID REFERENCES deals(id),
  period TEXT,
  year INT,
  forecast_category TEXT CHECK (forecast_category IN ('Commit','Best Case','Pipeline','Omit')),
  rep_override_amount NUMERIC,
  manager_override_amount NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

3. Go to **Settings → API** and copy:
   - **Project URL** → `SUPABASE_URL`
   - **service_role key** (under "Project API keys") → `SUPABASE_SERVICE_KEY`

---

## 2. Gmail App Password Setup

1. Go to [Google Account → Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** if not already enabled
3. Go to [App Passwords](https://myaccount.google.com/apppasswords)
4. Select **Mail** → **Other** → name it "Vantage"
5. Copy the 16-character password → `SMTP_PASSWORD`

---

## 3. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Mac/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment
# Edit .env with your real keys:
#   SUPABASE_URL=https://xxx.supabase.co
#   SUPABASE_SERVICE_KEY=eyJ...
#   GROQ_API_KEY=gsk_...
#   SMTP_USER=yourmail@gmail.com
#   SMTP_PASSWORD=xxxx xxxx xxxx xxxx
#   SMTP_FROM_NAME=Your Name
```

### Run Seed Script

```bash
python seed.py
```

This populates the database with:
- 3 Sales Reps
- 15 Companies
- 35 Contacts
- 25 Deals (all stages)
- 12 Email Templates
- 4 Sales Plays
- 8 Flows with steps
- 15 Flow Enrollments
- 10 Call Transcripts (inc. Spanish & French)
- 40 Emails (mixed statuses)
- 30 Tasks (today, overdue, upcoming)
- 20 Play Guidelines

### Start Backend

```bash

uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend runs at **http://localhost:8000**. API docs at **http://localhost:8000/docs**.

---

## 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (webpack — no native binaries needed)
npm run dev
```

Frontend runs at **http://localhost:5173**.

---

## Project Structure

```
POC_Thursday/
├── backend/
│   ├── main.py              # FastAPI app, CORS, Supabase client, routers
│   ├── seed.py              # Idempotent database seeder
│   ├── requirements.txt     # Python dependencies
│   ├── .env                 # Environment variables
│   ├── routers/
│   │   ├── tasks.py         # Task CRUD, bulk actions, summary
│   │   ├── emails.py        # Draft, send, schedule, threads
│   │   ├── ai.py            # Groq-powered AI endpoints
│   │   ├── flows.py         # Flow management, enrollment
│   │   ├── deals.py         # Deal CRUD with timeline
│   │   ├── contacts.py      # Contact search and detail
│   │   ├── plays.py         # Sales play listing and guidelines
│   │   ├── forecast.py      # Forecast board with team rollup
│   │   └── calls.py         # Call transcript CRUD
│   └── services/
│       ├── groq_service.py  # Context assembly + all AI functions
│       ├── email_service.py # SMTP sending via aiosmtplib
│       └── scheduler_service.py # APScheduler for scheduled emails
│
└── frontend/
    ├── src/
    │   ├── App.tsx           # Root layout with routes
    │   ├── main.tsx          # Entry point with providers
    │   ├── index.css         # Global styles + Tailwind
    │   ├── store/appStore.ts # Zustand global state
    │   ├── api/client.ts     # Axios API client
    │   ├── pages/            # 12 page components
    │   └── components/       # Layout components (Sidebar, TopBar)
    ├── tailwind.config.js
    ├── postcss.config.js
    └── vite.config.ts
```

---

## Features

### Dashboard (`/`)
- Stat cards: Tasks Due Today, Emails Sent, Deals in Pipeline, Pipeline Value
- Today's Focus: top 5 priority tasks
- Pipeline Snapshot: horizontal bar chart by deal stage
- Recent Activity feed

### Task Queue (`/tasks`)
- Segmented tabs: All / Email / Call / WhatsApp / Review
- Bulk select + actions (Complete All, Dismiss All, Snooze All)
- Side drawer with deal context and quick actions
- "Open in Composer" for email tasks

### Email Composer (`/email/compose`)
- Split-pane: compose (60%) + context panel (40%)
- AI Draft via Groq with full deal context assembly
- Multi-language support with translation tabs
- Schedule with recipient timezone display
- Context panel: deal info, contact card, call transcripts, email thread

### Flows (`/flows`) & Flow Detail
- Flow cards with trigger type, enrollment count, status
- Vertical step timeline with channel icons and day delays
- Enrollment management: advance step, exit flow

### Sales Plays (`/plays`) & Play Detail
- Play cards with type badges, step count, duration
- AI Guidelines generation per deal stage via Groq
- Associated flows listing

### Forecast Board (`/forecast`)
- Summary cards: Commit, Best Case, Pipeline, Quota, Attainment %
- Inline-editable forecast category dropdowns
- Rep override amount editing
- Team Rollup table per rep

### Call Transcripts (`/calls`)
- Transcript list with sentiment badges and duration
- Full transcript modal with metadata chips
- AI Summarize button
- "Draft Follow-up Email" shortcut

### Contact Detail (`/contacts/:id`)
- Activity score ring visualization
- Tabbed view: Overview, Emails, Deals, Tasks, Calls

### Deal Detail (`/deals/:id`)
- Editable fields (auto-save on blur): stage, category, next step, notes, close date
- Chronological timeline: emails, tasks, calls
- Quick compose email shortcut

### Settings (`/settings`)
- Active rep selector (persisted to localStorage)
- SMTP configuration with test email
- Groq API key field (masked)
- Connection status indicators

---

## Key Implementation Details

- **Context Assembly**: Every AI call uses `assemble_deal_context()` which fetches live data (contact, company, deal, email history, call transcripts, completed tasks) from Supabase and injects it into the Groq system prompt. Never cached.

- **Email → Task Sync**: When an email is sent, linked pending tasks are automatically marked as completed.

- **WhatsApp Integration**: Generates conversational messages via Groq and returns `wa.me` URLs with pre-filled text in E.164 format.

- **APScheduler**: On startup, restores all `scheduled` emails from DB and registers them as timed jobs.

- **CORS**: `allow_origins=["*"]` for development.

---

## API Endpoints Summary

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/reps` | List all sales reps |
| GET | `/tasks` | List tasks (filterable) |
| PATCH | `/tasks/{id}` | Update task status |
| POST | `/tasks/bulk` | Bulk complete/dismiss/snooze |
| GET | `/tasks/summary` | Task counts by type/priority |
| POST | `/emails/draft` | Save email draft |
| POST | `/emails/send` | Send email via SMTP |
| POST | `/emails/schedule` | Schedule email for later |
| GET | `/emails` | List emails (filterable) |
| GET | `/emails/threads` | Email threads by deal |
| POST | `/ai/draft-email` | AI-generate email draft |
| POST | `/ai/translate-email` | Translate email |
| POST | `/ai/generate-guidelines` | Generate play guidelines |
| POST | `/ai/whatsapp-message` | Generate WhatsApp message |
| POST | `/ai/summarize-transcript` | AI-summarize transcript |
| GET | `/flows` | List flows |
| GET | `/flows/{id}` | Flow detail + steps |
| POST | `/flows/{id}/enroll` | Enroll contact in flow |
| GET | `/flows/{id}/enrollments` | List enrollments |
| PATCH | `/flows/enrollments/{id}/advance` | Advance enrollment |
| GET | `/deals` | List deals |
| GET | `/deals/{id}` | Deal detail + timeline |
| PATCH | `/deals/{id}` | Update deal |
| GET | `/contacts` | List/search contacts |
| GET | `/contacts/{id}` | Contact detail |
| GET | `/plays` | List plays |
| GET | `/plays/{id}/guidelines` | Play guidelines |
| GET | `/forecast` | Forecast data |
| PATCH | `/forecast/deals/{id}/category` | Update forecast category |
| GET | `/forecast/summary` | Team forecast rollup |
| GET | `/calls` | List transcripts |
| GET | `/calls/{id}` | Full transcript |
| POST | `/calls` | Create new call |
| PATCH | `/calls/{id}/summarize` | AI-summarize call |
