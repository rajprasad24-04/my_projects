"""
Settings router.
GET /api/settings  — read current settings
PUT /api/settings  — update settings
"""

from __future__ import annotations
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.config import SETTINGS_FILE
from app.storage.file_store import read_json, write_json

router = APIRouter(prefix="/api/settings", tags=["settings"])

# ---------------------------------------------------------------------------
# Default settings
# STORAGE: Change to DB/cloud when deploying
# ---------------------------------------------------------------------------
DEFAULT_SETTINGS = {
    "version": 1,
    "short_term_default": "Debt",
    "asset_classes": ["Domestic", "International", "Commodity", "Debt", "Cash"],

    # Editable quiz scoring coefficients
    "scoring": {
        "intercept": -2.6698,
        "coefficients": {
            "Q1": 1.4219,
            "Q2": 2.5300,
            "Q3": 2.9337,
            "Q4": 2.1720,
            "Q5": 2.1985,
            "Q6": 1.3318,
            "Q7": 1.3386,
            "Q8": 1.4704,
            "Q9": 1.8848,
            "Q10": 1.0876,
        },
    },

    # Asset allocation table by risk score band
    "allocation_table": {
        "0-30":   {"Domestic": 15, "International": 0,  "Commodity": 15, "Debt": 50, "Cash": 20},
        "31-45":  {"Domestic": 40, "International": 5,  "Commodity": 10, "Debt": 35, "Cash": 10},
        "46-55":  {"Domestic": 50, "International": 5,  "Commodity": 5,  "Debt": 30, "Cash": 10},
        "56-65":  {"Domestic": 50, "International": 10, "Commodity": 5,  "Debt": 25, "Cash": 10},
        "66-75":  {"Domestic": 60, "International": 10, "Commodity": 5,  "Debt": 15, "Cash": 10},
        "75-100": {"Domestic": 70, "International": 15, "Commodity": 0,  "Debt": 10, "Cash": 5},
    },
}


def get_or_create_settings() -> dict:
    """Read settings from file, create defaults if not found."""
    data = read_json(SETTINGS_FILE)
    if data is None:
        write_json(SETTINGS_FILE, DEFAULT_SETTINGS)
        return DEFAULT_SETTINGS
    return data


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class ScoringConfig(BaseModel):
    intercept: float
    coefficients: dict[str, float]


class SettingsPayload(BaseModel):
    short_term_default: str
    asset_classes: list[str]
    scoring: ScoringConfig
    allocation_table: dict[str, dict[str, int]]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@router.get("")
async def get_settings() -> dict:
    """Return current settings."""
    return get_or_create_settings()


@router.put("")
async def update_settings(payload: SettingsPayload) -> dict:
    """Update settings with validation."""

    # Validate asset_classes not empty
    if not payload.asset_classes:
        raise HTTPException(status_code=422, detail="asset_classes cannot be empty.")

    # Validate short_term_default is in asset_classes
    if payload.short_term_default not in payload.asset_classes:
        raise HTTPException(
            status_code=422,
            detail=f"short_term_default '{payload.short_term_default}' must be in asset_classes.",
        )

    # Validate each band sums to 100
    errors = []
    for band, alloc in payload.allocation_table.items():
        total = sum(alloc.values())
        if total != 100:
            errors.append(f"Band '{band}' sums to {total}, must be 100.")
    if errors:
        raise HTTPException(status_code=422, detail=errors)

    # Validate all Q1-Q10 coefficients present
    required_keys = {f"Q{i}" for i in range(1, 11)}
    missing = required_keys - set(payload.scoring.coefficients.keys())
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Missing coefficients for: {sorted(missing)}",
        )

    current = get_or_create_settings()
    updated = {
        "version": current.get("version", 1),
        "short_term_default": payload.short_term_default,
        "asset_classes": payload.asset_classes,
        "scoring": payload.scoring.model_dump(),
        "allocation_table": payload.allocation_table,
    }
    write_json(SETTINGS_FILE, updated)
    return updated