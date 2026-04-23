"""
Assessment router.
POST /api/assessment  — submit quiz answers, get risk score
"""

from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.routers.settings import get_or_create_settings

router = APIRouter(prefix="/api/assessment", tags=["assessment"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class AssessmentRequest(BaseModel):
    user_name: str = Field(min_length=1, max_length=200)
    time_horizon: int = Field(ge=0, le=21)
    investment_amount: float = Field(ge=0)
    answers: dict[str, int]


# ---------------------------------------------------------------------------
# Answer ranges — fixed, not editable
# ---------------------------------------------------------------------------
ANSWER_RANGES: dict[str, tuple[int, int]] = {
    "Q1": (1, 7), "Q2": (1, 4), "Q3": (1, 4),
    "Q4": (1, 4), "Q5": (1, 5), "Q6": (1, 5),
    "Q7": (1, 6), "Q8": (1, 7), "Q9": (1, 4),
    "Q10": (1, 6),
}


def get_risk_category(score: int) -> tuple[str, str]:
    if score < 35:
        return "Very Low", "very-low"
    elif score <= 44:
        return "Low", "low"
    elif score <= 54:
        return "Average", "average"
    elif score <= 64:
        return "High", "high"
    else:
        return "Very High", "very-high"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("")
async def submit_assessment(payload: AssessmentRequest) -> dict:
    """
    Calculate risk score using coefficients from settings.
    Coefficients are read from settings file — editable by user.
    Score is calculated once and returned. Not stored here.
    Frontend stores it in wizard state and saves to session at the end.
    """

    # Read coefficients from settings (not hardcoded)
    settings = get_or_create_settings()
    scoring = settings.get("scoring", {})
    intercept = scoring.get("intercept", -2.6698)
    coefficients = scoring.get("coefficients", {})

    # Validate all questions present
    missing = set(coefficients.keys()) - set(payload.answers.keys())
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing answers for: {sorted(missing)}"
        )

    # Validate answer ranges
    for key, (lo, hi) in ANSWER_RANGES.items():
        val = payload.answers.get(key)
        if val is None or not (lo <= val <= hi):
            raise HTTPException(
                status_code=422,
                detail=f"{key} must be between {lo} and {hi}"
            )

    # Calculate score using settings coefficients
    raw = intercept
    breakdown = []
    for key, coeff in coefficients.items():
        val = payload.answers[key]
        pts = round(coeff * val, 2)
        raw += pts
        breakdown.append({
            "question": key,
            "value": val,
            "coefficient": coeff,
            "points": pts,
        })

    score = round(raw)
    category, level = get_risk_category(score)

    return {
        "user_name": payload.user_name,
        "time_horizon": payload.time_horizon,
        "investment_amount": payload.investment_amount,
        "score": score,
        "category": category,
        "level": level,
        "breakdown": breakdown,
    }