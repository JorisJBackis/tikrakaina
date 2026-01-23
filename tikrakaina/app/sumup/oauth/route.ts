import { NextRequest, NextResponse } from 'next/server'

// This route handler ONLY handles SumUp OAuth callbacks (admin authorization)
// Payment callbacks are handled by /sumup/callback/page.tsx

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

  try {
    const response = await fetch(`${backendUrl}/api/auth/sumup/exchange-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code })
    })

    const data = await response.json()

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.success ? 'Authorization Successful' : 'Authorization Failed'}</title>
  <style>
    body { font-family: Arial; margin: 0; padding: 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
    .container { background: white; border-radius: 20px; padding: 40px; max-width: 600px; text-align: center; box-shadow: 0 10px 40px rgba(0,0,0,0.3); }
    h1 { color: ${data.success ? '#10b981' : '#ef4444'}; margin-bottom: 20px; }
    .icon { font-size: 60px; margin-bottom: 20px; }
    .code-box { background: #f3f4f6; padding: 20px; border-radius: 10px; margin: 20px 0; font-size: 12px; word-break: break-all; }
    .button { display: inline-block; padding: 12px 32px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 500; margin-top: 20px; }
    .button:hover { background: #2563eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon">${data.success ? '🎉' : '❌'}</div>
    <h1>${data.success ? 'Authorization Successful!' : 'Authorization Failed'}</h1>
    <p>${data.success ? 'Your SumUp payment integration is now configured with the payments scope!' : data.error || 'Failed to exchange authorization code'}</p>
    <div class="code-box"><strong>Code:</strong><br/>${code}</div>
    <a href="/" class="button">Return to Home</a>
  </div>
</body>
</html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' }
    })
  } catch (error) {
    return new NextResponse(`<html><body><h1>Error</h1><p>${error}</p><p>Code: ${code}</p></body></html>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
}
