"""
Application configuration.

# STORAGE: Change DATA_DIR to your cloud storage path when deploying.
# For AWS S3, replace file_store.py with an S3 client.
# For a database, replace file_store.py with SQLAlchemy models.
"""

from pathlib import Path
import os
from dotenv import load_dotenv

# Load .env from backend folder explicitly
load_dotenv(Path(__file__).parent.parent / ".env")

# STORAGE: This is the local folder where all JSON data is saved.
DATA_DIR = Path(os.getenv("DATA_DIR", str(Path(__file__).parent.parent.parent / "data")))

# Make sure the folder exists on startup
DATA_DIR.mkdir(parents=True, exist_ok=True)

# Sub-folders for different data types
SESSIONS_DIR = DATA_DIR / "sessions"
SETTINGS_FILE = DATA_DIR / "settings.json"

SESSIONS_DIR.mkdir(parents=True, exist_ok=True)

# Teams webhook URL
# STORAGE: Move this to .env when deploying
TEAMS_WEBHOOK_URL = os.getenv(
    "TEAMS_WEBHOOK_URL",
    "https://wealixir.webhook.office.com/webhookb2/7d8b3c09-4646-48c0-9c8e-636b17ee99c9@8f698e86-8712-49ca-a246-b593f2619807/IncomingWebhook/3e1270df74fe408b91772e406bb4f33a/d671f50f-fe0b-414b-bfb8-7cd20c6e83b3/V23DL4U1F1fYsoSdZOH0WuaF85DPWTr1lTzpcf45LCGLk1"
)