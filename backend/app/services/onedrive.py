"""
OneDrive integration service.
Uploads/updates Excel file to OneDrive using Microsoft Graph API.
# STORAGE: Credentials loaded from environment variables.
"""

from __future__ import annotations
import os
import msal
import requests
from pathlib import Path

# Load credentials from environment
TENANT_ID = os.getenv("ONEDRIVE_TENANT_ID", "")
CLIENT_ID = os.getenv("ONEDRIVE_CLIENT_ID", "")
CLIENT_SECRET = os.getenv("ONEDRIVE_CLIENT_SECRET", "")
DRIVE_ID = os.getenv("ONEDRIVE_DRIVE_ID", "")
FOLDER_NAME = os.getenv("ONEDRIVE_FOLDER_NAME", "Risk_Profiler")

GRAPH_URL = "https://graph.microsoft.com/v1.0"
SCOPE = ["https://graph.microsoft.com/.default"]


def _get_access_token() -> str | None:
    """Get Microsoft Graph API access token."""
    try:
        app = msal.ConfidentialClientApplication(
            client_id=CLIENT_ID,
            client_credential=CLIENT_SECRET,
            authority=f"https://login.microsoftonline.com/{TENANT_ID}",
        )
        result = app.acquire_token_for_client(scopes=SCOPE)
        return result.get("access_token")
    except Exception as e:
        print(f"Token error: {e}")
        return None


def _ensure_folder(token: str) -> bool:
    """Create folder in OneDrive if it doesn't exist."""
    try:
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        # Check if folder exists
        url = f"{GRAPH_URL}/drives/{DRIVE_ID}/root:/{FOLDER_NAME}"
        res = requests.get(url, headers=headers)

        if res.status_code == 404:
            # Create folder
            create_url = f"{GRAPH_URL}/drives/{DRIVE_ID}/root/children"
            payload = {
                "name": FOLDER_NAME,
                "folder": {},
                "@microsoft.graph.conflictBehavior": "rename",
            }
            res = requests.post(create_url, headers=headers, json=payload)
            return res.status_code == 201

        return res.status_code == 200

    except Exception as e:
        print(f"Folder error: {e}")
        return False


def upload_excel_to_onedrive(local_file: Path) -> bool:
    """
    Upload local Excel file to OneDrive Risk_Profiler folder.
    Overwrites if file already exists.
    Returns True if successful.
    """
    if not local_file.exists():
        print(f"Local file not found: {local_file}")
        return False

    if not all([TENANT_ID, CLIENT_ID, CLIENT_SECRET, DRIVE_ID]):
        print("OneDrive credentials not configured.")
        return False

    try:
        # Get token
        token = _get_access_token()
        if not token:
            return False

        # Ensure folder exists
        _ensure_folder(token)

        # Upload file
        file_name = local_file.name
        upload_url = (
            f"{GRAPH_URL}/drives/{DRIVE_ID}/root:/"
            f"{FOLDER_NAME}/{file_name}:/content"
        )

        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": (
                "application/vnd.openxmlformats-officedocument"
                ".spreadsheetml.sheet"
            ),
        }

        with open(local_file, "rb") as f:
            res = requests.put(upload_url, headers=headers, data=f)

        if res.status_code in (200, 201):
            print(f"Uploaded to OneDrive: {FOLDER_NAME}/{file_name}")
            return True
        else:
            print(f"Upload failed: {res.status_code} {res.text}")
            return False

    except Exception as e:
        print(f"OneDrive upload error: {e}")
        return False