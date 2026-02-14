# RENUM Backend (FastAPI)

This backend implements core APIs and integrations (Metricool, Tavily, HeyGen, OpusClip, Claude) for the RENUM Social AI project.

Quick start (local / VPS)

1. Copy .env.example to .env and fill secrets (especially SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY).
2. Build and run:
   - Local: python -m uvicorn app.main:app --reload
   - Docker: docker build -t renum-api . && docker run -d -p 8000:8000 --env-file .env renum-api

Health: GET /health/