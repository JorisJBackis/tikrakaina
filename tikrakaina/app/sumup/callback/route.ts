import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const ref = searchParams.get('ref')
    const transactionId = searchParams.get('transaction_id')
    const status = searchParams.get('status')

    // If no ref, redirect to test page
    if (!ref) {
      return NextResponse.redirect(new URL('/sumup-test', request.url))
    }

    // Get INITIAL status from database (don't poll server-side!)
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'
    const finalizeUrl = new URL(`${backendUrl}/api/payments/sumup/finalize`)
    finalizeUrl.searchParams.set('ref', ref)

    let result: any = null
    try {
      const response = await fetch(finalizeUrl.toString(), {
        signal: AbortSignal.timeout(3000) // 3 second timeout
      })
      result = await response.json()
    } catch (error) {
      console.error('Failed to fetch initial status:', error)
      result = { status: 'REDIRECTED', ref }
    }

    // Create a response page with the result
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>Payment ${result.status === 'PAID' ? 'Successful' : result.status === 'CANCELLED' ? 'Cancelled' : 'Failed'}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
    .icon.success {
      background: #d1fae5;
      color: #10b981;
    }
    .icon.cancelled {
      background: #fed7aa;
      color: #f97316;
    }
    .icon.failed {
      background: #fee2e2;
      color: #ef4444;
    }
    .icon.pending {
      background: #e0e7ff;
      color: #6366f1;
    }
    h1 {
      margin: 0 0 12px;
      font-size: 28px;
      font-weight: 700;
      color: #1f2937;
    }
    .message {
      color: #6b7280;
      margin-bottom: 32px;
      line-height: 1.5;
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
    .detail-row:last-child {
      margin-bottom: 0;
    }
    .detail-label {
      color: #6b7280;
    }
    .detail-value {
      font-family: monospace;
      color: #1f2937;
      font-weight: 500;
    }
    .button {
      display: inline-block;
      padding: 12px 32px;
      background: #6366f1;
      color: white;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 500;
      transition: background 0.2s;
    }
    .button:hover {
      background: #4f46e5;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="icon ${result.status === 'PAID' ? 'success' : result.status === 'CANCELLED' ? 'cancelled' : result.status === 'FAILED' ? 'failed' : 'pending'}">
      ${result.status === 'PAID' ? '✓' : result.status === 'CANCELLED' ? '⚠' : result.status === 'FAILED' ? '✕' : '⏱'}
    </div>

    <h1>
      ${result.status === 'PAID' ? 'Payment Successful!' :
        result.status === 'CANCELLED' ? 'Payment Cancelled' :
        result.status === 'FAILED' ? 'Payment Failed' :
        'Processing Payment...'}
    </h1>

    <p class="message">
      ${result.status === 'PAID' ? 'Payment confirmed with SumUp' :
        result.status === 'CANCELLED' ? 'Payment was cancelled' :
        result.status === 'FAILED' ? 'Payment could not be completed' :
        'Waiting for payment confirmation...'}
      ${result.message ? `<br><small>${result.message}</small>` : ''}
    </p>

    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Reference:</span>
        <span class="detail-value">${ref.slice(0, 8)}...</span>
      </div>
      ${result.transactionCode ? `
      <div class="detail-row">
        <span class="detail-label">Transaction:</span>
        <span class="detail-value">${result.transactionCode}</span>
      </div>
      ` : ''}
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value">${result.status}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Timestamp:</span>
        <span class="detail-value">${new Date().toLocaleString()}</span>
      </div>
    </div>

    <a href="/sumup-test" class="button">Back to Test Page</a>
  </div>

  <script>
    // Client-side polling if payment is still pending
    const initialStatus = '${result.status}';
    const ref = '${ref}';

    // Credits are now tracked server-side in the database
    // No need to update localStorage anymore

    if (initialStatus === 'REDIRECTED' || initialStatus === 'PENDING') {
      let attempts = 0;
      const maxAttempts = 6;

      const pollStatus = async () => {
        attempts++;

        try {
          const response = await fetch('${backendUrl}/api/payments/sumup/finalize?ref=' + ref);
          const data = await response.json();

          if (data.status === 'PAID' || data.status === 'CANCELLED' || data.status === 'FAILED') {
            // Payment finalized - reload page to show final result
            window.location.reload();
          } else if (attempts < maxAttempts) {
            // Still pending - poll again in 2 seconds
            setTimeout(pollStatus, 2000);
          }
        } catch (error) {
          console.error('Polling error:', error);
          if (attempts < maxAttempts) {
            setTimeout(pollStatus, 2000);
          }
        }
      };

      // Start polling after 1 second
      setTimeout(pollStatus, 1000);
    }
  </script>
</body>
</html>
    `

    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  } catch (error) {
    console.error('Callback error:', error)

    // Return error page
    const errorHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex,nofollow">
  <title>Payment Error</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f3f4f6;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      border-radius: 8px;
      padding: 32px;
      max-width: 400px;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    h1 {
      color: #ef4444;
      margin-bottom: 16px;
    }
    p {
      color: #6b7280;
      margin-bottom: 24px;
    }
    a {
      display: inline-block;
      padding: 10px 24px;
      background: #6366f1;
      color: white;
      text-decoration: none;
      border-radius: 6px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Error Processing Payment</h1>
    <p>An error occurred while processing your payment. Please try again.</p>
    <a href="/sumup-test">Back to Test Page</a>
  </div>
</body>
</html>
    `

    return new NextResponse(errorHtml, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    })
  }
}