"""
Teams notification service.
Sends risk assessment results to Microsoft Teams channel.
"""

from __future__ import annotations
import requests
from datetime import datetime
from app.config import TEAMS_WEBHOOK_URL


def send_risk_assessment_notification(
    user_name: str,
    time_horizon: int,
    investment_amount: float,
    score: int,
    category: str,
    level: str,
    answers: dict[str, int],
) -> bool:
    """
    Send a formatted risk assessment notification to Teams.
    Returns True if successful, False if failed.
    """

    # Risk level emoji
    level_emoji = ""

    # Format date
    now = datetime.now().strftime("%d %b %Y, %I:%M %p")

    # Format time horizon
    if time_horizon == 0:
        horizon_text = "Less than 1 year"
    elif time_horizon == 21:
        horizon_text = "More than 20 years"
    else:
        horizon_text = f"{time_horizon} year{'s' if time_horizon > 1 else ''}"

    # Format investment amount
    def format_inr(amount: float) -> str:
        return "₹{:,.0f}".format(amount)

    # Format answers in a grid
    answers_text = "  ".join(
        [f"**{q}:** {v}" for q, v in sorted(answers.items())]
    )

    # Score bar (visual)
    score_pct = int((score / 88) * 10)
    score_bar = "█" * score_pct + "░" * (10 - score_pct)

    # Build Teams message card
    message = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": {
            "very-low": "00B050",
            "low": "92D050",
            "average": "FFC000",
            "high": "FF6600",
            "very-high": "FF0000",
        }.get(level, "0078D4"),
        "summary": f"New Risk Assessment — {user_name}",
        "sections": [
            {
                "activityTitle": f"New Risk Assessment Completed",
                "activitySubtitle": now,
                "facts": [
                    {"name": "Client", "value": user_name},
                    # {"name": "Time Horizon", "value": horizon_text},
                    # {"name": "Investment Amount", "value": format_inr(investment_amount)},
                ],
                "markdown": True,
            },
            {
                "activityTitle": f"{level_emoji} Risk Score: **{score} / 88**",
                "activitySubtitle": f"Category: **{category}**",
                "text": f"`{score_bar}` {score}/88",
                "markdown": True,
            },
            # {
            #     "activityTitle": "Question Responses",
            #     "text": answers_text,
            #     "markdown": True,
            # },
        ],
    }

    try:
        response = requests.post(
            TEAMS_WEBHOOK_URL,
            json=message,
            timeout=10,
        )
        return response.status_code == 200
    except Exception:
        return False