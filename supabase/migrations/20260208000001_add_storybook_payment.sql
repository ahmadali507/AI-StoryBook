-- Migration to add payment tracking to storybooks
-- Tracks Stripe checkout session and payment status

ALTER TABLE storybooks 
  ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'unpaid' 
    CHECK (payment_status IN ('unpaid', 'pending', 'paid', 'failed')),
  ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
  ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Add index for faster payment status queries
CREATE INDEX IF NOT EXISTS idx_storybooks_payment_status ON storybooks(payment_status);

-- Comment for documentation
COMMENT ON COLUMN storybooks.payment_status IS 'Payment status for book generation: unpaid, pending, paid, failed';
COMMENT ON COLUMN storybooks.stripe_session_id IS 'Stripe Checkout session ID';