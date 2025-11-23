"""
OAuth setup with localhost redirect - easier to see the code!
"""

import os
from dotenv import load_dotenv
from urllib.parse import urlencode
from database import save_sumup_token

load_dotenv()

SUMUP_MODE = os.getenv("SUMUP_MODE", "test")
SUMUP_AUTHORIZE_URL = "https://api.sumup.com/authorize"
SUMUP_TOKEN_URL = "https://api.sumup.com/token"

if SUMUP_MODE == "test":
    CLIENT_ID = os.getenv("SUMUP_TEST_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_TEST_CLIENT_SECRET")
    print(f"🧪 Setting up TEST mode OAuth")
else:
    CLIENT_ID = os.getenv("SUMUP_LIVE_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_LIVE_CLIENT_SECRET")
    print(f"🔴 Setting up LIVE mode OAuth")

# Use localhost for easier code visibility
REDIRECT_URI = "http://localhost:3000/sumup/callback"

print(f"Client ID: {CLIENT_ID}")
print(f"Redirect URI: {REDIRECT_URI}")
print()

# Generate authorization URL
params = {
    "response_type": "code",
    "client_id": CLIENT_ID,
    "redirect_uri": REDIRECT_URI,
    "scope": "payments transactions.history user.app-settings user.profile_readonly",
}

auth_url = f"{SUMUP_AUTHORIZE_URL}?{urlencode(params)}"

print("=" * 80)
print("STEP 1: Visit this URL:")
print("=" * 80)
print(auth_url)
print()
print("=" * 80)
print()
print("After authorizing, you'll see the code in the URL bar:")
print("http://localhost:3000/sumup/callback?code=XXXXX")
print()
print("Copy the code and run:")
print("cd /Users/test/Documents/aruodas/backend")
print("source .env && python3 oauth_setup_localhost.py PASTE_CODE_HERE")
print()

# Exchange code for tokens
import sys
if len(sys.argv) > 1:
    code = sys.argv[1]
    print(f"Exchanging code for tokens...")

    import httpx
    import asyncio

    async def exchange_code():
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SUMUP_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "code": code,
                    "redirect_uri": REDIRECT_URI,  # Must match the one used in auth URL!
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

    asyncio.run(exchange_code())
