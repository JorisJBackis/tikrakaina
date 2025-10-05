"""
SumUp authentication with automatic token refresh using database storage.
"""

import os
import httpx
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
import logging
from typing import Optional

# Import database functions
from database import get_sumup_token, save_sumup_token, is_token_expired

load_dotenv()
logger = logging.getLogger(__name__)

# Load environment mode
SUMUP_MODE = os.getenv("SUMUP_MODE", "test")  # Default to test for safety

# Load credentials based on mode (ONLY CLIENT CREDENTIALS, NO TOKENS!)
if SUMUP_MODE == "test":
    SUMUP_CLIENT_ID = os.getenv("SUMUP_TEST_CLIENT_ID")
    SUMUP_CLIENT_SECRET = os.getenv("SUMUP_TEST_CLIENT_SECRET")
    logger.info("🧪 SumUp Auth initialized in TEST mode")
else:
    SUMUP_CLIENT_ID = os.getenv("SUMUP_LIVE_CLIENT_ID")
    SUMUP_CLIENT_SECRET = os.getenv("SUMUP_LIVE_CLIENT_SECRET")
    logger.info("🔴 SumUp Auth initialized in LIVE mode")

SUMUP_TOKEN_URL = os.getenv("SUMUP_OAUTH_TOKEN_URL", "https://api.sumup.com/token")


async def get_user_token() -> str:
    """
    Get a valid user access token from database.

    This will:
    1. Check database for existing token
    2. Refresh token if expired
    3. Return valid access token

    Raises exception if no token exists or refresh fails.
    """

    # Get token from database
    token_data = get_sumup_token(SUMUP_MODE)

    if not token_data:
        raise Exception(
            f"No SumUp token found in database for {SUMUP_MODE} mode. "
            "Please run 'python3 migrate_tokens_to_db.py' to migrate tokens from .env"
        )

    # Check if token is still valid
    if not is_token_expired(token_data):
        logger.debug(f"Using valid token from database ({SUMUP_MODE} mode)")
        return token_data["access_token"]

    # Token expired, need to refresh
    logger.info(f"Token expired for {SUMUP_MODE} mode, refreshing...")

    if not token_data.get("refresh_token"):
        raise Exception(
            f"Token expired but no refresh token available for {SUMUP_MODE} mode. "
            "Please run OAuth flow again to get new tokens."
        )

    async with httpx.AsyncClient() as client:
        response = await client.post(
            SUMUP_TOKEN_URL,
            data={
                "grant_type": "refresh_token",
                "client_id": SUMUP_CLIENT_ID,
                "client_secret": SUMUP_CLIENT_SECRET,
                "refresh_token": token_data["refresh_token"],
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code != 200:
            logger.error(f"Failed to refresh token: {response.text}")
            raise Exception(
                f"Failed to refresh user token: {response.status_code} - {response.text}. "
                "You may need to run OAuth flow again."
            )

        data = response.json()

        # Save refreshed token to database
        save_sumup_token(
            mode=SUMUP_MODE,
            access_token=data["access_token"],
            refresh_token=data.get("refresh_token", token_data["refresh_token"]),
            expires_in=data.get("expires_in", 3600)
        )

        logger.info(f"Successfully refreshed token for {SUMUP_MODE} mode")
        return data["access_token"]


async def get_client_credentials_token() -> str:
    """
    Get a client credentials token (for non-transaction operations).
    This is the old method that doesn't work for transactions.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SUMUP_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": SUMUP_CLIENT_ID,
                "client_secret": SUMUP_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code != 200:
            raise Exception(f"Failed to get client token: {response.text}")

        data = response.json()
        return data["access_token"]


# For backward compatibility
async def get_merchant_token() -> str:
    """
    Get the appropriate token for transactions API.
    Now uses user token instead of client credentials.
    """
    return await get_user_token()