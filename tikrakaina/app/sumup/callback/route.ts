import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ref = searchParams.get('ref')
    const transactionId = searchParams.get('transaction_id')
    const status = searchParams.get('status')

    // If no ref, redirect to home
    if (!ref) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Get INITIAL status from database
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const finalizeUrl = new URL(`${backendUrl}/api/payments/sumup/finalize`)
    finalizeUrl.searchParams.set('ref', ref)

    let result: any = null
    try {
      const response = await fetch(finalizeUrl.toString(), {
        signal: AbortSignal.timeout(3000)
      })
      result = await response.json()
    } catch (error) {
      console.error('Failed to fetch initial status:', error)
      result = { status: 'REDIRECTED', ref }
    }

    // Create a response page with the result
    const html = `
<!DOCTYPE html>
<html lang="lt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>${result.status === 'PAID' ? 'Mokėjimas sėkmingas' : result.status === 'CANCELLED' ? 'Mokėjimas atšauktas' : 'Apdorojama...'}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      padding: 48px;
      max-width: 480px;
      width: 90%;
      text-align: center;
    }
    .icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48px;
    }
    .icon.success { background: #d1fae5; color: #10b981; }
    .icon.cancelled { background: #fed7aa; color: #f97316; }
    .icon.failed { background: #fee2e2; color: #ef4444; }
    .icon.pending { background: #e5e7eb; color: #6b7280; }
    h1 { margin: 0 0 12px; font-size: 28px; font-weight: 700; color: #1f2937; }
    .message { color: #6b7280; margin-bottom: 32px; line-height: 1.5; }
    .credits-added {
      background: #d1fae5;
      color: #065f46;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      margin-bottom: 24px;
      display: inline-block;
    }
    .details {
      background: #f9fafb;
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 32px;
    }
    .detail-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 14px;
    }
    .detail-row:last-child { margin-bottom: 0; }
    .detail-label { color: #6b7280; }
    .detail-value { font-family: monospace; color: #1f2937; font-weight: 500; }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background: #1f2937;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .button:hover { background: #374151; }
    .spinner {
      animation: spin 1s linear infinite;
      display: inline-block;
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon ${result.status === 'PAID' ? 'success' : result.status === 'CANCELLED' ? 'cancelled' : result.status === 'FAILED' ? 'failed' : 'pending'}">
      ${result.status === 'PAID' ? '✓' : result.status === 'CANCELLED' ? '⚠' : result.status === 'FAILED' ? '✕' : '<span class="spinner">⏳</span>'}
    </div>

    <h1>
      ${result.status === 'PAID' ? 'Mokėjimas sėkmingas!' :
        result.status === 'CANCELLED' ? 'Mokėjimas atšauktas' :
        result.status === 'FAILED' ? 'Mokėjimas nepavyko' :
        'Apdorojama...'}
    </h1>

    <p class="message">
      ${result.status === 'PAID' ? 'Jūsų analizės pridėtos į paskyrą!' :
        result.status === 'CANCELLED' ? 'Mokėjimas buvo atšauktas.' :
        result.status === 'FAILED' ? 'Mokėjimas nepavyko. Bandykite dar kartą.' :
        'Laukiama mokėjimo patvirtinimo...'}
    </p>

    ${result.status === 'PAID' && result.creditsAdded ? `
    <div class="credits-added">
      +${result.creditsAdded} analizės pridėtos!
    </div>
    ` : ''}

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Nuoroda:</span>
        <span class="detail-value">${ref.slice(0, 8)}...</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Būsena:</span>
        <span class="detail-value">${result.status}</span>
      </div>
    </div>

    <a href="/" class="button">Grįžti į VilRent</a>
  </div>

  <script>
    const initialStatus = '${result.status}';
    const ref = '${ref}';

    if (initialStatus === 'REDIRECTED' || initialStatus === 'PENDING' || initialStatus === 'INIT') {
      let attempts = 0;
      const maxAttempts = 15;

      const pollStatus = async () => {
        attempts++;
        document.querySelector('.message').textContent = 'Laukiama mokėjimo patvirtinimo... (' + attempts + '/' + maxAttempts + ')';

        try {
          const response = await fetch('${backendUrl}/api/payments/sumup/finalize?ref=' + ref);
          const data = await response.json();

          if (data.status === 'PAID' || data.status === 'CANCELLED' || data.status === 'FAILED') {
            window.location.reload();
          } else if (attempts < maxAttempts) {
            setTimeout(pollStatus, 2000);
          } else {
            document.querySelector('.message').textContent = 'Mokėjimas vis dar apdorojamas. Kreditai bus pridėti automatiškai.';
          }
        } catch (error) {
          console.error('Polling error:', error);
          if (attempts < maxAttempts) {
            setTimeout(pollStatus, 2000);
          }
        }
      };

      setTimeout(pollStatus, 1500);
    }

    // Auto-redirect to home after success
    if (initialStatus === 'PAID') {
      setTimeout(() => {
        window.location.href = '/';
      }, 3000);
    }
  </script>
</body>
</html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html' },
    })
  } catch (error) {
    console.error('Callback error:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}
