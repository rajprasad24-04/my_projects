"""
FastAPI application entry point.
"""

from __future__ import annotations
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import settings, assessment, investment, session

app = FastAPI(title="WEALIXIR_VIEW", version="1.0.0")

# CORS — allows frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["Content-Type"],
)

# Register routers
app.include_router(settings.router)
app.include_router(assessment.router)
app.include_router(investment.router)
app.include_router(session.router)


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}