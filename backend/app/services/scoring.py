"""
Pure scoring logic — no I/O, no side effects.
Regression formula to calculate risk tolerance score from quiz answers.
"""

from __future__ import annotations

INTERCEPT: float = -2.6698

COEFFICIENTS: dict[str, float] = {
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
}

ANSWER_RANGES: dict[str, tuple[int, int]] = {
    "Q1": (1, 7),
    "Q2": (1, 4),
    "Q3": (1, 4),
    "Q4": (1, 4),
    "Q5": (1, 5),
    "Q6": (1, 5),
    "Q7": (1, 6),
    "Q8": (1, 7),
    "Q9": (1, 4),
    "Q10": (1, 6),
}


def get_risk_category(score: int) -> tuple[str, str]:
    """Returns (category, level) for a given score."""
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


def calculate_score(answers: dict[str, int]) -> dict:
    """
    Calculate risk score from answers.
    Returns score, category, level, and per-question breakdown.
    """
    # Validate all questions present
    missing = set(COEFFICIENTS.keys()) - set(answers.keys())
    if missing:
        raise ValueError(f"Missing answers for: {sorted(missing)}")

    # Validate answer ranges
    for key, (lo, hi) in ANSWER_RANGES.items():
        val = answers[key]
        if not (lo <= val <= hi):
            raise ValueError(f"{key} must be between {lo} and {hi}, got {val}")

    # Calculate score
    raw = INTERCEPT
    breakdown = []

    for key, coeff in COEFFICIENTS.items():
        val = answers[key]
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
        "score": score,
        "category": category,
        "level": level,
        "breakdown": breakdown,
    }