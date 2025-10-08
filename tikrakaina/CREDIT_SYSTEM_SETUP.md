# Credit System Setup

## Database Function Setup

The credit system requires a PostgreSQL function to safely deduct credits. Run this SQL in your Supabase SQL Editor:

```sql
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

  -- Deduct credits
  UPDATE user_credits
  SET
    credits = credits - credits_to_use,
    updated_at = NOW()
  WHERE user_id = user_id_input;

  RETURN TRUE;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.use_credits(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.use_credits(UUID, INTEGER) TO anon;
```

## How It Works

1. **Check Credit Balance**: Gets current credits with row-level lock (prevents race conditions)
2. **Validate Sufficient Credits**: Returns false if user doesn't have enough credits
3. **Atomic Deduction**: Deducts credits and updates total_used in a single transaction
4. **Real-time Updates**: Triggers Supabase realtime notifications to update UI

## Testing

After running the migration, test the function:

```sql
-- Test with a user that has credits
SELECT use_credits('user-uuid-here', 1);
-- Should return true if successful

-- Check credits were deducted
SELECT credits, total_used FROM user_credits WHERE user_id = 'user-uuid-here';
```

## Troubleshooting

### Credits not deducting
1. Check if function exists: `\df use_credits` in psql
2. Verify user has credits: `SELECT * FROM user_credits WHERE user_id = 'uuid'`
3. Check browser console for RPC errors

### Real-time updates not working
1. Verify Realtime is enabled in Supabase project settings
2. Check RLS policies allow SELECT on user_credits table
3. Ensure channel subscription is active (check browser console)
