"""
Investment router.
POST /api/investment/calculate  — calculate split and auto-suggestion
"""

from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.financial import evaluate_split, auto_suggest

router = APIRouter(prefix="/api/investment", tags=["investment"])


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class InvestmentRequest(BaseModel):
    target: float = Field(ge=1)
    years: int = Field(ge=1, le=50)
    lumpsum: float = Field(ge=0)
    sip_monthly: float = Field(ge=0)
    rate_st: float = Field(ge=0.1, le=50)
    w_l: float = Field(ge=0, le=100)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.post("/calculate")
async def calculate(payload: InvestmentRequest) -> dict:
    """Calculate split evaluation and auto-suggestion."""
    if payload.lumpsum == 0 and payload.sip_monthly == 0:
        raise HTTPException(
            status_code=422,
            detail="At least one of lumpsum or sip_monthly must be greater than 0.",
        )

    split = evaluate_split(
        w_l=payload.w_l,
        lumpsum=payload.lumpsum,
        sip=payload.sip_monthly,
        target=payload.target,
        years=payload.years,
        rate_st=payload.rate_st,
    )

    suggestion = auto_suggest(
        lumpsum=payload.lumpsum,
        sip=payload.sip_monthly,
        target=payload.target,
        years=payload.years,
        rate_st=payload.rate_st,
    )

    return {
        "split": split,
        "suggestion": suggestion,
    }