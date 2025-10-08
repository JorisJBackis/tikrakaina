-- Function to safely deduct credits from user account
-- Returns true if successful, false if insufficient credits
CREATE OR REPLACE FUNCTION public.use_credits(
  user_id_input UUID,
  credits_to_use INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get current credits with row lock
  SELECT credits INTO current_credits
  FROM user_credits
  WHERE user_id = user_id_input
  FOR UPDATE;

  -- If user doesn't exist, return false
  IF current_credits IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check if user has enough credits
  IF current_credits < credits_to_use THEN
    RETURN FALSE;
  END IF;

  -- Deduct credits (only update credits and updated_at, no total_used column)
  UPDATE user_credits
  SET
    credits = credits - credits_to_use,
    updated_at = NOW()
  WHERE user_id = user_id_input;

  RETURN TRUE;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.use_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_credits(UUID, INTEGER) TO anon;
