# Task 001 – Project Bootstrap

## Goal
Create a working local environment with FastAPI backend + Next.js frontend that can talk to each other. Add a health-check API and simple frontend page to test integration.

## Steps
1. **Backend (FastAPI)**
   - Create `backend/main.py` with a minimal FastAPI app.
   - Add CORS middleware to allow requests from `http://localhost:3000`.
   - Add endpoint `GET /health` returning `{"status": "ok"}`.

2. **Frontend (Next.js)**
   - Create Next.js 15 project under `/frontend`.
   - Add Tailwind CSS + shadcn/ui setup.
   - Create page `/health` that calls `http://localhost:8000/health` and renders the JSON response.

3. **Integration**
   - Run backend (`uvicorn main:app --reload --port 8000`).
   - Run frontend (`npm run dev` on port 3000).
   - Visit `/health` in browser, see `{status: "ok"}`.

## Acceptance Criteria
- Backend and frontend both run locally.
- Calling `/health` page in FE shows backend JSON.