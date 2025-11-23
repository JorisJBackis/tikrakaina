"""
OAuth setup with www redirect URI
"""

import os
from dotenv import load_dotenv
from database import save_sumup_token
import httpx
import asyncio

load_dotenv()

SUMUP_MODE = os.getenv("SUMUP_MODE", "test")
SUMUP_TOKEN_URL = "https://api.sumup.com/token"

if SUMUP_MODE == "test":
    CLIENT_ID = os.getenv("SUMUP_TEST_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_TEST_CLIENT_SECRET")
else:
    CLIENT_ID = os.getenv("SUMUP_LIVE_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_LIVE_CLIENT_SECRET")

# Use www version
REDIRECT_URI = "https://www.vilrent.lt/sumup/callback"

import sys
if len(sys.argv) < 2:
    print("Usage: python3 oauth_setup_www.py CODE")
    sys.exit(1)

code = sys.argv[1]
print(f"Exchanging code for tokens (www redirect)...")

async def exchange():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SUMUP_TOKEN_URL,
            data={
                "grant_type": "authorization_code",
                "client_id": CLIENT_ID,
                "client_secret": CLIENT_SECRET,
                "code": code,
                "redirect_uri": REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code != 200:
            print(f"❌ Failed: {response.status_code}")
            print(response.text)
            return

        data = response.json()

        # Save to database
        save_sumup_token(
            mode=SUMUP_MODE,
            access_token=data["access_token"],
            refresh_token=data.get("refresh_token"),
            expires_in=data.get("expires_in", 3600)
        )

        print("✅ SUCCESS! Tokens saved to database.")
        print(f"Mode: {SUMUP_MODE}")
        print("Your payment system is now ready with the 'payments' scope!")

asyncio.run(exchange())
