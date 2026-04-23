"""
# STORAGE: This entire file is the layer to replace when moving to cloud.
# All reads/writes go through these functions only.
# To switch to S3: replace read_json/write_json with boto3 calls.
# To switch to database: replace with SQLAlchemy queries.
"""

import json
from pathlib import Path
from datetime import datetime


def read_json(filepath: Path) -> dict | None:
    """Read a JSON file. Returns None if file doesn't exist."""
    if not filepath.exists():
        return None
    with open(filepath, "r", encoding="utf-8") as f:
        return json.load(f)


def write_json(filepath: Path, data: dict) -> None:
    """Write data to a JSON file. Creates file if it doesn't exist."""
    filepath.parent.mkdir(parents=True, exist_ok=True)
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def list_json_files(folder: Path) -> list[dict]:
    """Read all JSON files in a folder and return as a list."""
    if not folder.exists():
        return []
    results = []
    for filepath in sorted(folder.glob("*.json"), reverse=True):
        data = read_json(filepath)
        if data:
            results.append(data)
    return results


def generate_session_id() -> str:
    """Generate a unique session ID based on timestamp."""
    return datetime.utcnow().strftime("%Y%m%d_%H%M%S_%f")