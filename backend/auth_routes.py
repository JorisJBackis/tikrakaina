"""OAuth authorization routes for SumUp."""

from fastapi import APIRouter, Query, HTTPException
from fastapi.responses import HTMLResponse
import os
import httpx
from dotenv import load_dotenv
from database import save_sumup_token

load_dotenv()

router = APIRouter(prefix="/api/auth/sumup", tags=["auth"])

SUMUP_MODE = os.getenv("SUMUP_MODE", "test")
SUMUP_TOKEN_URL = "https://api.sumup.com/token"
SUMUP_AUTHORIZE_URL = "https://api.sumup.com/authorize"
REDIRECT_URI = os.getenv("SUMUP_RETURN_URL", "https://vilrent.lt/sumup/callback")

if SUMUP_MODE == "test":
    CLIENT_ID = os.getenv("SUMUP_TEST_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_TEST_CLIENT_SECRET")
else:
    CLIENT_ID = os.getenv("SUMUP_LIVE_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_LIVE_CLIENT_SECRET")


@router.get("/start")
async def start_oauth():
    """Start OAuth flow - returns authorization URL."""
    from urllib.parse import urlencode

    params = {
        "response_type": "code",
        "client_id": CLIENT_ID,
        "redirect_uri": REDIRECT_URI,
        "scope": "payments transactions.history user.app-settings user.profile_readonly",
    }

    auth_url = f"{SUMUP_AUTHORIZE_URL}?{urlencode(params)}"

    return {
        "authUrl": auth_url,
        "mode": SUMUP_MODE,
        "redirectUri": REDIRECT_URI,
        "message": "Visit authUrl to authorize"
    }


from pydantic import BaseModel

class CodeExchangeRequest(BaseModel):
    code: str


@router.post("/exchange-code")
async def exchange_code(request: CodeExchangeRequest):
    """Exchange authorization code for tokens."""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SUMUP_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "code": request.code,
                    "redirect_uri": REDIRECT_URI,
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
            )

            if response.status_code != 200:
                return {
                    "success": False,
                    "error": f"Failed to exchange code: {response.text}"
                }

            data = response.json()

            # Save to database
            save_sumup_token(
                mode=SUMUP_MODE,
                access_token=data["access_token"],
                refresh_token=data.get("refresh_token"),
                expires_in=data.get("expires_in", 3600)
            )

            return {
                "success": True,
                "mode": SUMUP_MODE,
                "message": "Tokens saved successfully!"
            }

    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }


@router.get("/callback", response_class=HTMLResponse)
async def oauth_callback(code: str = Query(None), error: str = Query(None)):
    """
    OAuth callback endpoint.
    This is where SumUp redirects after authorization.
    """

    if error:
        return f"""
        <html>
        <head><title>Authorization Failed</title></head>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1 style="color: red;">❌ Authorization Failed</h1>
            <p>Error: {error}</p>
            <p><a href="/">Return to home</a></p>
        </body>
        </html>
        """

    if not code:
        return """
        <html>
        <head><title>No Code Received</title></head>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1 style="color: orange;">⚠️ No Authorization Code</h1>
            <p>The authorization code was not received.</p>
            <p><a href="/api/auth/sumup/start">Try again</a></p>
        </body>
        </html>
        """

    # Exchange code for tokens
    try:
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
                error_msg = response.text
                return f"""
                <html>
                <head><title>Token Exchange Failed</title></head>
                <body style="font-family: Arial; padding: 50px; text-align: center;">
                    <h1 style="color: red;">❌ Failed to Exchange Code</h1>
                    <p>Error: {error_msg}</p>
                    <p><a href="/api/auth/sumup/start">Try again</a></p>
                </body>
                </html>
                """

            data = response.json()

            # Save to database
            save_sumup_token(
                mode=SUMUP_MODE,
                access_token=data["access_token"],
                refresh_token=data.get("refresh_token"),
                expires_in=data.get("expires_in", 3600)
            )

            return f"""
            <html>
            <head>
                <title>Authorization Successful!</title>
                <style>
                    body {{ font-family: Arial; padding: 50px; text-align: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }}
                    .container {{ background: white; color: #333; padding: 40px; border-radius: 20px; max-width: 600px; margin: 0 auto; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }}
                    h1 {{ color: #10b981; margin-bottom: 20px; }}
                    .token-box {{ background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0; font-size: 14px; word-break: break-all; }}
                    .success-icon {{ font-size: 60px; margin-bottom: 20px; }}
                    .mode-badge {{ display: inline-block; padding: 5px 15px; background: #3b82f6; color: white; border-radius: 20px; font-size: 14px; margin: 10px 0; }}
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="success-icon">🎉</div>
                    <h1>Authorization Successful!</h1>
                    <div class="mode-badge">{SUMUP_MODE.upper()} MODE</div>
                    <p style="font-size: 18px; margin: 20px 0;">Your SumUp payment integration is now configured with the <strong>payments</strong> scope!</p>
                    <div class="token-box">
                        <strong>Access Token:</strong><br/>
                        {data['access_token'][:40]}...
                    </div>
                    <div class="token-box">
                        <strong>Refresh Token:</strong><br/>
                        {data.get('refresh_token', 'N/A')[:40]}...
                    </div>
                    <p style="color: #10b981; font-weight: bold; margin-top: 30px;">✅ Tokens have been saved to your database!</p>
                    <p style="margin-top: 20px;">
                        <a href="https://vilrent.lt" style="color: #3b82f6; text-decoration: none; font-weight: bold;">← Return to VilRent</a>
                    </p>
                </div>
            </body>
            </html>
            """

    except Exception as e:
        return f"""
        <html>
        <head><title>Error</title></head>
        <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1 style="color: red;">❌ Error</h1>
            <p>{str(e)}</p>
            <p><a href="/api/auth/sumup/start">Try again</a></p>
        </body>
        </html>
        """
