"""
Session router.
POST /api/session  — save completed session
GET  /api/session  — list all sessions
"""

from __future__ import annotations
from datetime import datetime
from fastapi import APIRouter, BackgroundTasks
from pydantic import BaseModel
from app.config import SESSIONS_DIR
from app.storage.file_store import write_json, list_json_files, generate_session_id
from app.services.teams_notify import send_risk_assessment_notification
from app.services.excel_export import append_assessment

router = APIRouter(prefix="/api/session", tags=["session"])


class RiskSessionPayload(BaseModel):
    user_name: str
    time_horizon: int
    investment_amount: float
    answers: dict[str, int]
    score: int
    category: str
    level: str
    breakdown: list[dict]


def _background_tasks(
    user_name: str,
    time_horizon: int,
    investment_amount: float,
    score: int,
    category: str,
    level: str,
    answers: dict[str, int],
    created_at: str,
) -> None:
    """Run all background tasks after session save."""
    # Send Teams notification
    send_risk_assessment_notification(
        user_name=user_name,
        time_horizon=time_horizon,
        investment_amount=investment_amount,
        score=score,
        category=category,
        level=level,
        answers=answers,
    )
    # Append to Excel
    append_assessment(
        user_name=user_name,
        time_horizon=time_horizon,
        investment_amount=investment_amount,
        score=score,
        category=category,
        level=level,
        answers=answers,
        created_at=created_at,
    )


@router.post("")
async def save_session(
    payload: RiskSessionPayload,
    background_tasks: BackgroundTasks,
) -> dict:
    """Save risk assessment session, notify Teams, update Excel."""

    session_id = generate_session_id()
    safe_name = payload.user_name.strip().replace(" ", "_")
    filename = f"{safe_name}_{session_id}"
    created_at = datetime.utcnow().isoformat()

    session_data = {
        "id": filename,
        "created_at": created_at,
        "user_name": payload.user_name,
        "time_horizon": payload.time_horizon,
        "investment_amount": payload.investment_amount,
        "answers": payload.answers,
        "score": payload.score,
        "category": payload.category,
        "level": payload.level,
        "breakdown": payload.breakdown,
    }

    # Save JSON file
    filepath = SESSIONS_DIR / f"{filename}.json"
    write_json(filepath, session_data)

    # Run Teams + Excel in background
    background_tasks.add_task(
        _background_tasks,
        user_name=payload.user_name,
        time_horizon=payload.time_horizon,
        investment_amount=payload.investment_amount,
        score=payload.score,
        category=payload.category,
        level=payload.level,
        answers=payload.answers,
        created_at=created_at,
    )

    return {"id": filename, "created_at": created_at}


@router.get("")
async def list_sessions() -> dict:
    """List all saved sessions."""
    sessions = list_json_files(SESSIONS_DIR)
    return {"total": len(sessions), "sessions": sessions}