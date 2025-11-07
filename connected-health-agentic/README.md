# Connected Health Agentic

A multi-agent prototype for Pakistan’s connected health ecosystem featuring a Prisma-powered backend, LangGraph orchestrator with Gemini reasoning, MCP tool server, and a Next.js PWA-friendly frontend. All data and flows are mock, auditable, and runnable locally with Docker.

## Repository structure

```
connected-health-agentic/
├── backend/
│   ├── src/
│   ├── prisma/
│   └── Dockerfile
├── agents/
│   ├── orchestration/
│   ├── data/
│   └── Dockerfile
├── mcp-server/
│   └── Dockerfile
├── frontend/
│   ├── app/
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Prerequisites

- Docker and docker-compose
- Optionally Node.js 20+ and Python 3.10+ if running services individually

## Quick start

1. Copy environment template:

   ```bash
   cp .env.example .env
   ```

   Update values if needed (e.g., `GEMINI_API_KEY`). Leaving the key blank keeps the system in degraded/offline mode with deterministic rules.

2. Launch the full stack:

   ```bash
   docker-compose up --build
   ```

   Services:

   - Backend API on <http://localhost:3001>
   - LangGraph orchestrator on <http://localhost:8000>
   - MCP server on <http://localhost:7000>
   - Next.js frontend on <http://localhost:3000>
   - PostgreSQL database on port 5432

3. Seed the database (in another terminal inside the backend container):

   ```bash
   docker-compose exec backend npx prisma migrate deploy
   docker-compose exec backend npm run prisma:seed
   ```

   The Docker entrypoint already runs migrations on start; the seed command loads facilities, programs, patients, reminders, and analytics examples.

4. Visit the frontend at <http://localhost:3000> to access the citizen chat, LHW console, reminder hub, and admin dashboard.

## Architecture summary

- **Backend (Node.js + Express + Prisma):** exposes REST APIs for triage orchestration, facilities, program eligibility, reminders, analytics, knowledge base, patients, and MCP logging. Provides degraded mode detection and seeds PostgreSQL with representative data.
- **Agents (Python + LangGraph):** orchestrates multi-agent workflow (triage, facility finder, program eligibility, follow-up, analytics). Integrates Google Gemini via `google-genai` with rule-based fallback, uses Chroma for RAG, and exposes `/run` HTTP endpoint via FastAPI.
- **MCP Server (Node.js):** implements Model Context Protocol tools that wrap backend endpoints for safe, auditable agent tool usage.
- **Frontend (Next.js + Tailwind):** PWA-friendly app router UI with mobile-first chat, patient roster for LHWs, reminders timeline, and admin analytics.
- **Database:** PostgreSQL schema for users, patients, facilities, inventory, programs, interactions, reminders, analytics events, and MCP tool logs.

### MCP tool catalog

The MCP server exposes the following audited tools for LangGraph or compatible clients:

- `get_patient_profile` – fetch a patient record from the backend by ID.
- `save_interaction_log` – persist structured interaction summaries to the interactions table.
- `check_program_eligibility` – evaluate subsidy/program fit given demographics.
- `get_facility_recommendations` – retrieve top facilities for a location and service need.
- `create_reminder` – schedule medication, vaccine, or follow-up reminders.
- `get_triage_rules_cached` – access cached rule JSON for degraded/offline triage.
- `query_knowledge_base` – query the knowledge base embeddings index for supporting facts.

## Environment variables

Key variables (see `.env.example`):

- `DATABASE_URL` – PostgreSQL connection string used by Prisma.
- `GEMINI_API_KEY` – optional Gemini key; leave blank for degraded mode.
- `LANGGRAPH_URL` – LangGraph orchestrator endpoint used by backend.
- `MCP_SERVER_URL` – informational for integration references.
- `NEXT_PUBLIC_API_BASE_URL` – backend URL consumed by the frontend.
- `FORCE_DEGRADED_MODE` – set `true` to simulate offline mode end-to-end.

## Testing the orchestrator

With the stack running you can call the orchestrator directly:

```bash
cd agents
python run_example.py
```

This posts “Bachay ko bukhar hai, Sehat Card hai, kahan jaun?” to the LangGraph workflow and prints the combined reply and state payload.

## Safety & auditing notes

- Every tool call from the MCP server is logged to the backend `/api/mcp/logs` table.
- Triage outputs embed a prominent emergency disclaimer.
- Degraded/offline mode ensures deterministic rule-based decisions when Gemini or network services are unavailable.
- Analytics endpoints aggregate counts without exposing PII (only synthetic mock data is stored).

## Development tips

- Run `npm run dev` inside `backend` or `frontend` for live reload during local development.
- For the agents service, create a virtual environment and install `requirements.txt`, then run `uvicorn main:app --reload`.
- Use `docker-compose down -v` to reset the PostgreSQL volume if you need a clean database.
