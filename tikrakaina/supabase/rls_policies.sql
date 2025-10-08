-- Row Level Security Policies for user_credits table
-- Run this in your Supabase SQL Editor

-- Enable RLS on user_credits table
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own credits
CREATE POLICY "Users can view their own credits"
ON user_credits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id::uuid);

-- Policy: Users can update their own credits
CREATE POLICY "Users can update their own credits"
ON user_credits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id::uuid)
WITH CHECK (auth.uid() = user_id::uuid);

-- Policy: Allow service role to do everything (for RPC functions)
CREATE POLICY "Service role can manage all credits"
ON user_credits
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- IMPORTANT: The use_credits function uses SECURITY DEFINER
-- which means it runs with the permissions of the function owner (postgres/service role)
-- So it should bypass RLS, but let's ensure the function is created properly

-- Recreate the function with proper permissions
CREATE OR REPLACE FUNCTION public.use_credits(
  user_id_input UUID,
  credits_to_use INTEGER DEFAULT 1
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- This makes it run with elevated privileges
SET search_path = public
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
    RAISE NOTICE 'User not found: %', user_id_input;
    RETURN FALSE;
  END IF;

  -- Check if user has enough credits
  IF current_credits < credits_to_use THEN
    RAISE NOTICE 'Insufficient credits. Has: %, Needs: %', current_credits, credits_to_use;
    RETURN FALSE;
  END IF;

  -- Deduct credits
  UPDATE user_credits
  SET
    credits = credits - credits_to_use,
    updated_at = NOW()
  WHERE user_id = user_id_input;

  RAISE NOTICE 'Credits deducted successfully. Old: %, New: %', current_credits, current_credits - credits_to_use;
  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.use_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_credits(UUID, INTEGER) TO anon;
