"""
Simple OAuth setup script to get SumUp tokens with payments scope.

This generates an authorization URL. Visit it in your browser to authorize,
then you'll be redirected back with a code that we can exchange for tokens.
"""

import os
from dotenv import load_dotenv
from urllib.parse import urlencode
from database import save_sumup_token

load_dotenv()

# Configuration
SUMUP_MODE = os.getenv("SUMUP_MODE", "test")
SUMUP_AUTHORIZE_URL = "https://api.sumup.com/authorize"
SUMUP_TOKEN_URL = "https://api.sumup.com/token"

# Get credentials based on mode
if SUMUP_MODE == "test":
    CLIENT_ID = os.getenv("SUMUP_TEST_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_TEST_CLIENT_SECRET")
    print(f"🧪 Setting up TEST mode OAuth")
else:
    CLIENT_ID = os.getenv("SUMUP_LIVE_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_LIVE_CLIENT_SECRET")
    print(f"🔴 Setting up LIVE mode OAuth")

# Your redirect URI from SumUp approval
REDIRECT_URI = os.getenv("SUMUP_RETURN_URL", "https://vilrent.lt/sumup/callback")

print(f"Client ID: {CLIENT_ID}")
print(f"Redirect URI: {REDIRECT_URI}")
print()

# Step 1: Generate authorization URL
params = {
    "response_type": "code",
    "client_id": CLIENT_ID,
    "redirect_uri": REDIRECT_URI,
    "scope": "payments transactions.history user.app-settings user.profile_readonly",
}

auth_url = f"{SUMUP_AUTHORIZE_URL}?{urlencode(params)}"

print("=" * 80)
print("STEP 1: Visit this URL in your browser to authorize:")
print("=" * 80)
print(auth_url)
print()
print("=" * 80)
print()
print("After you authorize, you'll be redirected to:")
print(f"{REDIRECT_URI}?code=XXXXX")
print()
print("Copy the 'code' parameter from the URL and run:")
print(f"python3 oauth_setup.py PASTE_CODE_HERE")
print()

# Step 2: Exchange code for tokens (if code provided)
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
                    "redirect_uri": REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code != 200:
                print(f"❌ Failed to exchange code: {response.status_code}")
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

            print("✅ Success! Tokens saved to database.")
            print(f"Access token: {data['access_token'][:20]}...")
            print(f"Refresh token: {data.get('refresh_token', 'N/A')[:20]}...")
            print(f"Expires in: {data.get('expires_in')} seconds")
            print()
            print(f"Mode: {SUMUP_MODE}")
            print("You can now use the payment system!")

    asyncio.run(exchange_code())
