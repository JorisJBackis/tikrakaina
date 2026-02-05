-- Atomic function to add credits for a payment (prevents double-crediting)
-- Uses FOR UPDATE row locking on both payment_attempts and user_credits
-- Returns: number of credits added (0 if already processed or no user)
CREATE OR REPLACE FUNCTION public.add_credits_for_payment(
  payment_ref TEXT
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT;
  v_credits_added BOOLEAN;
  v_credits_purchased INTEGER;
BEGIN
  -- Lock the payment_attempts row and read atomically
  SELECT user_id, credits_added, credits_purchased
  INTO v_user_id, v_credits_added, v_credits_purchased
  FROM payment_attempts
  WHERE ref = payment_ref
  FOR UPDATE;

  -- If payment not found or no user_id, return 0
  IF NOT FOUND OR v_user_id IS NULL OR v_user_id = '' THEN
    RETURN 0;
  END IF;

  -- If credits already added, return 0 (idempotent)
  IF v_credits_added = TRUE THEN
    RETURN 0;
  END IF;

  -- Try to lock existing user_credits row
  PERFORM 1 FROM user_credits
  WHERE user_id = v_user_id::uuid
  FOR UPDATE;

  IF FOUND THEN
    -- Update existing record
    UPDATE user_credits
    SET
      credits = credits + v_credits_purchased,
      total_purchased = total_purchased + v_credits_purchased,
      updated_at = NOW()
    WHERE user_id = v_user_id::uuid;
  ELSE
    -- Insert new record
    INSERT INTO user_credits (user_id, credits, total_purchased, updated_at)
    VALUES (v_user_id::uuid, v_credits_purchased, v_credits_purchased, NOW());
  END IF;

  -- Mark credits as added in payment_attempts
  UPDATE payment_attempts
  SET credits_added = TRUE, updated_at = NOW()
  WHERE ref = payment_ref;

  RETURN v_credits_purchased;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.add_credits_for_payment(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.add_credits_for_payment(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.add_credits_for_payment(TEXT) TO service_role;
