"""SumUp payment integration routes."""

from fastapi import APIRouter, HTTPException, Request, Query, Form, Body
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import os
import httpx
import uuid
import json
import asyncio
from datetime import datetime, timedelta
from urllib.parse import urlencode, quote
from dotenv import load_dotenv
import logging

from database import (
    create_payment_attempt,
    get_payment_attempt,
    update_payment_attempt,
    list_payment_attempts,
    add_credits_to_user,
    PaymentStatus,
    supabase
)
from sumup_auth import get_user_token

load_dotenv()
logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/payments/sumup", tags=["sumup"])

# SumUp configuration from environment
SUMUP_CLIENT_ID = os.getenv("SUMUP_CLIENT_ID")
SUMUP_CLIENT_SECRET = os.getenv("SUMUP_CLIENT_SECRET")
SUMUP_OAUTH_TOKEN_URL = os.getenv("SUMUP_OAUTH_TOKEN_URL", "https://api.sumup.com/token")
SUMUP_CHECKOUTS_URL = os.getenv("SUMUP_CHECKOUTS_URL", "https://api.sumup.com/v0.1/checkouts")
SUMUP_TRANSACTIONS_URL = os.getenv("SUMUP_TRANSACTIONS_URL", "https://api.sumup.com/v0.1/me/transactions")
SUMUP_RETURN_URL = os.getenv("SUMUP_RETURN_URL", "https://vilrent.com/sumup/callback")
SUMUP_WEBHOOK_URL = os.getenv("SUMUP_WEBHOOK_URL", "https://vilrent.com/api/webhooks/sumup")
SUMUP_MODE = os.getenv("SUMUP_MODE", "live")
SUMUP_HAS_PAYMENTS_SCOPE = os.getenv("SUMUP_HAS_PAYMENTS_SCOPE", "false").lower() == "true"
SUMUP_DASHBOARD_PAYMENT_LINK = os.getenv("SUMUP_DASHBOARD_PAYMENT_LINK", "https://pay.sumup.com/b2c/Q2J0CU80")

# Token cache
_token_cache = {"token": None, "expires_at": None}

async def get_merchant_token() -> str:
    """Get SumUp merchant access token via client credentials flow."""
    # Check cache
    if _token_cache["token"] and _token_cache["expires_at"]:
        if datetime.utcnow() < _token_cache["expires_at"]:
            return _token_cache["token"]

    # Request new token
    async with httpx.AsyncClient() as client:
        response = await client.post(
            SUMUP_OAUTH_TOKEN_URL,
            data={
                "grant_type": "client_credentials",
                "client_id": SUMUP_CLIENT_ID,
                "client_secret": SUMUP_CLIENT_SECRET,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code != 200:
            logger.error(f"Failed to get SumUp token: {response.text}")
            raise HTTPException(status_code=500, detail="Failed to authenticate with SumUp")

        data = response.json()
        _token_cache["token"] = data["access_token"]
        # Cache for 15 minutes (tokens usually last longer)
        _token_cache["expires_at"] = datetime.utcnow() + timedelta(minutes=15)

        return data["access_token"]

from pydantic import BaseModel
from typing import Optional

class CheckoutRequest(BaseModel):
    amountCents: Optional[int] = 100
    userId: Optional[str] = None

@router.post("/create-checkout")
async def create_checkout(request: CheckoutRequest = CheckoutRequest()):
    """Create a new SumUp checkout for payment."""
    try:
        # Generate unique reference
        ref = str(uuid.uuid4())

        # Use provided amount or default to 100 cents (€1)
        amount_cents = request.amountCents if request.amountCents else 100

        # Calculate credits based on amount
        # Pricing: €2.99 = 1, €4.99 = 5, €9.99 = 15
        credits = 1 if amount_cents == 299 else 5 if amount_cents == 499 else 15 if amount_cents == 999 else 1

        # Create payment attempt record with userId
        attempt = await create_payment_attempt(
            ref=ref,
            amount_cents=amount_cents,
            currency="EUR",
            credits_purchased=credits,
            user_id=request.userId
        )
        if not attempt:
            raise HTTPException(status_code=500, detail="Failed to create payment attempt")

        # Build URLs
        # return_url = webhook URL (SumUp POSTs status here server-to-server)
        # redirect_url = user browser redirect URL
        webhook_url = f"{SUMUP_WEBHOOK_URL}?ref={ref}"
        frontend_redirect_url = f"{SUMUP_RETURN_URL}?ref={ref}"

        # Check if we have payments scope or are in test mode
        if SUMUP_HAS_PAYMENTS_SCOPE or SUMUP_MODE == "test":
            # Create checkout via API
            token = await get_user_token()  # Use get_user_token from sumup_auth.py

            async with httpx.AsyncClient() as client:
                checkout_data = {
                    "amount": amount_cents / 100,  # Convert cents to euros
                    "currency": "EUR",
                    "checkout_reference": ref,
                    "description": f"VilRent credits purchase ({amount_cents/100:.2f} EUR)",
                    "hosted_checkout": {"enabled": True},
                    "return_url": webhook_url,  # SumUp POSTs status updates here
                    "redirect_url": frontend_redirect_url,  # User browser redirect after payment
                    "metadata": {
                        "ref": ref,
                        "purpose": "sumup-verification"
                    }
                }

                # Add merchant_code (required for both test and live)
                if SUMUP_MODE == "test":
                    checkout_data["merchant_code"] = "MKXM19DH"
                else:
                    checkout_data["merchant_code"] = "M7CZS725"  # Live merchant code

                response = await client.post(
                    SUMUP_CHECKOUTS_URL,
                    json=checkout_data,
                    headers={
                        "Authorization": f"Bearer {token}",
                        "Content-Type": "application/json",
                    },
                )

                if response.status_code not in [200, 201]:
                    logger.error(f"Failed to create checkout: {response.text}")
                    raise HTTPException(status_code=500, detail="Failed to create SumUp checkout")

                checkout = response.json()

                # Update attempt with checkout ID
                await update_payment_attempt(ref, {
                    "sumup_checkout_id": checkout.get("id"),
                    "status": PaymentStatus.REDIRECTED.value,
                })

                return JSONResponse({
                    "ref": ref,
                    "checkoutUrl": checkout.get("hosted_checkout_url"),  # Correct field name!
                    "mode": "api"
                })

        else:
            # Use dashboard payment link
            # Update status to redirected
            await update_payment_attempt(ref, {
                "status": PaymentStatus.REDIRECTED.value,
            })

            # Add ref to the dashboard link if possible
            separator = "&" if "?" in SUMUP_DASHBOARD_PAYMENT_LINK else "?"
            checkout_url = f"{SUMUP_DASHBOARD_PAYMENT_LINK}{separator}ref={ref}"

            return JSONResponse({
                "ref": ref,
                "checkoutUrl": checkout_url,
                "mode": "dashboard-link"
            })

    except Exception as e:
        logger.error(f"Create checkout error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/finalize")
async def check_payment_status(
    ref: str = Query(..., description="Payment reference")
):
    """
    Check payment status from database.

    This is a "dumb" status checker - it ONLY reads from the database.
    The webhook is responsible for updating the status.
    This endpoint just tells the frontend what the current status is.
    """
    try:
        # Get payment attempt from database
        attempt = await get_payment_attempt(ref)
        if not attempt:
            raise HTTPException(status_code=404, detail="Payment attempt not found")

        # Just return what's in the database
        return JSONResponse({
            "ref": ref,
            "status": attempt["status"],
            "transactionCode": attempt.get("sumup_transaction_code"),
            "creditsAdded": attempt.get("credits_purchased") if attempt["status"] == "PAID" else 0,
            "message": "Status from database (webhook updates this)"
        })

    except Exception as e:
        logger.error(f"Check payment status error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/verify-payment-manually")
async def verify_payment_manually(
    ref: str = Query(..., description="Payment reference")
):
    """
    FALLBACK ONLY: Manually verify a payment by checking SumUp API.
    This should only be used for debugging or if webhooks fail.
    Normally, webhooks handle all verification automatically.
    """
    try:
        attempt = await get_payment_attempt(ref)
        if not attempt:
            raise HTTPException(status_code=404, detail="Payment attempt not found")

        if not attempt.get("sumup_checkout_id"):
            raise HTTPException(status_code=400, detail="No checkout ID - cannot verify")

        token = await get_user_token()

        async with httpx.AsyncClient() as client:
            # Check checkout by ID if we have it
            if attempt.get("sumup_checkout_id"):
                logger.info(f"Verifying payment via Checkout API: {attempt['sumup_checkout_id']}")

                checkout_response = await client.get(
                    f"{SUMUP_CHECKOUTS_URL}/{attempt['sumup_checkout_id']}",
                    headers={"Authorization": f"Bearer {token}"}
                )

                if checkout_response.status_code == 200:
                    checkout = checkout_response.json()
                    checkout_status = checkout.get("status", "").upper()

                    logger.info(f"Checkout status: {checkout_status}")

                    # Map checkout status to our status
                    if checkout_status == "PAID":
                        new_status = PaymentStatus.PAID.value
                    elif checkout_status in ["CANCELLED", "CANCELED"]:
                        new_status = PaymentStatus.CANCELLED.value
                    elif checkout_status == "FAILED":
                        new_status = PaymentStatus.FAILED.value
                    else:
                        # Still pending
                        return JSONResponse({
                            "ref": ref,
                            "status": attempt["status"],
                            "transactionCode": None,
                            "verified": False,
                            "message": f"Payment still pending (checkout status: {checkout_status})"
                        })

                    # Update attempt
                    await update_payment_attempt(ref, {
                        "status": new_status,
                        "sumup_transaction_code": checkout.get("transaction_code"),
                        "sumup_raw": checkout,
                    })

                    # If payment successful, add credits to user account (only once)
                    credits_added = 0
                    if new_status == PaymentStatus.PAID.value and attempt.get("user_id"):
                        # Check if credits were already added (idempotency)
                        if not attempt.get("credits_added"):
                            credits_to_add = attempt.get("credits_purchased", 1)
                            success = await add_credits_to_user(attempt["user_id"], credits_to_add)
                            if success:
                                credits_added = credits_to_add
                                # Mark credits as added in database
                                await update_payment_attempt(ref, {"credits_added": True})
                                logger.info(f"[Manual Verify] Added {credits_to_add} credits to user {attempt['user_id']}")
                            else:
                                logger.error(f"[Manual Verify] Failed to add credits to user {attempt['user_id']}")
                        else:
                            logger.info(f"[Manual Verify] Credits already added for payment {ref}, skipping")

                    return JSONResponse({
                        "ref": ref,
                        "status": new_status,
                        "transactionCode": checkout.get("transaction_code"),
                        "sumupStatus": checkout_status,
                        "verified": True,
                        "method": "checkout_api",
                        "creditsAdded": credits_added
                    })

            # FALLBACK METHOD: Query transactions if no checkout_id or checkout lookup failed
            logger.info("Falling back to Transactions API verification")

            # Get recent transactions
            # For dashboard payments, we need to be more lenient with timing
            params = {
                "order": "desc",
                "limit": 100  # Check more transactions for dashboard payments
            }

            response = await client.get(
                f"{SUMUP_TRANSACTIONS_URL}/history",
                params=params,
                headers={"Authorization": f"Bearer {token}"},
            )

            if response.status_code != 200:
                logger.error(f"Failed to get transactions: {response.text}")
                raise HTTPException(status_code=500, detail="Failed to fetch transactions")

            transactions = response.json().get("items", [])

            logger.info(f"Found {len(transactions)} transactions to check")
            logger.info(f"Looking for payment after {attempt['created_at']}")

            # Find matching transaction
            matching_tx = None

            for tx in transactions:
                logger.debug(f"Checking transaction: amount={tx.get('amount')}, status={tx.get('status')}, time={tx.get('timestamp')}")

                # Check by checkout reference
                if tx.get("checkout_reference") == ref:
                    matching_tx = tx
                    break

                # Check by amount and time window (last resort for dashboard payments)
                if tx.get("amount") == 1.0 and tx.get("currency") == "EUR":
                    # Check if status is successful first
                    if tx.get("status", "").upper() == "SUCCESSFUL":
                        try:
                            tx_time = datetime.fromisoformat(tx.get("timestamp", "").replace("Z", "+00:00"))
                            attempt_time = datetime.fromisoformat(attempt["created_at"])

                            # Check if transaction happened AFTER the attempt was created
                            # (not before, which would be an old payment)
                            if tx_time >= attempt_time:
                                time_diff = (tx_time - attempt_time).total_seconds()

                                # Allow up to 30 minutes for payment completion
                                if time_diff < 1800:  # 30 minutes
                                    matching_tx = tx
                                    logger.info(f"Found matching payment: {tx.get('transaction_code')} completed {time_diff}s after attempt created")
                                    break
                        except Exception as e:
                            logger.error(f"Error parsing timestamps: {e}")
                            continue

            # Update payment status based on findings
            if matching_tx:
                sumup_status = matching_tx.get("status", "").upper()

                if sumup_status == "SUCCESSFUL":
                    new_status = PaymentStatus.PAID.value
                elif sumup_status in ["CANCELLED", "CANCELED"]:
                    new_status = PaymentStatus.CANCELLED.value
                else:
                    new_status = PaymentStatus.FAILED.value

                # Update attempt
                await update_payment_attempt(ref, {
                    "status": new_status,
                    "sumup_transaction_code": matching_tx.get("transaction_code"),
                    "sumup_raw": matching_tx,
                })

                return JSONResponse({
                    "ref": ref,
                    "status": new_status,
                    "transactionCode": matching_tx.get("transaction_code"),
                    "sumupStatus": sumup_status,
                    "verified": True
                })
            else:
                # No matching transaction found
                return JSONResponse({
                    "ref": ref,
                    "status": attempt["status"],
                    "transactionCode": None,
                    "verified": False,
                    "message": "Transaction not found yet - it may take a moment to appear"
                })

    except Exception as e:
        logger.error(f"Finalize payment error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/attempts")
async def get_attempts(limit: int = Query(10, ge=1, le=100)):
    """Get list of recent payment attempts."""
    try:
        attempts = await list_payment_attempts(limit)
        return JSONResponse(content=attempts)
    except Exception as e:
        logger.error(f"List attempts error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# Webhook router (separate to avoid prefix)
webhook_router = APIRouter()

@webhook_router.post("/api/webhooks/sumup")
async def sumup_webhook(request: Request):
    """
    Handle SumUp webhook notifications.

    This is the SINGLE SOURCE OF TRUTH for payment verification.
    When SumUp sends a webhook, we:
    1. Extract the checkout_id from the webhook
    2. Query the Checkouts API to get authoritative payment status
    3. Update our database with the verified status
    4. Frontend polls /finalize to get the updated status
    """
    try:
        # Get ref from query parameters (we added it to return_url)
        ref = request.query_params.get("ref")

        # Get body as both form and JSON (SumUp might send either)
        content_type = request.headers.get("content-type", "")

        if "application/json" in content_type:
            body = await request.json()
        elif "application/x-www-form-urlencoded" in content_type:
            form_data = await request.form()
            body = dict(form_data)
        else:
            body = await request.body()
            body = body.decode("utf-8") if isinstance(body, bytes) else str(body)

        logger.info(f"Received SumUp webhook: {json.dumps(body) if isinstance(body, dict) else body}")
        logger.info(f"Ref from query: {ref}")

        # Extract checkout info from webhook
        checkout_id = None

        if isinstance(body, dict):
            checkout_id = body.get("id") or body.get("checkout_id")
            # Also try to get ref from body (fallback)
            if not ref:
                ref = body.get("checkout_reference") or body.get("ref") or body.get("metadata", {}).get("ref")

        # We need EITHER checkout_id OR ref to proceed
        if not checkout_id and not ref:
            logger.warning("Webhook missing both checkout_id and ref - cannot process")
            return JSONResponse({"status": "ok", "message": "missing identifiers"})

        # Find the payment attempt
        attempt = None
        if ref:
            attempt = await get_payment_attempt(ref)

        # If we have checkout_id but no attempt yet, we could search by checkout_id
        # (but this is unlikely since we create the attempt before the checkout)

        if not attempt:
            logger.warning(f"No payment attempt found for ref={ref}, checkout_id={checkout_id}")
            return JSONResponse({"status": "ok", "message": "payment attempt not found"})

        # Use the checkout_id from the attempt if webhook didn't provide one
        if not checkout_id:
            checkout_id = attempt.get("sumup_checkout_id")

        if not checkout_id:
            logger.warning(f"No checkout_id available for ref={ref}")
            return JSONResponse({"status": "ok", "message": "no checkout_id"})

        # VERIFY payment status by querying Checkouts API
        # This is the authoritative source - we don't trust webhook status alone
        token = await get_user_token()

        async with httpx.AsyncClient() as client:
            checkout_response = await client.get(
                f"{SUMUP_CHECKOUTS_URL}/{checkout_id}",
                headers={"Authorization": f"Bearer {token}"}
            )

            if checkout_response.status_code != 200:
                logger.error(f"Failed to verify checkout {checkout_id}: {checkout_response.text}")
                return JSONResponse({"status": "error", "message": "checkout verification failed"})

            checkout = checkout_response.json()
            checkout_status = checkout.get("status", "").upper()

            logger.info(f"Verified checkout {checkout_id}: status={checkout_status}")

            # Map SumUp status to our status
            if checkout_status == "PAID":
                new_status = PaymentStatus.PAID.value
            elif checkout_status in ["CANCELLED", "CANCELED"]:
                new_status = PaymentStatus.CANCELLED.value
            elif checkout_status == "FAILED":
                new_status = PaymentStatus.FAILED.value
            else:
                # Still pending - don't update yet
                logger.info(f"Checkout still pending: {checkout_status}")
                return JSONResponse({"status": "ok", "message": "still pending"})

            # Update database with verified status
            updates = {
                "status": new_status,
                "sumup_transaction_code": checkout.get("transaction_code"),
                "sumup_checkout_id": checkout_id,  # Ensure this is set
                "sumup_raw": checkout,
            }

            await update_payment_attempt(ref, updates)

            logger.info(f"Payment {ref} verified and updated to {new_status}")

            # If payment successful, add credits to user account (only once)
            credits_added = 0
            if new_status == PaymentStatus.PAID.value and attempt.get("user_id"):
                # Check if credits were already added (idempotency)
                if not attempt.get("credits_added"):
                    credits_to_add = attempt.get("credits_purchased", 1)
                    success = await add_credits_to_user(attempt["user_id"], credits_to_add)
                    if success:
                        credits_added = credits_to_add
                        # Mark credits as added in database
                        await update_payment_attempt(ref, {"credits_added": True})
                        logger.info(f"[Webhook] Added {credits_to_add} credits to user {attempt['user_id']}")
                    else:
                        logger.error(f"[Webhook] Failed to add credits to user {attempt['user_id']}")
                else:
                    logger.info(f"[Webhook] Credits already added for payment {ref}, skipping")

            return JSONResponse({"status": "ok", "verified_status": new_status, "creditsAdded": credits_added})

    except Exception as e:
        logger.error(f"Webhook error: {str(e)}")
        # Return 200 anyway to avoid retries
        return JSONResponse({"status": "error", "message": str(e)})

@router.get("/total-credits")
async def get_total_credits():
    """Get total credits from all PAID payments."""
    try:
        result = supabase.table("payment_attempts").select("credits_purchased").eq("status", "PAID").execute()
        total_credits = sum(item.get("credits_purchased", 0) for item in result.data) if result.data else 0
        return {"totalCredits": total_credits}
    except Exception as e:
        logger.error(f"Failed to get total credits: {str(e)}")
        return {"totalCredits": 0}