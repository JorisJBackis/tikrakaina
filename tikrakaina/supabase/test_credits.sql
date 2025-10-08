-- TEST SCRIPT FOR CREDITS SYSTEM
-- Copy and paste each section one at a time into Supabase SQL Editor

-- ============================================================================
-- 1. CHECK IF USER HAS CREDITS
-- ============================================================================
-- Replace 'f5a6e688-dfce-449d-83c9-c7e1f3eac74c' with your actual user ID
SELECT * FROM user_credits WHERE user_id = 'f5a6e688-dfce-449d-83c9-c7e1f3eac74c';


-- ============================================================================
-- 2. CHECK IF FUNCTION EXISTS
-- ============================================================================
SELECT
    proname as function_name,
    proargnames as argument_names,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'use_credits';


-- ============================================================================
-- 3. TEST THE FUNCTION DIRECTLY
-- ============================================================================
-- This should return TRUE if it works
SELECT use_credits('f5a6e688-dfce-449d-83c9-c7e1f3eac74c'::uuid, 1);


-- ============================================================================
-- 4. CHECK CREDITS AFTER FUNCTION CALL
-- ============================================================================
SELECT * FROM user_credits WHERE user_id = 'f5a6e688-dfce-449d-83c9-c7e1f3eac74c';


-- ============================================================================
-- 5. CHECK RLS POLICIES
-- ============================================================================
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'user_credits';


-- ============================================================================
-- 6. MANUAL CREDIT DEDUCTION (IF FUNCTION FAILS)
-- ============================================================================
-- This directly updates the table
UPDATE user_credits
SET credits = credits - 1, updated_at = NOW()
WHERE user_id = 'f5a6e688-dfce-449d-83c9-c7e1f3eac74c';

-- Check result
SELECT * FROM user_credits WHERE user_id = 'f5a6e688-dfce-449d-83c9-c7e1f3eac74c';


-- ============================================================================
-- 7. ADD CREDITS BACK (FOR TESTING)
-- ============================================================================
UPDATE user_credits
SET credits = credits + 5, updated_at = NOW()
WHERE user_id = 'f5a6e688-dfce-449d-83c9-c7e1f3eac74c';
