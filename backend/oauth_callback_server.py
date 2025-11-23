"""
Super simple callback server to capture OAuth code.
Just run this, then visit the authorization URL.
"""

import os
from dotenv import load_dotenv
from urllib.parse import urlencode, parse_qs, urlparse
from http.server import HTTPServer, BaseHTTPRequestHandler
import webbrowser

load_dotenv()

SUMUP_MODE = os.getenv("SUMUP_MODE", "test")

if SUMUP_MODE == "test":
    CLIENT_ID = os.getenv("SUMUP_TEST_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_TEST_CLIENT_SECRET")
else:
    CLIENT_ID = os.getenv("SUMUP_LIVE_CLIENT_ID")
    CLIENT_SECRET = os.getenv("SUMUP_LIVE_CLIENT_SECRET")

REDIRECT_URI = "http://localhost:8080/callback"
SUMUP_AUTHORIZE_URL = "https://api.sumup.com/authorize"
SUMUP_TOKEN_URL = "https://api.sumup.com/token"

# Generate auth URL
params = {
    "response_type": "code",
    "client_id": CLIENT_ID,
    "redirect_uri": REDIRECT_URI,
    "scope": "payments transactions.history user.app-settings user.profile_readonly",
}
auth_url = f"{SUMUP_AUTHORIZE_URL}?{urlencode(params)}"

captured_code = None

class CallbackHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global captured_code

        # Parse the URL
        parsed = urlparse(self.path)
        params = parse_qs(parsed.query)

        if 'code' in params:
            captured_code = params['code'][0]

            # Send success response
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()

            html = f"""
            <html>
            <head><title>Authorization Successful!</title></head>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
                <h1 style="color: green;">✅ Authorization Successful!</h1>
                <h2>Your code:</h2>
                <div style="background: #f0f0f0; padding: 20px; margin: 20px; border-radius: 10px; font-size: 18px; word-break: break-all;">
                    {captured_code}
                </div>
                <p>Close this window and return to the terminal.</p>
                <p>The script will automatically exchange the code for tokens...</p>
            </body>
            </html>
            """
            self.wfile.write(html.encode())
        else:
            self.send_response(400)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            self.wfile.write(b"<h1>Error: No code received</h1>")

    def log_message(self, format, *args):
        pass  # Suppress server logs

print("=" * 80)
print("🚀 OAuth Authorization Server")
print("=" * 80)
print(f"Mode: {SUMUP_MODE.upper()}")
print(f"Client ID: {CLIENT_ID}")
print()
print("STEP 1: Starting local server on http://localhost:8080...")
print()
print("STEP 2: Opening authorization URL in your browser...")
print("If it doesn't open automatically, visit this URL:")
print(auth_url)
print()
print("STEP 3: After you authorize, you'll be redirected back here.")
print("The server will capture the code and exchange it for tokens.")
print()
print("=" * 80)
print()

# Open browser automatically
webbrowser.open(auth_url)

# Start server
server = HTTPServer(('localhost', 8080), CallbackHandler)
print("⏳ Waiting for authorization callback...")

# Wait for one request
server.handle_request()

if captured_code:
    print()
    print("=" * 80)
    print(f"✅ Code captured: {captured_code}")
    print("=" * 80)
    print()
    print("Now exchanging code for tokens...")

    import httpx
    import asyncio
    from database import save_sumup_token

    async def exchange():
        async with httpx.AsyncClient() as client:
            response = await client.post(
                SUMUP_TOKEN_URL,
                data={
                    "grant_type": "authorization_code",
                    "client_id": CLIENT_ID,
                    "client_secret": CLIENT_SECRET,
                    "code": captured_code,
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

            print()
            print("=" * 80)
            print("🎉 SUCCESS! Tokens saved to database!")
            print("=" * 80)
            print(f"Mode: {SUMUP_MODE}")
            print(f"Access token: {data['access_token'][:30]}...")
            print(f"Refresh token: {data.get('refresh_token', 'N/A')[:30]}...")
            print()
            print("✅ Your payment system is now ready with the 'payments' scope!")
            print("=" * 80)

    asyncio.run(exchange())
else:
    print("❌ No code received. Please try again.")
