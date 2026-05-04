# Product Requirements Document (PRD)
## Project Vantage: AI-Powered Sales Execution Workspace

### 1. Product Overview
Vantage is a unified workspace for sales representatives that combines CRM management, email automation, and conversational AI into a single high-performance dashboard.

### 2. User Personas
- **The High-Velocity Rep**: Needs to clear 50+ tasks a day without switching tabs.
- **The Strategic Account Executive**: Needs deep AI analysis of complex email threads to find the "closing signal."

### 3. Functional Requirements

#### F1: Strategic Task Queue (Priority Inbox)
- **Requirement**: Display a prioritized list of tasks (Emails, Calls, Follow-ups).
- **AI Logic**: Rank tasks by deal value and proximity to the next "Sales Play" step.

#### F2: Pulse Matrix (Sentiment Analysis)
- **Requirement**: Real-time sentiment scoring of prospect communication.
- **Visuals**: Use color-coded indicators (Red/Yellow/Green) to show deal health based on AI thread analysis.

#### F3: Smart Assistant (Conversational Interface)
- **Requirement**: A chatbot capable of multi-source data retrieval (Deals + Tasks + Emails).
- **Action Triggers**: The assistant must support executable commands for sending emails (SMTP) directly from the chat.
- **Persistence**: Conversation history must be preserved via browser storage.

#### F4: Background Inbox Integration (Auto-Sync)
- **Requirement**: Background IMAP polling every 60 seconds.
- **Privacy Filter**: Automatic regex-based redaction of sender/body for social media and personal domains.

#### F5: Outreach Lab (One-Click Drafting)
- **Requirement**: AI-generated email responses with tone-switching capability.

### 4. Technical Architecture
- **Backend**: FastAPI with APScheduler for background IMAP tasks.
- **AI Engine**: Groq LPU (Llama 3.1 8B/70B) for ultra-low latency inference.
- **Storage**: Supabase PostgreSQL for persistent deal and email states.
- **Email Delivery**: SMTP via standard TLS (Gmail/Outlook compatible).

### 5. UI/UX Requirements
- **Focus Mode**: A fullscreen toggle for the Smart Assistant to hide all dashboard navigation.
- **Typography**: Compact, enterprise-grade font scaling (14px/1.6 line height) for readability.
- **Micro-Animations**: Smooth Framer Motion transitions for state changes.

### 6. Security & Compliance
- **Privacy Filter**: Redacts `instagram.com`, `amazon.com`, `no-reply@`, etc.
- **Data Isolation**: Multi-tenant support via Supabase RLS (Row Level Security).
