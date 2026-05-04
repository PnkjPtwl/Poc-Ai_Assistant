import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client, Client

load_dotenv()

# Supabase client (global singleton)
supabase: Client = create_client(
    os.getenv("SUPABASE_URL", ""),
    os.getenv("SUPABASE_SERVICE_KEY", "")
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: restore scheduled email jobs and start auto-sync
    from services.scheduler_service import restore_scheduled_jobs, schedule_auto_sync
    await restore_scheduled_jobs(supabase)
    schedule_auto_sync(supabase)
    yield
    # Shutdown: stop scheduler
    from services.scheduler_service import scheduler
    if scheduler.running:
        scheduler.shutdown(wait=False)

app = FastAPI(
    title="AI Sales Engagement Platform",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Register routers ──────────────────────────────────────
from routers import tasks, emails, ai, flows, deals, contacts, plays, forecast, calls

app.include_router(tasks.router, prefix="/tasks", tags=["Tasks"])
app.include_router(emails.router, prefix="/emails", tags=["Emails"])
app.include_router(ai.router, prefix="/ai", tags=["AI"])
app.include_router(flows.router, prefix="/flows", tags=["Flows"])
app.include_router(deals.router, prefix="/deals", tags=["Deals"])
app.include_router(contacts.router, prefix="/contacts", tags=["Contacts"])
app.include_router(plays.router, prefix="/plays", tags=["Plays"])
app.include_router(forecast.router, prefix="/forecast", tags=["Forecast"])
app.include_router(calls.router, prefix="/calls", tags=["Calls"])

@app.get("/health")
async def health():
    return {"status": "ok"}

@app.get("/reps")
async def list_reps():
    res = supabase.table("reps").select("*").order("name").execute()
    return res.data

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
