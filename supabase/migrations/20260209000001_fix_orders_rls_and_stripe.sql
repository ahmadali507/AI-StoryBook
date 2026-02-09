-- Fix Orders RLS and Add Stripe Session ID
-- This migration fixes the "order not found" error in production by:
-- 1. Adding the missing stripe_session_id column
-- 2. Updating RLS policies to allow updates for all order statuses (not just 'pending')

-- 1. Add stripe_session_id column to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT;

-- 2. Drop the restrictive update policy that only allows pending orders
DROP POLICY IF EXISTS "Users can update own pending orders" ON orders;

-- 3. Create new, more permissive update policy for user-owned orders
-- This allows users to update their own orders regardless of status
CREATE POLICY "Users can update own orders"
ON orders FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Ensure we have a SELECT policy (should already exist, but just in case)
DO $$ BEGIN
  CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 5. Add index on stripe_session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON orders(stripe_session_id);
